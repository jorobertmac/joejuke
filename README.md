# Joe's Juke

A Chip's Challenge–style puzzle game in pure HTML/CSS/JS with a full level editor.

Reference tile set: [Chip's Challenge Wiki – Tile](https://wiki.bitbusters.club/Tile) (CC1).

**Joe** collects computer chips, opens the socket, and reaches the exit while using boots, keys, blocks, ice, force floors, and dodging nine monster types.

## Controls

- **Desktop:** Arrow keys / WASD  
- **Mobile:** Swipe or on-screen D-pad  
- **Pause:** Space / Esc (or HUD ❚❚)  

## Level select

- **Start menu:** choose any of the 30 built-in levels, then **Start Game**
- **Pause menu** (campaign play): **Go to** + level list → **Go** jumps to that level (hidden while testing from the editor)

## Level Editor

1. Title → **Level Editor**  
2. Set size (W/H up to 100) → Apply  
3. Choose **Layer**: **Base** (terrain, always filled), **Item** (chips/keys/boots; can be empty), or **Block** (pushable blocks; can sit on items)  
4. Paint from the palette (IDs shown under each icon on desktop)  
5. Place one **J0** (player) and one **EX** (exit) on the base layer  
6. **Test** → play; **Back to Editor** from win/lose  
7. **Rate** runs a static puzzle-quality report (see `LEVEL_RATING.md`)
8. **Export** JSON to share; **Import** to load  

Items on the item layer can hide under blocks. Push the block away in play to reveal and collect them.

## Tile / entity IDs (2-character alphanumeric)

Every map cell is a **unique 2-character ID** from `a-z`, `A-Z`, `0-9` (3,844 slots). Map rows are packed strings (2 chars per cell). Empty overlay cells use two spaces (`"  "`).

### Allocation scheme

| Prefix / pattern | Meaning |
|------------------|---------|
| `00` | Floor (default base) |
| `99` / `98` / `97` | Wall / hidden wall / invisible wall |
| Mnemonic pairs (`~~`, `FF`, `II`, `EX`, …) | Terrain & special tiles |
| `K*` / `L*` | Keys / locks (B/R/G/Y) |
| `B*` (mixed case) | Boots (`Bf` flip, `By` fire, `Bi` ice, `Bs` suction) |
| `BK` | Pushable block |
| `m*` | Monsters (always lowercase `m`) |
| `J0` | Player start |

Legacy single-character maps still import via `LEGACY_CH` → 2-char migration in `js/constants.js`.

### Terrain
| ID | Tile | Behavior |
|----|------|----------|
| `00` | Floor | Walkable |
| `99` | Wall | Solid |
| `~~` | Water | Deadly without flippers; block → dirt |
| `FF` | Fire | Deadly without fire boots; fireballs immune |
| `II` | Ice | Slide (ice skates walk) |
| `I1` `I3` `I7` `I9` | Ice corners NW/NE/SW/SE | Redirect slide; solid two sides |
| `FN` `FE` `FS` `FW` | Force N/E/S/W | Shove (suction boots walk) |
| `FR` | Random force | Random direction each step |
| `DD` | Dirt | Player only; becomes floor when stepped |
| `GG` | Gravel | Player only; permanent |
| `EX` | Exit | Win when chips ≥ needed |
| `SX` | Chip socket | Opens when all chips collected |
| `CH` | Computer chip | Collect |
| `??` | Hint | Floor (flavor) |
| `97` | Invisible wall | Always wall, never revealed |
| `98` | Hidden wall | Reveals as wall when touched |
| `RR` | Recessed wall | Player passes once → becomes wall |
| `BR` | Blue wall (real) | Becomes wall when touched |
| `BF` | Blue wall (fake) | Becomes floor when touched |
| `TN` `TE` `TS` `TW` | Thin wall N/E/S/W | Blocks entry from that side |
| `TP` | Teleporter | Exit previous teleport in reverse reading order |
| `BM` | Bomb | Kills player; block or monster clears it |
| `TH` | Thief | Steals all boots |
| `TR` | Trap | Closed until brown button |
| `VW` `VF` | Toggle wall / floor | Switched by green button |
| `CL` | Cloner | Spawns on red button |
| `BG` `RD` `BB` `BN` | Buttons G/R/B/Brn | Toggle / clone / tanks / traps |
| `KB` `KR` `KG` `KY` | Keys blue/red/green/yellow | Collect |
| `LB` `LR` `LG` `LY` | Locks B/R/G/Y | Need matching key |
| `Bf` `By` `Bi` `Bs` | Boots flip/fire/ice/suction | Inventory |
| `BK` | Dirt block | Pushable; fills water → dirt |
| `J0` | Player start | — |

### Monsters (CC1 AI) — IDs always start with `m`
| ID | Monster | Behavior |
|----|---------|----------|
| `mb` / `mB` | Ball H / V | Bounce reverse on obstacle |
| `mg` | Glider | Prefer left turn |
| `mf` | Fireball | Prefer right turn; immune to fire |
| `mu` | Bug | Left-wall follower |
| `mc` | Paramecium | Right-wall follower |
| `mt` | Tank | Move until blocked; reverse on blue button |
| `mw` | Walker | Random turn when blocked |
| `me` | Teeth | Chase player; every other tick |
| `mo` | Blob | Random direction; half speed |

## Tech

- Single-page Canvas game, no build step  
- Variable map size, layered JSON import/export (version 4: packed 2-char `map` + optional `overlay` + `blocks`)  
- Serve over HTTP (level pack uses `fetch` on `levels/manifest.json`)  
- Open `index.html` in any modern browser  

### Source layout

| File | Role |
|------|------|
| `game.js` | Boot + main loop only |
| `js/constants.js` | Tile IDs, 2-char maps, directions, sprite indices, legacy migration |
| `js/levels.js` | Loads `levels/manifest.json` + per-level JSON |
| `levels/` | One JSON file per level (map, overlay, blocks, timeLimit, chipsRequired, maxMoves) |
| `js/tiles.js` | Ice / force / slide helpers |
| `js/movement.js` | Player move, solid checks, monster AI |
| `js/drawing.js` | Asset load + sprite / procedural rendering |
| `js/editor.js` | Level editor UI & painting |
| `js/level-rating.js` | Static puzzle rating heuristics |

Mechanics follow the CC1 tile list and Lynx/MS movement rules documented on the Bit Busters wiki.


## Level pack format

Campaign levels live in `levels/` as individual JSON files listed by `levels/manifest.json`.

Each level file supports:

```json
{
  "id": "01-block-door",
  "number": 1,
  "title": "Block Door",
  "author": "Joe's Juke",
  "timeLimit": 150,
  "chipsRequired": 5,
  "maxMoves": 0,
  "password": null,
  "hint": "",
  "map": ["WWWW...", "..."],
  "overlay": null,
  "blocks": [{ "x": 4, "y": 3 }]
}
```

- `timeLimit` — seconds; `0` = no limit  
- `chipsRequired` — socket requirement (defaults to chip count on the map)  
- `maxMoves` — hard move cap; `0` = unlimited  
- `map` / `overlay` / `blocks` — layered layout (same as the editor export)

Serve over HTTP so `fetch` can load the pack (required for `file://` restrictions).
