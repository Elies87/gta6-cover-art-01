// Studio state: the photos the maker has brought in, which photo sits
// in which panel and how it is framed there, and the words and colours
// of the cover. The editor (main.js) and the screenshot poses
// (shots.js) both drive the studio through this one object, so a posed
// cover and a hand-made one are drawn by exactly the same code.

import { FORMATS, renderCover } from './render.js';
import { layoutById } from './layouts.js';

export const SAMPLE_PHOTOS = [
  { name: 'Heroine (sample)', url: 'samples/heroine.jpg' },
  { name: 'Neon Drive (sample)', url: 'samples/neon-drive.jpg' },
];

export function createStudio(canvas) {
  const ctx = canvas.getContext('2d');
  const state = {
    format: 'portrait',
    layout: 'collage',
    grade: 'sunset',
    title: 'NEON VICE',
    subtitle: 'Welcome back to the city of sunset',
    spread: false,
    spreadPhoto: null,
    spreadView: { x: 0.5, y: 0.5, zoom: 1 },
    panels: [],
    selected: 0,
  };
  const photos = []; // every photo the maker has loaded: {name, img}

  function syncPanelCount() {
    const count = layoutById(state.layout).panels.length;
    while (state.panels.length < count) {
      state.panels.push({ photo: null, view: { x: 0.5, y: 0.5, zoom: 1 } });
    }
    state.panels.length = count;
    if (state.selected >= count) state.selected = 0;
  }

  function render() {
    syncPanelCount();
    renderCover(ctx, state);
  }

  function setFormat(formatId) {
    const format = FORMATS[formatId];
    if (!format) return;
    state.format = formatId;
    canvas.width = format.w;
    canvas.height = format.h;
    render();
  }

  // Load one photo from a URL (a bundled sample) or an object URL (a
  // file the maker picked). Photos never leave the machine: a picked
  // file is read into an object URL and drawn, never uploaded.
  function loadPhoto(url, name) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const photo = { name, img };
        photos.push(photo);
        resolve(photo);
      };
      img.onerror = () => reject(new Error(`could not load photo ${name}`));
      img.src = url;
    });
  }

  function loadPhotoFile(file) {
    return loadPhoto(URL.createObjectURL(file), file.name);
  }

  function assignPhotoToPanel(photo, index) {
    syncPanelCount();
    state.panels[index].photo = photo;
    state.panels[index].view = { x: 0.5, y: 0.5, zoom: 1 };
    if (!state.spreadPhoto) state.spreadPhoto = photo;
    render();
  }

  function setSpreadPhoto(photo) {
    state.spreadPhoto = photo;
    state.spreadView = { x: 0.5, y: 0.5, zoom: 1 };
    render();
  }

  function clearPanel(index) {
    if (state.panels[index]) state.panels[index].photo = null;
    render();
  }

  // Pan the selected photo by a delta in canvas pixels, converted back
  // to the fraction-of-spare-room the renderer works in.
  function panSelected(dxPx, dyPx) {
    const view = state.spread ? state.spreadView : state.panels[state.selected]?.view;
    if (!view) return;
    const step = 260; // pixels of drag for the full spare room
    view.x = clamp01(view.x - dxPx / step);
    view.y = clamp01(view.y - dyPx / step);
    render();
  }

  function zoomSelected(factor) {
    const view = state.spread ? state.spreadView : state.panels[state.selected]?.view;
    if (!view) return;
    view.zoom = Math.min(4, Math.max(1, view.zoom * factor));
    render();
  }

  function exportPng() {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  syncPanelCount();
  return {
    canvas, state, photos,
    render, setFormat, loadPhoto, loadPhotoFile,
    assignPhotoToPanel, setSpreadPhoto, clearPanel,
    panSelected, zoomSelected, exportPng,
  };
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

// The bundled display font, loaded from a file inside the app so the
// lettering looks the same offline as it does served.
export async function loadPosterFont() {
  try {
    const face = new FontFace('Anton', "url('fonts/Anton-Regular.ttf')");
    await face.load();
    document.fonts.add(face);
  } catch {
    // The renderer falls back to a heavy system sans; the cover still works.
  }
}
