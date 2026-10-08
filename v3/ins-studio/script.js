(() => {
  'use strict';

  const demo = window.PortfolioDemo;
  if (!demo) return;

  const body = document.body;
  const mount = document.querySelector('.studio-mount');
  const plane = document.querySelector('.studio-photo-plane');
  const mainImage = document.querySelector('.studio-main-image');
  const title = document.querySelector('.studio-case-title');
  const subtitle = document.querySelector('.studio-case-subtitle');
  const number = document.querySelector('.studio-caption-number');
  const count = document.querySelector('.studio-sheet-count');
  const metric = document.querySelector('.studio-metric');
  const metricLabel = document.querySelector('.studio-metric-label');
  const note = document.querySelector('.studio-note-copy');
  const selectors = [...document.querySelectorAll('[data-select]')];
  const caseLinks = [...document.querySelectorAll('.studio-feature [data-open-case], .studio-read')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const studies = {
    xhs: {
      number: '01', metric: '1M+', image: '../shared/assets/work-xhs.png',
      en: {title: 'Xiaohongshu', subtitle: 'Content & operations', metric: 'views on one Xiaohongshu post', note: 'From planning and filming to publishing and day-to-day operations.', alt: 'Visual study for Xiaohongshu content and operations', open: 'Read Xiaohongshu content and operations case'},
      zh: {title: '小紅書', subtitle: '內容策劃與運營', metric: '單篇小紅書內容瀏覽量', note: '從內容策劃、拍攝製作，到發布及日常運營。', alt: '小紅書內容策劃及運營視覺概念', open: '閱讀小紅書內容策劃及運營項目'}
    },
    creators: {
      number: '02', metric: '1,000+', image: '../shared/assets/work-creators.png',
      en: {title: 'Creator partnerships', subtitle: 'Mainland & overseas', metric: 'collaboration occasions overall', note: 'Creator sourcing, briefing and coordination across mainland and overseas partnerships.', alt: 'Visual study for mainland and overseas creator partnerships', open: 'Read creator partnerships case'},
      zh: {title: '創作者合作', subtitle: '內地及海外', metric: '整體創作者合作次數', note: '負責創作者篩選、簡報及協調，涵蓋內地與海外合作。', alt: '內地及海外創作者合作視覺概念', open: '閱讀創作者合作項目'}
    },
    content: {
      number: '03', metric: '500+', image: '../shared/assets/work-content.png',
      en: {title: 'Content production', subtitle: 'Planning, shooting & publishing', metric: 'content pieces across platforms', note: 'Hands-on visual and written content. Conversion figures will be added when verified.', alt: 'Visual study for content planning and production', open: 'Read content production case'},
      zh: {title: '內容製作', subtitle: '策劃、拍攝與發布', metric: '跨平台內容製作', note: '親手製作圖像及文字內容。轉化數據待核實後補充。', alt: '內容策劃及製作視覺概念', open: '閱讀內容製作項目'}
    }
  };
  let selected = 'xhs';
  let selectionGeneration = 0;
  let incoming = null;
  let incomingAnimation = null;
  let lastScroll = window.scrollY;
  let scrollDrift = 0;
  let driftX = 0;
  let driftY = 0;

  function language() {
    return demo.lang === 'zh' ? 'zh' : 'en';
  }

  function renderText() {
    const study = studies[selected];
    const copy = study[language()];
    title.textContent = copy.title;
    subtitle.textContent = copy.subtitle;
    number.textContent = study.number;
    count.textContent = `${study.number} / 03`;
    metric.textContent = study.metric;
    metricLabel.textContent = copy.metric;
    note.textContent = copy.note;
    mainImage.alt = copy.alt;
    caseLinks.forEach(link => {
      link.dataset.openCase = selected;
      link.setAttribute('aria-label', copy.open);
    });
    selectors.forEach(button => {
      const active = button.dataset.select === selected;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
      const studyCopy = studies[button.dataset.select][language()];
      button.setAttribute('aria-label', `${language() === 'zh' ? '選擇' : 'Select '}${studyCopy.title}`);
    });
  }

  function clearIncoming() {
    incomingAnimation?.cancel();
    incomingAnimation = null;
    incoming?.remove();
    incoming = null;
  }

  async function selectStudy(id) {
    if (!studies[id] || id === selected) return;
    const generation = ++selectionGeneration;
    selected = id;
    body.dataset.selected = id;
    renderText();
    clearIncoming();
    const image = new Image();
    image.src = new URL(studies[id].image, window.location.href).href;
    image.className = 'studio-incoming-image';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    try { await image.decode(); } catch { /* Keep the source visible if decoding is delayed. */ }
    if (generation !== selectionGeneration) return;
    if (!demo.enabled || reducedMotion.matches || coarsePointer.matches || typeof image.animate !== 'function') {
      mainImage.src = image.src;
      return;
    }
    incoming = image;
    plane.append(image);
    incomingAnimation = image.animate([
      {opacity: 0, transform: 'scale(1.035) translateY(10px)'},
      {opacity: 1, transform: 'scale(1) translateY(0)'}
    ], {duration: 650, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'both'});
    try { await incomingAnimation.finished; } catch { return; }
    if (generation !== selectionGeneration) return;
    mainImage.src = image.src;
    clearIncoming();
  }

  selectors.forEach(button => button.addEventListener('click', () => selectStudy(button.dataset.select)));
  window.addEventListener('demo:language', renderText);
  window.addEventListener('demo:motion', event => {
    const enabled = typeof event.detail?.enabled === 'boolean' ? event.detail.enabled : demo.enabled;
    body.dataset.motion = enabled ? 'on' : 'off';
    if (!enabled && incoming) {
      mainImage.src = new URL(studies[selected].image, window.location.href).href;
      ++selectionGeneration;
      clearIncoming();
    }
  });

  demo.onFrame(state => {
    const currentScroll = window.scrollY;
    const delta = currentScroll - lastScroll;
    lastScroll = currentScroll;
    if (!state.enabled || reducedMotion.matches || coarsePointer.matches || state.width <= 700) {
      body.style.setProperty('--studio-x', '0px');
      body.style.setProperty('--studio-y', '0px');
      body.style.setProperty('--studio-scroll', '0px');
      body.style.setProperty('--studio-rx', '0deg');
      body.style.setProperty('--studio-ry', '0deg');
      return;
    }
    const seconds = state.time / 1000;
    const pointerX = state.pointer.live ? state.pointer.nx : 0;
    const pointerY = state.pointer.live ? state.pointer.ny : 0;
    const targetX = pointerX * 5 + Math.sin(seconds * .19) * 1.8;
    const targetY = pointerY * 3.2 + Math.cos(seconds * .16) * 1.1;
    driftX += (targetX - driftX) * .055;
    driftY += (targetY - driftY) * .055;
    scrollDrift += (Math.max(-8, Math.min(8, delta * -.45)) - scrollDrift) * .09;
    body.style.setProperty('--studio-x', `${driftX.toFixed(3)}px`);
    body.style.setProperty('--studio-y', `${driftY.toFixed(3)}px`);
    body.style.setProperty('--studio-scroll', `${scrollDrift.toFixed(3)}px`);
    body.style.setProperty('--studio-rx', `${(-pointerY * .45).toFixed(3)}deg`);
    body.style.setProperty('--studio-ry', `${(pointerX * .7).toFixed(3)}deg`);
    body.style.setProperty('--studio-light-x', `${(Math.sin(seconds * .13) * 30).toFixed(3)}px`);
    body.style.setProperty('--studio-light-y', `${(Math.cos(seconds * .1) * 18).toFixed(3)}px`);
    mount.dataset.motionFrame = String(Math.round(state.time));
  });

  renderText();
  body.dataset.selected = selected;
  body.dataset.motion = demo.enabled ? 'on' : 'off';
  body.dataset.demoReady = 'true';
})();
