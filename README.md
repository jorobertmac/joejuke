# Joe's Juke

A 5-level concept puzzle game built in pure HTML / CSS / JavaScript.

**Joe** must juke past enemies, collect keys, open locks, slide on ice, and avoid water & spikes to reach the exit on each level.

## How to Play

- **Desktop:** Arrow keys or WASD
- **Mobile:** Swipe on the board or use the on-screen D-pad
- Collect all **keys** before the **exit** will let you through
- **Locks** require the matching number of keys
- **Ice** makes you slide until you hit something solid
- Touching **enemies** or **spikes** ends the level
- **Water** is impassable

## Mobile

- Responsive layout with safe-area insets
- Touch swipe controls + large D-pad buttons
- Optimized viewport (no accidental zoom)
- Landscape-friendly compact mode

## Tech

- Single-page HTML5 Canvas game
- Linked CSS (`style.css`)
- Deferred JS in the `<head>` (`game.js`)
- Player / tiles inspired by the `wd17d.jpg` pixel-art sheet

Open `index.html` in any modern browser (or phone). No build step required.
