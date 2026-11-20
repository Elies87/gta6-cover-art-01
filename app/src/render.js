// The cover renderer: panels, colour grades and poster lettering,
// drawn onto any 2D canvas at whatever size the canvas already has.
// The editor's preview canvas and the exported PNG are the same size,
// so what the maker sees is byte for byte the drawing they download.

import { layoutById, panelBounds } from './layouts.js';

export const FORMATS = {
  square: { id: 'square', name: 'Square post', w: 1080, h: 1080 },
  portrait: { id: 'portrait', name: 'Portrait post', w: 1080, h: 1350 },
  wide: { id: 'wide', name: 'Wide post', w: 1920, h: 1080 },
};

// A grade is three things: a canvas filter applied to every photo as it
// is drawn, a translucent wash laid over the finished collage, and the
// colours the caption lettering is filled with.
export const GRADES = {
  sunset: {
    id: 'sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.32) contrast(1.07) brightness(1.03)',
    washTop: 'rgba(255, 94, 58, 0.16)',
    washBottom: 'rgba(43, 16, 84, 0.38)',
    titleStops: ['#fff7e0', '#ffd23f', '#ff5e7a'],
    emptyStops: ['#2b1055', '#7597de'],
    accent: '#ffb347',
  },
  neon: {
    id: 'neon',
    name: 'Neon Nights',
    filter: 'saturate(1.5) contrast(1.13) brightness(1.0)',
    washTop: 'rgba(0, 229, 255, 0.13)',
    washBottom: 'rgba(255, 0, 128, 0.30)',
    titleStops: ['#e0ffff', '#39d0ff', '#ff3ea5'],
    emptyStops: ['#0f2027', '#2c5364'],
    accent: '#39d0ff',
  },
  golden: {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'saturate(1.18) contrast(1.05) sepia(0.28) brightness(1.05)',
    washTop: 'rgba(255, 183, 77, 0.20)',
    washBottom: 'rgba(74, 32, 8, 0.34)',
    titleStops: ['#ffffff', '#ffe9a8', '#f5a623'],
    emptyStops: ['#3a2b12', '#8a6d2f'],
    accent: '#ffd23f',
  },
  noir: {
    id: 'noir',
    name: 'Midnight Noir',
    filter: 'saturate(0.5) contrast(1.28) brightness(0.94)',
    washTop: 'rgba(10, 10, 30, 0.22)',
    washBottom: 'rgba(0, 0, 0, 0.52)',
    titleStops: ['#ffffff', '#cfd8dc', '#78909c'],
    emptyStops: ['#101018', '#3a3f4a'],
    accent: '#cfd8dc',
  },
};

export function gradeById(id) {
  return GRADES[id] ?? GRADES.sunset;
}

function tracePolygon(ctx, polygon, W, H) {
  ctx.beginPath();
  polygon.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * W, y * H);
    else ctx.lineTo(x * W, y * H);
  });
  ctx.closePath();
}

// Draw one photo into one panel. The photo is cover-fitted to the
// panel's bounding box, then panned by the maker's view (x and y are
// the fraction of the spare room the pan uses) and scaled by zoom.
export function drawPhotoInPanel(ctx, img, polygon, view, W, H, grade) {
  const b = panelBounds(polygon);
  const bw = b.w * W;
  const bh = b.h * H;
  ctx.save();
  tracePolygon(ctx, polygon, W, H);
  ctx.clip();
  const coverScale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
  const scale = coverScale * view.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = b.minX * W + (bw - dw) * view.x;
  const dy = b.minY * H + (bh - dh) * view.y;
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

// In spread mode a single photo covers the whole poster and the panel
// keylines are drawn over it, the way a mural cover is one scene cut
// into panels by its own borders.
export function drawSpreadPhoto(ctx, img, view, W, H, grade) {
  const coverScale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const scale = coverScale * view.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.save();
  ctx.filter = grade.filter;
  ctx.drawImage(img, (W - dw) * view.x, (H - dh) * view.y, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

// A panel nobody has filled yet: a dusk gradient and its number, so an
// exported cover never shows a hole and the editor reads clearly.
export function drawEmptyPanel(ctx, polygon, index, W, H, grade) {
  const b = panelBounds(polygon);
  ctx.save();
  tracePolygon(ctx, polygon, W, H);
  ctx.clip();
  const grad = ctx.createLinearGradient(b.minX * W, b.minY * H, b.maxX * W, b.maxY * H);
  grad.addColorStop(0, grade.emptyStops[0]);
  grad.addColorStop(1, grade.emptyStops[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(b.minX * W, b.minY * H, b.w * W, b.h * H);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.font = `${Math.round(Math.min(b.w * W, b.h * H) * 0.5)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(index + 1), ((b.minX + b.maxX) / 2) * W, ((b.minY + b.maxY) / 2) * H);
  ctx.restore();
}

// The translucent colour wash and the vignette that finish the grade.
export function applyGradeWash(ctx, W, H, grade) {
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(8, 3, 20, 0)');
  vig.addColorStop(1, 'rgba(8, 3, 20, 0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

// White keylines between panels and around the poster edge.
export function drawKeylines(ctx, layout, W, H) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(4, W * 0.006);
  ctx.lineJoin = 'round';
  for (const polygon of layout.panels) {
    tracePolygon(ctx, polygon, W, H);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(10, 4, 24, 0.85)';
  ctx.lineWidth = Math.max(6, W * 0.01);
  ctx.strokeRect(0, 0, W, H);
  ctx.restore();
}

function fitFontSize(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  while (size > 12) {
    ctx.font = `${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

// The caption: a big slanted title with a gradient face and a heavy
// outline, and a letter-spaced subtitle on an accent rule beneath it.
export function drawLettering(ctx, W, H, title, subtitle, grade) {
  const family = "Anton, 'Arial Narrow Bold', sans-serif";
  const cleanTitle = (title || '').trim();
  const cleanSub = (subtitle || '').trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (cleanTitle) {
    const size = fitFontSize(ctx, cleanTitle, W * 0.92, H * 0.155, family);
    const y = H * 0.155;
    ctx.save();
    ctx.translate(W / 2, y);
    ctx.transform(1, 0, -0.07, 1, 0, 0);
    ctx.font = `${size}px ${family}`;
    const face = ctx.createLinearGradient(0, -size, 0, size * 0.25);
    grade.titleStops.forEach((stop, i) => {
      face.addColorStop(i / (grade.titleStops.length - 1), stop);
    });
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = size * 0.09;
    ctx.shadowOffsetY = size * 0.05;
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.17;
    ctx.strokeStyle = '#160a2e';
    ctx.strokeText(cleanTitle, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = face;
    ctx.fillText(cleanTitle, 0, 0);
    ctx.restore();
  }
  if (cleanSub) {
    // The tagline runs along the poster's foot, under an accent rule,
    // clear of the faces the panels usually put near the top. Its fit
    // is measured by hand because letter tracking widens the ink by a
    // fixed amount per character, which a plain measure misses.
    let size = Math.round(H * 0.034);
    while (size > 10) {
      ctx.font = `${size}px ${family}`;
      const ink = ctx.measureText(cleanSub).width + cleanSub.length * size * 0.32;
      if (ink <= W * 0.86) break;
      size -= 2;
    }
    try { ctx.letterSpacing = `${Math.round(size * 0.32)}px`; } catch { /* older canvas */ }
    const y = H * 0.962;
    ctx.font = `${size}px ${family}`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.22;
    ctx.strokeStyle = 'rgba(12, 5, 26, 0.9)';
    ctx.strokeText(cleanSub, W / 2, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cleanSub, W / 2, y);
    const textW = ctx.measureText(cleanSub).width;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    ctx.fillStyle = grade.accent;
    const ruleW = Math.min(W * 0.5, textW * 0.8);
    ctx.fillRect(W / 2 - ruleW / 2, y - size * 1.45, ruleW, Math.max(3, H * 0.006));
  }
  ctx.restore();
}

// The whole cover, in drawing order: photos, wash, keylines, lettering.
export function renderCover(ctx, state) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, W, H);
  if (state.spread && state.spreadPhoto) {
    drawSpreadPhoto(ctx, state.spreadPhoto.img, state.spreadView, W, H, grade);
  } else {
    layout.panels.forEach((polygon, i) => {
      const slot = state.panels[i];
      if (slot && slot.photo) drawPhotoInPanel(ctx, slot.photo.img, polygon, slot.view, W, H, grade);
      else drawEmptyPanel(ctx, polygon, i, W, H, grade);
    });
  }
  applyGradeWash(ctx, W, H, grade);
  drawKeylines(ctx, layout, W, H);
  drawLettering(ctx, W, H, state.title, state.subtitle, grade);
}
