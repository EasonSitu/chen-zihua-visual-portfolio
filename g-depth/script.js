(() => {
  'use strict';
  const lab = window.ChenLab;
  const scene = document.querySelector('.depth-scene');
  const narrow = matchMedia('(max-width: 760px)');
  const art = document.querySelector('.media-art');
  const scopes = {
    content: {
      number: '01 / CONTENT', label: 'Content', texture: '5', study: '01',
      summary: 'From the first idea to the published story.',
      role: 'Almost entirely individually handled content production across three consumer brands.',
      decision: 'Translate brand needs into concepts and scripts, then follow through on the practical details of production.',
      execution: 'Concepts, scripts, filming, editing and copywriting, with internal coordination and approval follow-up.',
      value: '500+', description: 'content pieces, cumulative across three brands.',
      note: 'One Xiaohongshu post reached 1M+ views. This is a single-post result.'
    },
    kol: {
      number: '02 / KOL', label: 'KOL collaborations', texture: '8', study: '02',
      summary: 'The details behind a creator collaboration.',
      role: 'Almost entirely individually handled 300+ KOL collaborations across the marketing practice.',
      decision: 'Turn brand needs into creator briefs, and route quotations and content through the relevant approvals.',
      execution: 'Creator sourcing, quotations, briefs, shoots, content review and reporting; internal, agency and vendor coordination.',
      value: '300+', description: 'KOL collaborations, cumulative.',
      note: 'Responsibilities span sourcing to reporting, with approval follow-up.'
    },
    activations: {
      number: '03 / ACTIVATIONS', label: 'Offline activations', texture: '4', study: '03',
      summary: 'Brand delivery beyond the screen.',
      role: 'Supported offline activations, connecting marketing work with on-the-ground delivery.',
      decision: 'Coordinate the people, budgets and approvals needed to carry the work forward.',
      execution: 'Internal, agency and vendor coordination, budgets and approval follow-up for offline marketing activity.',
      value: '10+', description: 'offline activations supported.',
      note: 'A supporting role in delivery; final approval authority is not claimed.'
    }
  };
  function selectScope(key) {
    const value = scopes[key];
    if (!value) return;
    scene.dataset.scope = key;
    document.querySelectorAll('[data-scope]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scope === key)));
    document.querySelector('.scope-number').textContent = value.number;
    document.querySelector('.scope-summary').textContent = value.summary;
    ['role', 'decision', 'execution'].forEach(field => document.querySelector(`[data-copy="${field}"]`).textContent = value[field]);
    document.querySelector('.evidence-value').textContent = value.value;
    document.querySelector('.evidence-description').textContent = value.description;
    document.querySelector('.evidence-note').textContent = value.note;
    art.dataset.texture = value.texture;
    document.querySelector('.media-layer figcaption > span:first-child').textContent = `Visual study / ${value.study}`;
    document.querySelector('.media-scope').textContent = value.label;
  }
  document.querySelectorAll('[data-scope]').forEach(button => button.addEventListener('click', () => selectScope(button.dataset.scope)));
  scene.dataset.scope = 'content';

  // One continuous sticky composition. All three layers travel vertically;
  // the scene's native scroll length controls their distinct physical rates.
  let viewportHeight = innerHeight;
  let lastProgress = -1;
  function update() {
    const staticLayout = narrow.matches || !lab || !lab.motionEnabled;
    scene.classList.toggle('is-static', staticLayout);
    const progress = staticLayout ? 0 : lab.progress(scene);
    if (progress === lastProgress) return;
    lastProgress = progress;
    scene.style.setProperty('--far-shift', `${(-progress * viewportHeight * .12).toFixed(2)}px`);
    scene.style.setProperty('--middle-shift', `${(-progress * viewportHeight * .36).toFixed(2)}px`);
    scene.style.setProperty('--foreground-shift', `${(-progress * viewportHeight * .80).toFixed(2)}px`);
    scene.style.setProperty('--scene-progress', progress.toFixed(4));
    scene.dataset.progress = progress.toFixed(4);
  }
  function recalculate() { viewportHeight = innerHeight; lastProgress = -1; update(); }
  let unsubscribe = lab ? lab.onScroll(update) : null;
  narrow.addEventListener('change', recalculate);
  addEventListener('resize', recalculate, { passive: true });
  addEventListener('chen:motionchange', recalculate);
  addEventListener('pagehide', () => { if (unsubscribe) { unsubscribe(); unsubscribe = null; } });
  addEventListener('pageshow', event => {
    if (event.persisted && lab) { unsubscribe = lab.onScroll(update); recalculate(); }
  });
  update();
  window.__siteReady = true;
})();
