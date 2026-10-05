(() => {
  'use strict';
  const lab = window.ChenLab;
  const scopes = [
    {title:'Content production', number:'01', annotation:'Concept, script, filming, editing and copy.', summary:'Turning a brand idea into social content, from the first concept through filming, editing and copywriting.', value:'500+', evidence:'content pieces', ownership:'Almost entirely individually handled.', responsibilities:['Concepts & scripts','Filming & editing','Copywriting & review','Reporting & performance review'], context:'Across three consumer brands. One Xiaohongshu post reached 1M+ views; this is a single-post result.', texture:'1', supporting:'8'},
    {title:'KOL collaborations', number:'02', annotation:'Creator sourcing, quotations, briefs and reviews.', summary:'Connecting brands with creators, and keeping each collaboration clear from sourcing and quotations to the brief, shoot and review.', value:'300+', evidence:'KOL collaborations', ownership:'Almost entirely individually handled.', responsibilities:['Creator sourcing & quotations','Briefs & shoot coordination','Content review & follow-up','Reporting'], context:'Work across three consumer brands. Collaboration scope includes preparation, coordination, review and reporting.', texture:'2', supporting:'8'},
    {title:'Campaign coordination', number:'03', annotation:'Teams, agencies, vendors, budgets and approvals.', summary:'Keeping people, timing and practical requirements connected across internal teams, agencies and vendors, with delivery and approval follow-up.', value:'10+', evidence:'offline activations', ownership:'Supported as part of the wider team.', responsibilities:['Internal, agency & vendor coordination','Budget follow-up','Approval follow-up','Offline activation support'], context:'Budget and approval follow-up, alongside team and vendor coordination.', texture:'3', supporting:'6'}
  ];
  const rows = [...document.querySelectorAll('.scope-row')];
  const panel = document.querySelector('.scope-panel');
  const content = document.querySelector('.case-content');
  const note = document.querySelector('.responsibility-note');
  const annotation = document.querySelector('#responsibility-text');
  const smallStudy = document.querySelector('.small-study');
  const largeStudy = document.querySelector('.large-study');
  const media = document.querySelector('.media-composition');
  const mobile = matchMedia('(max-width:760px)');
  let selected = 0;
  let noted = 0;
  let caseAnimation;
  const text = (selector, value) => { content.querySelector(selector).textContent = value; };
  function placeAnnotation(index) {
    noted = index;
    annotation.textContent = scopes[index].annotation;
    const rowRect = rows[index].getBoundingClientRect();
    const noteRect = note.getBoundingClientRect();
    const start = rowRect.top + rowRect.height / 2 - noteRect.top;
    note.style.setProperty('--note-start', `${start}px`);
    note.style.setProperty('--note-height', `${Math.max(20, -start + 19)}px`);
    note.dataset.scope = String(index);
  }
  function selectScope(index, focus = false) {
    selected = index;
    const scope = scopes[index];
    rows.forEach((row, i) => {
      const active = i === index;
      row.classList.toggle('is-active', active);
      row.setAttribute('aria-selected', String(active));
      row.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', rows[index].id);
    panel.dataset.activeScope = String(index);
    text('.case-number', scope.number);
    text('h3', scope.title);
    text('.case-summary', scope.summary);
    text('dt', scope.value);
    const dd = content.querySelector('dd');
    dd.replaceChildren(document.createTextNode(scope.evidence), document.createElement('br'));
    const ownership = document.createElement('span');
    ownership.textContent = scope.ownership;
    dd.append(ownership);
    const process = content.querySelector('.case-process p');
    process.replaceChildren();
    scope.responsibilities.forEach((item,i) => {if(i) process.append(document.createElement('br'));process.append(document.createTextNode(item));});
    text('.case-context', scope.context);
    largeStudy.querySelector('.study').dataset.texture = scope.texture;
    smallStudy.querySelector('.study').dataset.texture = scope.supporting;
    placeAnnotation(index);
    caseAnimation?.cancel();
    if (lab?.motionEnabled) caseAnimation = content.animate([{transform:'translateX(12px)'},{transform:'translateX(0)'}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});
    if (focus) rows[index].focus({preventScroll:true});
  }
  rows.forEach((row,index) => {
    row.addEventListener('click', () => selectScope(index));
    row.addEventListener('pointerenter', () => placeAnnotation(index));
    row.addEventListener('focus', () => placeAnnotation(index));
    row.addEventListener('keydown', event => {
      let next;
      if(event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % rows.length;
      if(event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + rows.length - 1) % rows.length;
      if(event.key === 'Home') next = 0;
      if(event.key === 'End') next = rows.length - 1;
      if(next !== undefined) {event.preventDefault();selectScope(next,true);}
    });
  });
  document.querySelector('.work-index').addEventListener('pointerleave', () => placeAnnotation(selected));
  document.querySelector('[data-testid="primary-interaction"]').addEventListener('click', () => {
    selectScope(1);
    document.querySelector('#selected-work').scrollIntoView({behavior:lab?.motionEnabled?'smooth':'instant',block:'start'});
  });
  function updateComposition() {
    if (!lab?.motionEnabled || mobile.matches) {
      smallStudy.style.transform = 'none';
      largeStudy.style.transform = 'none';
      smallStudy.dataset.progress = '1';
      placeAnnotation(noted);
      return;
    }
    const rect = media.getBoundingClientRect();
    const progress = lab.clamp((innerHeight * .70 - rect.top) / (innerHeight * .72));
    smallStudy.style.transform = `translate3d(${18 * (1-progress)}px,${-68 * (1-progress)}px,0) rotate(${-7 * (1-progress)}deg)`;
    largeStudy.style.transform = `translate3d(0,${-12 * progress}px,0)`;
    smallStudy.dataset.progress = progress.toFixed(4);
    placeAnnotation(noted);
  }
  let unsubscribe = lab?.onScroll(updateComposition);
  const motionChange = () => {caseAnimation?.cancel();updateComposition();};
  addEventListener('chen:motionchange', motionChange);
  mobile.addEventListener('change', updateComposition);
  if(document.fonts?.ready) document.fonts.ready.then(() => {placeAnnotation(noted);updateComposition();});
  addEventListener('pagehide', () => {
    unsubscribe?.();
    unsubscribe = null;
    caseAnimation?.cancel();
    removeEventListener('chen:motionchange', motionChange);
    mobile.removeEventListener('change', updateComposition);
  });
  addEventListener('pageshow', event => {
    if (!event.persisted || unsubscribe) return;
    addEventListener('chen:motionchange', motionChange);
    mobile.addEventListener('change', updateComposition);
    unsubscribe = lab?.onScroll(updateComposition);
  });
  panel.dataset.activeScope = '0';
  placeAnnotation(0);
  updateComposition();
  window.__siteReady = true;
})();
