(() => {
  'use strict';
  const lab = window.ChenLab;
  const hero = document.querySelector('.hero');
  const folder = document.querySelector('.archive-folder');
  const stage = document.querySelector('.folder-stage');
  const controls = document.querySelector('.folder-controls');
  const tabs = [...document.querySelectorAll('.folder-tab')];
  const buttons = [...document.querySelectorAll('[data-scope]')];
  const papers = [...document.querySelectorAll('[data-sheet]')];
  const scopes = [...document.querySelectorAll('[data-work-scope]')];
  const narrow = matchMedia('(max-width: 760px)');
  const descriptions = {
    content: { number:'01', title:'Content production', summary:'Concepts, scripts, shoots, edits & publishing.' },
    kol: { number:'02', title:'Creator collaborations', summary:'Sourcing, quotes, briefs, shoots, review & reporting.' },
    activations: { number:'03', title:'Offline activations', summary:'Materials, budgets, procurement & on-site support.' }
  };
  let selected = 'content';
  let initial = true;
  let extractionTimer = 0;

  function isStatic() { return !lab.motionEnabled || narrow.matches; }

  function renderScopes() {
    const stacked = isStatic();
    // Mobile controls leave the tilted object and become a normal reading list.
    if (narrow.matches && controls.parentElement !== stage) stage.insertBefore(controls, folder);
    else if (!narrow.matches && controls.parentElement !== folder) folder.append(controls);
    document.documentElement.classList.toggle('archive-static', !lab.motionEnabled);
    controls.setAttribute('aria-orientation', narrow.matches ? 'vertical' : 'horizontal');
    scopes.forEach(scope => {
      const active = scope.dataset.workScope === selected;
      scope.hidden = !stacked && !active;
      scope.classList.toggle('is-active', active);
      // Static layouts are ordinary articles, so every file remains readable.
      scope.setAttribute('role', stacked ? 'article' : 'tabpanel');
      scope.setAttribute('aria-labelledby', stacked ? scope.querySelector('h3').id : `tab-${scope.dataset.workScope}`);
    });
  }

  function updateMotion() {
    if (isStatic()) {
      folder.style.setProperty('--depth-y', '0px');
      folder.style.setProperty('--depth-angle', '0deg');
      document.querySelectorAll('.scope-media').forEach(media => media.style.setProperty('--media-shift', '0px'));
      return;
    }
    const travel = lab.clamp(scrollY / Math.max(1, hero.offsetHeight));
    const progress = lab.clamp(lab.progress(hero) * .25 + travel * .75);
    folder.style.setProperty('--depth-y', `${(progress * -29).toFixed(2)}px`);
    folder.style.setProperty('--depth-angle', `${(progress * 3.8).toFixed(2)}deg`);
    scopes.forEach(scope => {
      if (scope.hidden) return;
      const rect = scope.getBoundingClientRect();
      const amount = lab.clamp((innerHeight - rect.top) / (innerHeight + rect.height));
      scope.querySelector('.scope-media').style.setProperty('--media-shift', `${((amount - .35) * -18).toFixed(2)}px`);
    });
  }

  function selectScope(key, animate = true) {
    if (!descriptions[key]) return;
    const changed = selected !== key;
    selected = key;
    clearTimeout(extractionTimer);
    papers.forEach(paper => {
      paper.classList.remove('is-extracting');
      paper.classList.toggle('is-selected', paper.dataset.sheet === key);
      paper.classList.toggle('is-resting', initial && paper.dataset.sheet === key);
    });
    buttons.forEach(button => {
      const active = button.dataset.scope === key;
      button.classList.toggle('is-selected', active);
      button.classList.remove('is-extracting');
      button.classList.toggle('is-resting', initial && active);
      if (button.classList.contains('folder-tab')) {
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      } else button.setAttribute('aria-pressed', String(active));
    });
    const info = descriptions[key];
    document.querySelector('.selected-number').textContent = `FILE ${info.number}`;
    document.querySelector('.selected-title').textContent = info.title;
    document.querySelector('.selected-summary').textContent = info.summary;
    renderScopes();
    if (changed && animate && !isStatic()) {
      const paper = papers.find(item => item.dataset.sheet === key);
      const tab = tabs.find(item => item.dataset.scope === key);
      // Restart the physical lift even when a reader changes files quickly.
      void paper.offsetWidth;
      paper.classList.add('is-extracting');
      tab.classList.add('is-extracting');
      extractionTimer = setTimeout(() => {
        paper.classList.remove('is-extracting');
        tab.classList.remove('is-extracting');
      }, 850);
    }
    updateMotion();
  }

  scopes.forEach(scope => {
    scope.querySelector('h3').id = `heading-${scope.dataset.workScope}`;
  });
  buttons.forEach(button => button.addEventListener('click', () => {
    initial = false;
    selectScope(button.dataset.scope);
  }));
  controls.addEventListener('keydown', event => {
    const target = event.target.closest('.folder-tab');
    if (!target) return;
    const index = tabs.indexOf(target);
    let next = index;
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
    else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    initial = false;
    selectScope(tabs[next].dataset.scope);
    tabs[next].focus();
  });

  function refreshPreference() {
    clearTimeout(extractionTimer);
    document.querySelectorAll('.is-extracting').forEach(element => element.classList.remove('is-extracting'));
    renderScopes();
    updateMotion();
  }
  narrow.addEventListener('change', refreshPreference);
  addEventListener('chen:motionchange', refreshPreference);
  let unsubscribe = lab.onScroll(updateMotion);
  addEventListener('pagehide', () => {
    clearTimeout(extractionTimer);
    unsubscribe?.();
    unsubscribe = null;
    narrow.removeEventListener('change', refreshPreference);
    removeEventListener('chen:motionchange', refreshPreference);
  });
  addEventListener('pageshow', event => {
    if (!event.persisted || unsubscribe) return;
    narrow.addEventListener('change', refreshPreference);
    addEventListener('chen:motionchange', refreshPreference);
    refreshPreference();
    unsubscribe = lab.onScroll(updateMotion);
  });
  selectScope('content', false);
  window.__siteReady = true;
})();
