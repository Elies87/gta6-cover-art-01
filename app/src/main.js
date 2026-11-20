// The editor: wires the page's controls, photo tray and canvas gestures
// to the studio. Three steps from the door to a finished cover — add
// photos, tap panels to fill them, export the PNG — and every control
// redraws the same canvas the export is taken from, so the preview is
// never a promise the download breaks.

import { createStudio, loadPosterFont, SAMPLE_PHOTOS } from './studio.js';
import { FORMATS, GRADES } from './render.js';
import { LAYOUTS, panelIndexAt } from './layouts.js';

const canvas = document.getElementById('stage');
const studio = createStudio(canvas);
const state = studio.state;

const els = {
  fileInput: document.getElementById('fileInput'),
  exportBtn: document.getElementById('exportBtn'),
  formatGroup: document.getElementById('formatGroup'),
  layoutGroup: document.getElementById('layoutGroup'),
  gradeGroup: document.getElementById('gradeGroup'),
  titleInput: document.getElementById('titleInput'),
  subtitleInput: document.getElementById('subtitleInput'),
  tray: document.getElementById('tray'),
  spreadToggle: document.getElementById('spreadToggle'),
  selectedLabel: document.getElementById('selectedLabel'),
  zoomRange: document.getElementById('zoomRange'),
  resetViewBtn: document.getElementById('resetViewBtn'),
  clearBtn: document.getElementById('clearBtn'),
};

function currentView() {
  return state.spread ? state.spreadView : state.panels[state.selected]?.view;
}

function refreshPanelControls() {
  els.selectedLabel.textContent = state.spread
    ? 'Spread photo'
    : `Panel ${state.selected + 1} of ${state.panels.length}`;
  const view = currentView();
  if (view) els.zoomRange.value = String(Math.round(view.zoom * 100));
}

function buttonGroup(container, items, isCurrent, onPick) {
  container.innerHTML = '';
  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn' + (item.swatch ? ' swatch' : '');
    btn.textContent = item.name;
    if (item.swatch) btn.style.background = item.swatch;
    btn.setAttribute('aria-pressed', String(isCurrent(item)));
    btn.addEventListener('click', () => {
      onPick(item);
      buttonGroup(container, items, isCurrent, onPick);
    });
    container.appendChild(btn);
  }
}

function buildControls() {
  buttonGroup(
    els.formatGroup,
    Object.values(FORMATS).map((f) => ({ id: f.id, name: `${f.w}×${f.h}` })),
    (item) => state.format === item.id,
    (item) => { studio.setFormat(item.id); refreshPanelControls(); },
  );
  buttonGroup(
    els.layoutGroup,
    LAYOUTS.map((l) => ({ id: l.id, name: l.name })),
    (item) => state.layout === item.id,
    (item) => { state.layout = item.id; state.selected = 0; studio.render(); refreshPanelControls(); },
  );
  buttonGroup(
    els.gradeGroup,
    Object.values(GRADES).map((g) => ({
      id: g.id,
      name: g.name,
      swatch: `linear-gradient(135deg, ${g.titleStops[1]}, ${g.titleStops[2]})`,
    })),
    (item) => state.grade === item.id,
    (item) => { state.grade = item.id; studio.render(); },
  );
}

function refreshTray() {
  els.tray.innerHTML = '';
  for (const photo of studio.photos) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = photo.name;
    const inUse = state.spread
      ? state.spreadPhoto === photo
      : state.panels[state.selected]?.photo === photo;
    btn.setAttribute('aria-pressed', String(inUse));
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = photo.name;
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      if (state.spread) studio.setSpreadPhoto(photo);
      else studio.assignPhotoToPanel(photo, state.selected);
      refreshTray();
      refreshPanelControls();
    });
    els.tray.appendChild(btn);
  }
}

async function addPhotoFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const photo = await studio.loadPhotoFile(file);
    if (state.spread) {
      if (!state.spreadPhoto) studio.setSpreadPhoto(photo);
    } else {
      const empty = state.panels.findIndex((slot) => !slot.photo);
      studio.assignPhotoToPanel(photo, empty >= 0 ? empty : state.selected);
    }
  }
  refreshTray();
  refreshPanelControls();
}

function wireInteractions() {
  els.fileInput.addEventListener('change', () => {
    addPhotoFiles([...els.fileInput.files]);
    els.fileInput.value = '';
  });
  els.exportBtn.addEventListener('click', async () => {
    const blob = await studio.exportPng();
    if (!blob) return;
    const format = FORMATS[state.format];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-vice-cover-${format.w}x${format.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  els.titleInput.addEventListener('input', () => { state.title = els.titleInput.value; studio.render(); });
  els.subtitleInput.addEventListener('input', () => { state.subtitle = els.subtitleInput.value; studio.render(); });
  els.spreadToggle.addEventListener('change', () => {
    state.spread = els.spreadToggle.checked;
    studio.render();
    refreshTray();
    refreshPanelControls();
  });
  els.zoomRange.addEventListener('input', () => {
    const view = currentView();
    if (!view) return;
    view.zoom = Number(els.zoomRange.value) / 100;
    studio.render();
  });
  els.resetViewBtn.addEventListener('click', () => {
    const view = currentView();
    if (view) { view.x = 0.5; view.y = 0.5; view.zoom = 1; }
    studio.render();
    refreshPanelControls();
  });
  els.clearBtn.addEventListener('click', () => {
    if (!state.spread) studio.clearPanel(state.selected);
    refreshTray();
  });

  // Canvas gestures: click selects a panel, drag reframes its photo,
  // the wheel zooms it. Pointer deltas arrive in CSS pixels and are
  // scaled up to the canvas's own resolution before they pan.
  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    if (!state.spread) {
      const hit = panelIndexAt({ panels: currentLayoutPanels() }, nx, ny);
      if (hit >= 0 && hit !== state.selected) {
        state.selected = hit;
        studio.render();
        refreshTray();
        refreshPanelControls();
      }
    }
    drag = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (event.clientX - drag.x) * (canvas.width / rect.width);
    const dy = (event.clientY - drag.y) * (canvas.height / rect.height);
    drag = { x: event.clientX, y: event.clientY };
    studio.panSelected(dx, dy);
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    studio.zoomSelected(event.deltaY < 0 ? 1.07 : 0.93);
    refreshPanelControls();
  }, { passive: false });
  canvas.addEventListener('dragover', (event) => event.preventDefault());
  canvas.addEventListener('drop', (event) => {
    event.preventDefault();
    addPhotoFiles([...event.dataTransfer.files]);
  });
}

function currentLayoutPanels() {
  return (LAYOUTS.find((l) => l.id === state.layout) ?? LAYOUTS[0]).panels;
}

// First paint: the bundled samples fill the collage so a visitor meets
// a finished cover, not an empty form, and can export within seconds.
async function fillWithSamples() {
  const loaded = [];
  for (const sample of SAMPLE_PHOTOS) {
    loaded.push(await studio.loadPhoto(sample.url, sample.name));
  }
  state.panels.forEach((slot, i) => {
    studio.assignPhotoToPanel(loaded[i % loaded.length], i);
  });
  studio.setSpreadPhoto(loaded[0]);
}

async function init() {
  await loadPosterFont();
  buildControls();
  wireInteractions();
  studio.setFormat(state.format);
  await fillWithSamples();
  refreshTray();
  refreshPanelControls();
  const query = new URLSearchParams(location.search);
  if (query.has('shot')) {
    const { runShot } = await import('./shots.js');
    await runShot(query.get('shot'), query, studio, {
      setCaption: (title, subtitle) => {
        els.titleInput.value = title;
        els.subtitleInput.value = subtitle;
      },
      refreshControls: buildControls,
      refreshTray,
      refreshPanelControls,
    });
  }
}

init();
