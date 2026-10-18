# Joe's Juke — Resources

All tiles are **32×32** pixels. Generated from the original procedural Canvas style.

## Folder layout

```
resources/
  sprites/
    joe.png              # 64×128  — 2 frames × 4 directions (cols=frames, rows=N/E/S/W)
    joe_n_idle.png …     # individual frames
  tiles/
    terrain.png          # horizontal strip of all terrain tiles
    terrain_*.png        # individual terrain tiles
    items.png            # horizontal strip of items / keys / boots / locks / buttons
    item_*.png           # individual item tiles
  monsters/
    ball.png … blob.png  # each: 32×128 (or 64×128 for blob) — cols=frames, rows=N/E/S/W
    *_n_0.png …          # individual frames
```

## Terrain strip order (`tiles/terrain.png`)

| Index | Name |
|------:|------|
| 0 | floor |
| 1 | floor_alt |
| 2 | wall |
| 3 | water |
| 4 | fire |
| 5 | ice |
| 6 | ice_nw |
| 7 | ice_ne |
| 8 | ice_sw |
| 9 | ice_se |
| 10 | force_n |
| 11 | force_e |
| 12 | force_s |
| 13 | force_w |
| 14 | force_r |
| 15 | dirt |
| 16 | gravel |
| 17 | exit |
| 18 | socket |
| 19 | hint |
| 20 | invis |
| 21 | hidden |
| 22 | recessed |
| 23 | blue_real |
| 24 | blue_fake |
| 25 | thin_n |
| 26 | thin_e |
| 27 | thin_s |
| 28 | thin_w |
| 29 | teleport |
| 30 | bomb |
| 31 | thief |
| 32 | trap_closed |
| 33 | trap_open |
| 34 | toggle_wall |
| 35 | toggle_floor |
| 36 | cloner |

## Items strip order (`tiles/items.png`)

| Index | Name |
|------:|------|
| 0 | chip |
| 1 | key_blue |
| 2 | key_red |
| 3 | key_green |
| 4 | key_yellow |
| 5 | boot_flip |
| 6 | boot_fire |
| 7 | boot_ice |
| 8 | boot_suction |
| 9 | block |
| 10 | lock_blue |
| 11 | lock_red |
| 12 | lock_green |
| 13 | lock_yellow |
| 14 | btn_green |
| 15 | btn_red |
| 16 | btn_blue |
| 17 | btn_brown |

## Joe sheet layout

- Columns: frame 0 = idle, frame 1 = walk
- Rows: 0 = North, 1 = East, 2 = South, 3 = West

## Monster sheet layout

- Columns: animation frames (most have 1; blob has 2)
- Rows: 0 = North, 1 = East, 2 = South, 3 = West

## Monsters

- `ball` — pink bouncing ball
- `glider` — blue diamond / kite
- `fireball` — red/orange/yellow sphere
- `bug` — yellow oval
- `paramecium` — teal elongated
- `tank` — green body + barrel (direction-aware)
- `walker` — purple biped
- `teeth` — green chaser with teeth
- `blob` — green blob (2-frame squash)

Do not edit game.js / index / css yet — assets only.
