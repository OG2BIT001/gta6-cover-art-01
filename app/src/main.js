// Neon Coast Cover Studio — page wiring: photos in, a GTA-poster-style cover out.
// Pick photos (or use a sample), choose a panel layout and a colour grade, write the title, accent,
// tagline and caption, drag the cover to reframe, then export a PNG at 1080 × 1080, 1080 × 1350 or
// 1920 × 1080. Everything happens on this machine: photos are read locally and never uploaded.
// A ?shot= query sets up a fixed scene for screenshots instead (./shots.js).
import { EXPORT_SIZES, GRADES, LAYOUTS, renderCover, renderExport } from './cover.js';
import { SAMPLE_SCENES, makeSampleCanvas } from './sample.js';
import { runShot } from './shots.js';

const SAMPLE_PHOTOS = [
  { id: 'boulevard', label: 'Photo: sunset boulevard' },
  { id: 'neon', label: 'Photo: neon street' },
  { id: 'pier', label: 'Photo: the pier' },
];

const state = {
  photos: [],
  activePhoto: 0,
  spread: false,
  layout: 'grid',
  grade: 'sunset',
  size: 'square',
  title: 'Neon Coast',
  accent: 'Vice Nights',
  tagline: 'Leonida • Est. 2026',
  caption: 'One last ride',
  heat: 4,
};

const canvas = document.getElementById('stage');
const status = document.getElementById('status');
const thumbs = document.getElementById('photo-thumbs');

function newPhoto(source, name) {
  return { source, name, focusX: 0.5, focusY: 0.45, zoom: 1 };
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function currentSize() {
  return EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[0];
}

function activePhoto() {
  return state.photos[state.activePhoto] || state.photos[0];
}

let redrawQueued = false;
function redraw() {
  if (redrawQueued) return;
  redrawQueued = true;
  requestAnimationFrame(() => {
    redrawQueued = false;
    const size = currentSize();
    if (canvas.width !== size.width) canvas.width = size.width;
    if (canvas.height !== size.height) canvas.height = size.height;
    renderCover(canvas, state);
  });
}

function setStatus(text) {
  status.textContent = text;
}

// ---- Photo list -------------------------------------------------------------

function renderThumbs() {
  thumbs.replaceChildren();
  state.photos.forEach((photo, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb' + (i === state.activePhoto ? ' on' : '');
    button.title = photo.name;
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 96;
    thumbCanvas.height = 72;
    const tctx = thumbCanvas.getContext('2d');
    const src = photo.source;
    const sw = src.naturalWidth || src.width;
    const sh = src.naturalHeight || src.height;
    const scale = Math.max(96 / sw, 72 / sh);
    tctx.drawImage(src, (96 - sw * scale) / 2, (72 - sh * scale) / 2, sw * scale, sh * scale);
    button.append(thumbCanvas);
    button.addEventListener('click', () => {
      state.activePhoto = i;
      syncPhotoControls();
      renderThumbs();
    });
    thumbs.append(button);
  });
}

function setPhotos(photos) {
  state.photos = photos;
  state.activePhoto = 0;
  syncPhotoControls();
  renderThumbs();
  redraw();
}

async function addFiles(fileList) {
  const loaded = [];
  for (const file of fileList) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      loaded.push(newPhoto(img, file.name));
    } catch {
      setStatus(`Could not read ${file.name}`);
    }
  }
  if (loaded.length) {
    setPhotos([...state.photos.filter((p) => !p.builtin), ...loaded]);
    setStatus(loaded.length === 1 ? 'Photo loaded' : `${loaded.length} photos loaded`);
  }
}

function useScene(sceneId) {
  const scene = SAMPLE_SCENES.find((s) => s.id === sceneId) || SAMPLE_SCENES[0];
  const photo = newPhoto(makeSampleCanvas(scene.id), scene.label);
  photo.builtin = true;
  setPhotos([photo]);
}

async function loadSampleFile(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  const photo = newPhoto(img, `Sample photo: ${name}`);
  photo.builtin = true;
  setPhotos([photo]);
}

// ---- Controls ---------------------------------------------------------------

function buildButtons(containerId, items, get, set) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.label;
    button.dataset.value = item.id;
    if (get() === item.id) button.classList.add('on');
    button.addEventListener('click', () => {
      set(item.id);
      for (const b of container.children) b.classList.toggle('on', b.dataset.value === item.id);
      redraw();
    });
    container.append(button);
  }
}

function syncLookButtons() {
  for (const [containerId, get] of [
    ['layout-buttons', () => state.layout],
    ['grade-buttons', () => state.grade],
    ['size-buttons', () => state.size],
  ]) {
    const container = document.getElementById(containerId);
    for (const b of container.children) b.classList.toggle('on', b.dataset.value === get());
  }
}

const fields = {
  title: document.getElementById('title-input'),
  accent: document.getElementById('accent-input'),
  tagline: document.getElementById('tagline-input'),
  caption: document.getElementById('caption-input'),
  heat: document.getElementById('heat-input'),
};
for (const key of ['title', 'accent', 'tagline', 'caption']) {
  fields[key].addEventListener('input', () => { state[key] = fields[key].value; redraw(); });
}
fields.heat.addEventListener('input', () => { state.heat = Number(fields.heat.value); redraw(); });

const photoControls = {
  focusX: document.getElementById('focus-x'),
  focusY: document.getElementById('focus-y'),
  zoom: document.getElementById('zoom'),
};
function syncPhotoControls() {
  const photo = activePhoto();
  if (!photo) return;
  photoControls.focusX.value = String(photo.focusX);
  photoControls.focusY.value = String(photo.focusY);
  photoControls.zoom.value = String(photo.zoom);
}
for (const key of ['focusX', 'focusY', 'zoom']) {
  photoControls[key].addEventListener('input', () => {
    const photo = activePhoto();
    if (!photo) return;
    photo[key] = Number(photoControls[key].value);
    redraw();
  });
}

document.getElementById('spread-input').addEventListener('change', (e) => {
  state.spread = e.target.checked;
  redraw();
});

document.getElementById('photo-files').addEventListener('change', (e) => {
  if (e.target.files.length) addFiles(e.target.files);
  e.target.value = '';
});

// Drag on the cover reframes the active photo.
let dragging = false;
function dragTo(event) {
  const photo = activePhoto();
  if (!photo) return;
  const rect = canvas.getBoundingClientRect();
  photo.focusX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  photo.focusY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  syncPhotoControls();
  redraw();
}
canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); dragTo(e); });
canvas.addEventListener('pointermove', (e) => { if (dragging) dragTo(e); });
canvas.addEventListener('pointerup', () => { dragging = false; });

// ---- Export -----------------------------------------------------------------

function download(canvasToSave, filename) {
  canvasToSave.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setStatus(`Saved ${filename}`);
  }, 'image/png');
}

document.getElementById('export-button').addEventListener('click', () => {
  const size = currentSize();
  download(renderExport(state, size), `neon-coast-cover-${size.width}x${size.height}.png`);
});
document.getElementById('export-all-button').addEventListener('click', () => {
  EXPORT_SIZES.forEach((size, i) => {
    setTimeout(() => download(renderExport(state, size), `neon-coast-cover-${size.width}x${size.height}.png`), i * 400);
  });
});

// ---- Sample buttons -----------------------------------------------------------

const sampleButtons = document.getElementById('sample-buttons');
for (const sample of SAMPLE_PHOTOS) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = sample.label;
  button.addEventListener('click', async () => { await loadSampleFile(sample.id); setStatus(sample.label); });
  sampleButtons.append(button);
}
for (const scene of SAMPLE_SCENES) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = scene.label.replace('Sample:', 'Drawn:');
  button.addEventListener('click', () => { useScene(scene.id); setStatus(scene.label); });
  sampleButtons.append(button);
}

// ---- Go -----------------------------------------------------------------------

buildButtons('layout-buttons', LAYOUTS, () => state.layout, (v) => { state.layout = v; });
buildButtons('grade-buttons', GRADES, () => state.grade, (v) => { state.grade = v; });
buildButtons('size-buttons', EXPORT_SIZES, () => state.size, (v) => { state.size = v; });

const shotApi = {
  applyLook(look) {
    for (const key of ['title', 'accent', 'tagline', 'caption']) {
      if (look[key] !== undefined) { state[key] = look[key]; fields[key].value = look[key]; }
    }
    if (look.layout !== undefined) state.layout = look.layout;
    if (look.grade !== undefined) state.grade = look.grade;
    if (look.heat !== undefined && Number.isFinite(look.heat)) { state.heat = look.heat; fields.heat.value = String(look.heat); }
    syncLookButtons();
  },
  useScene,
  loadSampleFile,
  setSize(sizeId) { state.size = sizeId; syncLookButtons(); },
  redraw,
};

useScene('boulevard');
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), shotApi);
} else {
  redraw();
}
