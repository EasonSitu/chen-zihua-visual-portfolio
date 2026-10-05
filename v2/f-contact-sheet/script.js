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
  const atelier = window.Atelier;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const page = document.querySelector('.page');
  const sheet = document.getElementById('contact-sheet');
  const entries = [...sheet.querySelectorAll('.sheet-entry')];
  const heroButtons = [...document.querySelectorAll('[data-open]')];
  const dialog = document.getElementById('selection');
  const visual = dialog.querySelector('.selection-visual');
  const image = visual.querySelector('.study');
  const copy = dialog.querySelector('.selection-copy');
  const morph = dialog.querySelector('.frame-morph');
  const preview = document.querySelector('.hover-preview');
  const closeButton = dialog.querySelector('.close-selection');
  const status = document.getElementById('selection-status');
  const running = new Set();
  const motion = () => Boolean(atelier?.enabled && !reduce.matches);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let selected = -1, origin = null, closing = false, generation = 0;
  let previewTarget = null, previewTimer = null, previewX = 0, previewY = 0;
  let savedOverflow = '';

  function play(element, frames, duration, options = {}) {
    if (!motion()) return null;
    const animation = element.animate(frames, { duration, easing: 'cubic-bezier(.22,.72,.1,1)', ...options });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
    return animation;
  }
  function finishRunning() {
    for (const animation of running) { try { animation.finish(); } catch {} }
    running.clear();
  }
  function hidePreview() {
    clearTimeout(previewTimer);
    previewTarget = null;
    preview.classList.remove('is-visible');
  }
  function setEntryState(index) {
    entries.forEach((entry, i) => {
      entry.setAttribute('aria-expanded', String(i === index));
      entry.classList.toggle('is-selected', i === index);
    });
    heroButtons.forEach(button => button.setAttribute('aria-expanded', String(Number(button.dataset.open) === index)));
  }
  function fillScope(index) {
    const item = scopes[index], number = String(index + 1).padStart(2, '0');
    image.dataset.texture = String(index + 1);
    dialog.querySelector('.selection-study-label').textContent = `Visual study ${number} / abstract media`;
    dialog.querySelector('#selection-category').textContent = `Scope ${number} / ${item.category}`;
    dialog.querySelector('#selection-title').textContent = item.title;
    dialog.querySelector('.selection-summary').textContent = item.summary;
    dialog.querySelector('.scope-evidence > span').textContent = item.evidence;
    dialog.querySelector('.scope-evidence small').textContent = item.note;
    dialog.querySelector('.responsibilities').replaceChildren(...item.tasks.map(task => {
      const li = document.createElement('li'); li.textContent = task; return li;
    }));
    dialog.querySelector('.selection-area').href = `#scope-${item.anchor}`;
    dialog.querySelector('.selection-nav span').textContent = `${number} / 09`;
    status.textContent = `Selected scope ${index + 1}: ${item.category}. ${item.title}`;
    setEntryState(index);
  }
  function animateFrame(from, to, index, returning = false) {
    if (!motion() || !from.width || !to.width) return Promise.resolve();
    const start = returning ? from : to;
    morph.style.width = `${start.width}px`;
    morph.style.height = `${start.height}px`;
    morph.style.display = 'block';
    morph.querySelector('.study').dataset.texture = String(index + 1);
    dialog.classList.add('is-morphing');
    const frame = rectangle => `translate3d(${rectangle.left}px,${rectangle.top}px,0) scale(${rectangle.width / start.width},${rectangle.height / start.height})`;
    const animation = play(morph, [{ transform: frame(from), opacity: 1 }, { transform: frame(to), opacity: returning && (to.bottom < 0 || to.top > innerHeight) ? 0 : 1 }], returning ? 570 : 790);
    return animation ? animation.finished.catch(() => {}) : Promise.resolve();
  }
  function cleanupMorph() {
    morph.style.display = 'none';
    dialog.classList.remove('is-morphing');
  }
  function open(index, source = entries[index]) {
    if (index < 0 || index >= scopes.length) return;
    const token = ++generation;
    closing = false;
    finishRunning();
    hidePreview();
    if (dialog.open) {
      selected = index; origin = source;
      fillScope(index);
      cleanupMorph();
      play(image, [{ clipPath: 'inset(0 100% 0 0)', transform: 'scale(1.05)' }, { clipPath: 'inset(0 0 0 0)', transform: 'scale(1)' }], 650);
      play(copy, [{ opacity: .15, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], 420);
      return;
    }
    const from = source.querySelector('.plate').getBoundingClientRect();
    selected = index; origin = source;
    fillScope(index);
    savedOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.setAttribute('aria-modal', 'true');
    dialog.show();
    page.inert = true;
    document.body.classList.add('is-viewing');
    const to = image.getBoundingClientRect();
    play(dialog, [{ backgroundColor: '#e8eff100' }, { backgroundColor: '#e8eff1' }], 500);
    play(copy, [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], 620, { delay: 170, fill: 'backwards' });
    animateFrame(from, to, index).then(() => { if (token === generation) cleanupMorph(); });
    closeButton.focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }
  function close({ focus = true } = {}) {
    if (!dialog.open || closing) return Promise.resolve();
    closing = true;
    const token = ++generation, source = origin, index = selected;
    finishRunning(); cleanupMorph();
    const from = image.getBoundingClientRect();
    document.body.classList.remove('is-viewing');
    const to = source.querySelector('.plate').getBoundingClientRect();
    play(copy, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(12px)' }], 250);
    play(dialog, [{ backgroundColor: '#e8eff1' }, { backgroundColor: '#e8eff100' }], 480, { delay: 90 });
    return animateFrame(from, to, index, true).then(() => {
      if (generation !== token) return;
      cleanupMorph();
      dialog.close();
      page.inert = false;
      document.documentElement.style.overflow = savedOverflow;
      selected = -1; closing = false; setEntryState(-1);
      status.textContent = 'Selection closed. Contact sheet restored.';
      if (focus && source.isConnected) source.focus({ preventScroll: true });
    });
  }
  function nextScope(step) { open((selected + step + entries.length) % entries.length); }
  entries.forEach((entry, index) => {
    entry.addEventListener('click', () => open(index, entry));
    entry.addEventListener('pointerenter', () => {
      if (!fine.matches || !motion() || dialog.open) return;
      clearTimeout(previewTimer);
      previewTarget = entry;
      preview.querySelector('.study').dataset.texture = String(index + 1);
      preview.querySelector('span').textContent = `${String(index + 1).padStart(2, '0')} / ${entry.querySelector('.entry-caption small').textContent}`;
      previewTimer = setTimeout(() => { if (previewTarget === entry) preview.classList.add('is-visible'); }, 240);
    });
    entry.addEventListener('pointerleave', hidePreview);
  });
  heroButtons.forEach(button => button.addEventListener('click', () => open(Number(button.dataset.open), button)));
  closeButton.addEventListener('click', () => close());
  dialog.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => nextScope(Number(button.dataset.step))));
  dialog.querySelector('.selection-area').addEventListener('click', async event => {
    event.preventDefault();
    const target = document.querySelector(event.currentTarget.getAttribute('href'));
    await close({ focus: false });
    target?.scrollIntoView({ block: 'start', behavior: motion() ? 'smooth' : 'instant' });
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); nextScope(event.key === 'ArrowRight' ? 1 : -1); }
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('a[href],button')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  sheet.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target.closest('.sheet-entry');
    if (!target || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    const index = Number(target.dataset.index), columns = innerWidth < 768 ? 2 : 3;
    const step = event.key === 'ArrowUp' ? -columns : event.key === 'ArrowDown' ? columns : event.key === 'ArrowLeft' ? -1 : 1;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 : (index + step + entries.length) % entries.length;
    event.preventDefault(); entries[next].focus();
  });

  const scene = document.querySelector('.exhibition');
  const layers = [...scene.querySelectorAll('[data-layer]')].map((element, index) => ({ element, speed: [.065, -.09, -.17][index], pointer: [5, 10, 20][index], x: 0, y: 0 }));
  atelier?.onFrame(state => {
    const sceneRect = scene.getBoundingClientRect();
    const active = state.enabled && fine.matches;
    const visible = sceneRect.bottom > -100 && sceneRect.top < state.height + 100;
    if (active && visible && !dialog.open) {
      const progress = clamp((state.height * .5 - sceneRect.top - sceneRect.height * .5), -700, 700);
      const interpolation = 1 - Math.exp(-5.5 * state.dt);
      layers.forEach(layer => {
        const x = state.pointer.live ? state.pointer.nx * layer.pointer : 0;
        const y = progress * layer.speed + (state.pointer.live ? state.pointer.ny * layer.pointer * .65 : 0);
        layer.x += (x - layer.x) * interpolation;
        layer.y += (y - layer.y) * interpolation;
        layer.element.style.transform = `translate3d(${layer.x.toFixed(2)}px,${layer.y.toFixed(2)}px,0)`;
      });
    } else if (!active) {
      layers.forEach(layer => { layer.x = layer.y = 0; layer.element.style.transform = 'none'; });
    }
    if (previewTarget && active && !dialog.open) {
      const x = state.pointer.x + 225 > state.width ? state.pointer.x - 226 : state.pointer.x + 28;
      const y = clamp(state.pointer.y - 80, 12, state.height - 260);
      const interpolation = 1 - Math.exp(-18 * state.dt);
      if (!preview.classList.contains('is-visible')) { previewX = x; previewY = y; }
      previewX += (x - previewX) * interpolation; previewY += (y - previewY) * interpolation;
      preview.style.transform = `translate3d(${previewX.toFixed(1)}px,${previewY.toFixed(1)}px,0)`;
    } else if (!active) hidePreview();
  });
  const observer = new IntersectionObserver(items => {
    items.forEach(item => {
      if (!item.isIntersecting) return;
      observer.unobserve(item.target);
      play(item.target.querySelector('.plate'), [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], 1000);
    });
  }, { threshold: .12 });
  entries.forEach(entry => observer.observe(entry));
  addEventListener('atelier:motion', event => { if (!event.detail) { finishRunning(); hidePreview(); } });
  fine.addEventListener('change', hidePreview);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hidePreview(); });
  addEventListener('pagehide', hidePreview);
  window.__siteReady = true;
})();
