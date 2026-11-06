# Joe's Juke — Level solve outlines (v2 challenge set)

30 **original** levels designed for real puzzle challenge. No CCLP1 copies.

Design rules used:
- Socket always gates the exit.
- Critical chips sit behind a hazard, lock, or tool requirement.
- Forced order: later tools/keys depend on earlier ones.
- Distinct identity per level (one core mechanic + a twist).

## Training (1–5)

| # | Title | Core | Outline |
|---|--------|------|---------|
| 1 | First Bridge | Blocks | Push the single block into the water row to form a dirt bridge; collect chips on the far side; socket → exit. |
| 2 | Locked Vault | Keys | Free blue key → blue lock → red key + chips → red lock → remaining chips → socket. |
| 3 | Boot Ladder | Boots | Flippers → water chips + fire boots → fire chips + ice skates → ice chips → socket. |
| 4 | Ball Crossing | Balls | Time crossings between east/west ball lanes; flippers for the water chip row. |
| 5 | Tool Sampler | Combo intro | Blue key → vault (chips + red key) → red vault (fire boots + chips) → fire path to ice skates → ice chips → socket. |

## Challenge (6–20)

| # | Title | Core | Outline |
|---|--------|------|---------|
| 6 | Triple Bridge | Sokoban | Three blocks → three separate water bridges; chips only on the far shore. |
| 7 | Key Cascade | Keys | Yellow → blue → red → green lock chain; each lock holds the next key and chips. |
| 8 | Ice Corridors | Ice | Ice skates optional but safer; corridors + corner redirects; chips on ice. |
| 9 | Force Ring | Force | Suction boots; walk (or ride) the force ring to center chips. |
| 10 | Fire Sanctum | Fire | Flippers to fire boots; chips on fire islands; fire boots required. |
| 11 | Toggle Gates | Toggle | Green buttons open/close toggle-wall columns that hide chips. |
| 12 | Teleport Swap | Teleport | Teleport into the sealed room for chips; exit via the pair. |
| 13 | Dirt Dig | Dirt | Dig dirt corridors; gravel is permanent; chips buried in dirt. |
| 14 | Trap Release | Traps | Brown button opens trap line; chips behind traps; then socket. |
| 15 | Thief's Toll | Thief | Flippers → water chips → thief strips boots → replacement fire boots → fire chips. |
| 16 | Tank Turn | Tank | Blue button reverses the tank so the gap opens; chips behind. |
| 17 | Blue Walls | Blue walls | Mix of real/fake blue walls; probe to reach chips; some paths are dead ends. |
| 18 | Teeth Chase | Teeth | Stay ahead of teeth along the corridor; side-room chips are optional risk. |
| 19 | Mixed Signals | Ice+Force | Both ice skates and suction required for the dual corridors. |
| 20 | Rainbow Locks | 4 keys | Four free keys; each color lock holds one chip; fifth chip free. |

## Advanced (21–30)

| # | Title | Core | Outline |
|---|--------|------|---------|
| 21 | Block Bomb | Blocks+Bombs | Push blocks onto bombs to clear the field; chips behind. |
| 22 | Glider Alley | Gliders | Three glider lanes; use left-turn AI to create safe gaps. |
| 23 | Cloner Pressure | Cloner | Red button clones; grab chips before the area fills. |
| 24 | Nested Keys | Nested locks | Outer blue → inner red → core green lock + chips. |
| 25 | Force Maze | Force maze | Suction (or careful slides) through a force-floor maze. |
| 26 | Monster Gauntlet | Multi-mob | Ball, glider, fireball, bug, paramecium, tank, walker, teeth lanes. |
| 27 | Full Kit | All boots | Sequential water → fire → ice → force rooms, then blue-locked vault. |
| 28 | Sokoban Core | Tight sokoban | Four blocks into four water tiles in a walled room; order matters. |
| 29 | Master Lock | Full toolkit | Flippers, keys, fire, ice, green lock, teeth-guarded chips. |
| 30 | Endgame | Everything | All boots + keys up front; hazard chips; dual-lock central vault; monsters on the flank. |

## Engine notes

- Socket is solid until chipsCollected >= chipsNeeded.
- Block on water becomes dirt.
- Thief clears all boots.
- Cloner + red button spawns from the cloner's facing direction.
