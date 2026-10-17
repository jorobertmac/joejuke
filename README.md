# Joe's Juke

A 5-level concept puzzle game built in pure HTML / CSS / JavaScript.

**Joe** must juke past enemies, collect keys, open locks, slide on ice, and avoid water & spikes to reach the exit on each level.

## How to Play

- **Arrow keys** or **WASD** to move
- Collect all **keys** (yellow) before the **exit** will let you through
- **Locks** (red) require the matching number of keys
- **Ice** makes you slide until you hit something solid
- Touching **enemies** (green blobs) or **spikes** ends the level
- **Water** is impassable

## Tech

- Single-page HTML5 Canvas game
- Linked CSS (`style.css`)
- Deferred JS in the `<head>` (`game.js`)
- Player sprites extracted & processed from the provided `wd17d.jpg` pixel-art sheet

## Files

- `index.html` — structure, deferred script
- `style.css` — pixel-font UI, HUD, overlays
- `game.js` — full game logic + 5 handcrafted levels + embedded player atlas

Open `index.html` in any modern browser. No build step required.
