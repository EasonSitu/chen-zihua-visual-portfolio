(() => {
  'use strict';
  const demo = window.PortfolioDemo;
  const xhsCase = demo?.cases.find(entry => entry.id === 'xhs');
  if (xhsCase) xhsCase.image = new URL('../shared/assets/work-c-xhs.png', location.href).href;
  const scrollScene = document.querySelector('[data-scroll-scene]');
  const scene = document.querySelector('.gallery-scene');
  const room = document.querySelector('.far-room');
  const glass = document.querySelector('.middle-glass');
  const light = document.querySelector('.ceiling-light');
  const foreground = document.querySelector('.near-floor');
  const heading = document.querySelector('.gallery-intro');
  const exhibits = [...document.querySelectorAll('.exhibit')];
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const touchLayout = matchMedia('(max-width:900px), (pointer:coarse)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const water = document.querySelector('.water-light');
  const lightContext = light.getContext('2d');
  const waterContext = water.getContext('2d');
  const names = {en:{xhs:'Xiaohongshu',creators:'Creator partnerships',content:'Content performance'},zh:{xhs:'小紅書',creators:'創作者合作',content:'內容表現'}};
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  let progress = 0;
  let selected = 'xhs';
  let pointerX = 0;
  let pointerY = 0;
  let lastLight = -Infinity;
  let previousEnabled = true;
  light.width = 900;
  light.height = 330;
  water.width = 480;
  water.height = 290;

  function setSelection(id) {
    if (!names.en[id]) return;
    selected = id;
    document.body.dataset.selected = id;
    exhibits.forEach(exhibit => exhibit.classList.toggle('is-selected', exhibit.dataset.case === id));
    chapters.forEach(button => {
      if (button.dataset.chapter === id) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }

  function accessibility() {
    const lang = demo?.lang === 'zh' ? 'zh' : 'en';
    exhibits.forEach(exhibit => {
      const id = exhibit.dataset.case;
      exhibit.querySelector('.work-frame').setAttribute('aria-label', lang === 'zh' ? `閱讀${names.zh[id]}故事` : `Open ${names.en[id]} story`);
    });
    document.querySelector('.chapter-nav').setAttribute('aria-label', lang === 'zh' ? '展廊章節' : 'Gallery chapters');
    document.querySelector('.gallery-works').setAttribute('aria-label', lang === 'zh' ? '三個精選故事' : 'Three selected stories');
  }

  chapters.forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.chapter;
    setSelection(id);
    if (touchLayout.matches || reduced.matches) {
      document.querySelector(`#story-${id}`).scrollIntoView({behavior: reduced.matches || !demo?.enabled ? 'instant' : 'smooth', block:'start'});
      return;
    }
    const range = Math.max(0, scrollScene.offsetHeight - scene.offsetHeight);
    window.scrollTo({top:scrollScene.offsetTop + range * Number(button.dataset.targetProgress), behavior:demo?.enabled ? 'smooth' : 'instant'});
  }));
  exhibits.forEach(exhibit => exhibit.querySelector('.work-frame').addEventListener('click', () => setSelection(exhibit.dataset.case)));
  window.addEventListener('demo:language', accessibility);

  // The room is an empty architectural plate. Real HTML mounts move at different
  // rates, using normal document scroll as the camera path. No wheel interception.
  function drawLight(seconds) {
    if (!lightContext || !waterContext) return;
    const ctx = lightContext;
    ctx.clearRect(0, 0, light.width, light.height);
    for (let row = 0; row < 10; row++) {
      ctx.beginPath();
      for (let x = -30; x <= 930; x += 12) {
        const y = row * 38 - 15 + Math.sin(x * .012 + row * 1.14 + seconds * .11) * 21 + Math.sin(x * .033 + row * 2.31 - seconds * .09) * 6;
        if (x === -30) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(255,255,240,${.12 + (Math.sin(row * 2.71) + 1) * .14})`;
      ctx.lineWidth = 3 + (Math.sin(row * 1.93) + 1) * 4;
      ctx.stroke();
    }
    const waterCtx = waterContext;
    waterCtx.clearRect(0, 0, water.width, water.height);
    for (let row = 0; row < 30; row++) {
      const depth = row / 30;
      const y = 13 + Math.pow(depth, 1.22) * 272;
      waterCtx.beginPath();
      for (let x = -10; x < 500; x += 7) {
        const ripple = y + Math.sin(x * (.025 + depth * .025) + row * 1.51 + seconds * .22) * (1.6 + depth * 3.1) + Math.sin(x * .068 - seconds * .18 + row * 2.29) * 1.2;
        if (x === -10) waterCtx.moveTo(x, ripple); else waterCtx.lineTo(x, ripple);
      }
      waterCtx.strokeStyle = `rgba(253,255,234,${.11 + (Math.sin(row * 1.97 + seconds * .09) + 1) * .16})`;
      waterCtx.lineWidth = .5 + depth;
      waterCtx.stroke();
    }
  }

  function render(state) {
    const vertical = touchLayout.matches || reduced.matches;
    const rect = scrollScene.getBoundingClientRect();
    const range = Math.max(1, scrollScene.offsetHeight - scene.offsetHeight);
    progress = vertical ? 0 : clamp(-rect.top / range);
    document.body.dataset.progress = progress.toFixed(4);
    document.body.dataset.phase = vertical ? 'reading' : progress < .32 ? 'arrival' : progress < .73 ? 'partnerships' : 'connection';
    const moving = state.enabled && !reduced.matches && !vertical;
    const p = moving ? progress : 0;
    const rate = 1 - Math.exp(-4 * state.dt);
    pointerX += ((moving && state.pointer.live ? state.pointer.nx : 0) - pointerX) * rate;
    pointerY += ((moving && state.pointer.live ? state.pointer.ny : 0) - pointerY) * rate;
    const vw = state.width / 100;
    const vh = state.height / 100;
    room.style.transform = `translate3d(${-p * 3.8 * vw - pointerX * 2}px,${p * 1.6 * vh - pointerY * 1.5}px,0) scale(${1.02 + p * .055})`;
    glass.style.transform = `translate3d(${-p * 7.4 * vw + pointerX * 3}px,${-p * 3 * vh}px,0) scale(${1 + p * .105})`;
    light.style.transform = `translate3d(${-p * 2.5 * vw}px,${p * 1.2 * vh}px,0) scale(${1 + p * .025})`;
    heading.style.transform = `translate3d(${-p * .6 * vw}px,${-p * 1.5 * vh}px,0) scale(${1 - p * .045})`;
    foreground.style.transform = `translate3d(${-p * 17 * vw}px,${p * 14 * vh}px,0) skewY(-13deg) scale(${1 + p * .16})`;
    water.style.transform = `translate3d(${-p * 8.5 * vw}px,${p * 7 * vh}px,0) scale(${1 + p * .18})`;
    const paths = [
      {x:-19.5,y:-4,scale:.28,depth:8.5},
      {x:-13,y:-10,scale:.52,depth:5},
      {x:-8,y:-8,scale:.28,depth:3.3}
    ];
    exhibits.forEach((exhibit, i) => {
      const path = paths[i];
      const eased = p * p * (3 - 2 * p);
      const x = path.x * vw * eased + pointerX * path.depth;
      const y = path.y * vh * eased + pointerY * path.depth * .38;
      const scale = 1 + path.scale * eased;
      exhibit.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
    });
    if (!vertical) setSelection(progress < .32 ? 'xhs' : progress < .73 ? 'creators' : 'content');
    if (moving && state.time - lastLight > 65) {
      drawLight(state.time / 1000);
      lastLight = state.time;
    } else if (!moving && previousEnabled) drawLight(0);
    previousEnabled = moving;
  }

  accessibility();
  drawLight(0);
  setSelection('xhs');
  if (demo?.onFrame) {
    demo.onFrame(render);
    document.body.dataset.demoReady = 'true';
  } else {
    document.body.dataset.demoReady = 'false';
    console.warn('The light gallery requires the shared PortfolioDemo scheduler.');
  }
})();
