(() => {
  'use strict';
  const root=document.documentElement, body=document.body;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'), fine=matchMedia('(hover: hover) and (pointer: fine)');
  const callbacks=new Set(), revealAnimations=new Set(), clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  let manual; try{manual=localStorage.getItem('chen-atelier-motion');}catch{}
  let enabled=manual!=='off'&&!reduce.matches, raf=null, last=0, hidden=document.hidden, auto=false, lastEmission=0;
  const pointer={x:innerWidth/2,y:innerHeight/2,nx:0,ny:0,live:false};
  const ring={x:pointer.x,y:pointer.y}, samples=[], sparks=[];
  const canvas=document.createElement('canvas'), atmosphere=document.createElement('canvas'), cursor=document.createElement('div');
  canvas.className='atelier-trail';canvas.setAttribute('aria-hidden','true');canvas.dataset.testid='pointer-trail';
  atmosphere.className='atelier-atmosphere';atmosphere.setAttribute('aria-hidden','true');
  cursor.className='atelier-cursor';cursor.setAttribute('aria-hidden','true');cursor.innerHTML='<i></i><span></span>';
  body.append(atmosphere,canvas,cursor);
  const ctx=canvas.getContext('2d'), actx=atmosphere.getContext('2d');
  const meter=document.createElement('div');meter.className='atelier-progress';meter.setAttribute('aria-hidden','true');body.append(meter);
  const route=location.pathname.split('/').find(p=>/^[a-h]-/.test(p)), code=route?route[0].toUpperCase():'V2';
  const utility=document.createElement('nav');utility.className='atelier-utility';utility.setAttribute('aria-label','Visual versions and motion controls');
  utility.innerHTML=`<button type="button" class="atelier-menu-toggle" data-action="utility" data-cursor="MENU" aria-label="Open visual controls" aria-expanded="false">${code}<span>+</span></button><div class="atelier-menu"><a href="${route?'../':'./'}index.html" data-cursor="INDEX">All versions ↗</a><button type="button" data-action="motion">Motion</button><button type="button" data-action="auto">Play scroll</button></div>`;
  body.append(utility);const motionButton=utility.querySelector('[data-action="motion"]'), autoButton=utility.querySelector('[data-action="auto"]');
  const utilityToggle=utility.querySelector('[data-action="utility"]');utilityToggle.addEventListener('click',()=>{const open=utility.classList.toggle('is-open');utilityToggle.setAttribute('aria-expanded',String(open));utilityToggle.setAttribute('aria-label',open?'Close visual controls':'Open visual controls');});
  let width=innerWidth,height=innerHeight,dpr=1,color=getComputedStyle(body).getPropertyValue('--accent').trim()||'#ae6076';
  const ambient=[];let hovered=null, magnet=null, magnetOrigin=null;
  const magnets=[...document.querySelectorAll('[data-magnetic]')], depths=[...document.querySelectorAll('[data-depth]')].map(el=>({el,value:0})), tilts=[...document.querySelectorAll('[data-tilt]')];
  function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);for(const c of [canvas,atmosphere]){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);actx.setTransform(dpr,0,0,dpr,0,0);ambient.length=0;const count=width<650?9:18;for(let i=0;i<count;i++)ambient.push({x:Math.random()*width,y:Math.random()*height,s:4+Math.random()*7,phase:Math.random()*6.28,speed:7+Math.random()*13});}
  function updateControls(){motionButton.textContent=enabled?'Motion on':'Motion off';motionButton.setAttribute('aria-pressed',String(enabled));autoButton.textContent=auto?'Pause scroll':'Play scroll';autoButton.setAttribute('aria-pressed',String(auto));autoButton.disabled=!enabled;}
  function resetEffects(){for(const animation of revealAnimations){animation.finish();animation.cancel();}revealAnimations.clear();samples.length=0;sparks.length=0;ctx.clearRect(0,0,width,height);actx.clearRect(0,0,width,height);cursor.style.opacity='0';root.classList.remove('pointer-active');magnets.forEach(el=>el.style.translate='');depths.forEach(d=>{d.value=0;d.el.style.translate='';});tilts.forEach(el=>el.style.transform='');}
  function stopAuto(){auto=false;updateControls();}
  function start(){if(raf===null&&!hidden){last=0;raf=requestAnimationFrame(tick);}}
  const api=window.Atelier={get enabled(){return enabled;},clamp,progress(el){const r=el.getBoundingClientRect();return clamp(-r.top/Math.max(1,r.height-innerHeight));},onFrame(fn){callbacks.add(fn);start();return()=>callbacks.delete(fn);},setMotion(value){manual=value?'on':'off';try{localStorage.setItem('chen-atelier-motion',manual);}catch{}applyMotion();}};
  function applyMotion(){enabled=manual!=='off'&&!reduce.matches;root.classList.toggle('atelier-no-motion',!enabled);if(!enabled){auto=false;resetEffects();}updateControls();dispatchEvent(new CustomEvent('atelier:motion',{detail:enabled}));start();}
  motionButton.addEventListener('click',()=>api.setMotion(!enabled));autoButton.addEventListener('click',()=>{if(!enabled)return;auto=!auto;updateControls();start();});
  function pointerMove(e){if(e.pointerType==='touch'||!fine.matches)return;const previousX=pointer.x,previousY=pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;pointer.nx=pointer.x/width*2-1;pointer.ny=pointer.y/height*2-1;if(!pointer.live){ring.x=pointer.x;ring.y=pointer.y;}pointer.live=true;
    if(!enabled)return;root.classList.add('pointer-active');cursor.style.opacity='1';
    const target=e.target.closest('a,button,[data-cursor],input,textarea');if(target!==hovered){hovered=target;const label=target?.dataset.cursor||'';cursor.querySelector('span').textContent=label;cursor.classList.toggle('is-hover',!!target);cursor.classList.toggle('has-label',!!label);cursor.classList.toggle('is-input',!!target?.matches('input,textarea'));}
    const next=e.target.closest('[data-magnetic]');if(next!==magnet){if(magnet)magnet.style.translate='';magnet=next;if(next){const r=next.getBoundingClientRect();magnetOrigin={x:r.left+r.width/2,y:r.top+r.height/2};}}
    const now=performance.now(),distance=Math.hypot(pointer.x-previousX,pointer.y-previousY);if(distance>1){samples.push({x:pointer.x,y:pointer.y,t:now});if(samples.length>38)samples.shift();if(now-lastEmission>20&&distance>3){lastEmission=now;sparks.push({x:pointer.x,y:pointer.y,vx:(pointer.x-previousX)*.18,vy:(pointer.y-previousY)*.18,born:now,life:900+Math.random()*350,angle:Math.random()*6.28,s:body.dataset.trail==='petal'?3+Math.random()*4:1+Math.random()*1.6});if(sparks.length>70)sparks.shift();}}start();}
  addEventListener('pointermove',pointerMove,{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget){pointer.live=false;cursor.style.opacity='0';root.classList.remove('pointer-active');samples.length=0;if(magnet)magnet.style.translate='';magnet=null;}});
  addEventListener('pointerdown',()=>{cursor.classList.add('is-pressed');});addEventListener('pointerup',()=>cursor.classList.remove('is-pressed'));
  function petal(c,x,y,s,angle,alpha){c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();c.moveTo(-s,0);c.bezierCurveTo(-s*.35,-s*.65,s*.9,-s*.2,s,0);c.bezierCurveTo(s*.55,s*.78,-s*.8,s*.5,-s,0);c.fill();c.restore();}
  function drawPointer(now,dt){ctx.clearRect(0,0,width,height);if(!fine.matches)return;
    const follow=1-Math.exp(-25*dt);ring.x+=(pointer.x-ring.x)*follow;ring.y+=(pointer.y-ring.y)*follow;cursor.style.transform=`translate3d(${ring.x}px,${ring.y}px,0)`;cursor.dataset.x=ring.x.toFixed(1);cursor.dataset.y=ring.y.toFixed(1);
    while(samples.length&&now-samples[0].t>340)samples.shift();const ribbon=body.dataset.trail!=='dust';if(ribbon&&samples.length>2){for(let i=1;i<samples.length-1;i++){const a=samples[i-1],b=samples[i],c=samples[i+1];ctx.beginPath();ctx.moveTo((a.x+b.x)/2,(a.y+b.y)/2);ctx.quadraticCurveTo(b.x,b.y,(b.x+c.x)/2,(b.y+c.y)/2);ctx.strokeStyle=color;ctx.globalAlpha=.22*(i/samples.length)*clamp(1-(now-b.t)/340);ctx.lineWidth=.8+i/samples.length*.7;ctx.lineCap='round';ctx.stroke();}ctx.globalAlpha=1;}
    for(let i=sparks.length-1;i>=0;i--){const p=sparks[i],age=(now-p.born)/p.life;if(age>=1){sparks.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=(p.vy-12)*dt;p.vx*=Math.exp(-1.6*dt);p.vy*=Math.exp(-1.6*dt);const alpha=Math.sin(Math.PI*age)*.48;if(body.dataset.trail==='petal')petal(ctx,p.x,p.y,p.s,p.angle+age*.7,alpha);else{ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,p.s*(1-age*.4),0,Math.PI*2);ctx.fill();}}
    ctx.globalAlpha=1;canvas.dataset.samples=String(samples.length);canvas.dataset.sparks=String(sparks.length);
  }
  function drawAtmosphere(now,dt){actx.clearRect(0,0,width,height);if(body.dataset.ambient==='none'||!body.dataset.ambient)return;for(const p of ambient){p.y+=p.speed*dt;p.x+=Math.sin(now*.00018+p.phase)*3*dt;if(p.y>height+20){p.y=-20;p.x=Math.random()*width;}let dx=pointer.x-p.x,dy=pointer.y-p.y,dist=Math.hypot(dx,dy);if(pointer.live&&fine.matches&&dist<150){p.x+=(-dy/dist||0)*18*dt*(1-dist/150);p.y+=(dx/dist||0)*12*dt*(1-dist/150);}if(body.dataset.ambient==='petal')petal(actx,p.x,p.y,p.s,Math.sin(now*.0005+p.phase)*.5,.10);else{actx.globalAlpha=.11;actx.fillStyle=color;actx.beginPath();actx.arc(p.x,p.y,p.s*.14,0,6.28);actx.fill();}}actx.globalAlpha=1;}
  function sharedTransforms(dt){if(width<761||!fine.matches){depths.forEach(d=>{d.value=0;d.el.style.translate='';});tilts.forEach(el=>el.style.transform='');return;}if(magnet&&magnetOrigin&&pointer.live){magnet.style.translate=`${clamp((pointer.x-magnetOrigin.x)*.16,-9,9)}px ${clamp((pointer.y-magnetOrigin.y)*.16,-7,7)}px`;}
    for(const d of depths){const r=d.el.parentElement.getBoundingClientRect(),speed=Number(d.el.dataset.depth)||0,target=clamp((height/2-r.top-r.height/2)*speed,-height*.3,height*.3);d.value+=(target-d.value)*(1-Math.exp(-10*dt));d.el.style.translate=`0 ${d.value.toFixed(2)}px`;}
    if(fine.matches){for(const el of tilts){const r=el.getBoundingClientRect();const inView=r.bottom>0&&r.top<height;el.style.transform=inView&&pointer.live?`perspective(1400px) rotateX(${(-pointer.ny*1.8).toFixed(2)}deg) rotateY(${(pointer.nx*2.6).toFixed(2)}deg)`:'none';}}
  }
  function tick(now){raf=null;if(hidden)return;const dt=clamp((now-last)/1000||1/60,.001,.04);last=now;const total=Math.max(1,document.documentElement.scrollHeight-height);meter.style.transform=`scaleX(${clamp(scrollY/total)})`;
    if(enabled){if(auto){scrollTo({top:Math.min(total,scrollY+dt*110),behavior:'instant'});if(scrollY>=total-2)stopAuto();}drawPointer(now,dt);drawAtmosphere(now,dt);sharedTransforms(dt);}
    const state={time:now,dt,scrollY,width,height,pointer,enabled};for(const callback of callbacks)callback(state);
    if(enabled){raf=requestAnimationFrame(tick);}
  }
  addEventListener('resize',()=>{resize();start();},{passive:true});addEventListener('scroll',()=>{if(!enabled)start();},{passive:true});addEventListener('wheel',stopAuto,{passive:true});addEventListener('touchstart',stopAuto,{passive:true});addEventListener('keydown',e=>{if(['Escape','ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))stopAuto();});
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden){if(raf!==null)cancelAnimationFrame(raf);raf=null;pointer.live=false;resetEffects();}else start();});
  addEventListener('pagehide',()=>{hidden=true;if(raf!==null)cancelAnimationFrame(raf);raf=null;});addEventListener('pageshow',()=>{hidden=document.hidden;start();});
  reduce.addEventListener('change',applyMotion);fine.addEventListener('change',()=>{if(!fine.matches){pointer.live=false;resetEffects();}});
  resize();applyMotion();
  const observer=new IntersectionObserver(entries=>{for(const item of entries){if(!item.isIntersecting)continue;const el=item.target;observer.unobserve(el);if(!enabled)return;const type=el.dataset.reveal;const frames=type==='clip'?[{clipPath:'inset(0 0 100% 0)',transform:'scale(1.04)'},{clipPath:'inset(0 0 0 0)',transform:'scale(1)'}]:[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}];const animation=el.animate(frames,{duration:type==='clip'?1200:800,easing:'cubic-bezier(.2,.65,.1,1)',fill:'none'});revealAnimations.add(animation);animation.finished.then(()=>revealAnimations.delete(animation),()=>revealAnimations.delete(animation));}},{threshold:.12});document.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));
})();
