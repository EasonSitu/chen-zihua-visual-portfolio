(() => {
  'use strict';
  const lab = window.ChenLab;
  const hero = document.querySelector('.hero');
  const firstLine = document.querySelector('.hero-line--first');
  const secondLine = document.querySelector('.hero-line--second');
  const tabs = Array.from(document.querySelectorAll('.scope-tabs [role="tab"]'));
  const panels = Array.from(document.querySelectorAll('.scope[role="tabpanel"]'));
  const apertures = Array.from(document.querySelectorAll('[data-aperture]'));
  const desktop = matchMedia('(min-width: 768px)');
  const animations = new Set();
  const studies = {
    content: { portrait: '2', landscape: '6', caption: 'An idea, in motion.' },
    kol: { portrait: '8', landscape: '4', caption: 'The right fit. The clear brief.' },
    campaigns: { portrait: '7', landscape: '3', caption: 'From plan to live activity.' }
  };

  function stopAnimations() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }

  function setCategory(category, focusTab = false) {
    if (!studies[category]) return;
    if (hero.dataset.category === category) {
      if (focusTab) tabs.find(tab => tab.dataset.category === category).focus();
      return;
    }
    // Measure the current visual positions, commit the new layout, then invert.
    // The composition changes actual aperture position and dimensions in CSS.
    const before = apertures.map(element => element.getBoundingClientRect());
    stopAnimations();
    hero.dataset.category = category;
    tabs.forEach(tab => {
      const selected = tab.dataset.category === category;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) tab.focus();
    });
    panels.forEach(panel => { panel.hidden = panel.id !== `scope-${category}`; });
    apertures.forEach((element, index) => {
      const type = element.dataset.aperture;
      element.querySelector('.study').dataset.texture = studies[category][type];
      if (type === 'portrait') element.querySelector('figcaption').textContent = studies[category].caption;
      const after = element.getBoundingClientRect();
      if (!lab?.motionEnabled || !element.animate || after.width === 0 || after.height === 0) return;
      const from = before[index];
      const animation = element.animate([
        { transform: `translate(${from.left - after.left}px, ${from.top - after.top}px) scale(${from.width / after.width}, ${from.height / after.height})` },
        { transform: 'translate(0, 0) scale(1, 1)' }
      ], { duration: 690, easing: 'cubic-bezier(.22,.75,.16,1)', delay: index * 45, fill: 'backwards' });
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
      animation.oncancel = () => animations.delete(animation);
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setCategory(tab.dataset.category));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      setCategory(tabs[next].dataset.category, true);
    });
  });

  function updateType() {
    if (!lab?.motionEnabled || !desktop.matches) {
      firstLine.style.transform = '';
      secondLine.style.transform = '';
      return;
    }
    const rect = hero.getBoundingClientRect();
    const travel = lab.clamp(-rect.top / rect.height, 0, 1);
    firstLine.style.transform = `translate3d(${-travel * 45}px, 0, 0)`;
    secondLine.style.transform = `translate3d(${travel * 85}px, 0, 0)`;
  }
  let unsubscribe = lab?.onScroll(updateType);
  const motionChange = () => { stopAnimations(); updateType(); };
  addEventListener('chen:motionchange', motionChange);
  desktop.addEventListener('change', motionChange);
  addEventListener('pagehide', () => {
    stopAnimations();
    unsubscribe?.();
    unsubscribe = null;
    removeEventListener('chen:motionchange', motionChange);
    desktop.removeEventListener('change', motionChange);
  });
  addEventListener('pageshow', event => {
    if (!event.persisted || unsubscribe) return;
    addEventListener('chen:motionchange', motionChange);
    desktop.addEventListener('change', motionChange);
    unsubscribe = lab?.onScroll(updateType);
  });
  window.__siteReady = true;
})();
