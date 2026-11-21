// Neon Coast cover engine: turns photos into multi-panel, GTA-poster-style cover art on a 2D canvas.
//
// Everything is drawn locally on canvas — no libraries, no network. Each panel of the layout is filled from a
// photo (cover-fit around a focus point, with a zoom), graded per pixel through a gradient map (a duotone /
// colour-grade LUT) with posterisation mixed in for a painterly, printed-poster feel, then the whole cover is
// lettered: a letterspaced tagline, a big condensed title with a hard offset shadow, a neon script accent, a
// caption band along the foot and a wanted-star heat meter. A fixed-seed grain and a vignette finish it, so
// every export of the same scene is pixel-identical.

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', width: 1080, height: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', width: 1920, height: 1080 },
];

export const LAYOUTS = [
  { id: 'grid', label: 'Cover grid' },
  { id: 'hero', label: 'Hero + panels' },
  { id: 'strips', label: 'Side strips' },
  { id: 'single', label: 'Full bleed' },
];

// Colour grades as gradient maps: stops of [luminance, [r, g, b]] from shadow to highlight. The graded colour
// is mixed with the photo's own contrast/saturation-adjusted colour so faces and clothes keep their identity.
export const GRADES = [
  {
    id: 'sunset', label: 'Vice sunset', mix: 0.74, saturation: 1.18, contrast: 1.07, posterise: 0.45,
    stops: [[0, [24, 7, 44]], [0.34, [120, 26, 94]], [0.62, [233, 83, 92]], [0.85, [255, 166, 88]], [1, [255, 241, 205]]],
  },
  {
    id: 'neon', label: 'Neon nights', mix: 0.7, saturation: 1.32, contrast: 1.1, posterise: 0.4,
    stops: [[0, [4, 15, 38]], [0.4, [9, 92, 112]], [0.72, [216, 44, 132]], [1, [240, 250, 255]]],
  },
  {
    id: 'miami', label: 'Pastel vice', mix: 0.62, saturation: 1.06, contrast: 0.98, posterise: 0.5,
    stops: [[0, [36, 36, 94]], [0.45, [86, 158, 202]], [0.76, [250, 148, 190]], [1, [255, 246, 220]]],
  },
  {
    id: 'gold', label: 'Golden hour', mix: 0.66, saturation: 1.22, contrast: 1.05, posterise: 0.35,
    stops: [[0, [18, 22, 40]], [0.4, [28, 108, 118]], [0.7, [242, 148, 58]], [1, [255, 238, 200]]],
  },
  {
    id: 'noir', label: 'Midnight noir', mix: 0.88, saturation: 0.85, contrast: 1.24, posterise: 0.3,
    stops: [[0, [7, 7, 12]], [0.5, [108, 110, 124]], [1, [246, 245, 238]]],
  },
];

const TITLE_FONT = (px) => `900 ${px}px Impact, "Arial Narrow Bold", "Franklin Gothic Medium", "Liberation Sans", sans-serif`;
const SCRIPT_FONT = (px) => `italic 700 ${px}px "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive`;
const SANS_FONT = (px, weight = 700) => `${weight} ${px}px "Segoe UI", "Helvetica Neue", Arial, sans-serif`;

// When one photo fills every panel, each panel still gets its own crop: these focus points and zooms cycle
// deterministically so a single portrait becomes a varied cover instead of the same crop nine times.
const FOCUS_CYCLE = [
  [0.5, 0.4], [0.28, 0.55], [0.72, 0.42], [0.5, 0.62], [0.34, 0.34],
  [0.66, 0.6], [0.5, 0.5], [0.24, 0.44], [0.76, 0.56], [0.44, 0.3], [0.56, 0.7], [0.5, 0.46],
];
const ZOOM_CYCLE = [1.05, 1.3, 1.22, 1.12, 1.38, 1.18, 1.0, 1.34, 1.26, 1.42, 1.15, 1.08];

/** The panel rectangles of a layout, as fractions of the canvas. */
export function layoutPanels(layoutId, width, height) {
  if (layoutId === 'hero') {
    return [
      { x: 0, y: 0, w: 0.58, h: 0.7 },
      { x: 0.58, y: 0, w: 0.42, h: 0.35 },
      { x: 0.58, y: 0.35, w: 0.42, h: 0.35 },
      { x: 0, y: 0.7, w: 1, h: 0.3 },
    ];
  }
  if (layoutId === 'strips') {
    return [
      { x: 0, y: 0, w: 0.4, h: 0.78 },
      { x: 0.4, y: 0, w: 0.33, h: 0.78 },
      { x: 0.73, y: 0, w: 0.27, h: 0.78 },
      { x: 0, y: 0.78, w: 1, h: 0.22 },
    ];
  }
  if (layoutId === 'single') {
    return [{ x: 0, y: 0, w: 1, h: 1 }];
  }
  const cols = width > height ? 4 : 3;
  const rows = height > width ? 4 : width === height ? 3 : 2;
  const panels = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      panels.push({ x: col / cols, y: row / rows, w: 1 / cols, h: 1 / rows });
    }
  }
  return panels;
}

function sourceSize(source) {
  return { w: source.naturalWidth || source.width, h: source.naturalHeight || source.height };
}

/** The source rectangle of `source` that fills a panel of panelW × panelH around a focus point at a zoom. */
export function coverSourceRect(source, panelW, panelH, focusX, focusY, zoom) {
  const { w: iw, h: ih } = sourceSize(source);
  const scale = Math.max(panelW / iw, panelH / ih) * Math.max(1, zoom);
  const sw = Math.min(iw, panelW / scale);
  const sh = Math.min(ih, panelH / scale);
  const sx = Math.min(Math.max(focusX * iw - sw / 2, 0), iw - sw);
  const sy = Math.min(Math.max(focusY * ih - sh / 2, 0), ih - sh);
  return { sx, sy, sw, sh };
}

function buildGradientLut(stops) {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i += 1) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s += 1) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const span = Math.max(1e-6, b[0] - a[0]);
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c += 1) lut[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * f);
  }
  return lut;
}

const lutCache = new Map();
function gradeLut(grade) {
  if (!lutCache.has(grade.id)) lutCache.set(grade.id, buildGradientLut(grade.stops));
  return lutCache.get(grade.id);
}

/** Grades one panel-sized ImageData in place: contrast + saturation, posterise, then the gradient map mix. */
export function gradePixels(imageData, grade) {
  const data = imageData.data;
  const lut = gradeLut(grade);
  const { contrast, saturation, posterise, mix } = grade;
  const keep = 1 - mix;
  const levels = 18;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Saturation then contrast around middle grey.
    r = lum + (r - lum) * saturation;
    g = lum + (g - lum) * saturation;
    b = lum + (b - lum) * saturation;
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;
    // Posterise: pull each channel part-way to a quantised step for the printed-poster feel.
    if (posterise > 0) {
      const step = 255 / levels;
      r += (Math.round(r / step) * step - r) * posterise;
      g += (Math.round(g / step) * step - g) * posterise;
      b += (Math.round(b / step) * step - b) * posterise;
    }
    const li = Math.min(255, Math.max(0, Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)));
    data[i] = r * keep + lut[li * 3] * mix;
    data[i + 1] = g * keep + lut[li * 3 + 1] * mix;
    data[i + 2] = b * keep + lut[li * 3 + 2] * mix;
  }
  return imageData;
}

let scratch = null;
function scratchCanvas(w, h) {
  if (!scratch) scratch = document.createElement('canvas');
  scratch.width = Math.max(1, Math.round(w));
  scratch.height = Math.max(1, Math.round(h));
  return scratch;
}

/** Draws one graded panel of the cover into ctx. */
function drawPanel(ctx, panel, photo, panelIndex, grade, spread) {
  const { width: W, height: H } = ctx.canvas;
  const gutter = Math.max(5, Math.round(W * 0.006));
  const x = Math.round(panel.x * W) + gutter / 2;
  const y = Math.round(panel.y * H) + gutter / 2;
  const w = Math.round(panel.w * W) - gutter;
  const h = Math.round(panel.h * H) - gutter;
  if (w < 8 || h < 8 || !photo) return;
  let focusX = photo.focusX;
  let focusY = photo.focusY;
  let zoom = photo.zoom;
  if (!spread) {
    // One photo in every panel: the user's own focus and zoom stay in charge, with each panel's cycle
    // offset blended in, so reframing moves the whole cover while the panels still crop differently.
    const [cycleX, cycleY] = FOCUS_CYCLE[panelIndex % FOCUS_CYCLE.length];
    focusX = Math.min(1, Math.max(0, photo.focusX + (cycleX - 0.5) * 0.6));
    focusY = Math.min(1, Math.max(0, photo.focusY + (cycleY - 0.5) * 0.6));
    zoom = photo.zoom * (0.92 + (ZOOM_CYCLE[panelIndex % ZOOM_CYCLE.length] - 1) * 0.8);
  }
  const rect = coverSourceRect(photo.source, w, h, focusX, focusY, zoom);
  const off = scratchCanvas(w, h);
  const offCtx = off.getContext('2d', { willReadFrequently: true });
  offCtx.drawImage(photo.source, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, w, h);
  offCtx.putImageData(gradePixels(offCtx.getImageData(0, 0, w, h), grade), 0, 0);
  ctx.drawImage(off, x, y);
}

function drawVignette(ctx, W, H) {
  const radius = Math.hypot(W, H) / 2;
  const grad = ctx.createRadialGradient(W / 2, H * 0.42, radius * 0.42, W / 2, H * 0.5, radius);
  grad.addColorStop(0, 'rgba(8, 0, 18, 0)');
  grad.addColorStop(1, 'rgba(8, 0, 18, 0.30)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

let grainTile = null;
/** A 256 × 256 tile of fixed-seed noise, generated once: exports stay byte-stable between runs. */
function getGrainTile() {
  if (grainTile) return grainTile;
  grainTile = document.createElement('canvas');
  grainTile.width = 256;
  grainTile.height = 256;
  const gtx = grainTile.getContext('2d');
  const img = gtx.createImageData(256, 256);
  let seed = 0x2f6e2b1;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = 96 + (seed % 96);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  gtx.putImageData(img, 0, 0);
  return grainTile;
}

function drawGrain(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** Fits a font size so `text` fits `maxWidth`, shrinking from `startPx`. */
function fitFont(ctx, text, maxWidth, startPx, makeFont) {
  let px = startPx;
  ctx.font = makeFont(px);
  while (ctx.measureText(text).width > maxWidth && px > 14) {
    px -= 4;
    ctx.font = makeFont(px);
  }
  return px;
}

/** Splits the title into at most two balanced lines. */
function titleLines(title) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [title.trim()];
  let best = null;
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.abs(a.length - b.length);
    if (!best || score < best.score) best = { lines: [a, b], score };
  }
  return best.lines;
}

function drawTitleBlock(ctx, W, H, state) {
  const title = (state.title || '').trim().toUpperCase();
  const tagline = (state.tagline || '').trim().toUpperCase();
  const accent = (state.accent || '').trim();
  // Scrim so the lettering holds over any photo.
  const scrimH = H * 0.34;
  const scrim = ctx.createLinearGradient(0, 0, 0, scrimH);
  scrim.addColorStop(0, 'rgba(10, 2, 24, 0.62)');
  scrim.addColorStop(1, 'rgba(10, 2, 24, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, scrimH);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let cursorY = H * 0.055;
  if (tagline) {
    const px = fitFont(ctx, tagline, W * 0.8, H * 0.026, (s) => SANS_FONT(s, 700));
    try { ctx.letterSpacing = `${Math.round(px * 0.42)}px`; } catch { /* older engines */ }
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = px * 0.25;
    ctx.fillText(tagline, W / 2, cursorY + px);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
    cursorY += px * 1.7;
  }
  if (title) {
    const lines = titleLines(title);
    const startPx = H * (lines.length > 1 ? 0.105 : 0.125);
    let px = startPx;
    for (const line of lines) px = Math.min(px, fitFont(ctx, line, W * 0.92, startPx, TITLE_FONT));
    ctx.font = TITLE_FONT(px);
    ctx.save();
    ctx.translate(W / 2, 0);
    ctx.scale(0.94, 1); // a slight squeeze reads as condensed poster type
    lines.forEach((line, i) => {
      const y = cursorY + px * (i + 0.92);
      ctx.lineWidth = px * 0.16;
      ctx.strokeStyle = '#17042e';
      ctx.fillStyle = '#17042e';
      ctx.fillText(line, px * 0.045, y + px * 0.05);
      ctx.strokeText(line, 0, y);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, 0, y);
    });
    ctx.restore();
    cursorY += px * lines.length * 0.98;
  }
  if (accent) {
    const px = fitFont(ctx, accent, W * 0.5, H * 0.052, SCRIPT_FONT);
    ctx.font = SCRIPT_FONT(px);
    ctx.save();
    ctx.translate(W * 0.71, cursorY + px * 0.34);
    ctx.rotate(-0.055);
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = px * 0.45;
    ctx.fillStyle = '#ff5da2';
    ctx.fillText(accent, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd7ea';
    ctx.fillText(accent, 0, 0);
    ctx.restore();
  }
}

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(angle) * rad;
    const y = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawCaptionBand(ctx, W, H, state) {
  const caption = (state.caption || '').trim().toUpperCase();
  const bandH = Math.max(H * 0.078, 54);
  const y = H - bandH;
  ctx.fillStyle = 'rgba(9, 3, 20, 0.78)';
  ctx.fillRect(0, y, W, bandH);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, y, W, Math.max(3, H * 0.004));
  if (caption) {
    const px = fitFont(ctx, caption, W * 0.68, bandH * 0.46, (s) => SANS_FONT(s, 800));
    ctx.font = SANS_FONT(px, 800);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = px * 0.2;
    ctx.fillText(caption, W * 0.035, y + bandH * 0.64);
    ctx.shadowBlur = 0;
  }
  // Wanted-star heat meter, bottom right.
  const heat = Math.min(5, Math.max(0, Math.round(state.heat || 0)));
  const r = bandH * 0.26;
  for (let i = 0; i < 5; i += 1) {
    const cx = W - W * 0.03 - r - i * (r * 2.35);
    const cy = y + bandH * 0.52;
    starPath(ctx, cx, cy, r);
    if (i < heat) {
      ctx.fillStyle = '#ffd166';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = r * 0.14;
      ctx.stroke();
    }
  }
}

/**
 * Renders the whole cover onto `canvas` (already sized to the export size).
 * state: { photos: [{source, focusX, focusY, zoom}], spread, layout, grade (id),
 *          title, accent, tagline, caption, heat }
 */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES.find((g) => g.id === state.grade) || GRADES[0];
  const photos = (state.photos || []).filter((p) => p && p.source);
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(0, 0, W, H);
  const panels = layoutPanels(state.layout, W, H);
  panels.forEach((panel, i) => {
    const photo = photos.length
      ? (state.spread ? photos[i % photos.length] : photos[0])
      : null;
    drawPanel(ctx, panel, photo, i, grade, state.spread && photos.length > 1);
  });
  drawVignette(ctx, W, H);
  drawGrain(ctx, W, H);
  drawTitleBlock(ctx, W, H, state);
  drawCaptionBand(ctx, W, H, state);
  // A thin white outer frame, like the printed box art.
  ctx.strokeStyle = '#f4f1ea';
  ctx.lineWidth = Math.max(6, W * 0.008);
  ctx.strokeRect(0, 0, W, H);
  return canvas;
}

/** Renders the cover at an export size onto a fresh canvas and returns it (used by Export). */
export function renderExport(state, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  renderCover(canvas, state);
  return canvas;
}
