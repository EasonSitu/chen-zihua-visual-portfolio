(() => {
  'use strict';
  const atelier = window.Atelier;
  const scene = document.querySelector('.walk');
  const viewport = scene.querySelector('.walk-viewport');
  const media = scene.querySelector('.media-rail');
  const foreground = scene.querySelector('.foreground-rail');
  const far = scene.querySelector('.scene-far');
  const intro = scene.querySelector('.intro');
  const shutter = scene.querySelector('.gallery-shutter');
  const counter = scene.querySelector('.current-count');
  const compact = matchMedia('(max-width: 900px)');
  const coarse = matchMedia('(pointer: coarse)');
  const chapters = [...scene.querySelectorAll('.chapters a')];
  const jumps = [...document.querySelectorAll('[data-scene-jump]')];
  const targets = chapters.map(link => document.querySelector(link.hash));
  const stops = chapters.map(link => Number(link.dataset.sceneJump));
  let panorama = false;
  let progress = 0;
  let measured = { top: 0, travel: 1, width: innerWidth };
  let layoutDirty = true;
  let active = -1;
  let jumpAnimation = null;
  let routeHashPending = true;
  let lastPointer = { x: 0, y: 0 };

  function setActive(index) {
    if (index === active) return;
    active = index;
    chapters.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scene.dataset.chapter = String(index + 1);
    counter.textContent = String(index + 1).padStart(2, '0');
  }

  function measure() {
    const rect = scene.getBoundingClientRect();
    measured = { top: scrollY + rect.top, travel: Math.max(1, rect.height - innerHeight), width: viewport.clientWidth };
    layoutDirty = false;
  }

  function clearTransforms() {
    [media, foreground, far, intro].forEach(element => element.style.removeProperty('transform'));
    targets.forEach(element => element.style.removeProperty('transform'));
    intro.style.removeProperty('opacity');
    lastPointer = { x: 0, y: 0 };
  }

  function galleryTravel(value) {
    // Each image and its catalog sheet share the exhibition's baseline.
    // Reading holds prevent a faster sheet from introducing the next subject
    // while the preceding image still dominates the viewport.
    const ease = value => value * value * (3 - 2 * value);
    if (value <= .12) return 0;
    if (value < .26) return ease((value - .12) / .14);
    if (value <= .46) return 1;
    if (value < .58) return 1 + ease((value - .46) / .12);
    if (value <= .75) return 2;
    if (value < .88) return 2 + ease((value - .75) / .13);
    return 3;
  }

  function configure() {
    const before = panorama;
    const next = !compact.matches && !coarse.matches && innerHeight >= 640 && atelier.enabled;
    if (before === next && !layoutDirty) return;
    const rect = scene.getBoundingClientRect();
    const inside = rect.top < -4 && rect.bottom > innerHeight * .2;
    const selected = Math.max(0, active);
    panorama = next;
    scene.classList.toggle('is-panorama', panorama);
    clearTransforms();
    measure();
    if (before !== panorama && inside) {
      if (panorama) scrollTo({ top: measured.top + measured.travel * stops[selected], behavior: 'instant' });
      else targets[selected].scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    progress = panorama ? atelier.clamp((scrollY - measured.top) / measured.travel) : 0;
  }

  function render(state) {
    if (layoutDirty) configure();
    if (!panorama) {
      let selected = 0;
      targets.forEach((target, index) => {
        if (target.getBoundingClientRect().top <= state.height * .45) selected = index;
      });
      setActive(selected);
      scene.dataset.phase = 'vertical';
      return;
    }
    const actual = atelier.clamp((state.scrollY - measured.top) / measured.travel);
    const follow = 1 - Math.exp(-13 * state.dt);
    progress += (actual - progress) * follow;
    if (Math.abs(actual - progress) < .00002) progress = actual;
    const baseline = galleryTravel(progress);
    const nearDrift = Math.sin(progress * Math.PI * 2) * .025;
    const midDrift = Math.sin(progress * Math.PI * 2) * -.012;
    const onStage = state.scrollY >= measured.top - state.height && state.scrollY <= measured.top + measured.travel + state.height;
    const x = state.pointer.live && onStage ? state.pointer.nx : 0;
    const y = state.pointer.live && onStage ? state.pointer.ny : 0;
    lastPointer.x += (x - lastPointer.x) * (1 - Math.exp(-5 * state.dt));
    lastPointer.y += (y - lastPointer.y) * (1 - Math.exp(-5 * state.dt));
    const width = measured.width;
    media.style.transform = `translate3d(${width * (-baseline + midDrift) + lastPointer.x * -8}px,${lastPointer.y * -4}px,0)`;
    foreground.style.transform = `translate3d(${width * (-baseline + nearDrift) + lastPointer.x * 5}px,${lastPointer.y * 3}px,0)`;
    far.style.transform = `translate3d(${-width * .74 * progress + lastPointer.x * -16}px,0,0)`;
    intro.style.transform = `translate3d(${-width * .2 * progress}px,${lastPointer.y * -6}px,0)`;
    intro.style.opacity = String(atelier.clamp(1 - progress / .17));
    scene.dataset.progress = progress.toFixed(4);
    // These thresholds compare the visible areas of neighboring frames,
    // rather than the progress of an unrelated foreground rail.
    const selected = baseline >= 2.56 ? 3 : baseline >= 1.67 ? 2 : baseline >= .695 ? 1 : 0;
    scene.dataset.phase = selected === 0 ? 'start' : selected === 3 ? 'end' : 'middle';
    setActive(selected);
    targets.forEach((target, index) => {
      // Keep the current reading sheet on-screen as its frame exits. The
      // next sheet stays quiet until that frame becomes the dominant one.
      const compensation = index < 3 && index === selected ? Math.max(0, baseline - index - nearDrift) * width : 0;
      target.style.transform = compensation ? `translate3d(${compensation}px,0,0)` : '';
    });
  }

  function destination(link) {
    if (layoutDirty) configure();
    if (panorama) return measured.top + measured.travel * Number(link.dataset.sceneJump);
    const target = document.querySelector(link.hash);
    return target ? scrollY + target.getBoundingClientRect().top - 28 : 0;
  }

  function travel(link, animate = true) {
    const target = document.querySelector(link.hash);
    if (!target) return;
    const top = destination(link);
    const isScene = panorama && scrollY >= measured.top && scrollY <= measured.top + measured.travel;
    if (jumpAnimation) jumpAnimation.cancel();
    jumpAnimation = null;
    if (animate && isScene && atelier.enabled) {
      // A gallery shutter briefly folds from one edge to the other, while the
      // browser retains native smooth vertical scroll and scrollbar control.
      jumpAnimation = shutter.animate([
        { transform: 'scaleX(0)', transformOrigin: 'right' },
        { transform: 'scaleX(1)', transformOrigin: 'right', offset: .32 },
        { transform: 'scaleX(1)', transformOrigin: 'left', offset: .48 },
        { transform: 'scaleX(0)', transformOrigin: 'left' }
      ], { duration: 940, easing: 'cubic-bezier(.22,.68,0,1)', fill: 'none' });
      jumpAnimation.onfinish = () => { jumpAnimation = null; };
    }
    scrollTo({ top, behavior: animate && atelier.enabled ? 'smooth' : 'instant' });
    const selected = chapters.indexOf(link);
    if (selected >= 0) setActive(selected);
    if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
    if (location.hash !== link.hash) history.replaceState(null, '', link.hash);
  }

  jumps.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    travel(link);
  }));
  addEventListener('atelier:motion', () => { layoutDirty = true; configure(); });
  addEventListener('resize', () => { layoutDirty = true; }, { passive: true });
  compact.addEventListener('change', () => { layoutDirty = true; });
  coarse.addEventListener('change', () => { layoutDirty = true; });
  addEventListener('hashchange', () => {
    const link = jumps.find(item => item.hash === location.hash);
    if (link) travel(link, false);
  });
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && jumpAnimation) { jumpAnimation.cancel(); jumpAnimation = null; }
  });
  configure();
  atelier.onFrame(state => {
    if (routeHashPending) {
      routeHashPending = false;
      const link = jumps.find(item => item.hash === location.hash);
      if (link) travel(link, false);
    }
    render(state);
  });
  if (document.fonts) document.fonts.ready.then(() => { layoutDirty = true; });
  window.__siteReady = true;
})();
