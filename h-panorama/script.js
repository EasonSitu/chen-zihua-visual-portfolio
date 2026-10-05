(() => {
  'use strict';
  const lab = window.ChenLab;
  const scene = document.querySelector('.walk');
  const viewport = scene.querySelector('.walk-viewport');
  const media = scene.querySelector('.media-rail');
  const foreground = scene.querySelector('.foreground-rail');
  const back = scene.querySelector('.back-word');
  const intro = scene.querySelector('.intro');
  const compact = matchMedia('(max-width: 900px)');
  const chapters = [...scene.querySelectorAll('.chapters a')];
  const jumps = [...document.querySelectorAll('[data-scene-jump]')];
  const chapterProgress = [0, .37, .64, .92];
  const targets = chapters.map(link => document.querySelector(link.hash));
  let animated = false;
  let compactLayout = compact.matches;
  let resizeFrame;
  let settlingFrame;

  function activeIndex(progress) {
    if (progress >= .79) return 3;
    if (progress >= .51) return 2;
    if (progress >= .20) return 1;
    return 0;
  }

  function setActive(index) {
    chapters.forEach((link, i) => {
      if (index === i) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scene.dataset.chapter = String(index + 1);
  }

  function update() {
    // The shared resize callback can run one frame before this site's layout
    // reset. Keep that frame from replacing the current chapter with geometry
    // measured in the other layout.
    if (compactLayout !== compact.matches || animated !== (!compact.matches && lab.motionEnabled)) return;
    if (!animated) {
      let index = 0;
      if (compact.matches) {
        targets.forEach((target, i) => {
          if (target.getBoundingClientRect().top <= innerHeight * .55) index = i;
        });
      } else {
        // The desktop fallback presents all three scopes in one row. Preserve
        // the chosen scope until the reader reaches the following evidence.
        index = Math.min(2, Number(scene.dataset.chapter || 1) - 1);
        if (targets[3].getBoundingClientRect().top <= innerHeight * .15) index = 3;
      }
      setActive(index);
      return;
    }
    const progress = lab.progress(scene);
    const width = viewport.clientWidth;
    // The captions travel twice as far as the media. The reading panel stops
    // before the native sticky container releases, leaving time to read it.
    const frontProgress = lab.clamp(progress / .88);
    media.style.transform = `translate3d(${-width * 1.29 * progress}px,0,0)`;
    foreground.style.transform = `translate3d(${-width * 2.59 * frontProgress}px,0,0)`;
    back.style.transform = `translate3d(${-width * .46 * progress}px,0,0)`;
    intro.style.transform = `translate3d(${-width * .2 * progress}px,0,0)`;
    intro.style.opacity = String(lab.clamp(1 - progress * 3.3));
    scene.dataset.progress = progress.toFixed(4);
    setActive(activeIndex(progress));
  }

  function clearMotion() {
    [media, foreground, back, intro].forEach(element => element.style.removeProperty('transform'));
    intro.style.removeProperty('opacity');
    scene.removeAttribute('data-progress');
  }

  function topForProgress(progress) {
    const rect = scene.getBoundingClientRect();
    return scrollY + rect.top + Math.max(0, rect.height - innerHeight) * progress;
  }

  function configure(preserveContext = true) {
    cancelAnimationFrame(settlingFrame);
    const previous = animated;
    const rect = scene.getBoundingClientRect();
    const inside = rect.top <= 0 && rect.bottom > innerHeight * .25;
    const index = previous ? activeIndex(lab.progress(scene)) : Number(scene.dataset.chapter || 1) - 1;
    animated = !compact.matches && lab.motionEnabled;
    compactLayout = compact.matches;
    scene.classList.toggle('is-animated', animated);
    scene.classList.toggle('static-scene', !animated);
    setActive(index);
    clearMotion();
    update();
    if (preserveContext && previous !== animated && inside) {
      settlingFrame = requestAnimationFrame(() => {
        if (animated) window.scrollTo({ top: topForProgress(chapterProgress[index]), behavior: 'instant' });
        else targets[index].scrollIntoView({ behavior: 'instant', block: 'start' });
        update();
      });
    }
  }

  function jump(link, smooth = true) {
    cancelAnimationFrame(settlingFrame);
    const target = link.hash === '#work' ? scene : document.querySelector(link.hash);
    if (!target) return;
    if (animated) {
      const progress = Number(link.dataset.sceneJump);
      window.scrollTo({ top: topForProgress(progress), behavior: smooth ? 'smooth' : 'instant' });
    } else target.scrollIntoView({ behavior: smooth && lab.motionEnabled ? 'smooth' : 'instant', block: 'start' });
    const selectedIndex = chapters.indexOf(link);
    if (selectedIndex >= 0) setActive(selectedIndex);
    if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
    if (location.hash !== link.hash) history.replaceState(null, '', link.hash);
  }

  jumps.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    jump(link);
  }));

  addEventListener('chen:motionchange', () => configure());
  addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => configure());
  }, { passive: true });
  addEventListener('hashchange', () => {
    const link = jumps.find(item => item.hash === location.hash);
    if (link) requestAnimationFrame(() => jump(link, false));
  });
  configure(false);
  lab.onScroll(update);
  if (location.hash) {
    const link = jumps.find(item => item.hash === location.hash);
    if (link) requestAnimationFrame(() => jump(link, false));
  }
  window.__siteReady = true;
})();
