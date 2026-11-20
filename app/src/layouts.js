// Panel layouts for Neon Vice covers.
//
// Every layout is a list of polygons in normalised canvas coordinates
// (x and y both run 0..1), so one layout tiles any export size and any
// aspect. Neighbouring panels share their edges exactly, which is what
// makes the collage read as one poster instead of a grid of boxes.
// The slanted dividers are deliberate: angled panels are the signature
// of the sun-soaked crime-poster collage this studio imitates.

export const LAYOUTS = [
  {
    id: 'collage',
    name: 'Classic Collage',
    blurb: 'One hero panel, three supporting scenes',
    panels: [
      // hero, top-left
      [[0, 0], [0.6, 0], [0.54, 0.62], [0, 0.7]],
      // top-right
      [[0.6, 0], [1, 0], [1, 0.44], [0.54, 0.62]],
      // bottom-right
      [[0.54, 0.62], [1, 0.44], [1, 1], [0.68, 1]],
      // bottom-left
      [[0, 0.7], [0.54, 0.62], [0.68, 1], [0, 1]],
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    blurb: 'Three tall angled panels',
    panels: [
      [[0, 0], [0.36, 0], [0.3, 1], [0, 1]],
      [[0.36, 0], [0.68, 0], [0.62, 1], [0.3, 1]],
      [[0.68, 0], [1, 0], [1, 1], [0.62, 1]],
    ],
  },
  {
    id: 'hero-strip',
    name: 'Hero + Strip',
    blurb: 'A wide hero over a three-frame film strip',
    panels: [
      // hero
      [[0, 0], [1, 0], [1, 0.68], [0, 0.74]],
      // strip frames
      [[0, 0.74], [0.35, 0.71], [0.33, 1], [0, 1]],
      [[0.35, 0.71], [0.67, 0.695], [0.66, 1], [0.33, 1]],
      [[0.67, 0.695], [1, 0.68], [1, 1], [0.66, 1]],
    ],
  },
  {
    id: 'grid-six',
    name: 'Grid Six',
    blurb: 'Six scenes, two by three, slightly slanted',
    panels: [
      [[0, 0], [0.52, 0], [0.51, 0.34], [0, 0.36]],
      [[0.52, 0], [1, 0], [1, 0.32], [0.51, 0.34]],
      [[0, 0.36], [0.51, 0.34], [0.5, 0.67], [0, 0.69]],
      [[0.51, 0.34], [1, 0.32], [1, 0.65], [0.5, 0.67]],
      [[0, 0.69], [0.5, 0.67], [0.48, 1], [0, 1]],
      [[0.5, 0.67], [1, 0.65], [1, 1], [0.48, 1]],
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}

// The axis-aligned box a polygon covers, in normalised coordinates.
export function panelBounds(polygon) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

// Hit test in normalised coordinates; panels later in the list win.
export function panelIndexAt(layout, nx, ny) {
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    if (pointInPolygon(nx, ny, layout.panels[i])) return i;
  }
  return -1;
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}
