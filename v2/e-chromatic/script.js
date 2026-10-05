(() => {
  'use strict';
  const atelier = window.Atelier;
  const body = document.body;
  const stage = document.querySelector('.stage');
  const sculpture = document.querySelector('.sculpture-float');
  const turn = document.querySelector('.sculpture-turn');
  const surface = document.querySelector('.surface-light');
  const surfaceWipe = document.querySelector('.surface-wipe');
  const bases = [...document.querySelectorAll('[data-media-base]')];
  const wipes = [...document.querySelectorAll('[data-media-wipe]')];
  const controls = [...document.querySelectorAll('[data-scope]')];
  const panels = [...document.querySelectorAll('.scope-panel')];
  const scopeLabel = document.querySelector('.art-scope-label');
  const count = document.querySelector('.scene-count');
  const folio = document.querySelector('.media-folio');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const scopes = {
    content: { texture: '8', number: '01', label: 'CONTENT', material: 'radial-gradient(ellipse at 26% 20%,#fffff7 0%,transparent 36%),linear-gradient(115deg,#f2f3e1 4%,#c0ccb4 24%,#fcfbed 45%,#e2e6d2 62%,#8a9f80 86%)' },
    kol: { texture: '4', number: '02', label: 'KOL', material: 'radial-gradient(ellipse at 26% 20%,#fafffa 0%,transparent 36%),linear-gradient(115deg,#edf0e7 4%,#a7bdad 24%,#f8fbf2 45%,#d1ded3 62%,#809989 86%)' },
    activations: { texture: '1', number: '03', label: 'ACTIVATIONS', material: 'radial-gradient(ellipse at 26% 20%,#fffaf1 0%,transparent 36%),linear-gradient(115deg,#f0ebdd 4%,#c7bca7 24%,#fff8e8 45%,#e3ddc7 62%,#9f9d7c 86%)' }
  };
  let active = 'content';
  let sequence = 0;
  let animations = [];
  let settled = 'content';
  let drift = { x: 0, y: 0, rotation: 0 };
  body.classList.add('is-enhanced');

  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations = [];
  }

  function settle(scope) {
    const info = scopes[scope];
    bases.forEach(base => { base.dataset.texture = info.texture; });
    wipes.forEach(wipe => { wipe.style.clipPath = 'inset(0 100% 0 0)'; });
    surface.style.background = info.material;
    surfaceWipe.style.clipPath = 'inset(0 100% 0 0)';
    settled = scope;
  }

  function animate(element, frames, options) {
    const animation = element.animate(frames, options);
    animations.push(animation);
    return animation;
  }

  function selectScope(scope) {
    if (scope === active || !Object.hasOwn(scopes, scope)) return;
    const run = ++sequence;
    cancelAnimations();
    settle(settled);
    active = scope;
    const info = scopes[scope];
    body.dataset.activeScope = scope;
    controls.forEach(control => {
      const selected = control.dataset.scope === scope;
      control.classList.toggle('is-active', selected);
      control.setAttribute('aria-pressed', String(selected));
    });
    panels.forEach(panel => {
      const selected = panel.id === `scope-${scope}`;
      panel.classList.toggle('is-selected', selected);
      panel.setAttribute('aria-hidden', String(!selected));
    });
    scopeLabel.textContent = `${info.number} / ${info.label}`;
    count.textContent = `${info.number} — 03`;
    folio.textContent = info.number;
    if (!atelier?.enabled) { settle(scope); return; }
    const options = { duration: 1000, easing: 'cubic-bezier(.23,.72,.13,1)', fill: 'forwards' };
    wipes.forEach((wipe, index) => {
      wipe.dataset.texture = info.texture;
      animate(wipe, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { ...options, delay: index * 70 });
    });
    surfaceWipe.style.background = info.material;
    const reveal = animate(surfaceWipe, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], options);
    animate(turn, [{ transform: 'rotate(-13deg) translateY(0)' }, { transform: 'rotate(-17deg) translateY(-9px)', offset: .4 }, { transform: 'rotate(-13deg) translateY(0)' }], { duration: 1300, easing: 'cubic-bezier(.22,.7,.15,1)' });
    const panel = document.querySelector(`#scope-${scope}`);
    animate(panel.querySelector('.scope-lead'), [{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(15px)' }, { clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)' }], { duration: 750, easing: 'cubic-bezier(.22,.7,.15,1)' });
    // Await all media wipes, including the slightly delayed lower-page layer.
    Promise.all(animations.map(animation => animation.finished)).then(() => {
      if (run !== sequence) return;
      settle(scope);
      cancelAnimations();
    }).catch(() => {});
    // Keep a direct reference for debugging the material curtain without a second scheduler.
    surfaceWipe.dataset.transition = String(run);
    reveal.finished.catch(() => {});
  }

  controls.forEach(control => {
    control.addEventListener('click', () => selectScope(control.dataset.scope));
    control.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const siblings = [...control.parentElement.querySelectorAll('[data-scope]')];
      const index = siblings.indexOf(control);
      const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? siblings.length - 1 : (index + direction + siblings.length) % siblings.length;
      siblings[next].focus({ preventScroll: true });
      selectScope(siblings[next].dataset.scope);
    });
  });
  panels.forEach(panel => { panel.setAttribute('aria-hidden', String(!panel.classList.contains('is-selected'))); });

  atelier?.onFrame(state => {
    if (!state.enabled || !fine.matches || state.width <= 800) {
      sculpture.style.transform = '';
      drift.x = drift.y = drift.rotation = 0;
      return;
    }
    const progress = atelier.clamp(state.scrollY / Math.max(1, stage.offsetHeight));
    const pointerX = state.pointer.live ? state.pointer.nx : 0;
    const pointerY = state.pointer.live ? state.pointer.ny : 0;
    const targetX = pointerX * 10 + progress * 20;
    const targetY = pointerY * 6 - progress * 70 + Math.sin(state.time * .00048) * 4;
    const targetRotation = -progress * 6 + pointerX * .8;
    const follow = 1 - Math.exp(-4 * state.dt);
    drift.x += (targetX - drift.x) * follow;
    drift.y += (targetY - drift.y) * follow;
    drift.rotation += (targetRotation - drift.rotation) * follow;
    sculpture.style.transform = `translate3d(${drift.x.toFixed(2)}px,${drift.y.toFixed(2)}px,0) rotate(${drift.rotation.toFixed(3)}deg)`;
    sculpture.dataset.phase = progress.toFixed(3);
  });
  addEventListener('atelier:motion', event => {
    if (!event.detail) {
      ++sequence;
      cancelAnimations();
      settle(active);
      sculpture.style.transform = '';
    }
  });
  addEventListener('pagehide', () => {
    ++sequence;
    cancelAnimations();
    settle(active);
  });
  window.__siteReady = true;
})();
