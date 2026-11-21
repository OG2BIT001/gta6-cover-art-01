[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/OG2BIT001/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/OG2BIT001/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Coast Cover Studio

Turn your own photos and a caption into cover art in the multi-panel GTA-poster style — bold condensed
lettering, a Vice City sunset or neon colour grade, white panel gutters — and export it as a PNG ready to
post. It is a single-page web app that runs **fully offline** from its own static files: your photos are
read on your machine and never uploaded anywhere.

Built for the make.fun bounty [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Multi-panel covers** — four layouts: the classic cover grid, hero + panels, side strips, and full
  bleed. Fill every panel from one photo (each panel crops it differently) or spread several photos
  across the panels.
- **Colour grades** — five gradient-map grades applied per pixel on canvas, with posterisation for a
  printed-poster feel: Vice sunset, Neon nights, Pastel vice, Golden hour and Midnight noir.
- **Any photo** — add photos from your machine, click a thumbnail to select one, then reframe it with
  focus and zoom sliders, or simply drag the cover itself.
- **Lettering** — a letterspaced tagline, a big condensed title with a hard offset shadow, a neon script
  accent word, a caption band along the foot, and a wanted-star heat meter (0–5).
- **Exports** — one click saves a PNG at **1080 × 1080**, **1080 × 1350** or **1920 × 1080**, or all three
  sizes at once. Exports are deterministic: the same scene always renders the same pixels.
- **Samples built in** — three sample photos ship with the app, and three more scenes are drawn
  procedurally on canvas, so it makes a complete cover before you add anything.

Everything is original: no Rockstar Games logos, artwork or fonts. Lettering uses system font stacks, and
all art in the samples was drawn for this app.

## Run it

Serve the `app/` folder with any static file server and open it in a desktop browser — or use the little
server that comes with the repo (Node.js 22.18 or later):

```sh
node serve.ts
# then open http://localhost:8080
```

No build step, no dependencies, no network: every file the page loads lives under `app/`.

## How the entry is handed in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory and
writes `dossier.json` there with `buildDossier` from `vendor/makefun-app.ts`, under the competition gate's
caps:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout of this repository

- `main.ts` — the hand-in program described above
- `serve.ts` — a tiny local server for trying the app
- `vendor/makefun-app.ts` — the make.fun dossier library, copied from the competition kit unchanged
- `app/` — the web app: `index.html`, `style.css`, `src/` (cover engine, page wiring, sample scenes,
  screenshot scenes) and `samples/` (built-in sample photos)
- `screenshots/` — the app with a photo loaded, and covers it exported
- `shots.json` — the fixed scenes the screenshots were taken from

## License

MIT — see `LICENSE`.
