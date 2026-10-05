(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let manual;
  try { manual = localStorage.getItem('chen-motion'); } catch {}
  const callbacks = new Set();
  let pending = false;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const api = window.ChenLab = {
    motionEnabled: manual ? manual === 'on' && !preference.matches : !preference.matches,
    clamp,
    progress(el) { const rect = el.getBoundingClientRect(); return clamp(-rect.top / Math.max(1, rect.height - innerHeight)); },
    onScroll(callback) { callbacks.add(callback); callback(); return () => callbacks.delete(callback); }
  };
  function refresh() { pending = false; callbacks.forEach(fn => fn()); }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(refresh); } }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  function setMotion(enabled, persist = false) {
    api.motionEnabled = !!enabled && !preference.matches;
    document.documentElement.classList.toggle('motion-off', !api.motionEnabled);
    if (persist) { manual = enabled ? 'on' : 'off'; try { localStorage.setItem('chen-motion', manual); } catch {} }
    if (motionButton) { motionButton.textContent = api.motionEnabled ? 'Motion on' : 'Motion off'; motionButton.setAttribute('aria-pressed', String(api.motionEnabled)); }
    if (!api.motionEnabled) stop();
    if (autoButton) { autoButton.disabled = !api.motionEnabled; autoButton.title = preference.matches ? 'Reduced motion preference is enabled' : api.motionEnabled ? '' : 'Motion is turned off'; }
    dispatchEvent(new CustomEvent('chen:motionchange', { detail: api.motionEnabled }));
    schedule();
  }
  let motionButton;
  let playing = false, frame = 0, last = 0;
  let autoButton;
  function stop() { playing = false; cancelAnimationFrame(frame); if(autoButton){autoButton.textContent='Auto scroll';autoButton.setAttribute('aria-pressed','false');} }
  function play(time) {
    if(!playing)return;
    if(!last)last=time;
    const travel = Math.min(40, time-last) * .42;
    last=time;
    window.scrollTo({top:scrollY+travel,behavior:'instant'});
    if(scrollY >= document.documentElement.scrollHeight-innerHeight-3){stop();return;}
    frame=requestAnimationFrame(play);
  }
  const folder = location.pathname.split('/').find(part => /^[a-h]-/.test(part));
  if(folder && /^[a-h]-/.test(folder)){
    const bar=document.createElement('nav');bar.className='lab-toolbar';bar.setAttribute('aria-label','Portfolio comparison controls');
    const code=document.createElement('span');code.className='lab-code';code.textContent=folder[0].toUpperCase();bar.append(code);
    const index=document.createElement('a');index.href='../index.html';index.textContent='All directions';bar.append(index);
    motionButton=document.createElement('button');motionButton.type='button';motionButton.addEventListener('click',()=>setMotion(!api.motionEnabled,true));bar.append(motionButton);
    autoButton=document.createElement('button');autoButton.type='button';autoButton.textContent='Auto scroll';autoButton.setAttribute('aria-pressed','false');
    autoButton.addEventListener('click',()=>{if(playing){stop();return;}if(!api.motionEnabled)return;playing=true;last=0;autoButton.textContent='Pause scroll';autoButton.setAttribute('aria-pressed','true');frame=requestAnimationFrame(play);});bar.append(autoButton);
    document.body.append(bar);
  }
  setMotion(api.motionEnabled);
  preference.addEventListener('change',()=>setMotion(manual ? manual === 'on' : true));
  addEventListener('wheel',stop,{passive:true});addEventListener('touchstart',stop,{passive:true});
  addEventListener('keydown',e=>{if(['Escape','ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(e.key))stop();});
})();

