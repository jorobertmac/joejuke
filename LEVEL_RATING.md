# Joe's Juke — Puzzle Level Rating System

Static analysis rubric for Chip's Challenge–style levels. Used by the editor
**Rate Level** action and by future batch rewrites of the built-in set.

Inspired by CC1 lesson → progressive design (Bit Busters wiki, StrategyWiki
walkthroughs, and classic Sokoban / maze-puzzle principles).

---

## Design goals a good level should satisfy

1. **Necessity** — Every tool (key, boot, block) is required for at least one
   critical path. Bypassing a hazard without its boot is a design smell.
2. **Purpose** — Locks protect chips, keys, or the only route forward. Empty
   locks are acceptable only as intentional resource tension (e.g. 1 key / 2 doors).
3. **Engagement** — Monsters, ice, force floors, traps, or cloners force timing,
   sequencing, or spatial reasoning rather than pure walking.
4. **Scarcity** — Limited resources create meaningful choices.
5. **Progression** — Mechanics are introduced cleanly then combined; no pure
   decoration.
6. **Solvability** — At least one path from A → all chips → X → E exists
   (structural check only; full AI solver is out of scope for the static rater).

---

## Dimensions (0–10 each)

| ID | Dimension | What is measured |
|----|-----------|------------------|
| `hazardNecessity` | Hazard Necessity | Water / fire / ice / force that sit on paths to chips or exit and cannot be walked around. Boots present without a forced hazard score low. |
| `lockUtility` | Lock Utility | Locks that gate chips, keys, or unique progress. Decorative locks or key surplus without tension score low. |
| `resourceTension` | Resource Tension | Keys vs locks, blocks vs water-to-bridge, boots vs matching hazards. |
| `chipChallenge` | Chip Challenge | Fraction of chips that sit behind a lock, hazard, block, monster lane, or non-trivial path (not open floor near start). |
| `mechanicDensity` | Mechanic Density | Distinct meaningful systems used (keys, boots, blocks, ice, force, monsters, buttons/traps/cloners, blue walls, thief, teleports). |
| `monsterPressure` | Monster Pressure | Monsters that intersect chip paths or force timing (lanes, teeth chase, tanks on buttons). Decorative edge monsters score low. |
| `pathComplexity` | Path Complexity | Branching, forced order (key chains, block sequences), dead-ends that hold items, thin walls / blue walls / recessed. |
| `structure` | Structure Health | Has A, E, X; chipsNeeded > 0 or intentional zero-chip; no obvious soft-locks from map topology. |

**Composite score** = weighted average (weights below), clamped 1–10, plus letter grade.

| Weight | Dimension |
|--------|-----------|
| 0.18 | hazardNecessity |
| 0.16 | lockUtility |
| 0.14 | resourceTension |
| 0.16 | chipChallenge |
| 0.12 | mechanicDensity |
| 0.10 | monsterPressure |
| 0.08 | pathComplexity |
| 0.06 | structure |

### Grades

| Score | Grade | Meaning |
|-------|-------|---------|
| 9.0–10 | S | Excellent puzzle density and necessity |
| 8.0–8.9 | A | Strong challenge, minor polish issues |
| 7.0–7.9 | B | Solid, some bypasses or decoration |
| 5.5–6.9 | C | Playable but under-challenging or wasteful |
| 4.0–5.4 | D | Mostly walking / decorative tools |
| < 4.0 | F | Broken structure or trivial |

---

## Heuristics (implementation notes)

### Hazard necessity
- Count cells of `~ F I 1 3 7 9 ^ > v < R`.
- Flood-fill walkable (walls block; treat hazards as solid *without* boots) from A.
- If a chip or the socket is unreachable without crossing a hazard of type T, that boot type is “required”.
- Penalty if a boot exists in the level but its hazard is fully bypassable on open floor.

### Lock utility
- For each lock, BFS whether any chip (or key needed later, or unique path to X) is behind it when the lock is treated as solid.
- Key surplus: `keys - locks` for each color (green key is infinite in classic CC; treat green as non-consuming if engine matches).
- Empty locks that gate nothing → low score unless they create intentional choice (multiple locks, fewer keys).

### Resource tension
- Blocks vs water cells that must be bridged (chips/exit only reachable via water without flippers).
- Key/lock ratios.
- Boots present vs required (from hazard analysis).

### Chip challenge
- Chip is “challenged” if:
  - On or adjacent to hazard / lock / trap / bomb / monster spawn path, or
  - Under a block, or
  - Requires crossing a lock or hazard in the no-tools flood fill.

### Mechanic density
- Bit flags for: any key/lock pair, any boot, any block, ice/force, any monster, buttons (green/red/blue/brown), traps, cloners, blue walls, thief, teleports, recessed/hidden/invis, thin walls.
- Score scales with number of distinct systems that also pass a minimal “used” check.

### Monster pressure
- Monsters whose patrol/corridor intersects the no-tools path to any chip.
- Teeth / blob near chips score higher than distant balls on isolated tracks.

### Path complexity
- Number of dead-end corridors that contain an item.
- Longest forced key/lock chain length.
- Presence of blue walls, recessed, thin walls, teleporters.

### Structure
- Exactly one `A`, one `E`, one or more `X` (or clear zero-chip intent).
- `chipsNeeded` matches chip count (or is set).
- Border walls recommended but not required.

---

## Output shape (JS)

```js
{
  score: 7.4,          // 1–10 composite
  grade: "B",
  dimensions: {
    hazardNecessity: 6.0,
    lockUtility: 8.5,
    // ...
  },
  issues: [
    { severity: "warn", code: "BYPASS_FIRE", msg: "Fire boots present but fire is walk-aroundable" },
    { severity: "info", code: "EMPTY_LOCK", msg: "1 red lock protects no chip or unique path" }
  ],
  summary: "Solid key chain; fire boots under-used."
}
```

---

## Editor integration

- **Actions** panel → **Rate Level** button.
- Runs against current `editMap` / `editOverlay` / `editBlocks`.
- Shows modal or status + expandable issue list (same pattern as Export).
- Does not mutate the map; advisory only.

---

## Future use

- Batch-rate all 30 built-in levels → prioritize rewrites for D/F and low chipChallenge / hazardNecessity.
- Optional: suggest fixes (e.g. “seal bypass corridor at (x,y)”).
