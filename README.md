# Joe's Juke

A puzzle game built in pure HTML / CSS / JavaScript, now with a **full level editor**.

**Joe** must juke past enemies, collect keys, open locks, slide on ice, push dry blocks, and avoid water & spikes to reach the exit on each level.

## How to Play

- **Desktop:** Arrow keys or WASD
- **Mobile:** Swipe on the board or use the on-screen D-pad
- Collect all **keys** before the **exit** will let you through
- **Locks** require the matching number of keys
- **Ice** makes you (and blocks) slide until you hit something solid
- **Dry blocks (crates)** can be pushed. Push one into **water** to fill it and create a path
- Touching **enemies** or **spikes** ends the level
- **Water** is impassable until filled by a block

## Level Editor

Create, test, export, and share your own levels.

1. From the title screen choose **Level Editor**.
2. Set the full level size (width 5–40, height 5–30) and press **Apply Size**.
3. Pick a tile from the palette (or press the character key) and paint on the canvas.
4. Place exactly one **P** (player start) and one **E** (exit). Add keys, locks, blocks, ice, water, spikes, and enemies as you like.
5. Press **Test Level** to play your design. Use **Back to Editor** from the game-over or win screens to keep editing.
6. When happy, press **Export** → **Copy** or **Download** the JSON to save or share.
7. Anyone can load a shared level with **Import Level** (title screen or editor).

### Export format

```json
{
  "name": "Custom Level",
  "cols": 20,
  "rows": 15,
  "map": [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.P...............EW",
    "..."
  ],
  "version": 1
}
```

You can also paste a plain multi-line map of the character grid.

## Tile Legend

| Char | Tile        | Behavior                                      |
|------|-------------|-----------------------------------------------|
| `.`  | Floor       | Walkable                                      |
| `W`  | Wall        | Solid                                         |
| `~`  | Water       | Impassable; can be filled by a dry block      |
| `I`  | Ice         | Slide until non-ice solid                     |
| `B`  | Dry block   | Pushable crate; sinks into water              |
| `K`  | Key         | Collect                                       |
| `L`  | Lock        | Opens when you have enough keys               |
| `E`  | Exit        | Goal (needs all keys)                         |
| `S`  | Spike       | Lethal / blocked                              |
| `M`  | Enemy       | Patrols; contact = game over                  |
| `P`  | Player start| —                                             |

## Mobile

- Responsive layout with safe-area insets
- Touch swipe controls + large D-pad buttons
- Optimized viewport (no accidental zoom)
- Landscape-friendly compact mode
- Editor palette and size controls work on touch devices

## Tech

- Single-page HTML5 Canvas game
- Linked CSS (`style.css`)
- Deferred JS in the `<head>` (`game.js`)
- Variable level dimensions (canvas resizes to match)
- Level import / export as JSON
- Player / tiles inspired by the `wd17d.jpg` pixel-art sheet

Open `index.html` in any modern browser (or phone). No build step required.
