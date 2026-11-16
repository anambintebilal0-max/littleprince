# The Little Prince — Fan-Made Book Trailer (Animation)

A small, dependency-free HTML5 canvas project that plays a ~42-second animated book trailer in the spirit of *The Little Prince*: a starry night, a desert dusk, a tiny planet, a drift between stars, a wheat field at golden hour, and a title finale.

> Unofficial fan project. Not affiliated with or endorsed by the book's publishers or rights holders. All artwork is original and drawn in code; no book text or official art is included.

## Run it

No build step.

```bash
git clone https://github.com/<your-username>/little-prince-trailer.git
cd little-prince-trailer
python3 -m http.server 8000   # or: npx serve
```

Open <http://localhost:8000> and press **Play trailer**.

## Customise

Everything lives in `config.js`:

| Option | What it does |
| --- | --- |
| `title`, `byline` | Text on the title cards |
| `scenes[]` | Order, `duration` (seconds) and `caption` of each scene |
| `fade` | Cross-fade length between scenes |
| `colors` | The palette used by every scene |
| `audio` | Path to music **you have the rights to use** (e.g. `assets/music.mp3`) |
| `overlays[]` | Your own illustrations drawn over a scene: `{ src, scene, x, y, scale }` |

To add a new scene, write a function `sceneMine(t, time)` in `trailer.js`, register it in `RENDERERS`, then add `{ id: "mine", duration: 6, caption: "…" }` to `config.js`.

## Export a video

Click **● Record WebM**. The trailer restarts and records the canvas (plus audio, if configured). When it ends, a `.webm` file downloads. Convert to MP4 if needed:

```bash
ffmpeg -i little-prince-fan-trailer.webm -c:v libx264 -pix_fmt yuv420p trailer.mp4
```

## Publish on GitHub Pages

Push to GitHub, then **Settings → Pages → Deploy from branch → `main` / root**.

## Project structure

```
index.html   page + controls
style.css    layout
config.js    scenes, captions, colours, audio
trailer.js   animation engine and scene renderers
assets/      your music and artwork (optional)
```

## Licence

Code: MIT (add a `LICENSE` file). The book and its characters belong to their respective rights holders; please check the rules in your country before publishing fan content, and only use music and images you have permission to use.
