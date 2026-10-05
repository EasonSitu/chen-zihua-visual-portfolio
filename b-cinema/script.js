(() => {
  'use strict';
  const lab = window.ChenLab;
  const scene = document.querySelector('.cinema');
  const screen = document.querySelector('.screen');
  const title = document.querySelector('.film-title');
  const word = document.querySelector('.chapter-word');
  const aperture = document.querySelector('.aperture');
  const visual = document.querySelector('.visual-plane');
  const evidence = document.querySelector('.evidence-surface');
  const scopePanel = document.querySelector('.scope-panel');
  const heading = document.querySelector('#chapter-title');
  const scope = document.querySelector('#chapter-scope');
  const link = document.querySelector('#chapter-link');
  const format = document.querySelector('#format-label');
  const announcement = document.querySelector('.chapter-state');
  const buttons = [...document.querySelectorAll('[data-chapter]')];
  const chapters = [
    { title: 'Content production.', word: 'CONTENT', scope: 'Concepts, scripts, filming, editing and copywriting. 500+ content pieces, almost entirely individually handled.', texture: '4', link: '#content-scope', format: 'WIDESCREEN / CONTENT', progress: .19 },
    { title: 'KOL collaboration.', word: 'PEOPLE', scope: 'Creator sourcing, quotations, briefs, shoots, review and reporting. 300+ collaborations, almost entirely individually handled.', texture: '5', link: '#creator-scope', format: 'PORTRAIT / CREATORS', progress: .51 },
    { title: 'Offline activations.', word: 'IN THE ROOM', scope: 'Support for 10+ activations: internal, agency and vendor coordination, budgets and approval follow-up.', texture: '6', link: '#activation-scope', format: 'EVIDENCE / SUPPORT', progress: .88 }
  ];
  let active = -1;
  let staticChapter = -1;
  let selecting = false;
  let selectTimer;
  const clamp = lab ? lab.clamp : (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

  function setChapter(index, announce = false) {
    if (index === active) return;
    active = index;
    screen.dataset.chapter = String(index);
    buttons.forEach((button, n) => button.setAttribute('aria-pressed', String(n === index)));
    if (index < 0) {
      heading.textContent = 'A campaign takes shape.';
      scope.textContent = 'Brand stories, content production and creator coordination, carried through to launch.';
      link.href = '#work';
      link.firstChild.textContent = 'Read work scopes ';
      format.textContent = 'WIDESCREEN / 2.39:1';
      visual.dataset.texture = '4';
      aperture.setAttribute('aria-label', 'Abstract visual study, opening in a widescreen format');
      evidence.setAttribute('aria-hidden', 'true');
      return;
    }
    const chapter = chapters[index];
    heading.textContent = chapter.title;
    scope.textContent = chapter.scope;
    link.href = chapter.link;
    link.firstChild.textContent = 'Read this scope ';
    word.textContent = chapter.word;
    format.textContent = chapter.format;
    visual.dataset.texture = chapter.texture;
    aperture.setAttribute('aria-label', index === 2 ? 'Evidence of offline activation support' : `Abstract visual study in ${index === 1 ? 'portrait' : 'widescreen'} format`);
    evidence.setAttribute('aria-hidden', String(index !== 2));
    if (announce) announcement.textContent = `${chapter.title} ${chapter.scope}`;
  }

  function resetMotion() {
    [title, word, aperture, visual, evidence, scopePanel, heading].forEach(el => el.removeAttribute('style'));
  }

  function render() {
    if (!lab || !lab.motionEnabled) {
      resetMotion();
      setChapter(staticChapter);
      return;
    }
    const p = lab.progress(scene);
    if (!selecting) setChapter(p < .1 ? -1 : p < .34 ? 0 : p < .7 ? 1 : 2);
    const mobile = innerWidth < 768;
    const width = screen.clientWidth;
    const height = screen.clientHeight;
    const portrait = ease((p - .27) / .19);
    const opening = ease(p / .23);
    const support = ease((p - .65) / .2);
    let x, y, w, h, panelTop, panelWidth;
    if (mobile) {
      const initialW = width * .9;
      x = mix(width * .05, width * .48, portrait);
      y = mix(height * .34, height * .255, portrait);
      w = mix(initialW, width * .47, portrait);
      h = mix(initialW / 2.39, height * .39, portrait);
      x = mix(x, width * .05, support);
      y = mix(y, height * .365, support);
      w = mix(w, initialW, support);
      h = mix(h, height * .4, support);
      panelTop = mix(height * .6, height * .64, portrait);
      panelTop = mix(panelTop, height * .175, support);
      panelWidth = width * .9;
    } else {
      const initialW = Math.min(width * .76, height * (height < 760 ? .425 : .48) * 2.39);
      x = mix(width * .96 - initialW, width * .6, portrait);
      y = mix(height * .29, height * .185, portrait);
      w = mix(initialW, width * .29, portrait);
      h = mix(initialW / 2.39, height * .635, portrait);
      x = mix(x, width * .43, support);
      y = mix(y, height * .265, support);
      w = mix(w, width * .53, support);
      h = mix(h, height * .455, support);
      panelTop = mix(height - 225, height * .49, opening);
      panelWidth = width * .32;
    }
    aperture.style.left = `${x.toFixed(2)}px`;
    aperture.style.top = `${y.toFixed(2)}px`;
    aperture.style.width = `${w.toFixed(2)}px`;
    aperture.style.height = `${h.toFixed(2)}px`;
    aperture.style.transform = `translate3d(0,${(-5 * Math.sin(p * Math.PI)).toFixed(2)}px,0)`;
    title.style.transform = `translate3d(0,${mix(0, mobile ? -22 : -25, opening).toFixed(2)}px,0) scale(${mix(1, mobile ? .57 : .42, opening).toFixed(4)})`;
    title.style.clipPath = `inset(0 0 ${mix(0, 51, support).toFixed(2)}% 0)`;
    word.style.opacity = String(mix(0, .7, opening));
    word.style.transform = `translate3d(${mix(0, mobile ? -8 : -28, portrait).toFixed(2)}px,${mix(15, -10, support).toFixed(2)}px,0)`;
    visual.style.transform = `scale(${mix(1.04, 1.18, portrait).toFixed(4)}) translate3d(${mix(0, -2.8, portrait).toFixed(2)}%,${mix(1.8, -1.8, p).toFixed(2)}%,0)`;
    scopePanel.style.top = `${panelTop.toFixed(2)}px`;
    scopePanel.style.width = `${panelWidth.toFixed(2)}px`;
    heading.style.fontSize = `${mobile ? mix(22, 25, opening) : mix(22, Math.min(46, width * .034), opening)}px`;
    evidence.style.transform = `translate3d(0,${mix(106, 0, support).toFixed(2)}%,0)`;
    evidence.style.opacity = String(support);
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      staticChapter = index;
      setChapter(index, true);
      if (!lab || !lab.motionEnabled) { render(); return; }
      selecting = true;
      clearTimeout(selectTimer);
      const top = scrollY + scene.getBoundingClientRect().top;
      const travel = Math.max(1, scene.offsetHeight - innerHeight);
      window.scrollTo({ top: top + travel * chapters[index].progress, behavior: 'smooth' });
      render();
      selectTimer = setTimeout(() => { selecting = false; render(); }, 950);
    });
  });
  window.addEventListener('chen:motionchange', () => {
    selecting = false;
    clearTimeout(selectTimer);
    staticChapter = active;
    render();
  });
  let unsubscribe = lab ? lab.onScroll(render) : null;
  window.addEventListener('pagehide', () => { clearTimeout(selectTimer); if (unsubscribe) unsubscribe(); unsubscribe = null; });
  window.addEventListener('pageshow', event => { if (event.persisted && lab && !unsubscribe) unsubscribe = lab.onScroll(render); });
  render();
  window.__siteReady = true;
})();
