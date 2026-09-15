import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas=document.querySelector('#game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x101713);
scene.fog=new THREE.FogExp2(0x101713,.016);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,180);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;

scene.add(new THREE.HemisphereLight(0xb7c8b5,0x15110d,2.1));
const sun=new THREE.DirectionalLight(0xffe1b0,3.0);
sun.position.set(-18,28,10);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-38;sun.shadow.camera.right=38;sun.shadow.camera.top=38;sun.shadow.camera.bottom=-38;
scene.add(sun);
scene.add(new THREE.DirectionalLight(0x8ca5c8,.6)).position.set(20,16,-20);

const mat=(c,r=.7,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const stone=mat(0x343934,.88),darkStone=mat(0x242a26,.95),wood=mat(0x392c20,.9),steel=mat(0xbcc5c2,.2,.85),leather=mat(0x241c18,.8),gold=mat(0xc79242,.25,.7);
const forestWood=mat(0x30251b,.95),forestGreen=mat(0x26372b,.98),forestGreen2=mat(0x304331,.98);

const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,180),mat(0x202720,1));
floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const arena=new THREE.Mesh(new THREE.CylinderGeometry(27,29,.45,64),darkStone);arena.position.y=-.22;arena.receiveShadow=true;scene.add(arena);
const inner=new THREE.Mesh(new THREE.RingGeometry(25.5,27,64),mat(0x626458,.8));inner.rotation.x=-Math.PI/2;inner.position.y=.02;scene.add(inner);

function mesh(g,m,p=[0,0,0],s=[1,1,1],shadows=true){const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.castShadow=shadows;o.receiveShadow=shadows;scene.add(o);return o}
function pillar(x,z){mesh(new THREE.CylinderGeometry(1.15,1.45,6,8),darkStone,[x,3,z]);mesh(new THREE.CylinderGeometry(1.55,1.2,.5,8),stone,[x,6.1,z])}
for(let i=0;i<18;i++){const a=i*Math.PI*2/18;pillar(Math.cos(a)*25,Math.sin(a)*25)}
for(let i=0;i<34;i++){const a=Math.random()*Math.PI*2,d=5+Math.random()*19,s=.6+Math.random()*1.1;mesh(new THREE.DodecahedronGeometry(s,0),stone,[Math.cos(a)*d,s*.55,Math.sin(a)*d],[1,.65,.85])}

// Dense forest just outside the arena. Instancing keeps it fast even on school/laptop hardware.
const treeCount=110;
const trunkGeo=new THREE.CylinderGeometry(.28,.45,3.2,7);
const crownGeo=new THREE.ConeGeometry(2.0,4.6,8);
const crown2Geo=new THREE.ConeGeometry(1.55,3.2,8);
const trunks=new THREE.InstancedMesh(trunkGeo,forestWood,treeCount);
const crowns=new THREE.InstancedMesh(crownGeo,forestGreen,treeCount);
const crowns2=new THREE.InstancedMesh(crown2Geo,forestGreen2,treeCount);
trunks.castShadow=trunks.receiveShadow=false;
crowns.castShadow=crowns.receiveShadow=false;
const dummy=new THREE.Object3D();
for(let i=0;i<treeCount;i++){
  const a=Math.random()*Math.PI*2;
  const d=31+Math.random()*27;
  const x=Math.cos(a)*d,z=Math.sin(a)*d;
  const s=.8+Math.random()*1.15;
  dummy.position.set(x,1.6*s,z);dummy.scale.set(s, s*(.9+Math.random()*.25), s);dummy.rotation.y=Math.random()*Math.PI;dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  dummy.position.set(x,4.2*s,z);dummy.scale.set(s,s,s);dummy.rotation.y=Math.random()*Math.PI;dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
  dummy.position.set(x,6.1*s,z);dummy.scale.set(s*.78,s*.8,s*.78);dummy.updateMatrix();crowns2.setMatrixAt(i,dummy.matrix);
}
trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;crowns2.instanceMatrix.needsUpdate=true;
scene.add(trunks,crowns,crowns2);

function torch(x,z){
 const pole=mesh(new THREE.CylinderGeometry(.11,.16,2.4,8),wood,[x,1.2,z]);
 const flame=mesh(new THREE.SphereGeometry(.32,8,6),new THREE.MeshBasicMaterial({color:0xffa23b}),[x,2.65,z],[.7,1.5,.7],false);
 const glow=new THREE.PointLight(0xff8b32,8,8);glow.position.set(x,2.5,z);scene.add(glow);return{flame,glow}
}
const torches=[[-9,-13],[9,-13],[-13,7],[13,7]].map(p=>torch(...p));

// Player: layered fantasy rogue silhouette.
const player=new THREE.Group();player.position.set(0,0,8);scene.add(player);
function part(g,m,p,s=[1,1,1]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.castShadow=true;o.receiveShadow=true;o.parent=player;return o}
part(new THREE.CapsuleGeometry(.52,.35,5,10),leather,[0,1.05,0]);
part(new THREE.CapsuleGeometry(.68,1.0,6,12),mat(0x26343b,.55,.25),[0,1.65,0],[1,.95,.72]);
part(new THREE.CylinderGeometry(.52,.65,.65,8),mat(0x3c4c52,.5,.3),[0,1.8,-.05],[1,.8,.75]);
part(new THREE.SphereGeometry(.48,16,10),mat(0x9a6b4d,.75),[0,2.65,0]);
part(new THREE.SphereGeometry(.61,16,10),mat(0x171d20,.85),[0,2.72,0],[1,1.05,1]);
part(new THREE.SphereGeometry(.38,12,8),mat(0xa87857,.7),[0,2.58,-.34],[.9,.9,.5]);
part(new THREE.BoxGeometry(.95,.18,.72),mat(0x7c2925,.65),[0,2.2,-.05]);
function limb(x,y,z,m){return part(new THREE.CapsuleGeometry(.15,.72,5,7),m,[x,y,z])}
limb(-.66,1.7,0,mat(0x27343a,.6,.2));limb(.66,1.7,0,mat(0x27343a,.6,.2));limb(-.27,.65,0,leather);limb(.27,.65,0,leather);
function dagger(side){const g=new THREE.Group();g.position.set(side*.83,1.48,-.05);g.rotation.z=side<0?.35:-.35;g.parent=player;function add(o){o.castShadow=true;o.receiveShadow=true;o.parent=g;return o}const blade=add(new THREE.Mesh(new THREE.ConeGeometry(.13,1.15,5),steel));blade.position.y=.65;blade.rotation.z=Math.PI;const guard=add(new THREE.Mesh(new THREE.BoxGeometry(.55,.1,.12),gold));guard.position.y=.18;const grip=add(new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.42,8),leather));grip.position.y=-.05;return g}
const daggerL=dagger(-1),daggerR=dagger(1);

let enemies=[],particles=[],keys={},mouse=new THREE.Vector2(),mouseWorld=new THREE.Vector3();
let hp=100,score=0,wave=1,dashTimer=0,attackTimer=0,attackHeld=false,attackSide=-1,playing=false;

function enemy(){const a=Math.random()*Math.PI*2,d=18+Math.random()*5,e=new THREE.Group();e.position.set(Math.cos(a)*d,0,Math.sin(a)*d);e.userData={hp:4+wave*.55,hit:0};
 const body=new THREE.Mesh(new THREE.DodecahedronGeometry(.9,0),mat(0x3d2d2b,.6,.25));body.position.y=1;body.castShadow=true;body.receiveShadow=true;e.add(body);
 const core=new THREE.Mesh(new THREE.SphereGeometry(.25,10,7),new THREE.MeshBasicMaterial({color:0xff6135}));core.position.y=1;e.add(core);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.045,6,20),new THREE.MeshBasicMaterial({color:0xd95536}));ring.position.y=.15;ring.rotation.x=Math.PI/2;e.add(ring);scene.add(e);enemies.push(e)}
function burst(p,c=0xffa43b,n=12){for(let i=0;i<n;i++){const q=new THREE.Mesh(new THREE.IcosahedronGeometry(.06+Math.random()*.07,0),new THREE.MeshBasicMaterial({color:c}));q.position.copy(p);q.userData={v:new THREE.Vector3((Math.random()-.5)*7,Math.random()*7,(Math.random()-.5)*7),life:.65};scene.add(q);particles.push(q)}}
function strike(){if(!playing||attackTimer>0)return;attackTimer=.18;attackSide*=-1;const forward=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));for(const e of [...enemies]){const v=e.position.clone().sub(player.position);v.y=0;const d=v.length();if(d>4.2||!d)continue;if(forward.dot(v.normalize())<-.45)continue;e.userData.hp-=2.4;burst(e.position.clone().add(new THREE.Vector3(0,1,0)),0xff7040,10);if(e.userData.hp<=0){score+=100;burst(e.position,0xffc34d,20);scene.remove(e);enemies.splice(enemies.indexOf(e),1)}}}
function hurt(n){hp=Math.max(0,hp-n);const f=document.querySelector('#damageFlash');if(f){f.style.opacity=.38;setTimeout(()=>f.style.opacity=0,90)}if(hp<=0){playing=false;attackHeld=false;document.querySelector('#messageTitle').textContent='FALLEN';document.querySelector('#messageSub').textContent=`Wave ${wave}  •  ${score} souls`;document.querySelector('#start').textContent='RISE AGAIN';document.querySelector('#message').style.display='grid'}}
function start(){playing=true;hp=100;score=0;wave=1;dashTimer=0;attackTimer=0;attackHeld=false;attackSide=-1;player.position.set(0,0,8);player.rotation.y=0;enemies.forEach(e=>scene.remove(e));enemies=[];for(let i=0;i<5;i++)enemy();document.querySelector('#message').style.display='none';document.querySelector('#hud').style.opacity=1}
document.querySelector('#start').onclick=start;

addEventListener('keydown',e=>{keys[e.code]=true;if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!dashTimer&&playing){let v=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));if(!v.length())v.set(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));player.position.addScaledVector(v.normalize(),5.5);dashTimer=.75;burst(player.position,0xffc04c,16)}});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousedown',e=>{if(e.button!==0||!playing)return;attackHeld=true;updateAim(e.clientX,e.clientY);strike()});
addEventListener('mouseup',e=>{if(e.button===0)attackHeld=false});
addEventListener('mousemove',e=>updateAim(e.clientX,e.clientY));
addEventListener('blur',()=>{attackHeld=false;keys={}});
function updateAim(x,y){mouse.x=x/innerWidth*2-1;mouse.y=-(y/innerHeight*2-1)}
const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function aim(){ray.setFromCamera(mouse,camera);if(!ray.ray.intersectPlane(plane,mouseWorld))return;const a=new THREE.Vector3(mouseWorld.x-player.position.x,0,mouseWorld.z-player.position.z);if(a.lengthSq()>.02)player.rotation.y=Math.atan2(a.x,a.z)}

let last=performance.now();
function loop(t){const dt=Math.min((t-last)/1000,.033);last=t;
 if(playing){
  const mv=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
  if(mv.length())player.position.addScaledVector(mv.normalize(),dt*7);
  player.position.x=THREE.MathUtils.clamp(player.position.x,-20,20);player.position.z=THREE.MathUtils.clamp(player.position.z,-20,20);
  aim();
  if(attackHeld&&attackTimer<=0)strike();
  if(attackTimer>0){attackTimer-=dt;const p=1-Math.max(0,attackTimer)/.18,swing=Math.sin(p*Math.PI),side=attackSide;daggerL.rotation.z=-.35-side*swing*1.9;daggerR.rotation.z=.35-side*swing*1.9;daggerL.rotation.x=side*swing*1.15;daggerR.rotation.x=-side*swing*1.15;if(attackTimer<=0){daggerL.rotation.set(0,0,.35);daggerR.rotation.set(0,0,-.35)}}
  dashTimer=Math.max(0,dashTimer-dt);
  for(const e of enemies){const v=player.position.clone().sub(e.position);v.y=0;const d=v.length();if(d>1.55)e.position.addScaledVector(v.normalize(),dt*(1.35+wave*.1));else if(e.userData.hit<=0){hurt(6);e.userData.hit=.75}else e.userData.hit-=dt;e.children[0].rotation.y+=dt*1.8;e.children[2].rotation.z+=dt*2.4}
  if(!enemies.length){wave++;for(let i=0;i<4+wave*2;i++)enemy()}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.v,dt);p.userData.v.y-=11*dt;if(p.userData.life<=0){scene.remove(p);particles.splice(i,1)}}
  const h=document.querySelector('#healthBar');if(h)h.style.width=hp+'%';const ht=document.querySelector('#healthText');if(ht)ht.textContent=`${Math.ceil(hp)} / 100`;const sc=document.querySelector('#score');if(sc)sc.textContent=score;const w=document.querySelector('#wave');if(w)w.textContent=wave;const db=document.querySelector('#dashBar');if(db)db.style.width=(dashTimer?100:0)+'%';
 }
 camera.position.lerp(new THREE.Vector3(player.position.x,7.2,player.position.z+10.5),.08);camera.lookAt(player.position.x,1.15,player.position.z);
 for(const q of torches){q.flame.scale.y=1.4+Math.sin(t*.018+q.flame.position.x)*.25;q.glow.intensity=7+Math.sin(t*.014+q.flame.position.z)*1.5}
 renderer.render(scene,camera);
 requestAnimationFrame(loop)
}
requestAnimationFrame(loop);
setTimeout(()=>{const l=document.querySelector('#loading');if(l){l.style.opacity=0;setTimeout(()=>l.remove(),500)}},500);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
