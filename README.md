[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Elies87/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Elies87/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Vice — Cover Art Studio

An entry for the make.fun bounty [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01): a static web app that turns your own photos and a caption into GTA-style cover art — multi-panel posters with slanted panels, white keylines, a Vice City sunset or neon colour grade and bold poster lettering — exported as a PNG to share.

## Use it

Serve `app/` with any static file server (for example `node serve.ts`, then open the local address it prints) and open `app/index.html` in a desktop browser. The app runs fully offline and your photos never leave your machine.

1. **Add your photos** — or start with the two bundled sample artworks.
2. **Click a panel, then a photo** to fill it. Drag inside a panel to reposition its photo, scroll to zoom, or spread one photo across every panel.
3. **Pick a layout, a colour grade and a post size** — 1080×1080, 1080×1350 or 1920×1080 — and edit the title and tagline.
4. **Export PNG.** The preview canvas is the export canvas, so what you see is exactly what downloads.

## What's inside

- `app/src/layouts.js` — four panel layouts (Classic Collage, Triptych, Hero + Strip, Grid Six) as shared-edge polygons, so the collage tiles perfectly at any aspect.
- `app/src/render.js` — the cover renderer: per-photo colour grades (Vice Sunset, Neon Nights, Golden Hour, Midnight Noir), the finishing wash and vignette, keylines, and the slanted gradient lettering with its letter-spaced tagline.
- `app/src/studio.js` — state: photos, panel assignments and framing, plus PNG export.
- `app/src/main.js` — the editor: controls, photo tray, drag/scroll framing gestures, drag-and-drop.
- `app/src/shots.js` — deterministic screenshot poses (`?shot=cover`, `?shot=editor`, `?shot=coverwide`, `?shot=editorwide`).
- `app/fonts/` — Anton (SIL Open Font License 1.1, license included), the poster's display face.
- `app/samples/` — two artworks generated for this studio, free to use.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to the output and writes `dossier.json` with the kit's vendored library.

Everything is original: no Rockstar Games logo, artwork or font is used anywhere. License: MIT (see LICENSE).
