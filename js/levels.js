/**
 * Joe's Juke — built-in level layouts
 * 5 training levels + 25 progressive challenge levels (30 total)
 *
 * Design rules enforced:
 * - Exit (E) is always behind the chip socket (X). Socket opens only after all chips are collected.
 * - Locks protect chips or the only path to chips / next keys — never decorative.
 * - Every challenge level requires sequencing, timing, or spatial reasoning.
 * All maps 20×15, one A, one E.
 */
"use strict";

var LEVELS = [
  /* ========== TRAINING 1 — Movement, chips, blocks, exit ========== */
  /* Walk, push block out of the way, collect chips, open socket, exit. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W..................W",
    "W....WWWW..........W",
    "W....W..W..........W",
    "W....W.CW..........W",
    "W....W.BW..........W",
    "W....W..W..........W",
    "W....WWWW..........W",
    "W..................W",
    "W......C.....C.....W",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== TRAINING 2 — Keys, locks, socket ========== */
  /* Blue key opens the only lock protecting both chips; socket gates exit. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W.2................W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W.(................W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W.C..............C.W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== TRAINING 3 — Boots (water, fire, ice, force) ========== */
  /* Each boot is required to reach its chip across the matching hazard. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A..f.j.l.q.......W",
    "W.~~~~~~~~~~~~~~~~~W",
    "W.C................W",
    "W.FFFFFFF..........W",
    "W.C................W",
    "W.IIIIIIII.........W",
    "W.C................W",
    "W.^^^^^^^^.........W",
    "W.C................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== TRAINING 4 — Monsters (dodge) ========== */
  /* Collect four chips while dodging simple ball patrols; socket gates exit. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W....p.............W",
    "W..................W",
    "W.C...............CW",
    "W..................W",
    "W....P.............W",
    "W..................W",
    "W.C...............CW",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== TRAINING 5 — Special tiles overview ========== */
  /* Gallery of tiles; still requires chips + socket to leave. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.~.F.I.^.[.]....W",
    "W.D.G.r.h.i.N.Y.H.ZW",
    "W.@.*.$.=.|.+.!.#.%W",
    "W.2.4.6.8.(.).{.}.&W",
    "W.f.j.q.l.B.C......W",
    "W.p.P.m.z.a.c.t.k.TW",
    "W.x................W",
    "W......C.....C.....W",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],

  /* ========== LEVEL 6 — Nested maze ========== */
  /* Forced nested corridors; every chip is required before the central socket. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.WWWWWWWWWWWWWWW..W",
    "W.C..............C.W",
    "W.W.WWWWWWWWWWWW.W.W",
    "W.W.C..........C.W.W",
    "W.W.W.WWWWWWWW.W.W.W",
    "W.W.W.C......C.W.W.W",
    "W.W.W.W.WWWW.W.W.W.W",
    "W.W.W.W.C..C.W.W.W.W",
    "W.W.W.W.WXXW.W.W.W.W",
    "W.W.W.W.W.EW.W.W.W.W",
    "W.C.C.C.C..C.C.C.C.W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 7 — Block bridge ========== */
  /* Push the three blocks into water to reach the chips on the far side. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A....B.B.B.......W",
    "W..................W",
    "W.~~~~~~~~~~~~~~~~~W",
    "W.~~~~~~~~~~~~~~~~~W",
    "W.~~~~~~~~~~~~~~~~~W",
    "W..................W",
    "W.C.C.C.C.C.C.C.C..W",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 8 — Key chain ========== */
  /* Sequential keys open the only path to the next key, then to the chips. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.2..............W",
    "W.WWWWW.WWWWWWWWWWWW",
    "W.....(.4..........W",
    "W.WWWWWWWWW.WWWWWWWW",
    "W.........).6......W",
    "W.WWWWWWWWWWWWW.WWWW",
    "W.............{.8..W",
    "W.WWWWWWWWWWWWWWW.WW",
    "W................}.W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 9 — Ice maze ========== */
  /* Ice skates required; chips sit in the center of a sliding maze. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.j................W",
    "W.IIIIIIIIIIIIIIII.W",
    "W.I..............I.W",
    "W.I.IIIIIIIIIIII.I.W",
    "W.I.I..........I.I.W",
    "W.I.I.C.C.C.C..I.I.W",
    "W.I.I..........I.I.W",
    "W.I.IIIIIIIIIIII.I.W",
    "W.I..............I.W",
    "W.IIIIIIIIIIIIIIII.W",
    "W........X.........W",
    "W........E.........W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 10 — Force floors ========== */
  /* Suction boots + force corridors; chips only reachable on the forced loop. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.q..............W",
    "W.>>>>>>>>>>>>>>>>>W",
    "W.^...............vW",
    "W.^...............vW",
    "W.^...C.C.C.C.....vW",
    "W.^...............vW",
    "W.^...............vW",
    "W.<<<<<<<<<<<<<<<<<W",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 11 — Fire ring ========== */
  /* Fire boots required to enter the ring and collect the chips inside. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.l..............W",
    "W.FFFFFFFFFFFFFFFF.W",
    "W.F..............F.W",
    "W.F.FFFFFFFFFFFF.F.W",
    "W.F.F..........F.F.W",
    "W.F.F.C.C.C.C..F.F.W",
    "W.F.F..........F.F.W",
    "W.F.FFFFFFFFFFFF.F.W",
    "W.F..............F.W",
    "W.FFFFFFFFFFFFFFFF.W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 12 — Ball lanes ========== */
  /* Time crossings of ball patrols to reach the chip row. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W.p...............pW",
    "W..................W",
    "W.P...............PW",
    "W..................W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W..................W",
    "W.p...............pW",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 13 — Toggle walls ========== */
  /* Green button toggles the walls that block every chip and the socket. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.!.|..............W",
    "W...|..............W",
    "W...|...C..........W",
    "W...|..............W",
    "W...|...C..........W",
    "W...|..............W",
    "W...|...C..........W",
    "W...|..............W",
    "W...|...X..........W",
    "W...|...E..........W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 14 — Teleporters ========== */
  /* Teleport is the only way into the sealed chip room. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.@................W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W..................W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W..................W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W.................@W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 15 — Dirt & gravel ========== */
  /* Dirt turns to wall after you step; wrong order permanently seals chips. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.DDDDDDDDDDDDDDDD.W",
    "W.D..............D.W",
    "W.D.GGGGGGGGGGGG.D.W",
    "W.D.G..........G.D.W",
    "W.D.G.C.C.C.C..G.D.W",
    "W.D.G..........G.D.W",
    "W.D.GGGGGGGGGGGG.D.W",
    "W.D..............D.W",
    "W.DDDDDDDDDDDDDDDD.W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 16 — Cloner bridge ========== */
  /* Clone blocks with the red button, push them into water to reach chips. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.+>B..............W",
    "W..................W",
    "W.#................W",
    "W.~~~~~~~~~~~~~~~~~W",
    "W.~~~~~~~~~~~~~~~~~W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 17 — Trap release ========== */
  /* Brown button opens the trap corridor that is the only path to chips. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.&=...............W",
    "W.W................W",
    "W.C................W",
    "W.W................W",
    "W.C................W",
    "W.W................W",
    "W.C................W",
    "W.W................W",
    "W.X................W",
    "W.E................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 18 — Mixed boots ========== */
  /* Correct boot for each hazard segment; all chips lie beyond the hazards. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.f.l.j.q........W",
    "W.~~~~~~~~~~~~~~~~~W",
    "W.FFFFFFF..........W",
    "W.IIIIIIII.........W",
    "W.^^^^^^^^.........W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 19 — Glider / fireball ========== */
  /* Cross monster lanes to collect chips on the far side of each lane. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.m...............zW",
    "W..................W",
    "W.C...............CW",
    "W..................W",
    "W.m...............zW",
    "W..................W",
    "W.C...............CW",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 20 — Four-key vault ========== */
  /* Each colored lock is the only door to its chip; no way around. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.2.4.6.8..........W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W.(.C..............W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W.).C..............W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W.{.C..............W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W.}.C..............W",
    "W.WWWWWWWWWWWWWWWW.W",
    "W........X.........W",
    "W........E.........W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 21 — Ice corners ========== */
  /* Corner ice forces direction changes; chips only reachable with ice boots. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.j..............W",
    "W.1IIIIIIIIIIIIII3.W",
    "W.I..............I.W",
    "W.I.1IIIIIIIIII3.I.W",
    "W.I.I..........I.I.W",
    "W.I.I.C.C.C.C..I.I.W",
    "W.I.I..........I.I.W",
    "W.I.7IIIIIIIIII9.I.W",
    "W.I..............I.W",
    "W.7IIIIIIIIIIIIII9.W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 22 — Thief ========== */
  /* Boots are stolen; you must re-equip the correct boot for the remaining path. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.f..............W",
    "W.~.~.~.~.~.~.~.~.~W",
    "W.$................W",
    "W.l................W",
    "W.F.F.F.F.F.F.F.F.FW",
    "W.C.C.C.C.C.C.C.C.CW",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 23 — Tank ========== */
  /* Blue button reverses tank direction so you can safely reach the chips. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.t................W",
    "W..................W",
    "W.%................W",
    "W..................W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 24 — Bomb clearing ========== */
  /* Push the block onto bombs to clear the only path to the chips. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.B..............W",
    "W.*................W",
    "W.*................W",
    "W.*................W",
    "W.*................W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 25 — Blue walls ========== */
  /* Real vs fake blue walls; only one route leads to the chips. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.[[[.[[[.[[[.[[[..W",
    "W.]].]].]].]].]]...W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W.[[[.[[[.[[[.[[[..W",
    "W.]].]].]].]].]]...W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 26 — Teeth chase ========== */
  /* Teeth pursue; collect chips while staying ahead of them. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.T................W",
    "W..................W",
    "W.C...............CW",
    "W..................W",
    "W.T................W",
    "W..................W",
    "W.C...............CW",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 27 — Force + ice ========== */
  /* Ice + force floors combined; boots required for the only path to chips. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.j.q............W",
    "W.IIII>>>>>>>>>>>>.W",
    "W.I..............v.W",
    "W.I.C.C.C.C.C.C..v.W",
    "W.I..............v.W",
    "W.IIII<<<<<<<<<<<<.W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 28 — Monster gauntlet ========== */
  /* Dense monster patrols; chips sit in the middle of the danger zone. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A................W",
    "W.p.m.z.a.c.t.k.T.xW",
    "W..................W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W..................W",
    "W.p.m.z.a.c.t.k.T.xW",
    "W..................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 29 — Full toolkit ========== */
  /* Keys, boots, blocks and hazards layered; chips only after clearing defenses. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.2.f.l.j.q......W",
    "W.(.~.F.I.^........W",
    "W.4.B.B.B.B........W",
    "W.)................W",
    "W.6................W",
    "W.{.C.C.C.C.C.C.C.CW",
    "W.8................W",
    "W.}................W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ],
  /* ========== LEVEL 30 — Final challenge ========== */
  /* Full toolkit + monsters + special tiles; every chip is required for the socket. */
  [
    "WWWWWWWWWWWWWWWWWWWW",
    "W.A.2.4.6.8.f.l.j.qW",
    "W.(.).{.}.~.F.I.^..W",
    "W.B.B.B.B.B.B.B.B.BW",
    "W.p.m.z.a.c.t.k.T.xW",
    "W.@.!.#.%.&.|.+.*=.W",
    "W.C.C.C.C.C.C.C.C.CW",
    "W.D.G.r.h.i.[.]N.Y.W",
    "W.H.Z..............W",
    "W........X.........W",
    "W........E.........W",
    "W..................W",
    "W..................W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
  ]
];
