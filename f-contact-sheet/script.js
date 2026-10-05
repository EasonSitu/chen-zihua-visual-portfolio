(() => {
  'use strict';
  const scopes = [
    { category: 'Content', title: 'From concept to post.', summary: 'Creating brand content across three consumer brands, from the initial idea to the finished social post. Concepts, scripts, filming, editing and copywriting formed a connected, hands-on scope.', evidence: '500+ content pieces', note: 'Cumulative output across the three brands; almost entirely individually handled.', tasks: ['Develop content concepts and scripts', 'Film, edit and write accompanying copy', 'Coordinate the details needed for publication'], anchor: 'content' },
    { category: 'KOL', title: 'Finding the right creator.', summary: 'Sourcing creators and following collaboration through the practical decisions: quotations, briefs, shoots, review and reporting. The work connected brand needs with the people producing the content.', evidence: '300+ KOL collaborations', note: 'Cumulative collaborations; almost entirely individually handled.', tasks: ['Source creators and gather quotations', 'Prepare briefs and coordinate shoots', 'Review content and follow up reporting'], anchor: 'kol' },
    { category: 'Activations', title: 'From screen to space.', summary: 'Supporting the brand beyond its social channels through offline activations. Delivery involved internal teams, agencies and vendors, with attention to the practical details around budgets and approvals.', evidence: '10+ offline activations supported', note: 'An activation-support scope, including coordination and follow-up.', tasks: ['Coordinate internal, agency and vendor needs', 'Follow up budgets and approval steps', 'Support the work required for offline delivery'], anchor: 'activations' },
    { category: 'Content', title: 'Words before the camera.', summary: 'Turning a content concept into a script and filming plan, then producing the material. This was part of the broader content responsibility across three consumer brands.', evidence: 'Concepts · scripts · filming', note: 'A responsibility within the cumulative 500+ content pieces, rather than a separate invented campaign.', tasks: ['Develop an idea into a usable script', 'Organise the practical filming requirements', 'Capture material for subsequent editing'], anchor: 'content' },
    { category: 'Content', title: 'The finishing details.', summary: 'Editing filmed material and writing copy to carry the brand story into a finished post. Hands-on production extended through both the visual material and its accompanying words.', evidence: 'Editing · copywriting', note: 'Part of the cumulative content scope across three consumer brands.', tasks: ['Edit content into its final format', 'Write the accompanying social copy', 'Connect the finished content with coordination follow-up'], anchor: 'content' },
    { category: 'KOL', title: 'A brief with direction.', summary: 'Preparing creator briefs, coordinating shoots and reviewing content during collaboration. Clear communication helped keep creative material connected to the brand’s requirements.', evidence: 'Briefs · shoots · content review', note: 'A work area within the cumulative 300+ KOL collaborations; no specific creator or campaign is represented by this study.', tasks: ['Communicate requirements through creator briefs', 'Coordinate shoots and related participants', 'Review material and follow up required changes'], anchor: 'kol' },
    { category: 'KOL', title: 'Following through.', summary: 'Creator collaboration includes the less visible work around it: sourcing, quotation follow-up, coordination and reporting. These tasks were part of the wider collaboration responsibility.', evidence: 'Coordination · reporting', note: 'Included in the 300+ cumulative collaborations, almost entirely individually handled.', tasks: ['Follow up quotations and practical arrangements', 'Connect creators with internal requirements', 'Prepare reporting after collaboration'], anchor: 'kol' },
    { category: 'Activations', title: 'Keeping the pieces together.', summary: 'Supporting offline delivery through coordination across internal colleagues, agencies and vendors. Budget and approval follow-up kept the practical work connected with the wider activation.', evidence: 'Internal teams · agencies · vendors', note: 'Within 10+ offline activations supported; this scope does not imply final approval authority.', tasks: ['Coordinate the people involved in delivery', 'Follow up budget-related requirements', 'Track approval steps and outstanding details'], anchor: 'activations' },
    { category: 'Content', title: 'Reading the response.', summary: 'One Xiaohongshu post achieved more than one million views. That result sits alongside a broader, cumulative body of content production across three consumer brands.', evidence: '1M+ views on one Xiaohongshu post', note: 'A single-post result. It is not a campaign total or a claim of confirmed organic reach, conversions or sales.', tasks: ['Develop content concepts and scripts', 'Film, edit and write social copy', 'Prepare reporting within the wider marketing scope'], anchor: 'content' }
  ];
  const sheet = document.getElementById('contact-sheet');
  const entries = [...sheet.querySelectorAll('.sheet-entry')];
  const status = document.getElementById('selection-status');
  const lab = window.ChenLab;
  let selected = -1;
  let panel = null;
  let closing = false;
  let generation = 0;
  const running = new Set();
  const motion = () => lab ? lab.motionEnabled : !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const columns = () => getComputedStyle(sheet).gridTemplateColumns.split(' ').length;
  const measure = () => new Map(entries.map(entry => [entry, entry.getBoundingClientRect()]));

  function play(element, keyframes, duration, extra = {}) {
    if (!motion()) return null;
    const animation = element.animate(keyframes, { duration, easing: 'cubic-bezier(.22,.7,.2,1)', ...extra });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
    return animation;
  }
  function cancelAnimations() {
    for (const animation of running) animation.cancel();
    running.clear();
  }
  function animateLayout(before, duration) {
    if (!motion()) return;
    for (const entry of entries) {
      const previous = before.get(entry);
      const current = entry.getBoundingClientRect();
      const dx = previous.left - current.left;
      const dy = previous.top - current.top;
      if (Math.abs(dx) + Math.abs(dy) > 1) play(entry, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], duration);
    }
  }
  function setEntryState(index) {
    entries.forEach((entry, i) => entry.setAttribute('aria-expanded', String(i === index)));
  }
  function repositionPanel() {
    if (!panel || selected < 0) return;
    const nextRow = Math.min(entries.length, (Math.floor(selected / columns()) + 1) * columns());
    sheet.insertBefore(panel, entries[nextRow] || null);
  }
  function createPanel(index) {
    const item = scopes[index];
    const number = String(index + 1).padStart(2, '0');
    const node = document.createElement('article');
    node.id = 'selection';
    node.className = 'selection';
    node.setAttribute('aria-labelledby', 'selection-title');
    node.innerHTML = `<div class="selection-visual"><span class="study" data-texture="${index + 1}" aria-hidden="true"></span><span class="selection-study-label">Visual study ${number} / abstract media</span></div>
      <div class="selection-copy"><div class="selection-topline"><p class="eyebrow">Scope ${number} / ${item.category}</p><button class="close-selection" type="button" aria-label="Close selected scope">Close <span aria-hidden="true">×</span></button></div>
      <h3 id="selection-title">${item.title}</h3><p class="selection-summary">${item.summary}</p><p class="scope-evidence">${item.evidence}<small>${item.note}</small></p>
      <ul class="responsibilities">${item.tasks.map(task => `<li>${task}</li>`).join('')}</ul>
      <div class="selection-bottom"><a href="#scope-${item.anchor}">Read the work area ↗</a><div class="selection-nav"><button type="button" data-step="-1" aria-label="Previous work scope">←</button><span>${number} / 09</span><button type="button" data-step="1" aria-label="Next work scope">→</button></div></div></div>`;
    node.querySelector('.close-selection').addEventListener('click', () => close());
    node.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => open((selected + Number(button.dataset.step) + entries.length) % entries.length)));
    return node;
  }
  function open(index, { focus = true, scroll = true } = {}) {
    if (index < 0 || index >= entries.length) return;
    if (selected === index && !closing) { close(); return; }
    generation++;
    closing = false;
    cancelAnimations();
    const source = entries[index].querySelector('.plate').getBoundingClientRect();
    const before = measure();
    if (panel) panel.remove();
    selected = index;
    setEntryState(index);
    panel = createPanel(index);
    repositionPanel();
    const visual = panel.querySelector('.selection-visual');
    const target = visual.getBoundingClientRect();
    play(visual, [{ transform: `translate(${source.left - target.left}px, ${source.top - target.top}px) scale(${source.width / target.width}, ${source.height / target.height})` }, { transform: 'translate(0, 0) scale(1, 1)' }], 400);
    play(panel.querySelector('.selection-copy'), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], 400);
    animateLayout(before, 400);
    status.textContent = `Selected scope ${index + 1}: ${scopes[index].category}. ${scopes[index].title}`;
    if (focus) panel.querySelector('.close-selection').focus({ preventScroll: true });
    if (scroll) {
      const rect = panel.getBoundingClientRect();
      if (rect.bottom > innerHeight - 60 || rect.top < 0) {
        const offset = innerWidth <= 680 ? 90 : Math.min(250, innerHeight * .25);
        window.scrollTo({ top: Math.max(0, scrollY + rect.top - offset), behavior: motion() ? 'smooth' : 'instant' });
      }
    }
    updateDrift();
  }
  function close({ focus = true } = {}) {
    if (!panel || closing) return;
    closing = true;
    const token = ++generation;
    cancelAnimations();
    const index = selected;
    const oldPanel = panel;
    const visual = oldPanel.querySelector('.selection-visual');
    const from = visual.getBoundingClientRect();
    const source = entries[index].querySelector('.plate').getBoundingClientRect();
    const animation = play(visual, [{ transform: 'translate(0, 0) scale(1, 1)' }, { transform: `translate(${source.left - from.left}px, ${source.top - from.top}px) scale(${source.width / from.width}, ${source.height / from.height})` }], 250);
    play(oldPanel.querySelector('.selection-copy'), [{ opacity: 1 }, { opacity: 0 }], 180);
    const complete = () => {
      if (generation !== token) return;
      const before = measure();
      oldPanel.remove();
      panel = null;
      selected = -1;
      closing = false;
      setEntryState(-1);
      animateLayout(before, 250);
      status.textContent = 'Selection closed. Contact sheet restored.';
      if (focus) {
        entries[index].focus({ preventScroll: true });
        const rect = entries[index].getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > innerHeight - 60) entries[index].scrollIntoView({ block: 'center', behavior: motion() ? 'smooth' : 'instant' });
      }
      updateDrift();
    };
    if (animation) animation.finished.then(complete).catch(() => {});
    else complete();
  }
  entries.forEach((entry, index) => entry.addEventListener('click', () => open(index)));
  sheet.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape' && panel) { event.preventDefault(); close(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const entry = event.target.closest('.sheet-entry');
    if (!entry && !event.target.closest('.selection')) return;
    const origin = entry ? Number(entry.dataset.index) : selected;
    const step = event.key === 'ArrowUp' ? -columns() : event.key === 'ArrowDown' ? columns() : event.key === 'ArrowLeft' ? -1 : 1;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 : (origin + step + entries.length) % entries.length;
    event.preventDefault();
    if (panel) open(next);
    else entries[next].focus({ preventScroll: false });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel && !sheet.contains(event.target)) close();
  });
  function updateDrift() {
    entries.forEach((entry, index) => {
      const study = entry.querySelector('.study');
      if (!motion()) { study.style.removeProperty('--drift'); return; }
      const rect = entry.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - (rect.top + rect.height / 2)) / innerHeight));
      const speed = [18, 11, 15][index % 3];
      study.style.setProperty('--drift', `${(progress * speed).toFixed(2)}px`);
    });
  }
  if (lab) lab.onScroll(updateDrift);
  else addEventListener('scroll', updateDrift, { passive: true });
  addEventListener('chen:motionchange', () => {
    if (!motion()) {
      // Finish pending state changes before cancelling their decorative animations.
      running.forEach(animation => { try { animation.finish(); } catch {} });
    }
    updateDrift();
  });
  addEventListener('resize', () => { repositionPanel(); updateDrift(); });
  updateDrift();
  window.__siteReady = true;
})();
