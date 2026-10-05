(() => {
  'use strict';
  const atelier = window.Atelier;
  const scene = document.querySelector('.cinema');
  const screen = document.querySelector('.screen');
  const aperture = document.querySelector('.aperture');
  const visual = document.querySelector('.visual-plane');
  const tracking = document.querySelector('.tracking-plane');
  const matte = document.querySelector('.matte-tracking');
  const copy = document.querySelector('.film-copy');
  const windowCopy = document.querySelector('.scope-window');
  const evidence = document.querySelector('.evidence-surface');
  const heading = document.querySelector('#chapter-title');
  const scope = document.querySelector('#chapter-scope');
  const link = document.querySelector('#chapter-link');
  const format = document.querySelector('#format-label');
  const announcement = document.querySelector('.chapter-state');
  const topShutter = document.querySelector('.shutter-top');
  const bottomShutter = document.querySelector('.shutter-bottom');
  const buttons = [...document.querySelectorAll('button[data-chapter]')];
  const media = [...document.querySelectorAll('.image-tracking')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const chapters = [
    { title: 'Content production.', scope: 'Concepts, scripts, filming, editing and copywriting. 500+ content pieces, almost entirely individually handled.', texture: '4', link: '#content-scope', format: 'WIDESCREEN / CONTENT' },
    { title: 'KOL collaboration.', scope: 'Creator sourcing, quotations, briefs, shoots, review and reporting. 300+ collaborations, almost entirely individually handled.', texture: '5', link: '#creator-scope', format: 'PORTRAIT / CREATORS' },
    { title: 'Offline activations.', scope: 'Support for 10+ activations: internal, agency and vendor coordination, budgets and approval follow-up.', texture: '6', link: '#activation-scope', format: 'EVIDENCE / SUPPORT' }
  ];
  let active = -1;
  let transition = null;
  let unsubscribe = null;
  let camera = 0;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const motion = () => Boolean(atelier && atelier.enabled && !reduce.matches && !coarse.matches);

  function commitChapter(index) {
    active = index;
    const chapter = chapters[index];
    screen.dataset.chapter = String(index);
    heading.textContent = chapter.title;
    scope.textContent = chapter.scope;
    link.href = chapter.link;
    link.firstChild.textContent = 'Read this scope ';
    format.textContent = chapter.format;
    visual.dataset.texture = chapter.texture;
    aperture.setAttribute('aria-label', index === 2 ? 'Evidence of offline activation support' : `Abstract visual study in ${index === 1 ? 'portrait' : 'widescreen'} format`);
    evidence.setAttribute('aria-hidden', String(index !== 2));
    buttons.forEach((button, n) => button.setAttribute('aria-pressed', String(n === index)));
    announcement.textContent = `${chapter.title} ${chapter.scope}`;
  }

  function shutters(amount) {
    topShutter.style.transform = `translate3d(0,${(-104 * (1 - amount)).toFixed(3)}%,0)`;
    bottomShutter.style.transform = `translate3d(0,${(104 * (1 - amount)).toFixed(3)}%,0)`;
    windowCopy.style.opacity = String(1 - amount * .55);
    windowCopy.style.transform = `translate3d(0,${(amount * 5).toFixed(3)}px,0)`;
  }

  function reset() {
    [tracking, matte, copy, ...media].forEach(el => el.style.removeProperty('transform'));
    topShutter.style.removeProperty('transform');
    bottomShutter.style.removeProperty('transform');
    windowCopy.style.removeProperty('opacity');
    windowCopy.style.removeProperty('transform');
  }

  function syncMotion() {
    const enabled = motion();
    document.body.classList.toggle('cinema-motion-off', !enabled);
    if (!enabled) {
      if (transition) commitChapter(transition.next);
      transition = null;
      reset();
    }
  }

  function frame(state) {
    if (!motion()) return;
    const dt = clamp(Number(state.dt) || .016, 0, .08);
    const p = atelier.progress(scene);
    camera += (p - camera) * (1 - Math.exp(-dt * 7));
    const mobile = state.width < 768;
    const x = mobile ? -camera * 8 : -camera * 23;
    tracking.style.transform = `translate3d(${x.toFixed(3)}px,${(-camera * (mobile ? 21 : 55)).toFixed(3)}px,0) scale(${(1.025 + camera * .055).toFixed(5)})`;
    matte.style.transform = `translate3d(${(camera * 13).toFixed(3)}px,${(camera * 31).toFixed(3)}px,0) rotate(${(camera * -.85).toFixed(3)}deg)`;
    if (!mobile) copy.style.transform = `translate3d(0,${(-camera * 18).toFixed(3)}px,0)`;
    else copy.style.removeProperty('transform');
    media.forEach((plane, index) => {
      const r = plane.parentElement.getBoundingClientRect();
      const k = clamp((state.height - r.top) / (state.height + r.height));
      const y = (k - .5) * (index === 1 ? 66 : 43);
      plane.style.transform = `translate3d(0,${y.toFixed(3)}px,0)`;
    });
    if (!transition) return;
    transition.elapsed += dt;
    const t = clamp(transition.elapsed / .96);
    const closed = t < .44 ? ease(t / .44) : t < .55 ? 1 : 1 - ease((t - .55) / .45);
    shutters(closed);
    if (t >= .44 && !transition.committed) {
      commitChapter(transition.next);
      transition.committed = true;
    }
    if (t >= 1) { transition = null; shutters(0); }
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      if (index === active && !transition) return;
      if (!motion()) { commitChapter(index); return; }
      // One shutter cycle conceals the crop / chapter swap; rapid clicks retarget it.
      if (transition && !transition.committed) transition.next = index;
      else transition = { elapsed: 0, next: index, committed: false };
    });
  });

  window.addEventListener('atelier:motion', syncMotion);
  reduce.addEventListener('change', syncMotion);
  coarse.addEventListener('change', syncMotion);
  window.addEventListener('pagehide', () => { if (unsubscribe) unsubscribe(); unsubscribe = null; });
  window.addEventListener('pageshow', event => { if (event.persisted && atelier && !unsubscribe) unsubscribe = atelier.onFrame(frame); });
  if (atelier) unsubscribe = atelier.onFrame(frame);
  syncMotion();
  window.__siteReady = true;
})();
