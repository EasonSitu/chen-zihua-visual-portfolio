(()=>{'use strict';
 const demo=window.PortfolioDemo,scene=document.querySelector('.gallery-scene'),track=document.querySelector('[data-scroll-scene]'),room=document.querySelector('.far-room');
 const reading=document.querySelector('.story-reading');reading.classList.add('room-reading');scene.append(reading);
 const portal=document.createElement('div');portal.className='room-portal';portal.setAttribute('aria-hidden','true');portal.innerHTML='<div class="second-room"></div>';scene.append(portal);
 const second=portal.firstElementChild,jamb=document.createElement('div');jamb.className='door-jamb';jamb.setAttribute('aria-hidden','true');scene.append(jamb);
 const caption=document.createElement('div');caption.className='room-caption';caption.innerHTML='<span data-en="02 / THE READING ROOM" data-zh="02 / 閱讀展室">02 / THE READING ROOM</span><strong data-en="A closer look." data-zh="走近，讀懂。">A closer look.</strong>';scene.append(caption);
 const compare=document.createElement('a');compare.className='demo-comparison';compare.href='../c-light-gallery/';compare.innerHTML='<span data-en="Compare original C ↗" data-zh="對比原版 C ↗">Compare original C ↗</span>';document.body.append(compare);
 const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)},lerp=(a,b,v)=>a+(b-a)*v;
 const vertical=matchMedia('(max-width:900px),(pointer:coarse),(prefers-reduced-motion:reduce)');
 // One textured WebGL plane per room, with spatially masked motion. Architecture
 // remains fixed: only foliage, water and their projected light are displaced.
 const vertex='attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
 const fragment=`precision mediump float;
 varying vec2 v;uniform sampler2D photo;uniform vec2 size;uniform vec2 imageSize;uniform float time;uniform float motion;uniform float salon;
 float bell(float x,float c,float r){return exp(-pow((x-c)/r,2.));}
 float wind(float t){return sin(t*.63)*.62+sin(t*1.13+.8)*.25+sin(t*.27+2.)*.13;}
 void main(){
 vec2 uv=vec2(v.x,1.-v.y);float ar=size.x/size.y;float ir=imageSize.x/imageSize.y;
 vec2 fit=ar>ir?vec2(1.,ir/ar):vec2(ar/ir,1.);uv=(uv-.5)*fit+.5;vec2 p=uv;
 float t=time;float w=wind(t);float foliage=bell(p.x,.21,.12)*bell(p.y,.39,.25)+bell(p.x,.45,.16)*bell(p.y,.09,.065)+bell(p.x,.48,.17)*bell(p.y,.46,.13);
 // Reduce motion around the dark straight mullions; avoid rubber architecture.
 foliage*=1.-.96*bell(p.x,.191,.009);foliage*=1.-.92*bell(p.x,.355,.009);foliage*=1.-.9*bell(p.y,.602,.022);
 float rigid=(1.-bell(p.x,.097,.014))*(1.-bell(p.x,.191,.025))*(1.-bell(p.x,.266,.015))*(1.-bell(p.x,.355,.022)); foliage*=rigid; float water=smoothstep(.60,.68,p.y)*(1.-smoothstep(.07,.39,p.x))*rigid;
 float shadows=mix(bell(p.x,.11,.095)*bell(p.y,.4,.23)+bell(p.x,.52,.34)*bell(p.y,.82,.17),bell(p.x,.58,.26)*bell(p.y,.47,.23),salon);
 uv.x+=motion*(foliage*(.0064*w+.0012*sin(t*1.8+p.y*24.))*(1.-smoothstep(.1,.58,p.y))+shadows*rigid*.0024*w);
 float ripple=sin(p.y*195.+t*.75+p.x*25.)*.54+sin(p.y*323.-t*1.04+p.x*54.)*.29+sin(p.y*99.+t*.42)*.17;
 uv.x+=motion*water*ripple*.0019;uv.y+=motion*water*sin(p.x*43.+t*.57+p.y*61.)*.0008;
 vec3 col=texture2D(photo,uv).rgb;
 float caustic=sin(p.x*45.+p.y*62.+t*.21+sin(p.y*53.-t*.32)*1.4)*sin(p.x*23.-p.y*41.-t*.19);
 float ceiling=bell(p.y,.13,.13)*bell(p.x,.53,.43);float floor=bell(p.y,.84,.12)*bell(p.x,.53,.38);
 col+=motion*vec3(.022,.020,.014)*(water*ripple*.7+(ceiling+floor)*caustic*.6);
 // Tree-shadow contrast follows exactly the same wind as foliage, softly.
 col*=1.-motion*shadows*(.004*w+.003*sin(t*.63+p.x*21.));
 gl_FragColor=vec4(col,1.);
 }`;
 function surface(parent,url,salon){
  const canvas=document.createElement('canvas');canvas.className='living-surface';canvas.setAttribute('aria-hidden','true');canvas.style.visibility='hidden';parent.append(canvas);
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl){canvas.remove();return()=>{};}
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){console.warn('Living room renderer unavailable',e.message);canvas.remove();return()=>{};}
  gl.useProgram(program);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(['size','imageSize','time','motion','salon'].map(k=>[k,gl.getUniformLocation(program,k)]));const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const image=new Image();let ready=false,lost=false;image.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);ready=true;canvas.style.visibility='visible';document.body.dataset[salon?'salonRenderer':'livingRenderer']='webgl';draw({time:performance.now(),dt:0,enabled:demo.enabled});};image.src=url;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;canvas.style.display='none';});canvas.addEventListener('webglcontextrestored',()=>location.reload());
  let last=-100,clock=0;
  function draw(state){if(!ready||lost||state.time-last<32)return;const elapsed=Math.min(.08,Math.max(0,(state.time-last)/1000));last=state.time;if(state.enabled)clock+=elapsed;const dpr=Math.min(devicePixelRatio,1.4),w=Math.round(parent.clientWidth*dpr),h=Math.round(parent.clientHeight*dpr);if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.useProgram(program);gl.uniform2f(uniforms.size,w,h);gl.uniform2f(uniforms.imageSize,image.naturalWidth,image.naturalHeight);gl.uniform1f(uniforms.time,clock);gl.uniform1f(uniforms.motion,state.enabled?1:0);gl.uniform1f(uniforms.salon,salon?1:0);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.renderTime=clock.toFixed(3);} return draw;
 }
 const drawRoom=surface(room,'../shared/assets/room-c.png',false),drawSecond=surface(second,'../shared/assets/room-c-salon.png',true);
 const heading=document.querySelector('.gallery-intro'),works=document.querySelector('.gallery-works'),glass=document.querySelector('.middle-glass'),walls=[...document.querySelectorAll('.wall-copy')];let camera=0;
 const chapters=[...document.querySelectorAll('[data-chapter]')];chapters.forEach(b=>b.dataset.targetProgress=({xhs:.04,creators:.18,content:.32})[b.dataset.chapter]);
 const workLink=document.querySelector('.gallery-nav a');workLink.addEventListener('click',e=>{if(vertical.matches)return;e.preventDefault();scrollTo({top:track.offsetTop+(track.offsetHeight-innerHeight)*.88,behavior:demo.enabled?'smooth':'instant'});});
 demo.onFrame(state=>{
  drawRoom(state);drawSecond(state);const range=Math.max(1,track.offsetHeight-scene.offsetHeight),target=vertical.matches?0:clamp(-track.getBoundingClientRect().top/range);camera+= (target-camera)*(state.enabled?1-Math.exp(-9*state.dt):1);
  const walk=smooth((camera-.35)/.42),enter=smooth((camera-.63)/.15),read=smooth((camera-.75)/.12),approach=clamp(camera/.35);
  document.body.dataset.journey=vertical.matches?'vertical':camera<.35?'gallery':camera<.77?'threshold':'salon';document.body.dataset.camera=camera.toFixed(4);
  if(vertical.matches){reading.style.opacity='1';reading.style.pointerEvents='auto';reading.inert=false;works.inert=false;works.style.pointerEvents='auto';works.style.opacity='1';works.style.transform='none';room.style.opacity='1';heading.style.opacity='1';return;}
  room.style.transform=`translate(${-walk*31}%,${walk*2}%) scale(${1.02+walk*1.5})`;room.style.opacity=1-enter;
  heading.style.opacity=1-smooth((camera-.3)/.11);heading.style.transform=`translateY(${-walk*90}px)`;
  works.style.opacity=1-smooth((camera-.34)/.17);works.style.transform=`translate(${-walk*36}%,${walk*6}%) scale(${1+walk*.4})`;works.style.pointerEvents=camera<.49?'auto':'none';works.inert=camera>.5;
  glass.style.opacity=.25*(1-walk);walls.forEach(w=>w.style.opacity=.7*(1-walk));
  // View through the existing glass bay expands continuously until its jamb
  // passes the camera; no full-screen fade or detached next-section reveal.
  const left=lerp(70,-8,walk),right=lerp(14,-8,walk),top=lerp(29,-8,walk),bottom=lerp(8,-8,walk);
  portal.style.clipPath=`inset(${top}% ${right}% ${bottom}% ${left}%)`;portal.style.opacity=smooth((camera-.36)/.08);
  second.style.transform=`scale(${1.20-walk*.20})`;
  jamb.style.left=left+'%';jamb.style.top=top+'%';jamb.style.width=(100-left-right)+'%';jamb.style.height=(100-top-bottom)+'%';jamb.style.opacity=smooth((camera-.36)/.07)*(1-smooth((walk-.86)/.14));
  reading.style.opacity=read;reading.style.transform=`translateY(${(1-read)*28}px)`;reading.style.pointerEvents=read>.9?'auto':'none';reading.inert=read<.9;
  caption.style.opacity=read;document.body.dataset.roomReadReady=String(read>.9);
 });
 window.addEventListener('demo:language',()=>{caption.querySelectorAll('[data-en]').forEach(el=>el.textContent=el.dataset[demo.lang]);compare.firstElementChild.textContent=compare.firstElementChild.dataset[demo.lang];});
})();





