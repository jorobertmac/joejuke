# Joe's Juke

A puzzle game built in pure HTML / CSS / JavaScript, with a **full level editor** and **Chip's Challenge–inspired** directional tiles & monsters.

**Joe** must juke past enemies, collect keys, open locks, slide on ice (and around ice corners), ride force floors, push blocks into water, and avoid fire & spikes to reach the exit.

## How to Play

- **Desktop:** Arrow keys or WASD  
- **Mobile:** Swipe on the board or use the on-screen D-pad  
- Collect all **keys** before the **exit** will let you through  
- **Locks** require enough keys  
- **Ice** slides you until you leave ice; **ice corners** redirect the slide  
- **Force floors** shove you in the arrow direction  
- **Dry blocks** can be pushed (including onto ice/force); push into **water** to fill it  
- **Fire**, **spikes**, and **monsters** end the level on contact  

## Level Editor

1. Title screen → **Level Editor**  
2. Set width (5–40) / height (5–30) → **Apply**  
3. Paint tiles from the palette (or press the character key)  
4. Place one **P** and one **E**; add terrain, force, ice corners, and monsters  
5. **Test** to play; **Back to Editor** from win/lose  
6. **Export** JSON to save or share; **Import** to load  

Export format (version 2 supports the expanded tile set):

```json
{
  "name": "Custom Level",
  "cols": 20,
  "rows": 15,
  "map": ["WWWW...", "..."],
  "version": 2
}
```

## Tile Legend

### Terrain

| Char | Tile | Behavior |
|------|------|----------|
| `.` | Floor | Walkable |
| `W` | Wall | Solid |
| `~` | Water | Impassable; filled by a dry block |
| `I` | Ice | Slide until off ice |
| `1` | Ice corner NW | Solid N+W; redirects slide (N→E, W→S) |
| `3` | Ice corner NE | Solid N+E; redirects (N→W, E→S) |
| `7` | Ice corner SW | Solid S+W; redirects (S→E, W→N) |
| `9` | Ice corner SE | Solid S+E; redirects (S→W, E→N) |
| `^` `>` `v` `<` | Force floor | Shoves entities N/E/S/W |
| `F` | Fire | Lethal |
| `S` | Spike | Lethal / blocked |
| `B` | Dry block | Pushable; sinks in water |
| `K` | Key | Collect |
| `L` | Lock | Opens with enough keys |
| `E` | Exit | Goal (needs all keys) |
| `P` | Player start | — |

### Monsters (Chip's Challenge–style AI)

| Char | Monster | Behavior |
|------|---------|----------|
| `o` | Ball (H) | Bounces east/west |
| `O` | Ball (V) | Bounces north/south |
| `M` | Ball | Same as `o` (legacy) |
| `g` | Glider | Prefers left turns at walls |
| `f` | Fireball | Prefers right turns; ignores fire |
| `u` | Bug | Left-wall follower |
| `a` | Tank | Moves until blocked, then reverses |
| `w` | Walker | Random turn when blocked |
| `T` | Teeth | Chases the player |

Mechanics are inspired by the original Chip's Challenge (CC1) tile set and monster rules used across official level packs.

## Mobile

- Responsive layout with safe-area insets  
- Touch swipe + D-pad  
- Editor toolbar below the map (does not block painting)  
- Scrollable tile palette  

## Tech

- Single-page HTML5 Canvas  
- `style.css` + deferred `game.js`  
- Variable level size; JSON import/export  
- No build step — open `index.html` in a modern browser  
