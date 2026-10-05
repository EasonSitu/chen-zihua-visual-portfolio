(() => {
  'use strict';
  const atelier = window.Atelier;
  const hero = document.querySelector('.hero');
  const tabs = [...document.querySelectorAll('.scope-tabs [role="tab"]')];
  const panels = [...document.querySelectorAll('.scope[role="tabpanel"]')];
  const apertures = [...document.querySelectorAll('[data-aperture]')];
  const lines = [...document.querySelectorAll('.type-motion')];
  const orbit = document.querySelector('.orbit-drift');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const wide = matchMedia('(min-width:768px)');
  const animations = new Set();
  const studies = {
    content: { portrait:'2', landscape:'6', caption:'An idea, in motion.' },
    kol: { portrait:'8', landscape:'4', caption:'The right fit. The clear brief.' },
    campaigns: { portrait:'7', landscape:'3', caption:'From plan to live activity.' }
  };
  let selected = 'content';
  let hovered = null;
  let scene = 'content';
  let px = 0, py = 0, travel = 0;
  hero.dataset.scene = scene;

  function animate(element, keyframes, options) {
    if (!atelier?.enabled || !element.animate) return;
    const animation = element.animate(keyframes, options);
    animations.add(animation);
    animation.onfinish = animation.oncancel = () => animations.delete(animation);
  }
  function stopAnimations() {
    for (const animation of animations) animation.cancel();
    animations.clear();
  }
  function compose(category) {
    if (!studies[category] || scene === category) return;
    // Invert on the outer layout wrapper; tilt and parallax live on nested layers.
    const before = apertures.map(element => element.getBoundingClientRect());
    stopAnimations();
    scene = category;
    hero.dataset.scene = category;
    apertures.forEach((element, index) => {
      const after = element.getBoundingClientRect();
      const from = before[index];
      const image = element.querySelector('.study');
      image.dataset.texture = studies[category][element.dataset.aperture];
      if (element.dataset.aperture === 'portrait') element.querySelector('figcaption').textContent = studies[category].caption;
      if (!after.width || !after.height) return;
      animate(element, [
        { transform:`translate(${from.left-after.left}px,${from.top-after.top}px) scale(${from.width/after.width},${from.height/after.height})` },
        { transform:'translate(0,0) scale(1,1)' }
      ], {duration:800,delay:index*55,easing:'cubic-bezier(.22,.75,.1,1)',fill:'backwards'});
      animate(image, [
        {clipPath:'inset(0 0 100% 0)'},
        {clipPath:'inset(0 0 0 0)'}
      ], {duration:760,delay:90+index*75,easing:'cubic-bezier(.22,.75,.1,1)',fill:'backwards'});
    });
  }
  function select(category, focus = false) {
    if (!studies[category]) return;
    const old = selected;
    selected = category;
    hero.dataset.category = category;
    tabs.forEach(tab => {
      const active = tab.dataset.category === category;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (focus && active) tab.focus();
    });
    panels.forEach(panel => {panel.hidden = panel.id !== `scope-${category}`;});
    compose(category);
    if (old !== category) {
      const panel = panels.find(panel => !panel.hidden);
      animate(panel.querySelector('.scope-heading'), [
        {clipPath:'inset(0 0 100% 0)',transform:'translateY(12px)'},
        {clipPath:'inset(0 0 0 0)',transform:'translateY(0)'}
      ], {duration:620,easing:'cubic-bezier(.22,.75,.1,1)'});
      lines.forEach((line,index) => animate(line, [
        {letterSpacing:'-.032em'},
        {letterSpacing:index ? '-.024em' : '-.038em',offset:.4},
        {letterSpacing:'-.032em'}
      ], {duration:920,easing:'cubic-bezier(.22,.75,.1,1)'}));
    }
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => select(tab.dataset.category));
    tab.addEventListener('pointerenter', () => {
      if (!fine.matches || !atelier?.enabled) return;
      hovered = tab;
      compose(tab.dataset.category);
    });
    tab.addEventListener('pointerleave', () => {
      if (hovered === tab) hovered = null;
      compose(selected);
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index+1)%tabs.length;
      if (event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length-1;
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[next].dataset.category, true);
    });
  });
  function clearTravel() {
    px = py = travel = 0;
    lines.forEach(line => {line.style.transform='';});
    apertures.forEach(el => {el.querySelector('.media-parallax').style.transform='';});
    orbit.style.transform='';
  }
  const unsubscribe = atelier?.onFrame(state => {
    if (!state.enabled) {clearTravel();return;}
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < -100 || rect.top > state.height+100) return;
    const damp = 1-Math.exp(-6.5*state.dt);
    const pointerOn = state.pointer.live && fine.matches;
    px += ((pointerOn ? state.pointer.nx : 0)-px)*damp;
    py += ((pointerOn ? state.pointer.ny : 0)-py)*damp;
    const target = atelier.clamp(-rect.top/Math.max(1,rect.height),-.2,1);
    travel += (target-travel)*damp;
    const scale = wide.matches ? 1 : .36;
    lines[0].style.transform=`translate3d(${(-travel*28+px*4)*scale}px,${travel*-9*scale}px,0)`;
    lines[1].style.transform=`translate3d(${(travel*34-px*6)*scale}px,${travel*9*scale}px,0)`;
    apertures[0].querySelector('.media-parallax').style.transform=`translate3d(${px*14*scale}px,${(py*10-travel*55)*scale}px,0)`;
    apertures[1].querySelector('.media-parallax').style.transform=`translate3d(${-px*21*scale}px,${(-py*14+travel*43)*scale}px,0)`;
    orbit.style.transform=`translate3d(${-px*9*scale}px,${(py*6+travel*75)*scale}px,0) rotate(${travel*9}deg)`;
    hero.dataset.parallax = travel.toFixed(3);
  });
  addEventListener('atelier:motion', event => {
    stopAnimations();
    if (!event.detail) {hovered=null;compose(selected);clearTravel();}
  });
  // The shared scheduler owns visibility suspension and scroll timing.
  addEventListener('pagehide', () => {stopAnimations();clearTravel();});
  addEventListener('pageshow', () => {compose(selected);});
  window.__siteReady = true;
})();
