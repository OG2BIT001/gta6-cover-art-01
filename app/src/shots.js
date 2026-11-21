// Fixed scenes for screenshots: ?shot=cover shows one exported cover alone at its export size, ?shot=editor
// shows the editor with a sample loaded. Query parameters pick the scene: photo (a file under samples/,
// or scene:<id> for a drawn scene), size, layout, grade, title, accent, tagline, caption and heat.
// window.__shotReady is set once the scene has painted, so a capture tool knows when to shoot.

export async function runShot(shot, query, api) {
  api.applyLook({
    title: query.get('title') ?? undefined,
    accent: query.get('accent') ?? undefined,
    tagline: query.get('tagline') ?? undefined,
    caption: query.get('caption') ?? undefined,
    layout: query.get('layout') ?? undefined,
    grade: query.get('grade') ?? undefined,
    heat: query.get('heat') === null ? undefined : Number(query.get('heat')),
  });
  const photo = query.get('photo') ?? 'boulevard';
  if (photo.startsWith('scene:')) {
    api.useScene(photo.slice('scene:'.length));
  } else {
    await api.loadSampleFile(photo);
  }
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    api.setSize(query.get('size') ?? 'square');
  }
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
