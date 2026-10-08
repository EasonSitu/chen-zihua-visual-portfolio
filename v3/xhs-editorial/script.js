/* The shared core owns language, dialogs, audio, pointer and frame scheduling. */
(() => {
  'use strict';

  const demo = window.PortfolioDemo;
  if (!demo) return;

  const notes = Array.from(document.querySelectorAll('.paper-note'));
  const room = document.querySelector('.room-plate');
  const light = document.querySelector('.window-light');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touch = window.matchMedia('(hover: none), (pointer: coarse)');
  const labels = {
    xhs: {
      en: 'Read the Xiaohongshu content and operations case',
      zh: '閱讀小紅書內容及營運案例',
      alt: { en: 'Editorial food and product still life, a visual study for Xiaohongshu content', zh: '餐飲及產品靜物，作為小紅書內容的視覺研究' }
    },
    creators: {
      en: 'Read the mainland and overseas creator partnerships case',
      zh: '閱讀內地及海外創作者合作案例',
      alt: { en: 'Anonymous creative briefs and contact sheets, a visual study for creator partnerships', zh: '匿名創意提案及聯絡素材，作為創作者合作的視覺研究' }
    },
    content: {
      en: 'Read the content production and performance case',
      zh: '閱讀內容製作及成效案例',
      alt: { en: 'Product photographs and an editorial storyboard, a visual study for content production', zh: '產品照片及編輯故事板，作為內容製作的視覺研究' }
    }
  };

  let selection = 'xhs';
  let smoothX = 0;
  let smoothY = 0;
  let motion = demo.enabled !== false && !reduced.matches;
  let firstFrame = true;

  function selectNote(id) {
    if (!labels[id]) return;
    selection = id;
    document.body.dataset.selected = id;
    notes.forEach((note) => {
      const selected = note.dataset.case === id;
      note.classList.toggle('is-selected', selected);
      note.querySelector('.paper-cover').setAttribute('aria-current', selected ? 'true' : 'false');
    });
  }

  function updateLabels(lang) {
    const key = lang === 'zh' ? 'zh' : 'en';
    notes.forEach((note) => {
      note.querySelector('.paper-cover').setAttribute('aria-label', labels[note.dataset.case][key]);
      note.querySelector('img').alt = labels[note.dataset.case].alt[key];
    });
    document.querySelector('.work-deck').setAttribute('aria-label', key === 'zh' ? '精選營銷作品' : 'Selected marketing work');
    document.querySelector('.main-nav').setAttribute('aria-label', key === 'zh' ? '主要導覽' : 'Main navigation');
  }

  function resetDepth() {
    smoothX = 0;
    smoothY = 0;
    room.style.setProperty('--room-x', '0px');
    room.style.setProperty('--room-y', '0px');
    light.style.setProperty('--light-x', '0px');
    light.style.setProperty('--light-y', '0px');
    notes.forEach((note) => {
      note.style.setProperty('--paper-x', '0px');
      note.style.setProperty('--paper-y', '0px');
      note.style.setProperty('--paper-tilt', '0deg');
    });
  }

  function updateMotion(enabled) {
    motion = enabled && !reduced.matches;
    document.body.classList.toggle('is-still', !motion);
    if (!motion || touch.matches) resetDepth();
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-case]');
    if (trigger) selectNote(trigger.dataset.openCase);
  }, true);

  window.addEventListener('demo:language', (event) => updateLabels(event.detail.lang));
  window.addEventListener('demo:motion', (event) => updateMotion(event.detail.enabled));
  reduced.addEventListener('change', () => updateMotion(demo.enabled !== false));
  touch.addEventListener('change', resetDepth);

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        reveal.unobserve(entry.target);
      });
    }, { threshold: .08 });
    notes.forEach((note) => reveal.observe(note));
  } else {
    notes.forEach((note) => note.classList.add('is-revealed'));
  }

  demo.onFrame((state) => {
    if (firstFrame) {
      document.body.dataset.demoReady = 'true';
      firstFrame = false;
    }
    if (!motion || state.enabled === false || touch.matches || state.width < 769) return;

    const pointerX = state.pointer.live ? Math.max(-1, Math.min(1, state.pointer.nx)) : 0;
    const pointerY = state.pointer.live ? Math.max(-1, Math.min(1, state.pointer.ny)) : 0;
    const easing = 1 - Math.exp(-8 * state.dt);
    smoothX += (pointerX - smoothX) * easing;
    smoothY += (pointerY - smoothY) * easing;
    const seconds = state.time * .001;

    room.style.setProperty('--room-x', `${(-smoothX * 5).toFixed(2)}px`);
    room.style.setProperty('--room-y', `${(-smoothY * 3).toFixed(2)}px`);
    light.style.setProperty('--light-x', `${(Math.sin(seconds * .11) * 23 + smoothX * 8).toFixed(2)}px`);
    light.style.setProperty('--light-y', `${(Math.cos(seconds * .09) * 15 + smoothY * 4).toFixed(2)}px`);

    notes.forEach((note, index) => {
      const depth = note.dataset.case === selection ? 1 : .6;
      const drift = Math.sin(seconds * .21 + index * 1.9) * 1.4;
      note.style.setProperty('--paper-x', `${(smoothX * (4 + index) * depth).toFixed(2)}px`);
      note.style.setProperty('--paper-y', `${(smoothY * 3 * depth + drift).toFixed(2)}px`);
      note.style.setProperty('--paper-tilt', `${(smoothX * 1.2 * depth).toFixed(2)}deg`);
    });
  });

  selectNote('xhs');
  updateLabels(demo.lang);
  updateMotion(demo.enabled !== false);
  document.body.dataset.demoReady = 'true';
})();
