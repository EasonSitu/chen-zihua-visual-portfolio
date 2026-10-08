(() => {
  'use strict';

  const demo = window.PortfolioDemo;
  const room = document.querySelector('.room-plate');
  const exhibits = [...document.querySelectorAll('.exhibit')];
  const selectors = [...document.querySelectorAll('[data-select-case]')];
  const mobile = window.matchMedia('(max-width: 767px)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const water = document.querySelector('.water-shimmer');
  const wall = document.querySelector('.wall-caustics');
  const waterContext = water.getContext('2d');
  const wallContext = wall.getContext('2d');
  let selected = 'xhs';
  let pointerX = 0;
  let pointerY = 0;
  let lastLightFrame = -Infinity;
  let lightWasMoving = true;

  const names = {
    en: { xhs: 'Xiaohongshu', creators: 'Creator Partnerships', content: 'Content Performance' },
    zh: { xhs: '小紅書', creators: '創作者合作', content: '內容表現' }
  };
  const language = () => demo?.lang === 'zh' ? 'zh' : 'en';

  function updateAccessibility() {
    const lang = language();
    exhibits.forEach(exhibit => {
      const mount = exhibit.querySelector('.work-mount');
      const active = exhibit.dataset.case === selected;
      mount.setAttribute('aria-pressed', String(active));
      mount.setAttribute('aria-label', lang === 'zh'
        ? `${active ? '查看' : '選擇'}${names.zh[exhibit.dataset.case]}${active ? '案例' : ''}`
        : `${active ? 'Open' : 'Select'} ${names.en[exhibit.dataset.case]}${active ? ' case' : ''}`);
    });
    document.querySelector('.work-index').setAttribute('aria-label', lang === 'zh' ? '選擇作品' : 'Select a work');
    document.querySelector('.gallery-space').setAttribute('aria-label', lang === 'zh' ? '展廊中的精選作品' : 'Selected works in the gallery');
  }

  function selectCase(id) {
    if (!names.en[id]) return;
    selected = id;
    document.body.dataset.selected = id;
    const order = [id, ...['xhs', 'creators', 'content'].filter(caseId => caseId !== id)];
    const slots = ['front', 'near', 'far'];
    exhibits.forEach(exhibit => {
      const mount = exhibit.querySelector('.work-mount');
      exhibit.dataset.slot = slots[order.indexOf(exhibit.dataset.case)];
      if (exhibit.dataset.case === id) mount.dataset.openCase = id;
      else delete mount.dataset.openCase;
    });
    selectors.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.selectCase === id)));
    updateAccessibility();
  }

  selectors.forEach(button => button.addEventListener('click', () => selectCase(button.dataset.selectCase)));
  exhibits.forEach(exhibit => {
    exhibit.querySelector('.work-mount').addEventListener('click', event => {
      if (exhibit.dataset.case !== selected) {
        // The first click brings the mount forward. A second click opens its case.
        // Stop this selection click reaching the shared delegated case handler.
        event.stopPropagation();
        selectCase(exhibit.dataset.case);
      }
    });
  });
  window.addEventListener('demo:language', updateAccessibility);

  // Small cached canvas layers refract light over the architectural plate.
  // Animation belongs to the shared scheduler; the room image is never a full UI.
  water.width = 640;
  water.height = 220;
  wall.width = 480;
  wall.height = 260;

  function drawWater(seconds) {
    if (!waterContext || !wallContext) return;
    const ctx = waterContext;
    ctx.clearRect(0, 0, water.width, water.height);
    for (let row = 0; row < 22; row += 1) {
      const depth = row / 22;
      const y = 20 + Math.pow(depth, 1.24) * 194;
      ctx.beginPath();
      for (let x = 0; x <= 660; x += 8) {
        const ripplingY = y
          + Math.sin(x * (.019 + depth * .018) + seconds * .23 + row * 1.61) * (2.6 + depth * 3.6)
          + Math.sin(x * .052 - seconds * .18 + row * 2.73) * 1.9;
        if (x === 0) ctx.moveTo(x, ripplingY);
        else ctx.lineTo(x, ripplingY);
      }
      ctx.strokeStyle = `rgba(255,255,245,${.18 + (Math.sin(row * 2.77 + seconds * .12) + 1) * .15})`;
      ctx.lineWidth = .6 + depth * 1.2;
      ctx.stroke();
    }

    const light = wallContext;
    light.clearRect(0, 0, wall.width, wall.height);
    for (let band = 0; band < 10; band += 1) {
      light.beginPath();
      for (let x = -30; x < 520; x += 8) {
        const y = band * 33 - 16
          + Math.sin(x * .018 + band * 1.2 + seconds * .115) * 18
          + Math.sin(x * .045 - seconds * .16 + band * 2.7) * 8;
        if (x === -30) light.moveTo(x, y);
        else light.lineTo(x, y);
      }
      light.strokeStyle = `rgba(255,255,245,${.19 + (Math.sin(band * 1.79) + 1) * .2})`;
      light.lineWidth = 2.5 + (Math.sin(band * 2.2) + 1) * 3;
      light.stroke();
    }
  }

  function syncMotionState(enabled) {
    const moving = enabled && !reduceMotion.matches;
    document.body.dataset.motion = moving ? 'on' : 'off';
    if (!moving) {
      pointerX = 0;
      pointerY = 0;
      room.style.transform = 'translate3d(0,0,0) scale(1.016)';
      exhibits.forEach(exhibit => {
        const front = exhibit.dataset.slot === 'front';
        exhibit.querySelector('.work-mount').style.transform = `rotateY(${front ? -.8 : -2.2}deg)`;
        exhibit.querySelector('.floor-reflection').style.transform = 'skewX(-3deg)';
      });
      drawWater(0);
      lightWasMoving = false;
    }
  }
  window.addEventListener('demo:motion', event => syncMotionState(event.detail?.enabled !== false));
  window.addEventListener('demo:language', () => syncMotionState(demo?.enabled !== false));
  reduceMotion.addEventListener('change', () => syncMotionState(demo?.enabled !== false));

  drawWater(0);
  selectCase('xhs');
  syncMotionState(demo?.enabled !== false);

  if (!demo?.onFrame) {
    document.body.dataset.demoReady = 'false';
    console.warn('C2 requires the shared PortfolioDemo scheduler.');
    return;
  }

  demo.onFrame(state => {
    const moving = state.enabled && !reduceMotion.matches;
    const pointerEnabled = moving && !coarse.matches && !mobile.matches;
    const targetX = pointerEnabled ? state.pointer.nx : 0;
    const targetY = pointerEnabled ? state.pointer.ny : 0;
    const ease = Math.min(1, state.dt * 4);
    pointerX += (targetX - pointerX) * ease;
    pointerY += (targetY - pointerY) * ease;
    const seconds = state.time / 1000;
    const idle = moving && !coarse.matches ? 1 : 0;
    room.style.transform = `translate3d(${pointerX * -3.6}px,${pointerY * -2.4}px,0) scale(1.016)`;

    exhibits.forEach((exhibit, index) => {
      const front = exhibit.dataset.slot === 'front';
      const depth = front ? 1 : exhibit.dataset.slot === 'near' ? .54 : .32;
      const phase = index * 2.13;
      const driftX = Math.sin(seconds * .13 + phase) * 1.9 * idle;
      const driftY = Math.sin(seconds * .17 + phase + .3) * .85 * idle;
      const x = pointerX * 8.3 * depth + driftX;
      const y = pointerY * 4.3 * depth + driftY;
      const yaw = (front ? -.8 : -2.2) + pointerX * 1.05 * depth + Math.sin(seconds * .09 + phase) * .22 * idle;
      const pitch = pointerY * -.46 * depth;
      const mount = exhibit.querySelector('.work-mount');
      mount.style.transform = `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,${(depth * 6).toFixed(2)}px) rotateY(${yaw.toFixed(3)}deg) rotateX(${pitch.toFixed(3)}deg)`;
      exhibit.querySelector('.floor-reflection').style.transform = `translate3d(${(x * .8).toFixed(3)}px,0,0) skewX(-3deg)`;
    });

    if (moving && state.time - lastLightFrame > 60) {
      drawWater(seconds);
      lastLightFrame = state.time;
      lightWasMoving = true;
    } else if (!moving && lightWasMoving) {
      drawWater(0);
      lightWasMoving = false;
    }
  });
  document.body.dataset.demoReady = 'true';
})();
