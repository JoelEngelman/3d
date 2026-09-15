import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas=document.querySelector('#game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x101713);
scene.fog=new THREE.FogExp2(0x101713,.018);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,140);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;

scene.add(new THREE.HemisphereLight(0xb7c8b5,0x15110d,2.2));
const sun=new THREE.DirectionalLight(0xffe1b0,3.2);sun.position.set(-18,28,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
const moon=new THREE.DirectionalLight(0x8ca5c8,.65);moon.position.set(20,16,-20);scene.add(moon);

const mat=(c,r=.7,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const stone=mat(0x343934,.88),darkStone=mat(0x242a26,.95),wood=mat(0x392c20,.9),steel=mat(0xbcc5c2,.2,.85),leather=mat(0x241c18,.8),gold=mat(0xc79242,.25,.7);

const floor=new THREE.Mesh(new THREE.PlaneGeometry(120,120),mat(0x202720,1));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const arena=new THREE.Mesh(new THREE.CylinderGeometry(27,29,.45,64),darkStone);arena.position.y=-.22;arena.receiveShadow=true;scene.add(arena);
const inner=new THREE.Mesh(new THREE.RingGeometry(25.5,27,64),mat(0x626458,.8));inner.rotation.x=-Math.PI/2;inner.position.y=.02;scene.add(inner);

function mesh(g,m,p=[0,0,0],s=[1,1,1]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.castShadow=o.receiveShadow=true;scene.add(o);return o}
function pillar(x,z){mesh(new THREE.CylinderGeometry(1.15,1.45,6,8),darkStone,[x,3,z]);mesh(new THREE.CylinderGeometry(1.55,1.2,.5,8),stone,[x,6.1,z]);}
for(let i=0;i<18;i++){const a=i*Math.PI*2/18;pillar(Math.cos(a)*25,Math.sin(a)*25)}
for(let i=0;i<34;i++){const a=Math.random()*Math.PI*2,d=5+Math.random()*19;const s=.6+Math.random()*1.1;mesh(new THREE.DodecahedronGeometry(s,0),stone,[Math.cos(a)*d,s*.55,Math.sin(a)*d],[1,.65,.85])}

function torch(x,z){const pole=mesh(new THREE.CylinderGeometry(.11,.16,2.4,8),wood,[x,1.2,z]);const flame=mesh(new THREE.SphereGeometry(.32,10,8),new THREE.MeshBasicMaterial({color:0xffa23b}),[x,2.65,z],[.7,1.5,.7]);const glow=new THREE.PointLight(0xff8b32,10,9);glow.position.set(x,2.5,z);scene.add(glow);return {flame,glow}}
const torches=[[-9,-13],[9,-13],[-13,7],[13,7]].map(p=>torch(...p));

// Player: layered, readable fantasy rogue silhouette.
const player=new THREE.Group();player.position.set(0,0,8);scene.add(player);
const hips=mesh(new THREE.CapsuleGeometry(.52,.35,5,12),leather,[0,1.05,0],[1,1,1]);hips.parent=player;
const torso=mesh(new THREE.CapsuleGeometry(.68,1.0,6,14),mat(0x26343b,.55,.25),[0,1.65,0],[1,.95,.72]);torso.parent=player;
const chest=mesh(new THREE.CylinderGeometry(.52,.65,.65,8),mat(0x3c4c52,.5,.3),[0,1.8,-.05],[1,.8,.75]);chest.parent=player;
const head=mesh(new THREE.SphereGeometry(.48,20,14),mat(0x9a6b4d,.75),[0,2.65,0]);head.parent=player;
const hood=mesh(new THREE.SphereGeometry(.61,20,14),mat(0x171d20,.85),[0,2.72,0],[1,1.05,1]);hood.parent=player;
const face=mesh(new THREE.SphereGeometry(.38,16,12),mat(0xa87857,.7),[0,2.58,-.34],[.9,.9,.5]);face.parent=player;
const scarf=mesh(new THREE.BoxGeometry(.95,.18,.72),mat(0x7c2925,.65),[0,2.2,-.05]);scarf.parent=player;
function limb(x,y,z,sx,sy,sz,m){const o=mesh(new THREE.CapsuleGeometry(.15,.72,5,8),m,[x,y,z],[sx,sy,sz]);o.parent=player;return o}
const armL=limb(-.66,1.7,0,1,1,1,mat(0x27343a,.6,.2)),armR=limb(.66,1.7,0,1,1,1,mat(0x27343a,.6,.2));
const legL=limb(-.27,.65,0,.95,1.05,1,leather),legR=limb(.27,.65,0,.95,1.05,1,leather);

function dagger(side){const g=new THREE.Group();const blade=mesh(new THREE.ConeGeometry(.13,1.15,5),steel,[0,.65,0],[1,1,1]);blade.rotation.z=Math.PI;blade.parent=g;const guard=mesh(new THREE.BoxGeometry(.55,.1,.12),gold,[0,.18,0]);guard.parent=g;const grip=mesh(new THREE.CylinderGeometry(.09,.09,.42,8),leather,[0,-.05,0]);grip.parent=g;g.position.set(side*.83,1.48,-.05);g.rotation.z=side<0?.35:-.35;g.parent=player;return g}
const daggerL=dagger(-1),daggerR=dagger(1);

let enemies=[],particles=[],keys={},mouse=new THREE.Vector2(),mouseWorld=new THREE.Vector3();
let hp=100,score=0,wave=1,dashTimer=0,attackTimer=0,attackHeld=false,attackSide=-1,playing=false;

function enemy(){const a=Math.random()*Math.PI*2,d=18+Math.random()*5,e=new THREE.Group();e.position.set(Math.cos(a)*d,0,Math.sin(a)*d);e.userData={hp:4+wave*.55,hit:0};
 const body=mesh(new THREE.DodecahedronGeometry(.9,1),mat(0x3d2d2b,.6,.25),[0,1,0],[1,.95,1]);body.parent=e;body.castShadow=true;
 const core=mesh(new THREE.SphereGeometry(.25,12,8),new THREE.MeshBasicMaterial({color:0xff6135}),[0,1,0]);core.parent=e;
 const ring=mesh(new THREE.TorusGeometry(1.05,.045,8,24),new THREE.MeshBasicMaterial({color:0xd95536}),[0,.15,0]);ring.rotation.x=Math.PI/2;ring.parent=e;scene.add(e);enemies.push(e)}
function burst(p,c=0xffa43b,n=16){for(let i=0;i<n;i++){const q=new THREE.Mesh(new THREE.IcosahedronGeometry(.06+Math.random()*.07,0),new THREE.MeshBasicMaterial({color:c}));q.position.copy(p);q.userData={v:new THREE.Vector3((Math.random()-.5)*7,Math.random()*7,(Math.random()-.5)*7),life:.65};scene.add(q);particles.push(q)}}

function strike(){if(!playing||attackTimer>0)return;attackTimer=.18;attackSide*=-1;const side=attackSide;const forward=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));
 for(const e of [...enemies]){const v=e.position.clone().sub(player.position);v.y=0;const d=v.length();if(d>4.2||!d)continue;if(forward.dot(v.normalize())<-.45)continue;e.userData.hp-=2.4;burst(e.position.clone().add(new THREE.Vector3(0,1,0)),0xff7040,12);if(e.userData.hp<=0){score+=100;burst(e.position,0xffc34d,28);scene.remove(e);enemies.splice(enemies.indexOf(e),1)}}}

function hurt(n){hp=Math.max(0,hp-n);const f=document.querySelector('#damageFlash');f.style.opacity=.38;setTimeout(()=>f.style.opacity=0,90);if(hp<=0){playing=false;attackHeld=false;document.querySelector('#messageTitle').textContent='FALLEN';document.querySelector('#messageSub').textContent=`Wave ${wave}  •  ${score} souls`;document.querySelector('#start').textContent='RISE AGAIN';document.querySelector('#message').style.display='grid'}}
function start(){playing=true;hp=100;score=0;wave=1;dashTimer=0;attackTimer=0;attackHeld=false;attackSide=-1;player.position.set(0,0,8);player.rotation.y=0;enemies.forEach(e=>scene.remove(e));enemies=[];for(let i=0;i<5;i++)enemy();document.querySelector('#message').style.display='none';document.querySelector('#hud').style.opacity=1}
document.querySelector('#start').onclick=start;

addEventListener('keydown',e=>{keys[e.code]=true;if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!dashTimer&&playing){let v=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));if(!v.length())v.set(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));player.position.addScaledVector(v.normalize(),5.5);dashTimer=.75;burst(player.position,0xffc04c,20)}});
addEventListener('keyup',e=>keys[e.code]=false);

// Global mouse input: no canvas capture means repeated swings cannot get stuck after one click.
addEventListener('mousedown',e=>{if(e.button!==0||!playing)return;attackHeld=true;updateAim(e.clientX,e.clientY);strike()});
addEventListener('mouseup',e=>{if(e.button===0)attackHeld=false});
addEventListener('mousemove',e=>updateAim(e.clientX,e.clientY));
addEventListener('blur',()=>{attackHeld=false;keys={}});
function updateAim(x,y){mouse.x=x/innerWidth*2-1;mouse.y=-(y/innerHeight*2-1)}

const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function aim(){ray.setFromCamera(mouse,camera);if(!ray.ray.intersectPlane(plane,mouseWorld))return;const a=new THREE.Vector3(mouseWorld.x-player.position.x,0,mouseWorld.z-player.position.z);if(a.lengthSq()>.02)player.rotation.y=Math.atan2(a.x,a.z)}

let last=performance.now();
function loop(t){const dt=Math.min((t-last)/1000,.033);last=t;
 if(playing){const mv=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));if(mv.length())player.position.addScaledVector(mv.normalize(),dt*7);player.position.x=THREE.MathUtils.clamp(player.position.x,-20,20);player.position.z=THREE.MathUtils.clamp(player.position.z,-20,20);aim();
  if(attackHeld&&attackTimer<=0)strike();
  if(attackTimer>0){attackTimer-=dt;const p=1-Math.max(0,attackTimer)/.18;const swing=Math.sin(p*Math.PI);const side=attackSide;daggerL.rotation.z=-.35-side*swing*1.9;daggerR.rotation.z=.35-side*swing*1.9;daggerL.rotation.x=side*swing*1.15;daggerR.rotation.x=-side*swing*1.15;if(attackTimer<=0){daggerL.rotation.set(0,0,.35);daggerR.rotation.set(0,0,-.35)}}
  dashTimer=Math.max(0,dashTimer-dt);
  for(const e of enemies){const v=player.position.clone().sub(e.position);v.y=0;const d=v.length();if(d>1.55){e.position.addScaledVector(v.normalize(),dt*(1.35+wave*.1));e.rotation.y=Math.atan2(v.x,v.z)}else if(e.userData.hit<=0){hurt(6);e.userData.hit=.75}else e.userData.hit-=dt;e.children[0].rotation.y+=dt*1.8;e.children[2].rotation.z+=dt*2.4}
  if(!enemies.length){wave++;for(let i=0;i<4+wave*2;i++)enemy()}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.v,dt);p.userData.v.y-=11*dt;if(p.userData.life<=0){scene.remove(p);particles.splice(i,1)}}
  document.querySelector('#healthBar').style.width=hp+'%';document.querySelector('#healthText').textContent=`${Math.ceil(hp)} / 100`;document.querySelector('#score').textContent=score;document.querySelector('#wave').textContent=wave;document.querySelector('#dashBar').style.width=(dashTimer?100:0)+'%';
 }
 player.rotation.y+=0;camera.position.lerp(new THREE.Vector3(player.position.x,7.2,player.position.z+10.5),.08);camera.lookAt(player.position.x,1.15,player.position.z);for(const q of torches){q.flame.scale.y=1.4+Math.sin(t*.018+q.flame.position.x)*.25;q.glow.intensity=8+Math.sin(t*.014+q.flame.position.z)*2}renderer.render(scene,camera);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
setTimeout(()=>{const l=document.querySelector('#loading');if(l){l.style.opacity=0;setTimeout(()=>l.remove(),700)}},900);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
