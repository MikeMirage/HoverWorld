# HoverWorld Flight Model Design

## Purpose
This document describes the current flight model, control parameters, landing logic, camera behavior, and the main extension points needed to scale HoverWorld into a larger product.

The current prototype is:
- arcade-first
- readable on mobile
- compatible with simplified Star Fox-style handling
- now based on continuous 360-degree yaw navigation

This document is intended for lead design, systems design, and future gameplay tuning.

## Design Pillars
- The plane must feel readable within one second.
- Controls must work on touch, trackpad, and keyboard without demanding full simulation literacy.
- Pitch must clearly trade altitude against speed.
- Banking must feel expressive but not over-simulated.
- Glide and landing states must create tension and skill expression.
- The system must scale to multiple aircraft archetypes, upgrades, and mission types.

## Current Flight State Model

The prototype uses an explicit flight state instead of trusting the mesh Euler angles directly.

Active state variables:
- `flightState.pitch`
- `flightState.yaw`
- `flightState.roll`
- `targetRotation.x`
- `targetRotation.y`
- `shipVelocity`
- `flightSpeed`

This separation is important because it avoids the classic Euler wrapping issues that appear after 180-degree yaw rotation. It is the correct basis for future free-roam navigation and multiple aircraft.

Rotation order:
- `YXZ`

Meaning:
- `yaw` is continuous and unbounded
- `pitch` is clamped
- `roll` is visual / handling feedback

## Input Model

### Keyboard
- `W` / `ArrowUp`: `pitchInput = -1`
- `S` / `ArrowDown`: `pitchInput = 1`
- `A` / `ArrowLeft`: `yawInput = 1`
- `D` / `ArrowRight`: `yawInput = -1`

### Touch Drag
- `dragRadius = min(screenWidth, screenHeight) * 0.18`
- `deadZone = 0.12`
- horizontal drag controls yaw
- vertical drag controls pitch
- both channels clamp to `[-1, 1]`

### Interpretation
This is not a simulation stick. It is a high-level analog intent input:
- move finger left/right to bank-turn
- move finger up/down to pitch climb/dive
- let go to allow the craft to stabilize toward neutral

## Current Core Flight Parameters

### Baseline
- `maxFuel = 100`
- `flightSpeed = 120` on run start
- `STALL_SPEED = 40`
- `glideDuration = 10.0`
- `maxPitch = PI / 3` (`60º`)
- `currentFov = 60`

### Pitch-Speed Relationship
- `climbSpeedPenalty = 180`
- `diveSpeedBoost = 180`

Current convention in the prototype:
- positive pitch = nose up / climbing
- negative pitch = nose down / descending

Current speed contribution:
- `climbPenalty = max(0, pitch) * climbSpeedPenalty`
- `diveBonus = max(0, -pitch) * diveSpeedBoost`
- `targetSpeed += diveBonus - climbPenalty`

This means:
- climbing costs speed
- diving restores speed

### Roll-Speed Relationship
- `targetSpeed -= abs(roll) * 50`

This creates a turn cost and helps keep the handling arcade-readable.

## Speed Model

### Normal Flight
- base `targetSpeed = 120`

### Glide
- `targetSpeed = lerp(120, 60, glideProgress^1.5)`

### Speed Response
- if stalling: `speedAccel = 0.6`
- otherwise: `speedAccel = 2.0`
- `flightSpeed = lerp(flightSpeed, targetSpeed, delta * speedAccel)`
- hard clamp: `20 .. 250`

## Stall Logic

Trigger:
- if `flightSpeed < 40`, set `stallTimer = 1.0`

While stalling:
- pitch is forced toward `-maxPitch * 0.6`
- yaw authority is reduced to `20%`
- shake increases
- roll gets additional wobble
- FOV narrows by `15`

Additional glide soft-stall:
- `softStallForce = (speedDeficit / 60) * 1.2 * stabilityFactor`

This pushes the nose down when the player is too slow during glide.

## Turn and Rotation Model

### Turn Speed
- `turnSpeed = 1.5 * stabilityFactor`
- glide turn speed multiplier: `0.7`

### Pitch Targeting
- `targetRotation.x += pitchInput * currentTurnSpeed * delta`
- clamp to `[-maxPitch, +maxPitch]`

### Yaw Targeting
- `targetRotation.y += yawInput * currentTurnSpeed * delta`

### Roll
- `targetRoll = yawInput * PI / 4`
- max bank target: `45º`
- smoothing: `lerp(..., delta * 4)`

### Smoothing
- pitch smoothing: `5 * delta`
- yaw smoothing: `5 * delta`
- roll smoothing: `4 * delta`

## Fuel Model

### Consumption
- `currentFuel -= 5 * delta`

### Refuel
- standard fuel ring pickup: `+25 fuel`
- mission rewards can also add fuel

### Intent
Fuel is the macro tension source that eventually converts powered flight into glide. It should remain readable and tuneable per aircraft class later.

## Glide Model

### Variables
- `glideDuration`
- `currentGlideTime`

### Vertical Behavior
- upward vertical velocity is damped over time
- descent rate increases over glide time
- current prototype descent curve:
  - `lerp(2, 45, glideProgress^1.5)`

### Ground Effect Approximation
When below `20` altitude:
- descent is reduced
- dust can spawn

This gives the current prototype a small cushion near the ground and helps produce a controllable landing fantasy.

## Landing Model

There are currently three outcomes on ground contact:

### 1. Controlled Landing
Requirements:
- `speed < 110`
- altitude inside landing window
- pitch close to level
- roll close to level
- vertical speed acceptable
- hold the condition for `2.0` seconds

Parameters:
- `LANDING_MAX_SPEED = 110`
- `LANDING_MIN_HOLD = 2.0`
- `LANDING_WINDOW_ALTITUDE = 12`
- `LANDING_MAX_PITCH = 0.2`
- `LANDING_MAX_ROLL = 0.24`
- `LANDING_MAX_VERTICAL_SPEED = 12`

Timer logic:
- fills while valid
- decays gently outside the window

### 2. Forced Landing / Skid
If not a perfect landing and not a hard crash:
- the craft enters skid
- speed drains over time
- sparks and dust spawn

Parameter:
- skid deceleration: `60 * delta`

### 3. Hard Crash
Current crash thresholds on impact:
- `flightSpeed > 145`
- or `abs(verticalSpeed) > 28`
- or `abs(pitch) > 0.34`
- or `abs(roll) > 0.42`

## Controlled Landing Rollout

When a successful landing occurs:
- the craft is kept on ground
- roll and pitch are flattened
- speed drains slowly

Parameter:
- landing rollout deceleration: `42 * delta`

End condition:
- stop when `flightSpeed <= 8`

## Camera Design

### Base Camera
- `camHeightOffset = 15`
- `camDistanceOffset = 45`

### Low Altitude
If low and not skidding:
- height scales down toward the craft

### Glide
As glide progresses:
- height increases up to `+15`
- distance increases up to `+15`

### Landing Ready
When entering visible landing readiness:
- camera moves closer
- target approx:
  - height `9`
  - distance `30`

### Controlled Landing
- target approx:
  - height `6`
  - distance `34`

### Skid
- height trends toward `5`

### Combat Camera Variant
Alternate mode shifts the camera closer and lets it inherit more craft attitude.

## FOV Design

Current formula:
- `targetFov = 60 + (flightSpeed - 60) * 0.2`

Modifiers:
- stall: `-15`
- near ground: `+10`
- controlled landing: `-6`

Smoothing:
- `currentFov = lerp(currentFov, targetFov, delta * 3)`

## Camera Shake

### Trigger Values
- engine death: `4`
- fuel pickup: `+0.5`
- mission collect: `+0.4`
- truck collision: at least `6`
- skid start: `8`
- hard crash: `10`
- controlled landing: `0.8`

Decay:
- `lerp(shakeIntensity, 0, delta * 10)`

## Visual Surface Logic

### Ailerons
- respond to roll / bank demand
- target:
  - `clamp(-roll * 0.9, -0.35, 0.35)`

### Elevators
- respond to pitch
- target:
  - `clamp(-pitch * 0.85, -0.32, 0.32)`

### Rudder
- responds to yaw demand lag
- target:
  - `clamp((targetYaw - yaw) * 1.8, -0.28, 0.28)`

### Flaps
Flaps are not direct input-following control surfaces.
They deploy symmetrically for approach states.

Current prototype values:
- normal: `0.02`
- glide: `0.22`
- landing prep: `0.28`
- controlled landing: `0.34`

## Landing Gear Logic

Landing gear deployment triggers:
- glide
- landing prep
- controlled landing

Current deploy smoothing:
- `lerp(..., delta * 4.5)`

This is currently visual only, but it is already a good hook for future aircraft-specific landing behavior.

## Mission / World Parameters That Influence Flight Context

- `chunkDepth = 220`
- `missionLeadChunks = 3`
- `maxFutureMissionChunks = 6`
- `supportFuelCap = 8`

These are not flight forces, but they shape how often the player needs to maneuver, descend, or route aggressively.

## Current Tuning Sliders

Currently exposed in prototype settings:
- `glideDuration`
- `climbSpeedPenalty`
- `diveSpeedBoost`
- camera mode toggle

These are the first live-tuning controls available to design.

## Scaling Plan For Multiple Aircraft

The current prototype should evolve toward aircraft data profiles instead of one global tuning set.

Recommended future aircraft definition:

```js
{
  id: "starter_spitfire",
  displayName: "Falcon Mk.I",
  handling: {
    baseSpeed: 120,
    minSpeed: 20,
    maxSpeed: 250,
    stallSpeed: 40,
    turnSpeed: 1.5,
    maxPitch: Math.PI / 3,
    rollAuthority: Math.PI / 4,
    climbSpeedPenalty: 180,
    diveSpeedBoost: 180,
    bankDragPenalty: 50
  },
  glide: {
    duration: 10.0,
    descentMin: 2,
    descentMax: 45,
    descentExponent: 1.5
  },
  fuel: {
    capacity: 100,
    burnRate: 5,
    pickupGain: 25
  },
  landing: {
    maxSpeed: 110,
    minHold: 2.0,
    windowAltitude: 12,
    maxPitch: 0.2,
    maxRoll: 0.24,
    maxVerticalSpeed: 12
  }
}
```

Recommended archetypes:
- `fighter`: agile, lower fuel, tighter turn, harsher stall
- `tourer`: slower turn, larger fuel, safer glide
- `carrier / heavy`: higher stability, harder landing, slower response
- `experimental`: strong dive boost, unstable stall

## Upgrade Hooks

These systems map cleanly onto the current prototype:

### Airframe Upgrades
- `fuelCapacity`
- `burnRate`
- `turnSpeed`
- `stallMargin`
- `landingAssist`
- `glideDuration`
- `cameraAssist`

### Example Effects
- bigger tank:
  - increases `maxFuel`
- improved wing kit:
  - reduces `climbSpeedPenalty`
  - increases `turnSpeed`
- reinforced frame:
  - widens crash tolerance
- landing computer:
  - lowers required hold time
  - expands landing pitch / roll window

## Mission Types Enabled By Current Flight Model

Already naturally supported or close to support:
- standard fuel collection
- air refuel portal runs
- low-altitude canyon traversal
- controlled runway landing
- emergency forced landing
- aerial checkpoint / ring sequences
- near-ground delivery / extraction
- world exploration distance runs

Next mission extensions that fit especially well:
- runway approach missions
- carrier deck landing
- aerial refuel alignment mission
- glide-only challenge
- low-fuel return mission
- weather / crosswind challenge

## Meta / Product Scaling Hooks

The flight model now supports growth into a broader F2P structure because it already contains:
- aircraft-specific parameters
- landing-specific skill expression
- route-based resource management
- clear tuning hooks for classes and upgrades

Recommended meta pillars:

### 1. Aircraft Collection
- unlock aircraft frames
- each frame has a handling profile
- cosmetics and silhouettes matter

### 2. Aircraft Upgrades
- fuel tank
- control responsiveness
- glide quality
- landing safety
- recovery tools

### 3. World / Region Selection
- different worlds can tune atmosphere and mission density
- each world can bias handling:
  - wind
  - altitude ceiling
  - refuel rarity
  - landing opportunities

### 4. Mission Boards
- runway landing mission
- refuel chain mission
- collect relics
- survive storm route
- deliver or scout objective

### 5. Hub / Meta Screens
- aircraft hangar
- upgrade workshop
- discovered worlds menu
- mission board
- collection log / atlas
- world selection / progression gate

## Suggested Refactor Path

To scale cleanly, the next structural step should be:

1. Extract current flight constants into a `FLIGHT_TUNING` object
2. Replace globals with an `aircraftProfile`
3. Separate:
   - `input interpretation`
   - `flight physics`
   - `landing evaluation`
   - `camera logic`
4. Move mission and aircraft definitions into data objects
5. Introduce progression modifiers as additive layers on top of base aircraft profile

## Priority Tuning Values For Lead Design

If design wants to tune the feel quickly, these are the highest leverage knobs:

1. `climbSpeedPenalty`
2. `diveSpeedBoost`
3. `STALL_SPEED`
4. `turnSpeed`
5. `bankDragPenalty`
6. `glideDuration`
7. `glide descent curve`
8. `landing thresholds`
9. `camera offsets`
10. `FOV scaling`

## Notes

- The current model is intentionally arcade, not sim.
- That is a strength for mobile and F2P readability.
- The most important architectural improvement already made is the explicit flight orientation state, which allows true 360 navigation without control inversion.
- The next important improvement is data-driving aircraft definitions and upgrades.
