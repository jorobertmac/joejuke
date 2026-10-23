# Joe's Juke — Level solve outlines

Solution sketches only. Every listed level is solvable. Socket always gates the exit: collect **all** chips, step on **X**, then **E**.

## Training

| # | Focus | Outline |
|---|--------|---------|
| 1 | Move / block / chips | Enter the open alcove from the right, take the chip, push the block out if needed, grab the two floor chips, open socket, exit. |
| 2 | Key + lock | Take blue key, open blue lock, collect both chips behind the wall rows, socket, exit. |
| 3 | Boots | Grab flippers / ice / fire / suction. Cross water → fire → ice → force in order, picking each chip, then socket. |
| 4 | Balls | Time crossings of the horizontal ball lanes; collect four side chips; socket. |
| 5 | Tile gallery | Walk the sample tiles, collect the three chips, socket. (Some gallery tiles are lethal without boots.) |

## Challenge

| # | Focus | Outline |
|---|--------|---------|
| 6 | Nested maze | Work inward ring by ring; every chip is on a forced path. Center has socket + exit. |
| 7 | Block bridge | Push the three blocks south into water (one column) to make a dirt bridge across the three water rows; collect chips; socket. |
| 8 | Key chain | Blue key → blue lock → red key → red lock → green key → green lock → yellow key → yellow lock → chip row → socket. |
| 9 | Ice maze | Take ice skates, walk the ice corridors (no uncontrolled slide), reach center chips, leave, socket. |
| 10 | Force floors | Take suction boots, walk the force loop at will, pick center chips, socket. |
| 11 | Fire ring | Take fire boots, enter the fire ring, collect inner chips, leave, socket. |
| 12 | Ball lanes | Wait for gaps in ball patrols, cross to the chip row, then to socket. |
| 13 | Toggle walls | Walls start **open**. Collect chips and reach socket **without** pressing the green button (or press it only when safe). |
| 14 | Teleporters | Step on the north teleporter to reach the sealed chip room; collect chips; use the south teleporter (or walk) to return to socket. |
| 15 | Dirt / gravel | Dirt turns to floor when stepped. Path through dirt ring → gravel ring → chips without sealing your retreat. |
| 16 | Block bridge | Four blocks; push into water to bridge three water rows; collect chips; socket. (Red button / cloner not used — cloners spawn monsters, not blocks.) |
| 17 | Trap | Press **brown button** first to open the trap, then walk the corridor for chips, socket, exit. Stepping on a closed trap traps you permanently. |
| 18 | Mixed boots | Equip flippers, fire, ice, suction; cross each hazard band; collect chips; socket. |
| 19 | Glider / fireball | Cross lanes when clear; chips sit on the far sides of each lane. |
| 20 | Four-key vault | Collect all four keys, open each colored lock in its sealed row for its chip, then socket. |
| 21 | Ice corners | Ice skates on; corner tiles redirect. Reach center chips, exit ice, socket. |
| 22 | Thief | Flippers → cross water → thief steals boots → take fire boots → cross fire → chips → socket. |
| 23 | Tank | Use blue button to reverse the tank when its path blocks you; collect chips; socket. |
| 24 | Bombs | Push the block onto the bomb column (west then south) to clear bombs; walk to chips; socket. |
| 25 | Blue walls | `]` fake becomes floor; `[` real becomes wall. Probe fakes to reach the chip row; socket. |
| 26 | Teeth | Keep distance from teeth while collecting the four chips; socket. |
| 27 | Force + ice | Ice skates + suction; navigate the combined slide/force path to chips; socket. |
| 28 | Gauntlet | Use vertical gaps between monster rows; grab chips on the middle row when clear; socket. |
| 29 | Toolkit | Keys open locks along the left; boots handle water/fire/ice/force; blocks optional; chips behind green lock path; socket. |
| 30 | Finale | Combine keys, boots, blocks, and careful monster avoidance; collect every chip; socket; exit. |

## Engine notes (relevant to design)

- **Socket** is solid until `chipsCollected >= chipsNeeded`.
- **Locks** consume one matching key and become floor.
- **Cloner + red button** spawns **monsters**, not blocks.
- **Brown button** opens all traps; closed traps are enterable but immobilize the player.
- **Dirt** becomes floor when stepped; **gravel** stays gravel.
- **Block on water** becomes dirt (walkable).
- **Block on bomb** clears the bomb.
- Toggle walls start **open** (`toggleOpen = true` at load).
