import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ─────────── LOADER ─────────── */
let loadPct = 0;
const loaderFill = document.getElementById('loader-fill');
const loaderPct  = document.getElementById('loader-pct');
const loaderEl   = document.getElementById('loader');
const iv = setInterval(()=>{
  loadPct += Math.random()*12;
  if(loadPct>=100){loadPct=100;clearInterval(iv);
    setTimeout(()=>{
      if(loaderEl) { loaderEl.style.transition='opacity .8s'; loaderEl.style.opacity='0';
      setTimeout(()=>loaderEl.style.display='none',800); }
    },300);
  }
  if(loaderFill) loaderFill.style.width=loadPct+'%';
  if(loaderPct) loaderPct.textContent=Math.floor(loadPct)+'%';
},80);

/* ─────────── CURSOR ─────────── */
const cursor=document.getElementById('cursor');
const ring=document.getElementById('cursor-ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;
  if(cursor){cursor.style.left=mx+'px';cursor.style.top=my+'px';}
});
(function animCursor(){requestAnimationFrame(animCursor);
  rx+=(mx-rx)*.12;ry+=(my-ry)*.12;
  if(ring){ring.style.left=rx+'px';ring.style.top=ry+'px';}
})();

/* ─────────── SCROLL REVEAL ─────────── */
const revealEls=document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});
},{threshold:.15});
revealEls.forEach(el=>obs.observe(el));

/* ─────────── STAT COUNTER ─────────── */
const statNums=document.querySelectorAll('.stat-num[data-target]');
const statObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(!e.isIntersecting)return;
    const el=e.target;const target=+el.getAttribute('data-target');
    let cur=0;const step=target/60;
    const t=setInterval(()=>{
      cur=Math.min(cur+step,target);
      el.childNodes[0].nodeValue=Math.floor(cur).toLocaleString();
      if(cur>=target)clearInterval(t);
    },16);
    statObs.unobserve(el);
  });
},{threshold:.5});
statNums.forEach(el=>statObs.observe(el));

/* ═══════════════════════════════════════════
   HERO CANVAS
═══════════════════════════════════════════ */
(function setupHero(){
  const canvas=document.getElementById('hero-canvas');
  if(!canvas) return;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(60,canvas.offsetWidth/canvas.offsetHeight,.1,1000);
  camera.position.set(0,0,8);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(canvas.offsetWidth,canvas.offsetHeight);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;

  scene.add(new THREE.AmbientLight(0xffffff,0.3));
  const dl=new THREE.DirectionalLight(0x00d4ff,2); dl.position.set(5,5,5); scene.add(dl);
  const dl2=new THREE.DirectionalLight(0xff6b00,1.5); dl2.position.set(-5,-3,3); scene.add(dl2);
  const pt=new THREE.PointLight(0x7c3aed,3,20); pt.position.set(0,0,4); scene.add(pt);

  const pCount=2000; const pGeo=new THREE.BufferGeometry(); const pPos=new Float32Array(pCount*3);
  for(let i=0;i<pCount*3;i++)pPos[i]=(Math.random()-.5)*30;
  pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
  scene.add(new THREE.Points(pGeo,new THREE.PointsMaterial({color:0x00d4ff,size:.04,transparent:true,opacity:.6})));

  const rings=[]; const rColors=[0x00d4ff,0xff6b00,0x7c3aed];
  for(let i=0;i<3;i++){
    const r=new THREE.Mesh(new THREE.TorusGeometry(2.5+i*1.2,.012,8,120), new THREE.MeshBasicMaterial({color:rColors[i],transparent:true,opacity:.3-i*.07}));
    r.rotation.x=Math.PI/3*i; r.rotation.z=Math.PI/5*i; scene.add(r); rings.push(r);
  }

  const iGeo=new THREE.IcosahedronGeometry(1.2,1);
  const ico=new THREE.Mesh(iGeo,new THREE.MeshStandardMaterial({color:0x002233,metalness:.9,roughness:.1,emissive:0x001122,emissiveIntensity:.5}));
  scene.add(ico);
  const iWire=new THREE.Mesh(iGeo.clone(),new THREE.MeshBasicMaterial({color:0x00d4ff,wireframe:true,transparent:true,opacity:.2}));
  scene.add(iWire);

  let t=0;
  document.addEventListener('mousemove',e=>{
    const nx=(e.clientX/window.innerWidth-.5)*2; const ny=-(e.clientY/window.innerHeight-.5)*2;
    camera.position.x+=(nx*.5-camera.position.x)*.05; camera.position.y+=(ny*.3-camera.position.y)*.05;
    camera.lookAt(0,0,0);
  });
  window.addEventListener('resize',()=>{ camera.aspect=canvas.offsetWidth/canvas.offsetHeight; camera.updateProjectionMatrix(); renderer.setSize(canvas.offsetWidth,canvas.offsetHeight); });

  (function loop(){
    requestAnimationFrame(loop); t+=.005;
    ico.rotation.y=t*.4; ico.rotation.x=t*.2;
    iWire.rotation.y=-t*.3; iWire.rotation.x=t*.15;
    rings.forEach((r,i)=>{r.rotation.z=t*(0.15+i*.07);r.rotation.y=t*(0.1+i*.05);});
    pt.intensity=2+Math.sin(t*3)*1;
    renderer.render(scene,camera);
  })();
})();

/* ═══════════════════════════════════════════
   DRONE CANVAS — Interactive Explode & Inspect
═══════════════════════════════════════════ */
(function setupDrone() {
  const canvas = document.getElementById('drone-canvas');
  if(!canvas) return;
  const specPanel = document.getElementById('drone-spec-panel');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.offsetWidth / canvas.offsetHeight, 0.1, 200);
  camera.position.set(-3, 2, 5);
  
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.shadowMap.enabled = true;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;

  scene.add(new THREE.AmbientLight(0x112233, 1.5));
  const key = new THREE.DirectionalLight(0x88ddff, 3);
  key.position.set(4, 6, 4); key.castShadow = true; scene.add(key);
  scene.add(new THREE.PointLight(0x00d4ff, 4, 20));

  const partData = [
    { name: 'Carbon Fiber Frame', desc: 'Lightweight and sturdy frame for the drone.', specs: '200mm length, 3mm thickness, carbon fiber material', mfr: 'Tarot' },
    { name: 'Lithium-Polymer Battery', desc: 'High-capacity battery for extended flight time.', specs: '11.1V, 5000mAh, 30C discharge rate', mfr: 'Turnigy' },
    { name: 'HD Camera', desc: 'High-definition camera for aerial photography.', specs: '1080p resolution, 30fps, wide-angle lens', mfr: 'GoPro' },
    { name: 'GPS & Accelerometer Sensor', desc: 'Accurate positioning and orientation sensing.', specs: 'GPS L1 frequency, 3-axis accelerometer', mfr: 'u-blox' },
    { name: 'Brushless DC Motor (FL)', desc: 'High-torque motor for stable flight.', specs: '12V, 2A, 1000KV rating', mfr: 'HobbyKing' },
    { name: 'Brushless DC Motor (FR)', desc: 'High-torque motor for stable flight.', specs: '12V, 2A, 1000KV rating', mfr: 'HobbyKing' },
    { name: 'Brushless DC Motor (RL)', desc: 'High-torque motor for stable flight.', specs: '12V, 2A, 1000KV rating', mfr: 'HobbyKing' },
    { name: 'Brushless DC Motor (RR)', desc: 'High-torque motor for stable flight.', specs: '12V, 2A, 1000KV rating', mfr: 'HobbyKing' },
    { name: 'Carbon Fiber Propeller (FL)', desc: 'Lightweight and durable propeller for efficient flight.', specs: '95mm length, 3mm thickness', mfr: 'DJI' },
    { name: 'Carbon Fiber Propeller (FR)', desc: 'Lightweight and durable propeller for efficient flight.', specs: '95mm length, 3mm thickness', mfr: 'DJI' },
    { name: 'Carbon Fiber Propeller (RL)', desc: 'Lightweight and durable propeller for efficient flight.', specs: '95mm length, 3mm thickness', mfr: 'DJI' },
    { name: 'Carbon Fiber Propeller (RR)', desc: 'Lightweight and durable propeller for efficient flight.', specs: '95mm length, 3mm thickness', mfr: 'DJI' }
  ];

  const droneGroup = new THREE.Group();
  scene.add(droneGroup);
  const parts = [];

  function addPart(geom, matProps, homePos, expTarget, dataIdx, specialRot) {
    const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial(matProps));
    mesh.position.copy(homePos);
    if(specialRot) mesh.rotation.copy(specialRot);
    mesh.userData = { partIdx: dataIdx, isProp: dataIdx >= 8 };
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    droneGroup.add(mesh);
    parts.push({ mesh, home: homePos.clone(), target: expTarget.clone(), data: partData[dataIdx] });
  }

  // 0. Frame (Stylized minimal cylinder with integrated arms)
  const frameGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.35, 8);
  addPart(frameGeom, {color:0x1a1a1a, metalness:0.8, roughness:0.2}, new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0), 0);

  const armGeom = new THREE.BoxGeometry(3.6, 0.15, 0.15);
  const armMat = new THREE.MeshStandardMaterial({color:0x151515, metalness:0.7, roughness:0.3});
  const arm1 = new THREE.Mesh(armGeom, armMat); arm1.rotation.y = Math.PI/4; arm1.castShadow=true; arm1.receiveShadow=true;
  const arm2 = new THREE.Mesh(armGeom, armMat); arm2.rotation.y = -Math.PI/4; arm2.castShadow=true; arm2.receiveShadow=true;
  parts[0].mesh.add(arm1); parts[0].mesh.add(arm2);

  // 1. Battery
  addPart(new THREE.BoxGeometry(0.8, 0.3, 1.2), {color:0x051a2e, metalness:0.4, roughness:0.5}, new THREE.Vector3(0,-0.35,0), new THREE.Vector3(0,-2.0,0), 1);

  // 2. Camera
  addPart(new THREE.BoxGeometry(0.4, 0.4, 0.4), {color:0x111111, metalness:0.9, roughness:0.1}, new THREE.Vector3(0, -0.1, 1.0), new THREE.Vector3(0, -1.0, 2.5), 2);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16), new THREE.MeshStandardMaterial({color:0x00d4ff, emissive:0x00d4ff, emissiveIntensity:0.3}));
  lens.rotation.x = Math.PI/2; lens.position.z = 0.25;
  parts[2].mesh.add(lens);

  // 3. Sensors
  addPart(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16), {color:0x441100, metalness:0.5, roughness:0.5}, new THREE.Vector3(0, 0.3, -0.4), new THREE.Vector3(0, 2.0, -1.0), 3);

  // 4-7. Motors & 8-11. Props
  const mD = 1.27; 
  const posArr = [
    {x: -mD, z: -mD, midx: 4, pidx: 8}, 
    {x:  mD, z: -mD, midx: 5, pidx: 9},
    {x: -mD, z:  mD, midx: 6, pidx: 10},
    {x:  mD, z:  mD, midx: 7, pidx: 11}
  ];

  posArr.forEach(ap => {
    addPart(new THREE.CylinderGeometry(0.2, 0.2, 0.35, 16), {color:0x333333, metalness:0.9, roughness:0.2}, 
      new THREE.Vector3(ap.x, 0.15, ap.z), 
      new THREE.Vector3(ap.x*1.5, 1.2, ap.z*1.5), ap.midx);
      
    // Propeller cross-shape
    const pGeom = new THREE.BoxGeometry(1.6, 0.02, 0.12);
    addPart(pGeom, {color:0x050505, transparent:true, opacity:0.85}, 
      new THREE.Vector3(ap.x, 0.35, ap.z), 
      new THREE.Vector3(ap.x*1.8, 2.5, ap.z*1.8), ap.pidx);
  });

  let isExploded = false;
  let explodeT = 0;
  const btnExplode = document.getElementById('btn-drone-explode');
  if(btnExplode) {
    btnExplode.addEventListener('click', () => {
      isExploded = !isExploded;
      btnExplode.innerText = isExploded ? 'ASSEMBLE' : 'DISASSEMBLE';
      controls.autoRotate = !isExploded;
      if(specPanel) specPanel.style.display = 'none';
      selectedPart = null;
      parts.forEach(p=>p.mesh.material.emissiveIntensity = 0);
    });
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selectedPart = null;

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hit = raycaster.intersectObjects(parts.map(p=>p.mesh))[0];
    if(hit) {
      if(selectedPart) selectedPart.material.emissiveIntensity = 0;
      selectedPart = hit.object;
      selectedPart.material.emissive = new THREE.Color(0x00d4ff);
      selectedPart.material.emissiveIntensity = 0.5;

      const pData = partData[selectedPart.userData.partIdx];
      if(specPanel) {
        document.getElementById('dp-name').innerText = pData.name;
        document.getElementById('dp-desc').innerText = pData.desc;
        document.getElementById('dp-specs').innerText = pData.specs;
        document.getElementById('dp-mfr').innerText = pData.mfr;
        specPanel.style.display = 'block';
      }
    } else {
      if(selectedPart) selectedPart.material.emissiveIntensity = 0;
      selectedPart = null;
      if(specPanel) specPanel.style.display = 'none';
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  });

  let time = 0;
  (function loop() {
    requestAnimationFrame(loop); time += 0.01;
    controls.update();

    explodeT += ( (isExploded ? 1 : 0) - explodeT ) * 0.08;

    parts.forEach(p => {
      p.mesh.position.lerpVectors(p.home, p.target, explodeT);
      if(p.mesh.userData.isProp) p.mesh.rotation.y += 0.4 * Math.max(0, 1 - explodeT * 1.5);
    });

    droneGroup.position.y = Math.sin(time) * 0.1;
    renderer.render(scene, camera);
  })();
})();

/* ═══════════════════════════════════════════
   CAR CANVAS — Engine assembly animation
═══════════════════════════════════════════ */
(function setupCar() {
  const canvas=document.getElementById('car-canvas');
  const section=document.getElementById('car-section');
  if(!canvas) return;

  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0x020408,15,40);
  const camera=new THREE.PerspectiveCamera(55,canvas.offsetWidth/canvas.offsetHeight,.1,200);
  camera.position.set(-3,2,10);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(canvas.offsetWidth,canvas.offsetHeight);
  renderer.shadowMap.enabled=true;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;

  scene.add(new THREE.AmbientLight(0x0a0810,2));
  const key=new THREE.DirectionalLight(0xff8833,3); key.position.set(-5,6,4); key.castShadow=true; scene.add(key);
  const pt1=new THREE.PointLight(0xff6b00,5,20); pt1.position.set(-3,2,2); scene.add(pt1);
  const pt2=new THREE.PointLight(0x0044ff,3,15); pt2.position.set(3,1,-2); scene.add(pt2);
  const pt3=new THREE.PointLight(0x00d4ff,2,12); pt3.position.set(0,-1,5); scene.add(pt3);

  const roadGeo=new THREE.PlaneGeometry(20,60);
  const roadMat=new THREE.MeshStandardMaterial({color:0x0a0a0a,metalness:.1,roughness:.9});
  const road=new THREE.Mesh(roadGeo,roadMat);
  road.rotation.x=-Math.PI/2; road.position.y=-2.5; road.receiveShadow=true; scene.add(road);

  const engineGroup=new THREE.Group(); scene.add(engineGroup);
  const engineParts=[];

  const block=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.2,1.6), new THREE.MeshStandardMaterial({color:0x2a2a2a,metalness:.8,roughness:.2}));
  block.castShadow=true; engineGroup.add(block); engineParts.push({mesh:block,home:new THREE.Vector3(0,0,0)});

  for(let side=0;side<2;side++){
    const head=new THREE.Mesh(new THREE.BoxGeometry(1,.4,1.5), new THREE.MeshStandardMaterial({color:0x1a1a1a,metalness:.9,roughness:.1}));
    head.position.set(side===0?-.6:.6,.9,0); engineGroup.add(head); engineParts.push({mesh:head,home:head.position.clone()});
  }

  for(let i=0;i<2;i++){
    const tMat=new THREE.MeshStandardMaterial({color:0x444400,metalness:.9,roughness:.05,emissive:0x221100,emissiveIntensity:.3});
    const turbo=new THREE.Mesh(new THREE.CylinderGeometry(.22,.18,.55,16), tMat);
    turbo.position.set(i===0?-1.4:1.4,.5,.4); turbo.rotation.z=Math.PI/2;
    engineGroup.add(turbo); engineParts.push({mesh:turbo,home:turbo.position.clone()});
    const blade=new THREE.Mesh(new THREE.TorusGeometry(.15,.03,6,20), tMat.clone());
    blade.position.copy(turbo.position); blade.rotation.copy(turbo.rotation);
    engineGroup.add(blade); engineParts.push({mesh:blade,home:blade.position.clone()});
  }

  for(let i=0;i<4;i++){
    const pipe=new THREE.Mesh(new THREE.TorusGeometry(.15,.04,6,18,Math.PI), new THREE.MeshStandardMaterial({color:0x111100,metalness:.7,roughness:.2,emissive:0x330800,emissiveIntensity:.4}));
    pipe.position.set(i<2?-1.3:1.3,-.3,(i%2===0?-.5:.5)); pipe.rotation.z=Math.PI/2;
    engineGroup.add(pipe); engineParts.push({mesh:pipe,home:pipe.position.clone()});
  }

  for(let i=0;i<6;i++){
    const piston=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.35,12), new THREE.MeshStandardMaterial({color:0xaaaaaa,metalness:.95,roughness:.05}));
    piston.position.set(-.6+(i*.18),0,-.5+(i%3)*.45); engineGroup.add(piston); engineParts.push({mesh:piston,home:piston.position.clone()});
  }

  const crank=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,2.2,12), new THREE.MeshStandardMaterial({color:0x888800,metalness:.95,roughness:.05}));
  crank.position.set(0,-.55,0); crank.rotation.z=Math.PI/2; engineGroup.add(crank); engineParts.push({mesh:crank,home:crank.position.clone()});

  const oilPan=new THREE.Mesh(new THREE.BoxGeometry(2,.3,1.5), new THREE.MeshStandardMaterial({color:0x050505,metalness:.5,roughness:.4}));
  oilPan.position.set(0,-.8,0); engineGroup.add(oilPan); engineParts.push({mesh:oilPan,home:oilPan.position.clone()});

  const carGroup=new THREE.Group(); scene.add(carGroup);
  const carBody=new THREE.Mesh(new THREE.BoxGeometry(3.5,.8,1.8), new THREE.MeshStandardMaterial({color:0xff2200,metalness:.7,roughness:.2,emissive:0x1a0000,emissiveIntensity:.1}));
  carBody.position.set(0,-.8,0); carGroup.add(carBody);
  carGroup.visible=false; carGroup.position.set(0,-5,0);

  const engineExplodeTargets=[
    new THREE.Vector3(0,0,0), new THREE.Vector3(-3,2.5,.5), new THREE.Vector3(3,2.5,.5),
    new THREE.Vector3(-3.5,2.5,1), new THREE.Vector3(-3.5,1.5,.5), new THREE.Vector3(3.5,2.5,1), new THREE.Vector3(3.5,1.5,.5),
    new THREE.Vector3(-2,-1.5,-1), new THREE.Vector3(-2,-1,-1), new THREE.Vector3(2,-1.5,-1), new THREE.Vector3(2,-1,-1),
    new THREE.Vector3(-2,.5,-1.5), new THREE.Vector3(-1.5,.5,-1), new THREE.Vector3(-.5,.5,-1), new THREE.Vector3(.5,.5,-1), new THREE.Vector3(1.5,.5,-1), new THREE.Vector3(2,.5,-1),
    new THREE.Vector3(0,-3.5,0), new THREE.Vector3(0,-3,0)
  ];

  let assembleFactor=0; let carVisible=false; let driftAngle=0; let driftSpeed=0;
  window.addEventListener('scroll',()=>{
    const rect=section.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,-rect.top/Math.max(section.offsetHeight-window.innerHeight,1)));
    assembleFactor=progress;
    carVisible=progress>.7;
    if(carVisible){ driftAngle=((progress-.7)/.3)*Math.PI*.3; driftSpeed=((progress-.7)/.3)*20; }
  });

  document.querySelectorAll('.assemble-part.car').forEach(el=>{
    el.addEventListener('mouseenter',()=>{
      const idx=+el.dataset.part;
      const tMap = {0:0, 1:3, 2:7, 3:11, 4:17};
      const p=engineParts[tMap[idx]];
      if(p){ p.mesh.material.emissive=new THREE.Color(0xff6b00); p.mesh.material.emissiveIntensity=.9; }
    });
    el.addEventListener('mouseleave',()=>{
      const idx=+el.dataset.part;
      const tMap = {0:0, 1:3, 2:7, 3:11, 4:17};
      const p=engineParts[tMap[idx]];
      if(p){ p.mesh.material.emissiveIntensity=0.05; }
    });
  });

  window.addEventListener('resize',()=>{ camera.aspect=canvas.offsetWidth/canvas.offsetHeight; camera.updateProjectionMatrix(); renderer.setSize(canvas.offsetWidth,canvas.offsetHeight); });

  let t=0;
  (function loop(){
    requestAnimationFrame(loop); t+=.01;
    engineParts.forEach((p,i)=>{
      const target=engineExplodeTargets[Math.min(i,engineExplodeTargets.length-1)] || new THREE.Vector3(0,3,0);
      const blend=1-assembleFactor;
      p.mesh.position.x+=(blend*target.x+(assembleFactor)*p.home.x-p.mesh.position.x)*.06;
      p.mesh.position.y+=(blend*target.y+(assembleFactor)*p.home.y-p.mesh.position.y)*.06;
      p.mesh.position.z+=(blend*target.z+(assembleFactor)*p.home.z-p.mesh.position.z)*.06;
    });
    crank.rotation.y=assembleFactor*t*8;
    if(carVisible){
      carGroup.position.y+=((-2.5)-carGroup.position.y)*.08;
      carGroup.rotation.y+=((driftAngle*.6)-carGroup.rotation.y)*.05;
      engineGroup.position.y+=(.3-engineGroup.position.y)*.05;
      engineGroup.scale.setScalar(engineGroup.scale.x+(0.4-engineGroup.scale.x)*.05);
    } else {
      carGroup.position.y+=(-5-carGroup.position.y)*.08;
      engineGroup.scale.setScalar(engineGroup.scale.x+(1-engineGroup.scale.x)*.05);
    }
    pt1.intensity=3+Math.sin(t*6)*1.5;
    renderer.render(scene,camera);
  })();
})();

/* ═══════════════════════════════════════════
   WATCH CANVAS — Assembly with gear mechanics
═══════════════════════════════════════════ */
(function setupWatch() {
  const canvas=document.getElementById('watch-canvas');
  const section=document.getElementById('watch-section');
  if(!canvas) return;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(50,canvas.offsetWidth/canvas.offsetHeight,.1,100);
  camera.position.set(0,3,10);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(canvas.offsetWidth,canvas.offsetHeight);

  scene.add(new THREE.AmbientLight(0x0a0515,3));
  const key=new THREE.DirectionalLight(0xccaaff,4); key.position.set(3,5,4); scene.add(key);

  const watchGroup=new THREE.Group(); scene.add(watchGroup);
  const parts=[];

  const watchCase=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,.5,64), new THREE.MeshStandardMaterial({color:0xaaaacc,metalness:.95,roughness:.05}));
  watchGroup.add(watchCase); parts.push({mesh:watchCase,home:new THREE.Vector3(0,0,0)});

  const dial=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,.08,64), new THREE.MeshStandardMaterial({color:0x050010,metalness:.2,roughness:.8}));
  dial.position.y=.3; watchGroup.add(dial); parts.push({mesh:dial,home:dial.position.clone()});

  const crystal=new THREE.Mesh(new THREE.CylinderGeometry(1.38,1.38,.1,64), new THREE.MeshStandardMaterial({color:0x88aaff,transparent:true,opacity:.25}));
  crystal.position.y=.38; watchGroup.add(crystal); parts.push({mesh:crystal,home:crystal.position.clone()});

  const crown=new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,.35,12), new THREE.MeshStandardMaterial({color:0xcccccc,metalness:.9,roughness:.1}));
  crown.position.set(1.62,.08,0); crown.rotation.z=Math.PI/2; watchGroup.add(crown); parts.push({mesh:crown,home:crown.position.clone()});

  const hrHand=new THREE.Mesh(new THREE.BoxGeometry(.06,.02,.7), new THREE.MeshStandardMaterial({color:0xffffff}));
  hrHand.position.y=.37; watchGroup.add(hrHand); parts.push({mesh:hrHand,home:hrHand.position.clone()});

  const gears=[];
  for(let g=0;g<4;g++){
    const gear=new THREE.Mesh(new THREE.TorusGeometry(.15+g*.1,.025,6,20+g*4), new THREE.MeshStandardMaterial({color:0xffd700}));
    gear.position.set(.5+(g%2)*.25,.34,-.5+(g%2)*.2); watchGroup.add(gear); gears.push({mesh:gear,speed:.5+g*.3,dir:g%2===0?1:-1});
    parts.push({mesh:gear,home:gear.position.clone()});
  }

  const explodeTargets=[
    new THREE.Vector3(0,0,0), new THREE.Vector3(0,3.5,0), new THREE.Vector3(0,5,0), new THREE.Vector3(2.5,.5,0),
    new THREE.Vector3(-1.5,2.5,0), new THREE.Vector3(-2,1,1), new THREE.Vector3(-2.5,1.5,.5), new THREE.Vector3(-2,2,.5), new THREE.Vector3(-3,1.5,1)
  ];

  let assembleFactor=0;
  window.addEventListener('scroll',()=>{
    const rect=section.getBoundingClientRect();
    assembleFactor=Math.max(0,Math.min(1,-rect.top/Math.max(section.offsetHeight-window.innerHeight,1)));
  });

  document.querySelectorAll('.assemble-part.watch').forEach(el=>{
    el.addEventListener('mouseenter',()=>{
      const idx=+el.dataset.part;
      const tMap = {0:0, 1:1, 2:2, 4:4, 5:5};
      const p=parts[tMap[idx]];
      if(p){ p.mesh.material.emissive=new THREE.Color(0x7c3aed); p.mesh.material.emissiveIntensity=.9; }
    });
    el.addEventListener('mouseleave',()=>{
      const idx=+el.dataset.part;
      const tMap = {0:0, 1:1, 2:2, 4:4, 5:5};
      const p=parts[tMap[idx]];
      if(p){ p.mesh.material.emissiveIntensity=0; }
    });
  });

  window.addEventListener('resize',()=>{ camera.aspect=canvas.offsetWidth/canvas.offsetHeight; camera.updateProjectionMatrix(); renderer.setSize(canvas.offsetWidth,canvas.offsetHeight); });

  let t=0;
  (function loop(){
    requestAnimationFrame(loop); t+=.005;
    parts.forEach((p,i)=>{
      const target=explodeTargets[Math.min(i,explodeTargets.length-1)] || new THREE.Vector3(0,2,0);
      const blend=1-assembleFactor;
      p.mesh.position.x+=(blend*target.x+assembleFactor*p.home.x-p.mesh.position.x)*.07;
      p.mesh.position.y+=(blend*target.y+assembleFactor*p.home.y-p.mesh.position.y)*.07;
      p.mesh.position.z+=(blend*target.z+assembleFactor*p.home.z-p.mesh.position.z)*.07;
    });
    watchGroup.rotation.y=t*.2+Math.sin(t*.3)*.1;
    watchGroup.rotation.x=Math.sin(t*.2)*.05+.15;
    gears.forEach(g=>g.mesh.rotation.z+=g.speed*.03*g.dir);
    renderer.render(scene,camera);
  })();
})();

// ═══════════════════════════════════════════════════════════════
// 🔌 BACKEND API CONFIGURATION
// ─────────────────────────────────────────────────────────────
// ✅ LOCAL DEVELOPMENT:  change the URL below to your backend
//    Currently pointing to:  http://localhost:5000
//    If your backend runs on a different port, update it here.
//
// ✅ PRODUCTION / GITHUB / DEPLOYED BACKEND:
//    Replace the URL with your live backend, e.g.:
//    const API_URL = 'https://your-backend.onrender.com/api';
//    const API_URL = 'https://your-api.railway.app/api';
//    const API_URL = 'https://your-custom-domain.com/api';
// ═══════════════════════════════════════════════════════════════
const API_URL = 'http://localhost:5000/api';  // ← CHANGE THIS TO YOUR BACKEND URL

// ── Modal open/close helpers ──────────────────────────────────
window.openLoginModal = () => {
  document.getElementById('login-modal').style.display = 'block';
  document.getElementById('login-error').innerText = '';
};
window.closeLoginModal = () => {
  document.getElementById('login-modal').style.display = 'none';
};
window.openRegisterModal = () => {
  document.getElementById('register-modal').style.display = 'block';
  document.getElementById('register-error').innerText = '';
  document.getElementById('register-success').innerText = '';
};
window.closeRegisterModal = () => {
  document.getElementById('register-modal').style.display = 'none';
};
window.openCartModal = () => { document.getElementById('cart-modal').style.display = 'block'; fetchCart(); };
window.closeCartModal = () => { document.getElementById('cart-modal').style.display = 'none'; };

// ── LOGIN ─────────────────────────────────────────────────────
window.submitLogin = async () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  err.innerText = '';

  if (!username || !password) { err.innerText = 'Please fill in all fields.'; return; }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username || username);
      localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
      closeLoginModal();
      checkAuthStatus();
    } else {
      err.innerText = data.error || data.msg || 'Login failed.';
    }
  } catch (e) {
    err.innerText = 'Network error — make sure the backend is running at ' + API_URL;
  }
};

// ── REGISTER ──────────────────────────────────────────────────
window.submitRegister = async () => {
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const err      = document.getElementById('register-error');
  const success  = document.getElementById('register-success');
  err.innerText = '';
  success.innerText = '';

  if (!username || !email || !password) { err.innerText = 'All fields are required.'; return; }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { err.innerText = 'Please enter a valid email address.'; return; }
  if (password.length < 6) { err.innerText = 'Password must be at least 6 characters.'; return; }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username || username);
      localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
      success.innerText = '✅ Account created! Redirecting...';
      setTimeout(() => { closeRegisterModal(); checkAuthStatus(); }, 1200);
    } else {
      err.innerText = data.error || data.msg || 'Registration failed.';
    }
  } catch (e) {
    err.innerText = 'Network error — make sure the backend is running at ' + API_URL;
  }
};

window.logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('isAdmin');
  checkAuthStatus();
}

function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const btnAdmin = document.getElementById('btn-admin');
  
  if(token) {
    if(document.getElementById('btn-login')) document.getElementById('btn-login').style.display = 'none';
    if(document.getElementById('btn-register')) document.getElementById('btn-register').style.display = 'none';
    if(document.getElementById('btn-logout')) {
      document.getElementById('btn-logout').style.display = 'inline-block';
      let un = localStorage.getItem('username');
      if (isAdmin) un = "ADMIN";
      document.getElementById('btn-logout').innerText = `${un.substring(0,8).toUpperCase()} (LOGOUT)`;
    }
    if (btnAdmin) btnAdmin.style.display = isAdmin ? 'inline-block' : 'none';
    fetchCart();
  } else {
    if(document.getElementById('btn-login')) document.getElementById('btn-login').style.display = 'inline-block';
    if(document.getElementById('btn-register')) document.getElementById('btn-register').style.display = 'inline-block';
    if(document.getElementById('btn-logout')) document.getElementById('btn-logout').style.display = 'none';
    if(document.getElementById('cart-count')) document.getElementById('cart-count').innerText = '0';
    if(btnAdmin) btnAdmin.style.display = 'none';
  }
}


let productCodeMap = {}; // Will be hydrated from backend
let globalProducts = [];

window.addToCart = async (prodKey) => {
  const token = localStorage.getItem('token');
  if(!token) { openLoginModal(); return; }
  const pId = productCodeMap[prodKey] || prodKey; // Can pass key or actual ID
  if (!pId) return;

  try {
    const res = await fetch(`${API_URL}/cart/add`, {
      method: 'POST', headers: {'Content-Type':'application/json', 'x-auth-token':token},
      body: JSON.stringify({productId: pId, quantity: 1})
    });
    if(res.ok) fetchCart();
  } catch(e){ console.error(e); }
}

async function fetchCart() {
  const token = localStorage.getItem('token');
  if(!token) return;
  try {
    const res = await fetch(`${API_URL}/cart`, {
      headers: {'x-auth-token':token}
    });
    if(res.ok) {
      const cart = await res.json();
      let totalQty = 0;
      let ttl = 0;
      cart.forEach(c => totalQty += c.quantity);
      if(document.getElementById('cart-count')) document.getElementById('cart-count').innerText = totalQty;
      
      const cartList = document.getElementById('cart-items');
      if(cartList) {
        cartList.innerHTML = cart.length === 0 ? 'Cart is empty.' : '';
        cart.forEach(item => {
           const label = item.productId.name || 'Product';
           const price = item.productId.price || 0;
           cartList.innerHTML += `<div style="padding:10px; background:rgba(0,212,255,0.05); border:1px solid rgba(0,212,255,0.2); border-radius:4px;">${label.toUpperCase()} <span style="float:right; color:var(--accent);">Qty: ${item.quantity}</span></div>`;
           ttl += item.quantity * price; 
        });
        if(document.getElementById('cart-total')) document.getElementById('cart-total').innerText = ttl.toLocaleString();
      }
    }
  } catch(e){ console.error(e); }
}

window.checkout = async () => {
  const token = localStorage.getItem('token');
  if(!token) return;
  try {
    const res = await fetch(`${API_URL}/orders/checkout`, {
      method: 'POST', headers: {'x-auth-token':token}
    });
    const data = await res.json();
    if(res.ok) {
      alert('Order Placed! ID: ' + data.orderId);
      closeCartModal();
      fetchCart();
    } else {
      alert(data.msg || 'Checkout failed');
    }
  } catch(e){ console.error(e); }
}

async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (res.ok) {
      globalProducts = await res.json();
      
      // Hydrate code map for section links
      const drone = globalProducts.find(p=>p.name.includes('DRONE PRO'));
      const car = globalProducts.find(p=>p.name.includes('VORTEX'));
      const watch = globalProducts.find(p=>p.name.includes('CHRONOS'));
      if(drone) productCodeMap['nexus-drone-pro'] = drone._id;
      if(car) productCodeMap['vortex-v12e'] = car._id;
      if(watch) productCodeMap['chronos-s7'] = watch._id;

      // Render Dynamic grid
      const grid = document.getElementById('dynamic-products-grid');
      if(grid) {
        grid.innerHTML = '';
        globalProducts.forEach((p, idx) => {
          let accent = 'var(--accent)';
          if(p.category.includes('AUTOMOTIVE')) accent = 'var(--accent2)';
          if(p.category.includes('HOROLOGY')) accent = 'var(--accent3)';

          grid.innerHTML += `
            <div class="product-card reveal visible" style="transition-delay:.${idx%5}s">
              <img class="product-img" src="${p.imageUrl}" alt="${p.name}" />
              <div class="product-overlay">
                <div class="product-cat">${p.category}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-price">$${p.price.toLocaleString()}</div>
                <div class="product-action">
                  <button class="product-btn product-btn-buy" style="background:${accent}; border-color:${accent};" onclick="addToCart('${p._id}')">BUY NOW</button>
                  <button class="product-btn product-btn-view" style="color:${accent}; border-color:${accent};">3D VIEW</button>
                </div>
              </div>
            </div>`;
        });
      }
    }
  } catch (e) { console.error('Failed to load products', e); }
}

// Admin Functions
window.openAdminModal = () => {
  document.getElementById('admin-modal').style.display = 'block';
  fetchAdminOrders();
}
window.closeAdminModal = () => { document.getElementById('admin-modal').style.display = 'none'; }

window.submitProduct = async () => {
  const token = localStorage.getItem('token');
  const name = document.getElementById('add-prod-name').value;
  const description = document.getElementById('add-prod-desc').value;
  const price = document.getElementById('add-prod-price').value;
  const category = document.getElementById('add-prod-cat').value;
  const imageUrl = document.getElementById('add-prod-img').value;
  const msg = document.getElementById('admin-prod-msg');

  try {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'x-auth-token': token},
      body: JSON.stringify({name, description, price: Number(price), category, imageUrl})
    });
    if (res.ok) {
      msg.style.color = 'var(--accent)'; msg.innerText = 'Product Added Successfully!';
      fetchProducts(); // Refresh Grid
    } else {
      const err = await res.json();
      msg.style.color = '#f33'; msg.innerText = err.msg || 'Failed to add product';
    }
  } catch (e) { msg.innerText = 'Error saving.'; }
}

async function fetchAdminOrders() {
  const list = document.getElementById('admin-orders-list');
  const token = localStorage.getItem('token');
  try {
    list.innerHTML = 'Loading orders...';
    const res = await fetch(`${API_URL}/orders`, { headers: {'x-auth-token': token} });
    if(res.ok) {
      const orders = await res.json();
      if(orders.length === 0) { list.innerHTML = '<div style="color:var(--text2);">No recent orders found.</div>'; return; }
      list.innerHTML = '';
      orders.forEach(o => {
        let itemsStr = o.products.map(op => `${op.quantity}x ${op.productId?.name || 'Unknown'}`).join(', ');
        list.innerHTML += `
          <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:10px; margin-bottom:10px; border-radius:4px;">
            <div style="color:var(--accent2); font-size:0.85rem; margin-bottom:4px;">Order ID: ${o._id}</div>
            <div style="font-size:0.95rem; color:white; display:flex; justify-content:space-between;">
              <span><strong>User:</strong> ${o.userId?.username || 'Deleted User'}</span>
              <strong style="color:var(--accent);">$${o.totalAmount.toLocaleString()}</strong>
            </div>
            <div style="color:var(--text2); font-size:0.85rem; margin-top:6px;">Items: ${itemsStr}</div>
          </div>
        `;
      });
    } else { list.innerHTML = 'Failed to load orders.'; }
  } catch (e) {
    list.innerHTML = 'Network error loading orders.';
  }
}

// Init
checkAuthStatus();
fetchProducts();
