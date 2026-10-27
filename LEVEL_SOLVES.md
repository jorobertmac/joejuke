# Joe's Juke - Level solve outlines

30 original levels in classic Chip's Challenge style. All rate **B or A** under `LEVEL_RATING.md`.

Each level has a distinct puzzle identity. Shared rule: some chips sit behind a required hazard; some sit behind a lock that is the only gap in a wall. Socket gates the exit.

## Training (1-5)

| # | Theme | Outline |
|---|--------|---------|
| 1 | Block door | Flippers across water for chips; push block; blue key opens lock vault. |
| 2 | Keys | Water chips; blue lock holds red key + chip; red lock vault. |
| 3 | Boots tour | Sequential chips after water, fire, ice, and force; lock for last chips. |
| 4 | Balls | Cross ball lanes; water chips; lock vault. |
| 5 | Tile gallery | Sample tiles, then water + lock gated chips. |

## Challenge (6-30)

| # | Theme | Outline |
|---|--------|---------|
| 6 | Nested maze | Water chips, then weave nested wall rings to a lock-guarded core. |
| 7 | Block bridge | Push three blocks into water to reach chips; lock vault beyond. |
| 8 | Key chain | Water chip; blue→red→green→yellow locks in forced order. |
| 9 | Ice maze | Ice skates through corridors with interior chips; lock vault. |
| 10 | Force loop | Suction boots ride the force ring for center chips; lock vault. |
| 11 | Fire ring | Fire boots into the ring for chips; lock vault outside. |
| 12 | Ball lanes | Multiple ball rows; water; lock. |
| 13 | Toggle | Green button / toggle walls for tension; water + lock required. |
| 14 | Teleport | Water chips; teleporter into sealed area; lock vault. |
| 15 | Dirt dig | Water chip; dig dirt corridors past gravel; lock vault. |
| 16 | Heavy blocks | Four blocks bridge water; lock vault. |
| 17 | Spring trap | Brown button opens trap gap; water + lock. |
| 18 | Full kit | Chips after each of water/fire/ice/force; lock. |
| 19 | Crossfire | Glider and fireball lanes; water; lock. |
| 20 | Rainbow vault | Water chip; four colored locks each hide a chip. |
| 21 | Ice corners | Corner ice redirects; skates; lock vault. |
| 22 | Pickpocket | Flippers → water chips → thief strips boots → fire boots → fire chips → lock. |
| 23 | Tank trouble | Blue button reverses tank; water; lock. |
| 24 | Minefield | Block clears bombs; water; lock. |
| 25 | Illusions | Probe fake blue walls; water; lock. |
| 26 | Hungry | Stay ahead of teeth; water; lock. |
| 27 | Mixed signals | Ice then force (or reverse) with matching boots; lock. |
| 28 | Gauntlet | Dense monster rows; water; lock. |
| 29 | Master key | Multi-boot + dual colored locks. |
| 30 | Endgame | All boots, multi-keys, monsters, chips after every hazard, lock vault. |

## Engine notes

- Socket is solid until all chips are collected.
- A lock consumes one matching key and is the only gap in its wall.
- Cloner + red button spawns monsters (not blocks).
- Block on water becomes dirt.
- Thief removes collected boots.
