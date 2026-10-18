# Joe's Juke

A Chip's Challenge–style puzzle game in pure HTML/CSS/JS with a full level editor.

Reference tile set: [Chip's Challenge Wiki – Tile](https://wiki.bitbusters.club/Tile) (CC1).

**Joe** collects computer chips, opens the socket, and reaches the exit while using boots, keys, blocks, ice, force floors, and dodging nine monster types.

## Controls

- **Desktop:** Arrow keys / WASD  
- **Mobile:** Swipe or on-screen D-pad  

## Level Editor

1. Title → **Level Editor**  
2. Set size (W 5–40, H 5–30) → Apply  
3. Paint from the palette (or press the character key)  
4. Place one **A** (player) and one **E** (exit)  
5. **Test** → play; **Back to Editor** from win/lose  
6. **Export** JSON to share; **Import** to load  

## Tile Legend (CC1-accurate)

### Terrain
| Char | Tile | Behavior |
|------|------|----------|
| `.` | Floor | Walkable |
| `W` | Wall | Solid |
| `~` | Water | Deadly without flippers; block → dirt |
| `F` | Fire | Deadly without fire boots; fireballs immune |
| `I` | Ice | Slide (ice skates walk) |
| `1` `3` `7` `9` | Ice corners NW/NE/SW/SE | Redirect slide; solid two sides |
| `^` `>` `v` `<` | Force N/E/S/W | Shove (suction boots walk) |
| `R` | Random force | Random direction each step |
| `D` | Dirt | Player only; becomes floor when stepped |
| `G` | Gravel | Player only; permanent |
| `E` | Exit | Win when chips ≥ needed |
| `X` | Chip socket | Opens when all chips collected |
| `C` | Computer chip | Collect |
| `?` | Hint | Floor (flavor) |
| `i` | Invisible wall | Always wall, never revealed |
| `h` | Hidden wall | Reveals as wall when touched |
| `r` | Recessed wall | Player passes once → becomes wall |
| `[` | Blue wall (real) | Becomes wall when touched |
| `]` | Blue wall (fake) | Becomes floor when touched |
| `N` `Y` `H` `Z` | Thin wall N/E/S/W | Blocks entry from that side |
| `@` | Teleporter | Exit previous teleport in reverse reading order |
| `*` | Bomb | Kills player; block or monster clears it |
| `$` | Thief | Steals all boots |
| `=` | Trap | Closed until brown button |
| `\|` `_` | Toggle wall / floor | Switched by green button |
| `+` | Cloner | Spawns on red button |
| `!` `#` `%` `&` | Buttons G/R/B/Brn | Toggle / clone / tanks / traps |
| `2` `4` `6` `8` | Keys blue/red/green/yellow | Collect |
| `(` `)` `{` `}` | Locks B/R/G/Y | Need matching key |
| `f` `l` `j` `q` | Boots flip/fire/ice/suction | Inventory |
| `B` | Dirt block | Pushable; fills water → dirt |
| `A` | Player start | — |

### Monsters (CC1 AI)
| Char | Monster | Behavior |
|------|---------|----------|
| `p` / `P` | Ball H / V | Bounce reverse on obstacle |
| `m` | Glider | Prefer left turn |
| `z` | Fireball | Prefer right turn; immune to fire |
| `a` | Bug | Left-wall follower |
| `c` | Paramecium | Right-wall follower |
| `t` | Tank | Move until blocked; reverse on blue button |
| `k` | Walker | Random turn when blocked |
| `T` | Teeth | Chase player; every other tick |
| `x` | Blob | Random direction; half speed |

## Tech

- Single-page Canvas game, no build step  
- Variable map size, JSON import/export (version 3)  
- Open `index.html` in any modern browser  

Mechanics follow the CC1 tile list and Lynx/MS movement rules documented on the Bit Busters wiki.
