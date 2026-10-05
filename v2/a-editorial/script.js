(() => {
  'use strict';

  const atelier = window.Atelier;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 760px)');
  const coarse = matchMedia('(pointer: coarse)');
  const scopes = [
    { title: 'Content production', number: '01', annotation: 'Concept, script, filming, editing and copy.', summary: 'Turning a brand idea into social content, from the first concept through filming, editing and copywriting.', value: '500+', evidence: 'content pieces', ownership: 'Almost entirely individually handled.', responsibilities: ['Concepts & scripts', 'Filming & editing', 'Copywriting & review', 'Reporting & performance review'], context: 'Across three consumer brands. One Xiaohongshu post reached 1M+ views; this is a single-post result.', texture: '1', supporting: '8' },
    { title: 'KOL collaborations', number: '02', annotation: 'Creator sourcing, quotations, briefs and reviews.', summary: 'Connecting brands with creators, and keeping each collaboration clear from sourcing and quotations to the brief, shoot and review.', value: '300+', evidence: 'KOL collaborations', ownership: 'Almost entirely individually handled.', responsibilities: ['Creator sourcing & quotations', 'Briefs & shoot coordination', 'Content review & follow-up', 'Reporting'], context: 'Work across three consumer brands. Collaboration scope includes preparation, coordination, review and reporting.', texture: '2', supporting: '8' },
    { title: 'Campaign coordination', number: '03', annotation: 'Teams, agencies, vendors, budgets and approvals.', summary: 'Keeping people, timing and practical requirements connected across internal teams, agencies and vendors, with delivery and approval follow-up.', value: '10+', evidence: 'offline activations', ownership: 'Supported as part of the wider team.', responsibilities: ['Internal, agency & vendor coordination', 'Budget follow-up', 'Approval follow-up', 'Offline activation support'], context: 'Budget and approval follow-up, alongside team and vendor coordination.', texture: '3', supporting: '6' }
  ];
  const rows = [...document.querySelectorAll('.scope-row')];
  const panel = document.querySelector('#scope-panel');
  const content = document.querySelector('.case-content');
  const caseLeaf = document.querySelector('.case-leaf');
  const sheet = document.querySelector('.turn-sheet');
  const imageSweep = document.querySelector('.image-sweep');
  const annotation = document.querySelector('#responsibility-text');
  const paperScene = document.querySelector('.paper-scene');
  const back = document.querySelector('.paper-back');
  const primary = document.querySelector('.primary-float');
  const support = document.querySelector('.support-float');
  const register = document.querySelector('.registration-bottom');
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const smooth = v => v * v * (3 - 2 * v);
  const motionEnabled = () => Boolean(atelier?.enabled) && !reduced.matches;
  let selected = 0;
  let turn = null;
  let progress = 0;
  let unsubscribe;

  function setText(selector, value) { content.querySelector(selector).textContent = value; }
  function markSelection(index, focus) {
    rows.forEach((row, i) => {
      const active = i === index;
      row.classList.toggle('is-active', active);
      row.setAttribute('aria-selected', String(active));
      row.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', rows[index].id);
    if (focus) rows[index].focus({ preventScroll: true });
  }
  function commit(index) {
    const scope = scopes[index];
    selected = index;
    panel.dataset.activeScope = String(index);
    setText('.case-number', scope.number);
    setText('h3', scope.title);
    setText('.case-summary', scope.summary);
    setText('dt', scope.value);
    const dd = content.querySelector('dd');
    const ownership = document.createElement('span');
    ownership.textContent = scope.ownership;
    dd.replaceChildren(document.createTextNode(scope.evidence), document.createElement('br'), ownership);
    const responsibilities = content.querySelector('.case-process p');
    responsibilities.replaceChildren();
    scope.responsibilities.forEach((item, i) => {
      if (i) responsibilities.append(document.createElement('br'));
      responsibilities.append(document.createTextNode(item));
    });
    setText('.case-context', scope.context);
    document.querySelector('.primary-art .study').dataset.texture = scope.texture;
    document.querySelector('.case-cover .study').dataset.texture = scope.texture;
    document.querySelector('.support-art .study').dataset.texture = scope.supporting;
    annotation.textContent = scope.annotation;
  }
  function resetTurn() {
    sheet.style.transform = 'translateX(-106%) rotate(-2deg)';
    imageSweep.style.transform = 'translateX(-106%)';
    caseLeaf.style.transform = 'none';
    panel.removeAttribute('aria-busy');
    document.body.classList.remove('is-turning');
  }
  function scrollToWork() {
    document.querySelector('#selected-work').scrollIntoView({ behavior: motionEnabled() ? 'smooth' : 'instant', block: 'start' });
  }
  function selectScope(index, focus = false, scroll = false) {
    if (index < 0 || index >= scopes.length) return;
    markSelection(index, focus);
    annotation.textContent = scopes[index].annotation;
    if (!motionEnabled() || !atelier?.onFrame || (index === selected && !turn)) {
      turn = null;
      commit(index);
      resetTurn();
      if (scroll) scrollToWork();
      return;
    }
    turn = { index, elapsed: 0, committed: false, scroll, scrolled: false };
    panel.setAttribute('aria-busy', 'true');
    document.body.classList.add('is-turning');
  }
  function animateTurn(dt) {
    if (!turn) return 0;
    if (!motionEnabled()) {
      const pending = turn;
      turn = null;
      commit(pending.index);
      resetTurn();
      if (pending.scroll) scrollToWork();
      return 0;
    }
    turn.elapsed += dt;
    const t = clamp(turn.elapsed / .88);
    const firstHalf = t <= .5;
    const phase = smooth(firstHalf ? t * 2 : (t - .5) * 2);
    const x = firstHalf ? -106 + phase * 106 : phase * 106;
    const angle = firstHalf ? -2 + phase * 2 : phase * 2;
    sheet.style.transform = `translate3d(${x}%,0,0) rotate(${angle}deg)`;
    imageSweep.style.transform = `translate3d(${x}%,0,0)`;
    caseLeaf.style.transform = `translate3d(${firstHalf ? -phase * 12 : (1 - phase) * 12}px,0,0)`;
    if (t >= .5 && !turn.committed) { commit(turn.index); turn.committed = true; }
    if (t >= .71 && turn.scroll && !turn.scrolled) { turn.scrolled = true; scrollToWork(); }
    const lift = Math.sin(t * Math.PI) * 13;
    if (t >= 1) { turn = null; resetTurn(); }
    return lift;
  }
  function drawScene(state, lift = 0) {
    if (!motionEnabled() || narrow.matches || coarse.matches) {
      back.style.transform = '';
      primary.style.transform = '';
      support.style.transform = '';
      register.style.transform = '';
      support.dataset.progress = '0';
      return;
    }
    const rect = paperScene.getBoundingClientRect();
    const target = clamp((state.height * .77 - rect.top) / (rect.height + state.height * .4));
    const blend = 1 - Math.exp(-state.dt * 7.8);
    progress += (target - progress) * blend;
    const p = progress;
    back.style.transform = `translate3d(${-p * 11}px,${p * 29}px,0) rotate(${8 - p * 4.5}deg)`;
    primary.style.transform = `translate3d(${p * 4}px,${-p * 38 - lift}px,0) rotate(${-2 + p * 2.3 - lift * .07}deg)`;
    support.style.transform = `translate3d(${p * 20}px,${-p * 92 - lift * .34}px,0) rotate(${-7 + p * 7.8}deg)`;
    register.style.transform = `translate3d(0,${-p * 26}px,0)`;
    support.dataset.progress = p.toFixed(4);
  }
  function frame(state) { drawScene(state, animateTurn(clamp(state.dt || .016, 0, .08))); }
  rows.forEach((row, index) => {
    row.addEventListener('click', () => selectScope(index));
    row.addEventListener('pointerenter', () => { annotation.textContent = scopes[index].annotation; });
    row.addEventListener('focus', () => { annotation.textContent = scopes[index].annotation; });
    row.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % rows.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + rows.length - 1) % rows.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = rows.length - 1;
      if (next !== undefined) { event.preventDefault(); selectScope(next, true); }
    });
  });
  document.querySelector('.work-index').addEventListener('pointerleave', () => { annotation.textContent = scopes[turn?.index ?? selected].annotation; });
  document.querySelector('[data-testid="primary-interaction"]').addEventListener('click', () => selectScope(1, false, true));
  function motionChange() {
    if (!motionEnabled() && turn) { const pending = turn; turn = null; commit(pending.index); resetTurn(); if (pending.scroll) scrollToWork(); }
    drawScene({ height: innerHeight, dt: .016 });
  }
  function start() { if (!unsubscribe && atelier?.onFrame) unsubscribe = atelier.onFrame(frame); }
  addEventListener('atelier:motion', motionChange);
  reduced.addEventListener('change', motionChange);
  narrow.addEventListener('change', motionChange);
  coarse.addEventListener('change', motionChange);
  addEventListener('pagehide', () => { unsubscribe?.(); unsubscribe = null; if (turn) { commit(turn.index); turn = null; resetTurn(); } });
  addEventListener('pageshow', start);
  start();
  window.__siteReady = true;
})();
