(() => {
  'use strict';
  const atelier = window.Atelier;
  const scene = document.querySelector('.depth-scene');
  const narrow = matchMedia('(max-width: 900px)');
  const coarse = matchMedia('(pointer: coarse)');
  const art = document.querySelector('.media-art');
  const incomingArt = document.querySelector('.incoming-art');
  const details = document.querySelector('.scope-detail');
  const shutters = [...document.querySelectorAll('.art-shutter i')];
  const buttons = [...document.querySelectorAll('[data-scope]')];
  const scopeBar = document.querySelector('.scope-bar');
  const phaseLabels = [...document.querySelectorAll('.phase')];
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
  let selected = 'content';
  let animations = [];
  let swapSerial = 0;

  function updateCopy(value) {
    document.querySelector('.scope-number').textContent = value.number;
    document.querySelector('.scope-summary').textContent = value.summary;
    ['role', 'decision', 'execution'].forEach(field => {
      document.querySelector(`[data-copy="${field}"]`).textContent = value[field];
    });
    document.querySelector('.evidence-value').textContent = value.value;
    document.querySelector('.evidence-description').textContent = value.description;
    document.querySelector('.evidence-note').textContent = value.note;
    document.querySelector('.study-number').textContent = `Visual study / ${value.study}`;
    document.querySelector('.media-scope').textContent = value.label;
    document.querySelector('.card-scope').textContent = value.number;
    const cardValue = document.querySelector('.card-value');
    cardValue.replaceChildren(document.createTextNode(value.value.replace('+', '')));
    const plus = document.createElement('span');
    plus.textContent = '+';
    cardValue.append(plus);
    document.querySelector('.card-description').textContent = value.description;
  }

  function selectScope(key) {
    if (!scopes[key] || key === selected) return;
    const value = scopes[key];
    selected = key;
    scene.dataset.scope = key;
    scene.dataset.transition = 'shutter';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scope === key)));
    const serial = ++swapSerial;
    animations.forEach(animation => animation.cancel());
    animations = [];
    updateCopy(value);
    if (!atelier?.enabled || coarse.matches) {
      art.dataset.texture = value.texture;
      incomingArt.dataset.texture = value.texture;
      scene.dataset.transition = 'idle';
      return;
    }
    // Physical frame shutters close and retract as the new study is revealed.
    // WAAPI owns this finite gesture; the shared Atelier scheduler owns all continuous motion.
    incomingArt.dataset.texture = value.texture;
    const duration = 940;
    shutters.forEach((shutter, index) => {
      animations.push(shutter.animate([
        { transform: 'scaleY(0)', offset: 0 },
        { transform: 'scaleY(1)', offset: .35 },
        { transform: 'scaleY(1)', offset: .5 },
        { transform: 'scaleY(0)', offset: 1 }
      ], { duration, delay: index * 70, easing: 'cubic-bezier(.22,.68,0,1)', fill: 'none' }));
    });
    const wipe = incomingArt.animate([
      { clipPath: 'inset(0 100% 0 0)', transform: 'scale(1.06)' },
      { clipPath: 'inset(0 0 0 0)', transform: 'scale(1)' }
    ], { duration: 750, delay: 330, easing: 'cubic-bezier(.22,.68,0,1)', fill: 'forwards' });
    animations.push(wipe);
    animations.push(details.animate([
      { opacity: .3, clipPath: 'inset(0 0 100% 0)' },
      { opacity: 1, clipPath: 'inset(0 0 0 0)' }
    ], { duration: 730, easing: 'cubic-bezier(.22,.68,0,1)', fill: 'none' }));
    wipe.finished.then(() => {
      if (serial !== swapSerial) return;
      art.dataset.texture = value.texture;
      wipe.cancel();
      scene.dataset.transition = 'idle';
    }).catch(() => {});
  }
  buttons.forEach(button => button.addEventListener('click', () => selectScope(button.dataset.scope)));

  const clamp = atelier?.clamp || ((v, min = 0, max = 1) => Math.max(min, Math.min(max, v)));
  const smoothstep = (from, to, value) => {
    const normalized = clamp((value - from) / (to - from));
    return normalized * normalized * (3 - 2 * normalized);
  };
  let dynamic = false;
  let current = 0;
  let pointerX = 0;
  let pointerY = 0;
  let lastPhase = -1;
  let unsubscribe;
  let gutter = 0;

  function setLayout() {
    dynamic = !!atelier?.enabled && !narrow.matches && !coarse.matches && innerHeight >= 640;
    scene.classList.toggle('is-dynamic', dynamic);
    scene.classList.toggle('is-static', !dynamic);
    if (dynamic) {
      current = atelier.progress(scene);
      gutter = parseFloat(getComputedStyle(document.querySelector('.context')).left) || 0;
    }
    else {
      scene.dataset.progress = 'static';
      scene.dataset.phase = 'reading';
      scene.querySelector('.context').removeAttribute('inert');
      scene.querySelector('.case-sheet').removeAttribute('inert');
      scene.querySelector('.sheet-tail').removeAttribute('inert');
      scopeBar.removeAttribute('inert');
    }
  }

  function frame(state) {
    if (!dynamic) return;
    const target = atelier.progress(scene);
    const follow = 1 - Math.exp(-11 * state.dt);
    current += (target - current) * follow;
    if (Math.abs(target - current) < .00005) current = target;
    const compose = smoothstep(.12, .48, current);
    const close = smoothstep(.65, .88, current);
    // Keep controls in one of two clear, usable slots. The position handoff
    // happens in the zero-opacity interval, so no tab crosses the evidence card.
    const readingControls = current >= .32;
    const controlOpacity = readingControls
      ? smoothstep(.49, .56, current)
      : 1 - smoothstep(.13, .21, current);
    pointerX += ((state.pointer.live ? state.pointer.nx : 0) - pointerX) * (1 - Math.exp(-4 * state.dt));
    pointerY += ((state.pointer.live ? state.pointer.ny : 0) - pointerY) * (1 - Math.exp(-4 * state.dt));
    const set = (name, value) => scene.style.setProperty(name, value);
    const px = value => `${value.toFixed(2)}px`;
    const w = state.width;
    const h = state.height;
    // Outer scene wrappers handle choreography; inner depth/tilt wrappers belong to Atelier.
    set('--context-y', px(-smoothstep(0, .35, current) * h * .11));
    set('--context-opacity', (1 - smoothstep(.1, .22, current)).toFixed(4));
    set('--back-x', px(-compose * w * .555 + pointerX * 5));
    set('--back-y', px(-current * h * .052 + pointerY * 3));
    set('--back-rotate', `${(8 - compose * 4).toFixed(3)}deg`);
    set('--media-x', px(-compose * w * .502 + pointerX * 10));
    set('--media-y', px(-current * h * .035 + pointerY * 6));
    set('--media-scale', (1 - compose * .13).toFixed(4));
    set('--media-rotate', `${(-3 + compose * 3).toFixed(3)}deg`);
    set('--near-x', px(-compose * w * .338 + pointerX * 17));
    set('--near-y', px(compose * h * .065 - close * h * .014 + pointerY * 9));
    set('--near-rotate', `${(-8 + compose * 10).toFixed(3)}deg`);
    set('--sheet-y', px((1 - compose) * h * .88));
    set('--sheet-opacity', smoothstep(.35, .49, current).toFixed(4));
    set('--sheet-events', current > .4 ? 'auto' : 'none');
    set('--scope-x', px(readingControls ? w * .43 - gutter : 0));
    set('--scope-width', readingControls ? '48.5%' : '36.5%');
    // The control baseline exactly meets the title's reserved slot at the reading position.
    set('--scope-y', px(readingControls ? h * -.59 + (h <= 760 ? 118 : 160) : 0));
    set('--scope-opacity', controlOpacity.toFixed(4));
    set('--scope-events', controlOpacity > .15 ? 'auto' : 'none');
    scopeBar.toggleAttribute('inert', controlOpacity <= .15);
    scene.dataset.controlPhase = controlOpacity <= .15 ? 'hidden' : readingControls ? 'reading' : 'opening';
    set('--tail-opacity', smoothstep(.6, .83, current).toFixed(4));
    set('--tail-y', px((1 - close) * 20));
    set('--tail-events', current > .72 ? 'auto' : 'none');
    set('--scene-progress', current.toFixed(4));
    const sheet = scene.querySelector('.case-sheet');
    const tail = scene.querySelector('.sheet-tail');
    scene.querySelector('.context').toggleAttribute('inert', current > .22);
    sheet.toggleAttribute('inert', current < .35);
    tail.toggleAttribute('inert', current < .72);
    const phase = current < .3 ? 0 : current < .72 ? 1 : 2;
    if (phase !== lastPhase) {
      lastPhase = phase;
      phaseLabels.forEach((label, index) => label.classList.toggle('is-current', index === phase));
      scene.dataset.phase = ['idea', 'making', 'evidence'][phase];
    }
    scene.dataset.progress = current.toFixed(4);
  }
  setLayout();
  if (atelier) unsubscribe = atelier.onFrame(frame);
  narrow.addEventListener('change', setLayout);
  coarse.addEventListener('change', setLayout);
  addEventListener('atelier:motion', () => {
    animations.forEach(animation => animation.cancel());
    animations = [];
    art.dataset.texture = scopes[selected].texture;
    incomingArt.dataset.texture = scopes[selected].texture;
    setLayout();
  });
  addEventListener('resize', setLayout, { passive: true });
  addEventListener('pagehide', () => { if (unsubscribe) { unsubscribe(); unsubscribe = null; } });
  addEventListener('pageshow', event => { if (event.persisted && atelier && !unsubscribe) { setLayout(); unsubscribe = atelier.onFrame(frame); } });
  window.__siteReady = true;
})();
