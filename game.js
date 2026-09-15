import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas=document.querySelector('#game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x101713);
scene.fog=new THREE.Fog(0x101713,42,125);

const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,150);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;

scene.add(new THREE.HemisphereLight(0xc5d2c5,0x18130e,2.0));
const sun=new THREE.DirectionalLight(0xffdfad,2.8);
sun.position.set(-20,30,12);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-34;
sun.shadow.camera.right=34;
sun.shadow.camera.top=34;
sun.shadow.camera.bottom=-34;
scene.add(sun);
const fill=new THREE.DirectionalLight(0x8ca4c5,.55);
fill.position.set(20,15,-20);
scene.add(fill);

const mat=(c,r=.75,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const stone=mat(0x343934,.9), darkStone=mat(0x242a26,.96), wood=mat(0x392b20,.95);
const steel=mat(0xbcc5c2,.25,.8), leather=mat(0x241c18,.82), gold=mat(0xc79242,.3,.7);
const forestWood=mat(0x30251b,1), forestGreen=mat(0x26372b,1), forestGreen2=mat(0x344936,1);

function addMesh(geo,material,x=0,y=0,z=0,cast=true,receive=true){
  const o=new THREE.Mesh(geo,material);
  o.position.set(x,y,z);
  o.castShadow=cast;
  o.receiveShadow=receive;
  scene.add(o);
  return o;
}

const floor=addMesh(new THREE.PlaneGeometry(180,180),mat(0x202720,1),0,0,0,false,true);
floor.rotation.x=-Math.PI/2;
const arena=addMesh(new THREE.CylinderGeometry(27,29,.45,64),darkStone,0,-.22,0,false,true);
const ring=addMesh(new THREE.RingGeometry(25.5,27,64),mat(0x626458,.82),0,.02,0,false,false);
ring.rotation.x=-Math.PI/2;

function pillar(x,z){
  addMesh(new THREE.CylinderGeometry(1.15,1.45,6,8),darkStone,x,3,z);
  addMesh(new THREE.CylinderGeometry(1.55,1.2,.5,8),stone,x,6.1,z);
}
for(let i=0;i<18;i++){
  const a=i*Math.PI*2/18;
  pillar(Math.cos(a)*25,Math.sin(a)*25);
}

for(let i=0;i<28;i++){
  const a=Math.random()*Math.PI*2;
  const d=5+Math.random()*19;
  const s=.55+Math.random()*.8;
  const rock=addMesh(new THREE.DodecahedronGeometry(s,0),stone,Math.cos(a)*d,s*.5,Math.sin(a)*d,true,true);
  rock.scale.set(1,.65,.85);
}

const treeCount=90;
const trunkGeo=new THREE.CylinderGeometry(.3,.48,3.4,7);
const crownGeo=new THREE.ConeGeometry(2.05,4.8,8);
const crown2Geo=new THREE.ConeGeometry(1.55,3.4,8);
const trunks=new THREE.InstancedMesh(trunkGeo,forestWood,treeCount);
const crowns=new THREE.InstancedMesh(crownGeo,forestGreen,treeCount);
const crowns2=new THREE.InstancedMesh(crown2Geo,forestGreen2,treeCount);
trunks.castShadow=false;trunks.receiveShadow=false;
crowns.castShadow=false;crowns.receiveShadow=false;
crowns2.castShadow=false;crowns2.receiveShadow=false;
const dummy=new THREE.Object3D();
for(let i=0;i<treeCount;i++){
  const a=Math.random()*Math.PI*2;
  const d=31+Math.random()*28;
  const x=Math.cos(a)*d,z=Math.sin(a)*d;
  const s=.8+Math.random()*1.15;
  dummy.position.set(x,1.7*s,z);
  dummy.scale.set(s,s,s);
  dummy.rotation.y=Math.random()*Math.PI;
  dummy.updateMatrix();
  trunks.setMatrixAt(i,dummy.matrix);
  dummy.position.set(x,4.2*s,z);
  dummy.scale.set(s,s,s);
  dummy.updateMatrix();
  crowns.setMatrixAt(i,dummy.matrix);
  dummy.position.set(x,6.15*s,z);
  dummy.scale.set(s*.78,s*.8,s*.78);
  dummy.updateMatrix();
  crowns2.setMatrixAt(i,dummy.matrix);
}
trunks.instanceMatrix.needsUpdate=true;
crowns.instanceMatrix.needsUpdate=true;
crowns2.instanceMatrix.needsUpdate=true;
scene.add(trunks,crowns,crowns2);

function torch(x,z){
  addMesh(new THREE.CylinderGeometry(.11,.16,2.4,8),wood,x,1.2,z);
  const flame=addMesh(new THREE.SphereGeometry(.3,8,6),new THREE.MeshBasicMaterial({color:0xffa23b}),x,2.65,z,false,false);
  flame.scale.set(.7,1.5,.7);
  const glow=new THREE.PointLight(0xff8b32,7,8);
  glow.position.set(x,2.5,z);
  scene.add(glow);
  return {flame,glow};
}
const torches=[[-9,-13],[9,-13],[-13,7],[13,7]].map(p=>torch(p[0],p[1]));

// Player.
const player=new THREE.Group();
player.position.set(0,0,8);
scene.add(player);
function part(geo,material,x,y,z,sx=1,sy=1,sz=1){
  const o=new THREE.Mesh(geo,material);
  o.position.set(x,y,z);
  o.scale.set(sx,sy,sz);
  o.castShadow=true;o.receiveShadow=true;o.parent=player;
  return o;
}
part(new THREE.CapsuleGeometry(.52,.35,5,10),leather,0,1.05,0);
part(new THREE.CapsuleGeometry(.68,1,6,12),mat(0x26343b,.55,.25),0,1.65,0,1,.95,.72);
part(new THREE.CylinderGeometry(.52,.65,.65,8),mat(0x3c4c52,.5,.3),0,1.8,-.05,1,.8,.75);
part(new THREE.SphereGeometry(.48,16,10),mat(0x9a6b4d,.75),0,2.65,0);
part(new THREE.SphereGeometry(.61,16,10),mat(0x171d20,.85),0,2.72,0,1,1.05,1);
part(new THREE.SphereGeometry(.38,12,8),mat(0xa87857,.7),0,2.58,-.34,.9,.9,.5);
part(new THREE.BoxGeometry(.95,.18,.72),mat(0x7c2925,.65),0,2.2,-.05);
part(new THREE.CapsuleGeometry(.15,.72,5,7),mat(0x27343a,.6,.2),-.66,1.7,0);
part(new THREE.CapsuleGeometry(.15,.72,5,7),mat(0x27343a,.6,.2),.66,1.7,0);
part(new THREE.CapsuleGeometry(.15,.72,5,7),leather,-.27,.65,0);
part(new THREE.CapsuleGeometry(.15,.72,5,7),leather,.27,.65,0);

function dagger(side){
  const g=new THREE.Group();
  g.position.set(side*.83,1.48,-.05);
  g.rotation.z=side<0?.35:-.35;
  g.parent=player;
  const blade=new THREE.Mesh(new THREE.ConeGeometry(.13,1.15,5),steel);
  blade.position.y=.65;blade.rotation.z=Math.PI;blade.castShadow=true;blade.parent=g;
  const guard=new THREE.Mesh(new THREE.BoxGeometry(.55,.1,.12),gold);
  guard.position.y=.18;guard.castShadow=true;guard.parent=g;
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.42,8),leather);
  grip.position.y=-.05;grip.castShadow=true;grip.parent=g;
  return g;
}
const daggerL=dagger(-1),daggerR=dagger(1);

// Player visibility safeguard.
player.visible=true;
player.traverse(o=>{
  if(o.isMesh){
    o.visible=true;
    o.frustumCulled=false;
    o.renderOrder=1000;
    if(o.material && o.material.isMeshStandardMaterial){
      o.material=o.material.clone();
      o.material.emissive=o.material.color.clone();
      o.material.emissiveIntensity=.35;
    }
  }
});
const playerLight=new THREE.PointLight(0xffd18a,2.2,7);
playerLight.position.set(0,2.2,.2);
player.add(playerLight);

let enemies=[];
let particles=[];
let keys={};
let mouse=new THREE.Vector2(0,0);
const mouseWorld=new THREE.Vector3();
let hp=100,score=0,wave=1,dashTimer=0,attackTimer=0,attackHeld=false,attackSide=-1,playing=false;

function spawnEnemy(){
  const a=Math.random()*Math.PI*2;
  const d=18+Math.random()*5;
  const e=new THREE.Group();
  e.position.set(Math.cos(a)*d,0,Math.sin(a)*d);
  e.userData={hp:4+wave*.55,hit:0};
  const body=new THREE.Mesh(new THREE.DodecahedronGeometry(.9,0),mat(0x3d2d2b,.6,.25));
  body.position.y=1;body.castShadow=true;e.add(body);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.25,10,7),new THREE.MeshBasicMaterial({color:0xff6135}));
  core.position.y=1;e.add(core);
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.05,.045,6,20),new THREE.MeshBasicMaterial({color:0xd95536}));
  orbit.position.y=.15;orbit.rotation.x=Math.PI/2;e.add(orbit);
  scene.add(e);enemies.push(e);
}

function burst(pos,color=0xffa43b,count=10){
  for(let i=0;i<count;i++){
    const p=new THREE.Mesh(new THREE.IcosahedronGeometry(.065,0),new THREE.MeshBasicMaterial({color}));
    p.position.copy(pos);
    p.userData={v:new THREE.Vector3((Math.random()-.5)*7,Math.random()*7,(Math.random()-.5)*7),life:.55};
    scene.add(p);particles.push(p);
  }
}

function strike(){
  if(!playing||attackTimer>0)return;
  attackTimer=.18;
  attackSide*=-1;
  const forward=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));
  for(const e of [...enemies]){
    const v=e.position.clone().sub(player.position);v.y=0;
    const d=v.length();
    if(d>4.2||d===0)continue;
    if(forward.dot(v.normalize())<-.45)continue;
    e.userData.hp-=2.4;
    burst(e.position.clone().add(new THREE.Vector3(0,1,0)),0xff7040,8);
    if(e.userData.hp<=0){
      score+=100;burst(e.position,0xffc34d,16);scene.remove(e);
      enemies.splice(enemies.indexOf(e),1);
    }
  }
}

function hurt(amount){
  hp=Math.max(0,hp-amount);
  const flash=document.querySelector('#damageFlash');
  if(flash){flash.style.opacity=.38;setTimeout(()=>flash.style.opacity=0,90)}
  if(hp<=0){
    playing=false;attackHeld=false;
    document.querySelector('#messageTitle').textContent='FALLEN';
    document.querySelector('#messageSub').textContent=`Wave ${wave}  •  ${score} souls`;
    document.querySelector('#start').textContent='RISE AGAIN';
    document.querySelector('#message').style.display='grid';
  }
}

function start(){
  playing=true;hp=100;score=0;wave=1;dashTimer=0;attackTimer=0;attackHeld=false;attackSide=-1;
  player.position.set(0,0,8);player.rotation.y=0;
  for(const e of enemies)scene.remove(e);
  enemies=[];
  for(let i=0;i<5;i++)spawnEnemy();
  document.querySelector('#message').style.display='none';
  document.querySelector('#hud').style.opacity=1;
}
document.querySelector('#start').onclick=start;

addEventListener('keydown',e=>{
  keys[e.code]=true;
  if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!dashTimer&&playing){
    let v=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
    if(v.lengthSq()===0)v.set(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));
    player.position.addScaledVector(v.normalize(),5.5);
    dashTimer=.75;
    burst(player.position,0xffc04c,12);
  }
});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousedown',e=>{if(e.button===0&&playing){attackHeld=true;updateAim(e.clientX,e.clientY);strike()}});
addEventListener('mouseup',e=>{if(e.button===0)attackHeld=false});
addEventListener('mousemove',e=>updateAim(e.clientX,e.clientY));
addEventListener('blur',()=>{attackHeld=false;keys={};});
function updateAim(x,y){mouse.x=x/innerWidth*2-1;mouse.y=-(y/innerHeight*2-1);}

const ray=new THREE.Raycaster();
const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function aim(){
  ray.setFromCamera(mouse,camera);
  if(!ray.ray.intersectPlane(plane,mouseWorld))return;
  const x=mouseWorld.x-player.position.x,z=mouseWorld.z-player.position.z;
  if(x*x+z*z>.02)player.rotation.y=Math.atan2(x,z);
}

let last=performance.now();
function loop(now){
  const dt=Math.min((now-last)/1000,.033);last=now;

  if(playing){
    const mv=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
    if(mv.lengthSq()>0)player.position.addScaledVector(mv.normalize(),dt*7);
    player.position.x=THREE.MathUtils.clamp(player.position.x,-20,20);
    player.position.z=THREE.MathUtils.clamp(player.position.z,-20,20);
    aim();

    if(attackHeld&&attackTimer<=0)strike();
    if(attackTimer>0){
      attackTimer-=dt;
      const p=1-Math.max(0,attackTimer)/.18;
      const swing=Math.sin(p*Math.PI);
      const side=attackSide;
      daggerL.rotation.z=-.35-side*swing*1.9;
      daggerR.rotation.z=.35-side*swing*1.9;
      daggerL.rotation.x=side*swing*1.15;
      daggerR.rotation.x=-side*swing*1.15;
      if(attackTimer<=0){daggerL.rotation.set(0,0,.35);daggerR.rotation.set(0,0,-.35);}
    }

    dashTimer=Math.max(0,dashTimer-dt);
    for(const e of enemies){
      const v=player.position.clone().sub(e.position);v.y=0;
      const d=v.length();
      if(d>1.55)e.position.addScaledVector(v.normalize(),dt*(1.35+wave*.1));
      else if(e.userData.hit<=0){hurt(6);e.userData.hit=.75;}
      else e.userData.hit-=dt;
      e.children[0].rotation.y+=dt*1.8;
      e.children[2].rotation.z+=dt*2.4;
    }

    if(enemies.length===0){
      wave++;
      for(let i=0;i<Math.min(12,4+wave*2);i++)spawnEnemy();
    }

    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.userData.life-=dt;
      p.position.addScaledVector(p.userData.v,dt);
      p.userData.v.y-=11*dt;
      if(p.userData.life<=0){scene.remove(p);particles.splice(i,1);}
    }

    const h=document.querySelector('#healthBar');if(h)h.style.width=hp+'%';
    const ht=document.querySelector('#healthText');if(ht)ht.textContent=`${Math.ceil(hp)} / 100`;
    const sc=document.querySelector('#score');if(sc)sc.textContent=score;
    const w=document.querySelector('#wave');if(w)w.textContent=wave;
    const db=document.querySelector('#dashBar');if(db)db.style.width=(dashTimer?100:0)+'%';
  }

  camera.position.lerp(new THREE.Vector3(player.position.x,7.2,player.position.z+10.5),.08);
  camera.lookAt(player.position.x,1.15,player.position.z);
  for(const q of torches){q.flame.scale.y=1.4+Math.sin(now*.018+q.flame.position.x)*.25;q.glow.intensity=6.5+Math.sin(now*.014+q.flame.position.z)*1.2;}
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setTimeout(()=>{
  const loading=document.querySelector('#loading');
  if(loading){loading.style.opacity=0;setTimeout(()=>loading.remove(),500);}
},500);

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});