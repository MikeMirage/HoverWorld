# HoverWorld Product Systems

## Current implementation status

The prototype now includes a minimal product loop on top of the flight sandbox:
- aircraft profiles
- world profiles
- upgrade definitions
- local save / progression
- starter hangar / world select / workshop / mission board / discovery summary

This is still a prototype, but it is no longer only a sandbox. It now has a real growth path.

## Active data-driven systems

### AircraftProfile
Current fields:
- `id`
- `displayName`
- `blurb`
- `visualPrefab`
- `handling`
- `fuel`
- `glide`
- `landing`
- `camera`
- `upgradeSlots`

Purpose:
- define aircraft identity through stats and feel
- support multiple airframes without rewriting the core flight model

### WorldProfile
Current fields:
- `id`
- `displayName`
- `blurb`
- `visualTheme`
- `missionPool`
- `featuredChallenges`
- `environmentModifiers`

Purpose:
- change run atmosphere, mission flavor, and support resource density
- give world selection real pre-run meaning

### UpgradeProfile
Current fields:
- `id`
- `displayName`
- `maxLevel`
- `costByLevel`
- `describe(level)`

Current upgrade lanes:
- `fuel_tank`
- `control_linkage`
- `landing_suite`

Purpose:
- create persistent progression that changes run feel
- improve long-term ownership of aircraft

### Mission Library
Current structure:
- mission definitions indexed by id
- selected world maps to a `missionPool`

Purpose:
- let worlds choose mission sequences without hardcoding all mission state globally

## Current progression loop

### Rewards per run
The game currently pays out:
- credits
- discovery
- parts

These are awarded from:
- distance
- missions completed
- landing result

### Current unlock rules
- second aircraft unlocks at `1500m` best distance
- second world unlocks at `2200m` best distance

This is intentionally simple, but it already proves:
- persistent rewards
- unlock gating
- world / aircraft expansion hooks

## Recommended next systems

### 1. Proper hangar comparison
Add:
- stat deltas between current and candidate aircraft
- locked aircraft preview with unlock requirement
- aircraft-specific visuals and liveries

### 2. World select progression
Add:
- world difficulty markers
- world-specific mission modifiers
- world completion or discovery milestones

### 3. Mission board as real run director
Current mission board is descriptive.
Next version should:
- show active featured contracts
- optionally reward bonus currencies
- bias mission pools for the next run

### 4. Discovery log expansion
Add:
- discovered worlds
- found relic sets
- successful landings
- special run achievements
- notable route records

### 5. Upgrade specialization
Move from simple stat ladders to:
- branching upgrade choices
- aircraft-specific upgrade trees
- risk/reward modifiers

Examples:
- larger tank but more drag
- safer landing suite but lower top speed
- stronger control linkage but harsher stall onset

## Architecture direction

This prototype should continue moving toward:
- core gameplay systems driven by profile data
- meta loop driven by save data
- view layer reading both runtime run state and persistent account state

Recommended future split:
- `data/aircraft.js`
- `data/worlds.js`
- `data/upgrades.js`
- `data/missions.js`
- `systems/save.js`
- `systems/meta.js`
- `systems/flight.js`
- `systems/world.js`

## Quality notes

Any new product-layer feature should preserve:
- mobile readability
- fast start into a run
- clarity of aircraft choice
- clarity of reward outcome
- aircraft feel differentiation through tuning, not just cosmetics

## Product philosophy

HoverWorld scales best if every new layer serves the same fantasy:
- go farther
- discover more
- master your aircraft
- return stronger

If a feature does not strengthen one of those four pillars, it should be questioned before implementation.
