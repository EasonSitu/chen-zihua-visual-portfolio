(() => {
  'use strict';

  const atelier = window.Atelier;
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('.folder-stage');
  const hull = document.querySelector('.archive-hull');
  const ground = document.querySelector('.folder-ground');
  const back = document.querySelector('.folder-back');
  const sleeve = document.querySelector('.folder-front');
  const contact = document.querySelector('.contact-section');
  const contactPaper = document.querySelector('.contact-paper');
  const controls = document.querySelector('.folder-controls');
  const tabs = [...document.querySelectorAll('.folder-tab')];
  const buttons = [...document.querySelectorAll('[data-scope]')];
  const scopes = [...document.querySelectorAll('[data-work-scope]')];
  const narrow = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const descriptions = {
    content: { number: '01', title: 'Content production', summary: 'Concepts, scripts, shoots, edits & publishing.' },
    kol: { number: '02', title: 'Creator collaborations', summary: 'Sourcing, quotes, briefs, shoots, review & reporting.' },
    activations: { number: '03', title: 'Offline activations', summary: 'Materials, budgets, procurement & on-site support.' }
  };

  const resting = {
    content: { x: 0, y: -23, r: -3 },
    kol: { x: -32, y: 7, r: -10 },
    activations: { x: 37, y: -13, r: 8 }
  };
  const opened = {
    content: {
      content: { x: -5, y: -41, r: -4 },
      kol: { x: -48, y: 13, r: -12 },
      activations: { x: 50, y: -7, r: 10 }
    },
    kol: {
      content: { x: 32, y: 24, r: 5 },
      kol: { x: -24, y: -66, r: -7 },
      activations: { x: 48, y: 3, r: 11 }
    },
    activations: {
      content: { x: -38, y: 19, r: -8 },
      kol: { x: -55, y: 32, r: -13 },
      activations: { x: 28, y: -69, r: 5 }
    }
  };

  const sheets = [...document.querySelectorAll('[data-sheet]')].map(element => ({
    element,
    key: element.dataset.sheet,
    current: { ...resting[element.dataset.sheet] },
    from: { ...resting[element.dataset.sheet] },
    target: { ...resting[element.dataset.sheet] },
    lastLift: 0
  }));
  let selected = 'content';
  let phase = 1;
  let movingSheet = null;
  let turnTimer = 0;
  let unsubscribe = null;
  let live = true;
  let heroRect = { top: 0, height: 790 };
  let contactRect = { top: 0, height: 500 };
  let folioRects = [];
  let smoothTravel = 0;
  let smoothContact = 0;

  const motionEnabled = () => Boolean(atelier?.enabled) && !reduced.matches;
  const paperMotion = () => motionEnabled() && !narrow.matches && fine.matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (value) => 1 - Math.pow(1 - value, 3);

  function writeSheet(sheet, lift = 0) {
    const { element, current } = sheet;
    sheet.lastLift = lift;
    element.style.setProperty('--sheet-x', `${current.x.toFixed(3)}px`);
    element.style.setProperty('--sheet-y', `${(current.y + lift).toFixed(3)}px`);
    element.style.setProperty('--sheet-r', `${current.r.toFixed(3)}deg`);
  }

  function measure() {
    const scroll = window.scrollY;
    const rect = hero.getBoundingClientRect();
    const bottom = contact.getBoundingClientRect();
    heroRect = { top: rect.top + scroll, height: rect.height };
    contactRect = { top: bottom.top + scroll, height: bottom.height };
    folioRects = scopes.map(scope => {
      const item = scope.getBoundingClientRect();
      return {
        scope,
        visual: scope.querySelector('.scope-visual'),
        media: scope.querySelector('.scope-media > .study'),
        top: item.top + scroll,
        height: item.height
      };
    });
  }

  function renderScopes() {
    const stacked = !paperMotion();
    document.documentElement.classList.toggle('archive-static', stacked);
    controls.setAttribute('aria-orientation', 'horizontal');
    scopes.forEach(scope => {
      const active = scope.dataset.workScope === selected;
      scope.hidden = !stacked && !active;
      scope.classList.toggle('is-active', active);
      scope.setAttribute('role', stacked ? 'article' : 'tabpanel');
      scope.setAttribute('aria-labelledby', stacked ? `heading-${scope.dataset.workScope}` : `tab-${scope.dataset.workScope}`);
    });
    measure();
  }

  function selectScope(key, animate = true) {
    if (!descriptions[key]) return;
    const changed = selected !== key;
    selected = key;
    clearTimeout(turnTimer);
    buttons.forEach(button => {
      const active = button.dataset.scope === key;
      button.classList.toggle('is-selected', active);
      if (button.classList.contains('folder-tab')) {
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      } else button.setAttribute('aria-pressed', String(active));
    });
    sheets.forEach(sheet => {
      sheet.element.classList.toggle('is-selected', sheet.key === key);
      sheet.element.style.zIndex = sheet.key === key ? '4' : sheet.key === 'activations' ? '1' : '2';
      sheet.from = { ...sheet.current, y: sheet.current.y + sheet.lastLift };
      sheet.target = { ...(animate ? opened[key][sheet.key] : resting[sheet.key]) };
    });
    const info = descriptions[key];
    document.querySelector('.selected-number').textContent = `FILE ${info.number}`;
    document.querySelector('.selected-title').textContent = info.title;
    document.querySelector('.selected-summary').textContent = info.summary;
    scopes.forEach(scope => scope.classList.remove('is-turning'));
    renderScopes();
    if (changed && animate && paperMotion()) {
      phase = 0;
      movingSheet = key;
      const active = scopes.find(scope => scope.dataset.workScope === key);
      active.classList.add('is-turning');
      turnTimer = setTimeout(() => active.classList.remove('is-turning'), 680);
    } else {
      phase = 1;
      movingSheet = null;
      sheets.forEach(sheet => {
        sheet.current = { ...sheet.target };
        writeSheet(sheet);
      });
    }
    stage.dataset.selected = key;
  }

  function resetParallax() {
    smoothTravel = 0;
    smoothContact = 0;
    hull.style.setProperty('--hull-y', '0px');
    hull.style.setProperty('--hull-r', '0deg');
    back.style.setProperty('--back-y', '0px');
    sleeve.style.setProperty('--sleeve-y', '0px');
    ground.style.setProperty('--ground-y', '0px');
    contactPaper.style.setProperty('--contact-y', '0px');
    folioRects.forEach(({ visual, media }) => {
      visual.style.setProperty('--folio-y', '0px');
      media.style.setProperty('--media-y', '0px');
    });
  }

  function frame(state) {
    if (!live) return;
    if (!paperMotion()) return;
    const dt = clamp(state.dt || .016, .001, .05);
    if (phase < 1) {
      phase = Math.min(1, phase + dt / .88);
      const t = smooth(phase);
      const lift = Math.sin(phase * Math.PI) * -39;
      sheets.forEach(sheet => {
        ['x','y','r'].forEach(property => {
          sheet.current[property] = sheet.from[property] + (sheet.target[property] - sheet.from[property]) * t;
        });
        writeSheet(sheet, sheet.key === movingSheet ? lift : -Math.sin(phase * Math.PI) * 5);
      });
      if (phase === 1) movingSheet = null;
    }
    const travel = clamp((state.scrollY - heroRect.top) / heroRect.height, 0, 1);
    const follow = 1 - Math.exp(-dt * 9);
    smoothTravel += (travel - smoothTravel) * follow;
    hull.style.setProperty('--hull-y', `${(-smoothTravel * 59).toFixed(3)}px`);
    hull.style.setProperty('--hull-r', `${(-smoothTravel * 1.1).toFixed(3)}deg`);
    back.style.setProperty('--back-y', `${(smoothTravel * 26).toFixed(3)}px`);
    sleeve.style.setProperty('--sleeve-y', `${(-smoothTravel * 12).toFixed(3)}px`);
    ground.style.setProperty('--ground-y', `${(smoothTravel * 15).toFixed(3)}px`);
    folioRects.forEach(({ scope, visual, media, top, height }) => {
      if (scope.hidden || !height) return;
      const progress = clamp((state.scrollY + state.height - top) / (state.height + height));
      visual.style.setProperty('--folio-y', `${((progress - .5) * -34).toFixed(3)}px`);
      media.style.setProperty('--media-y', `${((progress - .5) * 54).toFixed(3)}px`);
    });
    const contactProgress = clamp((state.scrollY + state.height - contactRect.top) / (state.height + contactRect.height));
    smoothContact += (contactProgress - smoothContact) * follow;
    contactPaper.style.setProperty('--contact-y', `${((smoothContact - .5) * -75).toFixed(3)}px`);
  }

  function preferenceChanged() {
    clearTimeout(turnTimer);
    phase = 1;
    movingSheet = null;
    sheets.forEach(sheet => {
      sheet.current = { ...sheet.target };
      writeSheet(sheet);
    });
    scopes.forEach(scope => scope.classList.remove('is-turning'));
    renderScopes();
    resetParallax();
  }

  scopes.forEach(scope => { scope.querySelector('h3').id = `heading-${scope.dataset.workScope}`; });
  buttons.forEach(button => button.addEventListener('click', () => {
    selectScope(button.dataset.scope);
    if (narrow.matches && button.closest('.work-index')) {
      document.getElementById(`scope-${button.dataset.scope}`).scrollIntoView({ behavior: motionEnabled() ? 'smooth' : 'auto', block: 'start' });
    }
  }));
  controls.addEventListener('keydown', event => {
    const current = event.target.closest('.folder-tab');
    if (!current) return;
    let index = tabs.indexOf(current);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') index = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') index = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = tabs.length - 1;
    else return;
    event.preventDefault();
    selectScope(tabs[index].dataset.scope);
    tabs[index].focus();
  });

  function connect() {
    live = true;
    unsubscribe = atelier?.onFrame(frame) || null;
    addEventListener('resize', measure);
    addEventListener('atelier:motion', preferenceChanged);
    narrow.addEventListener('change', preferenceChanged);
    reduced.addEventListener('change', preferenceChanged);
    fine.addEventListener('change', preferenceChanged);
  }
  function disconnect() {
    live = false;
    clearTimeout(turnTimer);
    unsubscribe?.();
    unsubscribe = null;
    removeEventListener('resize', measure);
    removeEventListener('atelier:motion', preferenceChanged);
    narrow.removeEventListener('change', preferenceChanged);
    reduced.removeEventListener('change', preferenceChanged);
    fine.removeEventListener('change', preferenceChanged);
  }
  addEventListener('pagehide', disconnect);
  addEventListener('pageshow', event => {
    if (event.persisted) {
      measure();
      connect();
    }
  });
  document.fonts?.ready.then(measure);
  selectScope('content', false);
  connect();
  window.__siteReady = true;
})();
