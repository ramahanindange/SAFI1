/* ===== SAFI 3D: three cleanser bottles that re-arrange themselves for every section ===== */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv=document.getElementById('s3d');
  function fallback(){document.documentElement.classList.add('no3d');if(cv)cv.remove()}
  if(!window.THREE||!cv){fallback();return}
  let R;try{R=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true})}catch(e){fallback();return}
  if(!R.getContext()){fallback();return}
  R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.1;
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(24,1,.1,200);cam.position.set(0,0,30);
  const C=c=>new THREE.Color(c).convertSRGBToLinear();
  // soft studio environment
  const pm=new THREE.PMREMGenerator(R),es=new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(40,48,24),new THREE.MeshBasicMaterial({color:new THREE.Color(.2,.2,.21),side:THREE.BackSide})));
  const soft=(x,y,z,w,h,k)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(k,k,k),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m)};
  soft(0,18,6,26,14,3);soft(-18,4,10,7,20,2.2);soft(18,2,8,6,18,1.6);soft(0,-8,18,22,5,.8);
  scene.environment=pm.fromScene(es,.05).texture;
  scene.add(new THREE.HemisphereLight(0xffffff,0x303034,.45));
  const key=new THREE.DirectionalLight(0xffffff,1.3);key.position.set(6,12,10);scene.add(key);
  const rim=new THREE.DirectionalLight(0xfff1e6,.9);rim.position.set(-10,4,-8);scene.add(rim);

  const V={
    wine:{base:0xc4463e,inner:0xa5312c,pump:0xd0574e,ink:'rgba(255,214,208,.9)',name:'RED WINE',lines:['REVITALISES','STRENGTHENS','RADIANCE']},
    charcoal:{base:0x6f7074,inner:0x434448,pump:0x2b2c30,ink:'rgba(230,230,234,.9)',name:'CHARCOAL',lines:['OIL','CONTROL','CLEANSER']},
    aloe:{base:0x9bbd86,inner:0x7aa566,pump:0x8db77a,ink:'rgba(236,247,229,.92)',name:'ALOE VERA',lines:['BRIGHTENS','HYDRATES','MOISTURISES']}};
  const FONT='"Inter Tight", "Arial Narrow", sans-serif';
  function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;const redraw=()=>{const x=c.getContext('2d');x.globalAlpha=1;x.clearRect(0,0,w,h);x.save();draw(x,w,h);x.restore();t.needsUpdate=true};redraw();return {t,redraw}}
  const redraws=[];
  // photo-real bottles: each real product photo is wrapped onto a 3D shape built from its own outline
  const BOT=window.__BOT||{};
  // procedural water textures: round beads with dark rim + bright highlight, and running drops with trails
  function dropTex(run){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
    function bead(cx,cy,r,a){const g2=x.createRadialGradient(cx-r*.25,cy-r*.3,r*.05,cx,cy,r);g2.addColorStop(0,'rgba(255,255,255,'+(.7*a)+')');g2.addColorStop(.35,'rgba(235,245,255,'+(.22*a)+')');g2.addColorStop(.78,'rgba(255,255,255,'+(.12*a)+')');g2.addColorStop(.9,'rgba(0,0,0,'+(.42*a)+')');g2.addColorStop(1,'rgba(0,0,0,0)');
      x.fillStyle=g2;x.beginPath();x.ellipse(cx,cy,r,r*1.08,0,0,7);x.fill();x.fillStyle='rgba(255,255,255,'+(.95*a)+')';x.beginPath();x.ellipse(cx-r*.35,cy-r*.38,r*.2,r*.13,-.6,0,7);x.fill();
      x.fillStyle='rgba(255,255,255,'+(.35*a)+')';x.beginPath();x.arc(cx+r*.35,cy+r*.42,r*.08,0,7);x.fill()}
    if(!run){for(let i=0;i<150;i++){const r=Math.random()<.8?3+Math.random()*4.5:8+Math.random()*9;bead(Math.random()*512,Math.random()*512,r,.6+Math.random()*.4)}}
    else{for(let i=0;i<7;i++){const cx=30+Math.random()*450,cy=Math.random()*512,r=6+Math.random()*5;
      const tr=x.createLinearGradient(0,cy-140,0,cy);tr.addColorStop(0,'rgba(255,255,255,0)');tr.addColorStop(1,'rgba(255,255,255,.22)');x.fillStyle=tr;x.fillRect(cx-r*.35,cy-140,r*.7,140);
      for(let k=0;k<5;k++)bead(cx+(Math.random()-.5)*3,cy-30-k*24-Math.random()*8,1.4+Math.random()*1.6,.8);bead(cx,cy,r,1)}}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(run?1.6:2.2,run?2:2.8);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t}
  const DROPS={beads:dropTex(false),run:dropTex(true)};
  const glints=[];
  function glintMat(off){const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},off:{value:off},R:{value:.7}},
    vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float time;uniform float off;uniform float R;varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){float xn=vP.x/R+vP.y*.12;float s=fract(time*.07+off)*3.2-1.6;'+
      'float band=exp(-pow((xn-s)*5.5,2.))*.22+exp(-pow((xn-s+.35)*14.,2.))*.12;float fr=0.;float edge=smoothstep(1.,.55,abs(vP.x/R));'+
      'gl_FragColor=vec4(vec3(1.),(band*edge+fr));}'});glints.push(m);return m}
  function makeBottle(key){
    const d=BOT[key],g=new THREE.Group();
    const HU=4.0,k=HU/d.h;                       // bottle is 4 units tall
    const pts=d.prof.map(([r,y])=>new THREE.Vector2(Math.max(.001,r*k),(d.h-y)*k-1.8));
    pts.reverse();pts.unshift(new THREE.Vector2(.001,pts[0].y));pts.push(new THREE.Vector2(.001,pts[pts.length-1].y));
    const geo=new THREE.LatheGeometry(pts,96),pos=geo.attributes.position,uv=geo.attributes.uv;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);uv.setXY(i,(d.xc+x/k)/d.w,(y+1.8)/HU)}   // project the photo from the front
    uv.needsUpdate=true;
    const tex=new THREE.TextureLoader().load(d.img);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
    const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.04,side:THREE.FrontSide});
    const pg=new THREE.PlaneGeometry(d.w*k,HU);pg.translate((d.w/2-d.xc)*k,HU/2-1.8,0);const m=new THREE.Mesh(pg,mat);m.renderOrder=2;g.add(m);   // exact photo, never stretched
    // droplets only on the body (not the pump), following the same surface
    const maxR=Math.max(...pts.map(v=>v.x)),body=[];for(let i=1;i<pts.length-1;i++){if(pts[i].x>maxR*.62)body.push(pts[i]);else if(body.length>3)break}
    if(body.length>3){const bp=[new THREE.Vector2(.001,body[0].y)].concat(body.map(v=>new THREE.Vector2(v.x*1.006,v.y)),[new THREE.Vector2(.001,body[body.length-1].y)]);
      const dg=new THREE.LatheGeometry(bp,64,-Math.PI*.34,Math.PI*.68);   // front-facing half only
      const beads=new THREE.Mesh(dg,new THREE.MeshBasicMaterial({map:DROPS.beads,transparent:true,depthWrite:false}));beads.renderOrder=4;g.add(beads);
      const run=new THREE.Mesh(dg,new THREE.MeshBasicMaterial({map:DROPS.run,transparent:true,depthWrite:false}));run.renderOrder=5;g.add(run);g.userData.run=run.material.map
      const gl=new THREE.Mesh(new THREE.LatheGeometry(bp,64,-Math.PI*.34,Math.PI*.68),glintMat(Math.random()));gl.material.uniforms.R.value=maxR*.5;gl.renderOrder=6;g.add(gl);}
    return g}
  const bottles={wine:makeBottle('wine'),charcoal:makeBottle('charcoal'),aloe:makeBottle('aloe')};
  const shC=document.createElement('canvas');shC.width=256;shC.height=64;{const x=shC.getContext('2d'),g2=x.createRadialGradient(128,32,0,128,32,128);g2.addColorStop(0,'rgba(0,0,0,.7)');g2.addColorStop(.45,'rgba(0,0,0,.28)');g2.addColorStop(1,'rgba(0,0,0,0)');x.setTransform(1,0,0,.25,0,24);x.fillStyle=g2;x.fillRect(0,0,256,256)}
  const shT=new THREE.CanvasTexture(shC);
  Object.values(bottles).forEach(b=>{const s=new THREE.Mesh(new THREE.PlaneGeometry(2.1,.5),new THREE.MeshBasicMaterial({map:shT,transparent:true,depthWrite:false,opacity:0}));s.position.set(0,-1.8,-.05);s.renderOrder=1;b.add(s);b.userData.sh=s});
  Object.values(bottles).forEach(b=>scene.add(b));
  

  // ---- props ----
  const frame=new THREE.Group();scene.add(frame);
  const rnd=(a,b)=>a+Math.random()*(b-a);
  function noisy(geo,amt,f){const p=geo.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=Math.sin(v.x*f+1.3)*Math.sin(v.y*f*1.3+.7)*Math.sin(v.z*f*.9+2.1)+.5*Math.sin(v.x*f*2.7+v.z*f*2.1);v.multiplyScalar(1+amt*n);p.setXYZ(i,v.x,v.y,v.z)}geo.computeVertexNormals();return geo}
  // stone sphere
  const SC=window.__SCENE||{};
  function photoPlane(d,w){const t=new THREE.TextureLoader().load(d.img);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return new THREE.Mesh(new THREE.PlaneGeometry(w,w*d.h/d.w),new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:.03,depthWrite:false}))}
  const stone=photoPlane(SC.stone,3.15);frame.add(stone);
  // real photo props (cut-out charcoal, berries and aloe leaves) as camera-facing sprites
  const PR=window.__PROPS||{};
  function atlas(key){const clones=[];const t=new THREE.TextureLoader().load(PR[key].img,tx=>clones.forEach(c=>{c.image=tx.image;c.needsUpdate=true}));t.encoding=THREE.sRGBEncoding;t.clones=clones;return t}
  function piece(base,rect,h){const t=base.clone();base.clones.push(t);if(base.image){t.image=base.image;t.needsUpdate=true}t.repeat.set(rect[2],1);t.offset.set(rect[0],0);
    const m=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,alphaTest:.05,depthWrite:false}));m.scale.set(h*rect[4],h,1);m.userData.h=h;m.userData.asp=rect[4];return m}
  // bunches: grape clusters, aloe plant rosettes and charcoal heaps built from the real cut-out photos
  const coalT=atlas('coal'),berT=atlas('berry'),leafT=atlas('leaf');
  function rootTex(){const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');
    function root(x0,y0,ang,len,w,depth){let px=x0,py=y0;x.lineCap='round';
      for(let s=0;s<14;s++){const a2=ang+(Math.random()-.5)*.55;const nx=px+Math.cos(a2)*len/14,ny=py+Math.sin(a2)*len/14;
        const g2=x.createLinearGradient(px,py,nx,ny);g2.addColorStop(0,'#8a6a45');g2.addColorStop(1,'#b08c62');x.strokeStyle=g2;x.lineWidth=Math.max(.6,w*(1-s/14));
        x.beginPath();x.moveTo(px,py);x.lineTo(nx,ny);x.stroke();x.strokeStyle='rgba(255,235,205,.25)';x.lineWidth=Math.max(.3,w*(1-s/14)*.35);x.beginPath();x.moveTo(px-.6,py);x.lineTo(nx-.6,ny);x.stroke();
        if(depth<2&&Math.random()<.22)root(nx,ny,a2+(Math.random()<.5?-1:1)*(.4+Math.random()*.6),len*.55,w*.6,depth+1);px=nx;py=ny;ang=a2}}
    for(let i=0;i<16;i++)root(256+(Math.random()-.5)*150,135+Math.random()*20,Math.PI/2+(Math.random()-.5)*1.1,120+Math.random()*150,3.5+Math.random()*3.5,0);
    x.globalCompositeOperation='destination-in';const fm=x.createRadialGradient(256,170,40,256,230,240);fm.addColorStop(0,'rgba(0,0,0,1)');fm.addColorStop(.7,'rgba(0,0,0,.85)');fm.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=fm;x.fillRect(0,0,512,512);x.globalCompositeOperation='source-over';
    // soil clump on top
    for(let i=0;i<1600;i++){const a2=Math.random()*Math.PI*2,r=Math.sqrt(Math.random());const cx=256+Math.cos(a2)*r*150,cy=118+Math.sin(a2)*r*62;const s2=2+Math.random()*7;
      const v=40+Math.random()*45|0;x.fillStyle='rgba('+(v+28)+','+(v+12)+','+v+','+(.75+Math.random()*.25)+')';x.beginPath();x.ellipse(cx,cy,s2,s2*.8,Math.random()*3,0,7);x.fill()}
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t}
  const ROOT_T=rootTex();
  const mVine=new THREE.MeshStandardMaterial({color:new THREE.Color(0x6e5a33).convertSRGBToLinear(),roughness:.85});
  const mCane=new THREE.MeshStandardMaterial({color:new THREE.Color(0x5a3f26).convertSRGBToLinear(),roughness:.9});
  function vine(g,pts,r,mat){const cu=new THREE.CatmullRomCurve3(pts.map(q=>new THREE.Vector3(q[0],q[1],q[2])));const m=new THREE.Mesh(new THREE.TubeGeometry(cu,24,r,6,false),mat||mVine);m.renderOrder=6;g.add(m);return m}
  function bunchGroup(parent,list){list.forEach(b=>{b.g.userData.base=b.pos;b.g.userData.ph=Math.random()*6;b.g.userData.sw=b.sw||.06;b.g.position.set(...b.pos);b.g.scale.setScalar(b.s||1);b.g.rotation.z=b.rz||0;b.g.userData.rz=b.rz||0;parent.add(b.g)})}
  const grapeT=atlas('grapes'),aloeT=atlas('aloeplant');
  function grapes(){const g=new THREE.Group();const m=piece(grapeT,PR.grapes.rects[0],1.75);m.material.rotation=-.62;m.renderOrder=7;g.add(m);return g}
  function rosette(){const g=new THREE.Group();const m=piece(aloeT,PR.aloeplant.rects[0],2.5);m.renderOrder=7;g.add(m);return g}
  function heap(){const g=new THREE.Group();[[0,0,.62],[-.42,-.05,.5],[.42,-.06,.5],[-.2,.28,.45],[.22,.3,.42],[0,-.25,.4]].forEach(([x,y,h],i)=>{const m=piece(coalT,PR.coal.rects[i%PR.coal.rects.length],h);m.position.set(x,y,i*.01);m.material.rotation=rnd(-.4,.4);m.renderOrder=7;g.add(m)});g.scale.setScalar(1.3);return g}
  const berries=new THREE.Group();frame.add(berries);
  bunchGroup(berries,[{g:grapes(),pos:[-2,1.7,-.4],s:1.2,rz:.25},{g:grapes(),pos:[2,-.7,-.3],s:1.15,rz:-.3},{g:grapes(),pos:[1.7,2.4,-.8],s:.85,rz:-.1},{g:grapes(),pos:[-1.8,-1.9,-.5],s:.9,rz:.4}]);
  const leaves=new THREE.Group();frame.add(leaves);
  bunchGroup(leaves,[{g:rosette(),pos:[-2.0,-1.9,-.6],s:1.2,rz:.04,sw:.03},{g:rosette(),pos:[2.0,-2.1,-.6],s:1.0,rz:-.05,sw:.03},{g:rosette(),pos:[1.8,1.9,-.9],s:.7,rz:.06,sw:.03}]);
  const rocks=new THREE.Group();frame.add(rocks);
  bunchGroup(rocks,[{g:heap(),pos:[-2,1.6,-.4],s:1.25,rz:.2},{g:heap(),pos:[-2.1,-1.2,-.3],s:1.3,rz:-.15},{g:heap(),pos:[1.3,-2.7,-.4],s:1.1,rz:.3},{g:heap(),pos:[-.9,-2.8,-.5],s:.9,rz:-.4}]);
  // podium blocks
  const blocks=new THREE.Group();frame.add(blocks);
  const PF=7.6/SC.podium.w,podium=photoPlane(SC.podium,7.6);podium.position.set(0,-1.5,-.4);blocks.add(podium);
  const seat=k=>{const b=SC.podium.blocks[k],top=-1.5+SC.podium.h*PF/2;return [(b.cx-SC.podium.w/2)*PF,top-b.seat*PF+1.8]};

  // ---- animated water stream that flows around / through the bottles ----
  const waterMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},op:{value:0}},
    vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float time;uniform float op;varying vec2 vUv;varying vec3 vN;varying vec3 vV;'+
      'void main(){float fr=pow(1.-abs(dot(vN,vV)),2.2);float u=vUv.x;float f=u*38.-time*2.2;'+
      'float s1=smoothstep(.72,1.,.5+.5*sin(f+sin(vUv.y*12.566+time*1.7)*1.4));float s2=smoothstep(.8,1.,.5+.5*sin(f*1.7+vUv.y*9.42-time*3.1));'+
      'float ends=smoothstep(0.,.12,u)*smoothstep(1.,.86,u);float a=(.14+fr*.95+s1*.55+s2*.4)*ends*op;'+
      'vec3 col=mix(vec3(.62,.80,.95),vec3(1.),clamp(s1+s2+fr*.4,0.,1.));gl_FragColor=vec4(col,a);}'});
  function stream(points,rad){const curve=new THREE.CatmullRomCurve3(points.map(q=>new THREE.Vector3(q[0],q[1],q[2])));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,260,rad,18,false),waterMat);m.scale.set(1,1,1);m.renderOrder=6;return {m,curve}}
  const helix=[];for(let i=0;i<=60;i++){const t2=i/60,a2=t2*Math.PI*2.6+.6;helix.push([Math.cos(a2)*(1.25+.25*Math.sin(t2*6)),-2.6+t2*5.4,Math.sin(a2)*1.05])}
  const wSingle=stream(helix,.17);frame.add(wSingle.m);
  const sPts=[];for(let i=0;i<=80;i++){const t2=i/80,y=-5.6+t2*14.6;sPts.push([Math.sin(t2*Math.PI*3.1+.4)*1.55,y,Math.cos(t2*Math.PI*3.1+.4)*1.2])}
  const wStack=stream(sPts,.16);frame.add(wStack.m);
  // spray droplets riding the stream
  const dropC=document.createElement('canvas');dropC.width=dropC.height=64;{const x=dropC.getContext('2d'),g2=x.createRadialGradient(26,24,2,32,32,30);g2.addColorStop(0,'rgba(255,255,255,.95)');g2.addColorStop(.3,'rgba(225,240,255,.45)');g2.addColorStop(.85,'rgba(200,225,255,.12)');g2.addColorStop(1,'rgba(200,225,255,0)');x.fillStyle=g2;x.beginPath();x.arc(32,32,30,0,7);x.fill()}
  const dropT=new THREE.CanvasTexture(dropC),spray=new THREE.Group();frame.add(spray);
  for(let i=0;i<40;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dropT,transparent:true,depthWrite:false,opacity:0}));const sz=.05+Math.random()*.11;s.scale.set(sz,sz,1);s.userData={o:Math.random(),sp:.05+Math.random()*.08,j:new THREE.Vector3((Math.random()-.5)*.5,(Math.random()-.5)*.5,(Math.random()-.5)*.5)};spray.add(s)}

  // ---- layouts (local units, before slot scale) ----
  const L={
    stack:{h:16,w:5,b:{wine:[0,-3.14,0, 0,0,.04],charcoal:[.18,1.42,0, 0,0,-.1],aloe:[-.12,5.98,0, 0,0,.13]}},
    trio:{h:7.6,w:7.6,b:{}},
    single:{h:5.4,w:5.2}};
  ['wine','charcoal','aloe'].forEach(k=>{const s=seat(k);L.trio.b[k]=[s[0],s[1],.3,0,0,0]});
  const S={},T={};const keys=['wine','charcoal','aloe'];
  keys.forEach(k=>{S[k]={x:0,y:0,z:0,rx:0,ry:0,rz:0,s:0};T[k]=Object.assign({},S[k])});
  const P={stone:0,rocks:0,berries:0,leaves:0,blocks:0},PT=Object.assign({},P);
  const slots=[...document.querySelectorAll('[data-slot]')].map(el=>({el,sec:el.closest('section,header,footer')||el,cfg:JSON.parse(el.dataset.slot)}));
  window.__safi={variant:'aloe'};
  let mx=0,my=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5},{passive:true});
  let W=0,H=0,D=0;const cvEl=R.domElement;
  function size(force){const cw=cvEl.clientWidth||innerWidth,ch=cvEl.clientHeight||innerHeight,d=Math.min(devicePixelRatio||1,innerWidth<700?1.5:2);
    if(!force&&cw===W&&ch===H&&d===D)return;W=cw;H=ch;D=d;R.setPixelRatio(D);R.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix()}
  size(true);addEventListener('resize',()=>size());addEventListener('orientationchange',()=>setTimeout(()=>size(true),250));
  if(window.visualViewport)visualViewport.addEventListener('resize',()=>size());
  const visH=()=>2*cam.position.z*Math.tan(cam.fov*Math.PI/360);
  function pick(){const mid=H*.5;let best=slots[0],bd=1e9;for(const s of slots){const r=s.sec.getBoundingClientRect();const d=r.top<=mid&&r.bottom>=mid?0:Math.min(Math.abs(r.top-mid),Math.abs(r.bottom-mid));if(d<bd){bd=d;best=s}}return best}
  let spin=0,last=performance.now(),first=true,F={x:0,y:0,s:1};
  function tick(t){if(document.hidden){requestAnimationFrame(tick);return}size();const dt=Math.min(.05,(t-last)/1000);last=t;
    const s=pick(),r=s.el.getBoundingClientRect(),c=s.cfg,k=visH()/H,lay=L[c.lay]||L.single;
    const cx=((r.left+r.width/2)-W/2)*k,cy=-((r.top+r.height/2)-H/2)*k,sc=Math.min(r.width*k/lay.w,r.height*k/lay.h)*(c.z||1);
    if(!reduce)spin+=dt*(c.spin||.4);
    const variant=c.v==='quiz'?window.__safi.variant:c.v;
    keys.forEach(kk=>{const t2=T[kk];
      if(c.lay==='stack'||c.lay==='trio'){const b=lay.b[kk];t2.x=b[0];t2.y=b[1];t2.z=b[2];const still=c.lay==='trio';t2.rx=0;t2.ry=0;t2.rz=still?0:b[5]+(reduce?0:Math.sin(t/1600+keys.indexOf(kk))*.025);t2.s=1}
      else if(kk===variant){t2.x=0;t2.y=0;t2.z=0;t2.rx=0;t2.ry=0;t2.rz=-.12+(reduce?0:Math.sin(t/1400)*.04+mx*.05);t2.s=1.45}
      else{t2.x=0;t2.y=-1.5;t2.z=-4;t2.rx=0;t2.ry=0;t2.rz=0;t2.s=0}});
    PT.stone=c.lay==='stack'?1:0;PT.blocks=c.lay==='trio'?1:0;const pr=c.props!==false&&c.lay==='single';PT.rocks=(pr&&variant==='charcoal')?1:0;PT.berries=(pr&&variant==='wine')?1:0;PT.leaves=(pr&&variant==='aloe')?1:0;
    const a=first||reduce?1:1-Math.pow(.006,dt);first=false;
    F.x+=(cx-F.x)*a;F.y+=(cy-F.y)*a;F.s+=(sc-F.s)*a;
    keys.forEach(kk=>{const s2=S[kk],t2=T[kk];for(const p in s2)s2[p]+=(t2[p]-s2[p])*a;const b=bottles[kk];
      const bob=(c.lay==='trio'||reduce)?0:Math.sin(t/1000+keys.indexOf(kk))*.06;b.position.set(F.x+s2.x*F.s,F.y+(s2.y+bob)*F.s,s2.z*F.s);b.userData.sh.material.opacity+=((c.lay==='trio'?.5:c.lay==='stack'?.32:0)-b.userData.sh.material.opacity)*a;b.rotation.set(s2.rx,s2.ry,s2.rz);b.scale.setScalar(Math.max(.0001,s2.s*F.s));b.visible=s2.s>.01});
    for(const p in P)P[p]+=(PT[p]-P[p])*a;
    frame.position.set(F.x,F.y,0);frame.scale.setScalar(F.s);
    stone.position.set(0,-6.52,-.3);stone.scale.setScalar(Math.max(.0001,P.stone));stone.visible=P.stone>.01;
    blocks.scale.setScalar(Math.max(.0001,P.blocks));blocks.visible=P.blocks>.01;
    const tt=reduce?0:t/1000;
    [[rocks,P.rocks],[berries,P.berries],[leaves,P.leaves]].forEach(([G,v])=>{G.visible=v>.01;G.scale.setScalar(Math.max(.0001,v));const mob=W<700;G.children.forEach(b=>{const u=b.userData;b.scale.setScalar((u.s0||(u.s0=b.scale.x))*(mob?.68:1));b.position.set(u.base[0]*(mob?.86:1)*(c.sp||1),u.base[1]+(reduce?0:Math.sin(tt*.9+u.ph)*.12),u.base[2]);b.rotation.z=u.rz+(reduce?0:Math.sin(tt*.7+u.ph)*u.sw)})});
    // water: helix around a single bottle, ribbon weaving through the stack
    const wantS=(c.lay==='single'&&c.water!==false)?1:0,wantK=c.lay==='stack'?1:0;P.ws=(P.ws||0)+(wantS-(P.ws||0))*a;P.wk=(P.wk||0)+(wantK-(P.wk||0))*a;
    waterMat.uniforms.time.value=reduce?0:t/1000;
    wSingle.m.visible=P.ws>.01;wStack.m.visible=P.wk>.01;wSingle.m.material.uniforms.op.value=Math.max(P.ws,P.wk)*.95;
    wSingle.m.scale.setScalar(Math.max(.0001,.85+.15*P.ws));wSingle.m.rotation.y=reduce?0:t/5200;wStack.m.rotation.y=reduce?0:t/7000;
    const cv2=P.ws>=P.wk?wSingle:wStack,cw=P.ws>=P.wk?P.ws:P.wk;spray.visible=false;
    if(spray.visible)spray.children.forEach(s=>{const u=s.userData,k2=((u.o+t/1000*u.sp)%1);const pt=cv2.curve.getPointAt(k2);pt.applyEuler(cv2.m.rotation);s.position.copy(pt).add(u.j);s.material.opacity=cw*.9*Math.sin(k2*Math.PI)});
    Object.values(bottles).forEach(b=>{if(b.userData.run&&!reduce)b.userData.run.offset.y=-(t/1000)*.018});glints.forEach(m=>m.uniforms.time.value=reduce?.3:t/1000);
    R.render(scene,cam);requestAnimationFrame(tick)}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)last=performance.now()});
  requestAnimationFrame(tick);document.documentElement.classList.add('has3d');
})();
