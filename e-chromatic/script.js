(() => {
  'use strict';
  const stage = document.querySelector('.stage');
  const aperture = document.querySelector('.aperture-shell');
  const base = document.querySelector('.media-base');
  const wipe = document.querySelector('.media-wipe');
  const controls = [...document.querySelectorAll('[data-scope]')];
  const panels = [...document.querySelectorAll('.scope-panel')];
  const textures = { content: '8', kol: '4', activations: '1' };
  let active = 'content';
  let settledTexture = textures.content;
  let wipeAnimation;
  let sequence = 0;
  const motion = () => Boolean(window.ChenLab?.motionEnabled);

  document.body.classList.add('is-enhanced');

  function finishWipe(texture) {
    base.dataset.texture = texture;
    settledTexture = texture;
    wipe.style.clipPath = 'inset(0 100% 0 0)';
  }

  function selectScope(scope) {
    if (scope === active || !Object.hasOwn(textures, scope)) return;
    active = scope;
    controls.forEach(control => {
      const selected = control.dataset.scope === scope;
      control.classList.toggle('is-active', selected);
      control.setAttribute('aria-pressed', String(selected));
    });
    panels.forEach(panel => panel.classList.toggle('is-selected', panel.id === `scope-${scope}`));
    const texture = textures[scope];
    const run = ++sequence;
    if (wipeAnimation) wipeAnimation.cancel();
    base.dataset.texture = settledTexture;
    wipe.dataset.texture = texture;
    if (!motion()) {
      finishWipe(texture);
      return;
    }
    wipeAnimation = wipe.animate([
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)' }
    ], { duration: 740, easing: 'cubic-bezier(.22,.7,.16,1)', fill: 'forwards' });
    wipeAnimation.finished.then(() => {
      if (run !== sequence) return;
      finishWipe(texture);
      wipeAnimation.cancel();
      wipeAnimation = undefined;
    }).catch(() => {});
  }

  controls.forEach(control => {
    control.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') selectScope(control.dataset.scope);
    });
    control.addEventListener('focus', () => selectScope(control.dataset.scope));
    control.addEventListener('click', () => selectScope(control.dataset.scope));
    control.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const siblings = [...control.parentElement.querySelectorAll('[data-scope]')];
      const index = siblings.indexOf(control);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? siblings.length - 1 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + siblings.length) % siblings.length;
      siblings[next].focus({ preventScroll: true });
    });
  });

  function updateStage() {
    if (!motion() || innerWidth <= 900) {
      aperture.style.transform = 'none';
      return;
    }
    const progress = window.ChenLab.clamp(scrollY / Math.max(1, stage.offsetHeight), 0, 1);
    aperture.style.transform = `translate3d(${(progress * 18).toFixed(2)}px,${(progress * -62).toFixed(2)}px,0) rotate(${(progress * -5).toFixed(3)}deg) scale(${(1 - progress * .035).toFixed(4)})`;
  }

  window.ChenLab.onScroll(updateStage);
  window.addEventListener('chen:motionchange', () => {
    if (!motion()) {
      ++sequence;
      if (wipeAnimation) wipeAnimation.cancel();
      wipeAnimation = undefined;
      finishWipe(textures[active]);
    }
    updateStage();
  });
  window.__siteReady = true;
})();
