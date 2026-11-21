// Built-in sample scenes, drawn procedurally on canvas so the app makes a full cover before the user
// loads any photo of their own — and so the screenshots can be taken from the app's own scenes.
// Three flat-illustration scenes in bold shapes (they take the duotone grade well): a sunset boulevard
// with a convertible, a neon night street, and a pier over turquoise water. No images, no network.

function skyGradient(ctx, w, h, stops) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, colour] of stops) grad.addColorStop(at, colour);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function sun(ctx, x, y, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function skyline(ctx, w, horizon, colour, seedStart) {
  let seed = seedStart;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  ctx.fillStyle = colour;
  let x = -10;
  while (x < w + 10) {
    const bw = 40 + rand() * 90;
    const bh = 60 + rand() * 170;
    ctx.fillRect(x, horizon - bh, bw, bh);
    x += bw + 4 + rand() * 26;
  }
}

function palm(ctx, x, baseY, height, colour, lean = 0.16) {
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = Math.max(5, height * 0.045);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + height * lean * 0.4, baseY - height * 0.6, x + height * lean, baseY - height);
  ctx.stroke();
  const topX = x + height * lean;
  const topY = baseY - height;
  ctx.lineWidth = Math.max(3, height * 0.028);
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.PI * (0.08 + i * 0.14);
    const len = height * (0.34 + 0.1 * Math.sin(i * 2.3));
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(angle) * len * 0.6, topY - Math.sin(angle) * len * 0.7 - height * 0.05,
      topX + Math.cos(angle) * len, topY - Math.sin(angle) * len * 0.35 + height * 0.1,
    );
    ctx.stroke();
  }
}

function figure(ctx, x, groundY, height, colour) {
  // A simple standing figure: head, torso, legs, one arm akimbo. Bold shapes read well after the grade.
  const headR = height * 0.09;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, groundY - height + headR, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - height * 0.13, groundY - height * 0.78);
  ctx.lineTo(x + height * 0.13, groundY - height * 0.78);
  ctx.lineTo(x + height * 0.09, groundY - height * 0.42);
  ctx.lineTo(x + height * 0.2, groundY);
  ctx.lineTo(x + height * 0.08, groundY);
  ctx.lineTo(x, groundY - height * 0.36);
  ctx.lineTo(x - height * 0.08, groundY);
  ctx.lineTo(x - height * 0.2, groundY);
  ctx.lineTo(x - height * 0.09, groundY - height * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.lineWidth = height * 0.05;
  ctx.beginPath();
  ctx.moveTo(x + height * 0.1, groundY - height * 0.72);
  ctx.lineTo(x + height * 0.26, groundY - height * 0.5);
  ctx.stroke();
}

function convertible(ctx, x, groundY, w, bodyColour, darkColour) {
  const h = w * 0.26;
  ctx.fillStyle = bodyColour;
  ctx.beginPath();
  ctx.moveTo(x, groundY - h * 0.35);
  ctx.quadraticCurveTo(x + w * 0.04, groundY - h * 0.72, x + w * 0.3, groundY - h * 0.78);
  ctx.lineTo(x + w * 0.42, groundY - h * 1.18);
  ctx.lineTo(x + w * 0.62, groundY - h * 1.18);
  ctx.lineTo(x + w * 0.72, groundY - h * 0.8);
  ctx.quadraticCurveTo(x + w * 0.94, groundY - h * 0.78, x + w, groundY - h * 0.4);
  ctx.lineTo(x + w, groundY - h * 0.22);
  ctx.lineTo(x, groundY - h * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darkColour;
  ctx.fillRect(x + w * 0.44, groundY - h * 1.14, w * 0.16, h * 0.3);
  for (const wx of [x + w * 0.2, x + w * 0.8]) {
    ctx.beginPath();
    ctx.arc(wx, groundY - h * 0.2, h * 0.21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e4da';
    ctx.beginPath();
    ctx.arc(wx, groundY - h * 0.2, h * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkColour;
  }
}

function drawBoulevard(ctx, w, h) {
  skyGradient(ctx, w, h, [[0, '#3b1d5e'], [0.42, '#c73e7d'], [0.68, '#ff7e47'], [0.82, '#ffc46b'], [1, '#8a4b2d']]);
  sun(ctx, w * 0.68, h * 0.6, h * 0.13, '#ffe9a8');
  skyline(ctx, w, h * 0.72, '#4a2358', 1234567);
  ctx.fillStyle = '#5d2a3a';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = '#2e1a33';
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h);
  ctx.lineTo(w * 0.52, h * 0.72);
  ctx.lineTo(w * 0.6, h * 0.72);
  ctx.lineTo(w * 0.86, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 4;
  ctx.setLineDash([26, 30]);
  ctx.beginPath();
  ctx.moveTo(w * 0.6, h);
  ctx.lineTo(w * 0.56, h * 0.74);
  ctx.stroke();
  ctx.setLineDash([]);
  convertible(ctx, w * 0.08, h * 0.9, w * 0.52, '#d92350', '#22142e');
  figure(ctx, w * 0.7, h * 0.92, h * 0.42, '#2a1230');
  palm(ctx, w * 0.9, h * 0.95, h * 0.62, '#33183d', -0.14);
  palm(ctx, w * 0.05, h * 0.8, h * 0.4, '#3d1c47', 0.2);
}

function drawNeon(ctx, w, h) {
  skyGradient(ctx, w, h, [[0, '#050914'], [0.6, '#0a1e3c'], [1, '#123a4d']]);
  skyline(ctx, w, h * 0.78, '#0b1226', 987654);
  // Lit windows.
  let seed = 424242;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 130; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255, 214, 130, 0.9)' : 'rgba(140, 240, 255, 0.85)';
    ctx.fillRect(rand() * w, h * 0.14 + rand() * h * 0.55, 7, 10);
  }
  // Neon signs.
  const sign = (x, y, sw, sh, colour) => {
    ctx.save();
    ctx.shadowColor = colour;
    ctx.shadowBlur = 26;
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, sw, sh);
    ctx.restore();
  };
  sign(w * 0.1, h * 0.2, w * 0.2, h * 0.05, '#ff2e88');
  sign(w * 0.68, h * 0.14, w * 0.05, h * 0.3, '#29e6d8');
  sign(w * 0.8, h * 0.3, w * 0.14, h * 0.045, '#ffd166');
  // Wet street with reflections.
  ctx.fillStyle = '#0a1420';
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  ctx.save();
  ctx.globalAlpha = 0.35;
  sign(w * 0.1, h * 0.82, w * 0.2, h * 0.03, '#ff2e88');
  sign(w * 0.68, h * 0.8, w * 0.05, h * 0.16, '#29e6d8');
  ctx.restore();
  figure(ctx, w * 0.4, h * 0.94, h * 0.46, '#04060f');
  figure(ctx, w * 0.55, h * 0.95, h * 0.42, '#04060f');
}

function drawPier(ctx, w, h) {
  skyGradient(ctx, w, h, [[0, '#7fd4e8'], [0.45, '#c8ecdd'], [0.62, '#ffe3ae'], [1, '#19b8a6']]);
  sun(ctx, w * 0.2, h * 0.18, h * 0.07, '#fff6d8');
  ctx.fillStyle = '#0e9a8a';
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i += 1) {
    const y = h * (0.68 + i * 0.026);
    ctx.beginPath();
    ctx.moveTo(((i * 173) % 100) / 100 * w, y);
    ctx.lineTo(((i * 173) % 100) / 100 * w + 40 + (i % 4) * 22, y);
    ctx.stroke();
  }
  // The pier: deck in perspective and posts going down into the water.
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h);
  ctx.lineTo(w * 0.46, h * 0.6);
  ctx.lineTo(w * 0.58, h * 0.6);
  ctx.lineTo(w * 0.86, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6e4525';
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    ctx.beginPath();
    ctx.moveTo(w * (0.3 + 0.16 * t) + 6, h * (1 - 0.4 * t));
    ctx.lineTo(w * (0.86 - 0.28 * t) - 6, h * (1 - 0.4 * t));
    ctx.stroke();
  }
  ctx.fillStyle = '#5f3c1f';
  for (const [px, py, ph] of [[0.44, 0.6, 0.2], [0.6, 0.6, 0.2], [0.36, 0.78, 0.22], [0.72, 0.78, 0.22]]) {
    ctx.fillRect(w * px, h * py, 12, h * ph);
  }
  figure(ctx, w * 0.52, h * 0.62, h * 0.34, '#17323b');
  // Fishing rod and line.
  ctx.strokeStyle = '#17323b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.55, h * 0.4);
  ctx.lineTo(w * 0.78, h * 0.22);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.78, h * 0.22);
  ctx.lineTo(w * 0.78, h * 0.55);
  ctx.stroke();
}

export const SAMPLE_SCENES = [
  { id: 'boulevard', label: 'Sample: sunset boulevard', draw: drawBoulevard },
  { id: 'neon', label: 'Sample: neon street', draw: drawNeon },
  { id: 'pier', label: 'Sample: the pier', draw: drawPier },
];

/** Draws a sample scene onto a fresh canvas of the given size and returns it (usable as a photo source). */
export function makeSampleCanvas(sceneId, width = 1200, height = 900) {
  const scene = SAMPLE_SCENES.find((s) => s.id === sceneId) || SAMPLE_SCENES[0];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  scene.draw(canvas.getContext('2d'), width, height);
  return canvas;
}
