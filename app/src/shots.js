// Fixed scenes for the entry's screenshots, driven by the query
// string so a headless browser can pose the studio deterministically:
//   ?shot=cover&format=portrait&layout=collage&grade=sunset
//   ?shot=editor&format=wide&layout=triptych&grade=neon
// A cover pose shows the finished cover alone (the same drawing the
// Export button downloads); an editor pose shows the whole studio with
// its panels filled. window.__shotReady is set once the pose is drawn.

const POSES = {
  cover: {
    format: 'portrait',
    layout: 'collage',
    grade: 'sunset',
    title: 'NEON VICE',
    subtitle: 'Welcome back to the city of sunset',
    fill: ['heroine', 'neon-drive', 'neon-drive', 'heroine'],
  },
  coverwide: {
    format: 'wide',
    layout: 'hero-strip',
    grade: 'neon',
    title: 'MIDNIGHT RUN',
    subtitle: 'One car, one night, no brakes',
    fill: ['neon-drive', 'heroine', 'neon-drive', 'heroine'],
  },
  editor: {
    format: 'portrait',
    layout: 'collage',
    grade: 'sunset',
    title: 'NEON VICE',
    subtitle: 'Welcome back to the city of sunset',
    fill: ['heroine', 'neon-drive', 'heroine', 'neon-drive'],
  },
  editorwide: {
    format: 'wide',
    layout: 'triptych',
    grade: 'golden',
    title: 'GOLDEN HOUR',
    subtitle: 'Every sunset has a price',
    fill: ['neon-drive', 'heroine', 'neon-drive'],
  },
};

export async function runShot(shotName, query, studio, ui) {
  const pose = POSES[shotName] ?? POSES.cover;
  const { state } = studio;
  document.body.classList.add(shotName.startsWith('cover') ? 'shot-cover' : 'shot-editor');
  studio.setFormat(query.get('format') ?? pose.format);
  state.layout = query.get('layout') ?? pose.layout;
  state.grade = query.get('grade') ?? pose.grade;
  state.title = query.get('title') ?? pose.title;
  state.subtitle = query.get('subtitle') ?? pose.subtitle;
  ui?.setCaption(state.title, state.subtitle);
  ui?.refreshControls();
  // Fill the panels from the bundled samples, in the pose's order.
  const byKey = {};
  for (const photo of studio.photos) {
    if (photo.name.includes('Heroine')) byKey.heroine = photo;
    if (photo.name.includes('Neon Drive')) byKey['neon-drive'] = photo;
  }
  pose.fill.forEach((key, i) => {
    if (byKey[key] && i < state.panels.length) studio.assignPhotoToPanel(byKey[key], i);
  });
  studio.setSpreadPhoto(byKey.heroine ?? studio.photos[0]);
  studio.render();
  ui?.refreshTray();
  ui?.refreshPanelControls();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
