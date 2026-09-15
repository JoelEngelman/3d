import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b08);
scene.fog = new THREE.Fog(0x080b08, 18, 70);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 100);
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

scene.add(new THREE.HemisphereLight(0xb4c4a5,0x17120e,2));
const sun = new THREE.DirectionalLight(0xffd49b,4);
sun.position.set(-20,30,15); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); scene.add(sun);
const fire = new THREE.PointLight(0xff6726,15,25); fire.position.y=4; scene.add(fire);

const material=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),material(0x252a21,.95));
floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
const grid=new THREE.GridHelper(100,50,0x62634d,0x303429); grid.material.opacity=.2; grid.material.transparent=true; scene.add(grid);

function block(x,y,z,w,h,d,mat=material(0x4c4d40)){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh)}
for(let i=0;i<16;i++){const a=i*Math.PI/8,x=Math.cos(a)*22,z=Math.sin(a)*22;block(x,2.5,z,2.3,5,2.3,material(0x292c26,.9));block(x,5.3,z,3.2,.7,3.2)}
for(let i=0;i<28;i++){const a=Math.random()*Math.PI*2,d=7+Math.random()*12;block(Math.cos(a)*d,.5,Math.sin(a)*d,1+Math.random()*1.5,1,1+Math.random()*1.5)}
for(const p of [[-7,1,-8],[8,1,-7],[-10,1,7],[10,1,7]]){const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(1.15),material(0xff732c,.3));crystal.position.set(...p);scene.add(crystal);const light=new THREE.PointLight(0xff5928,7,10);light.position.set(...p);scene.add(light)}

const player=new THREE.Group(); player.position.set(0,0,6); scene.add(player);
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.58,1.1,5,10),material(0x38515d,.6,.3));body.position.y=1;body.castShadow=true;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.62,16,12),material(0x171c1c));head.scale.y=.8;head.position.y=1.8;head.castShadow=true;player.add(head);
const sword=new THREE.Group();
const blade=new THREE.Mesh(new THREE.BoxGeometry(.14,2.5,.3),material(0xdce1d7,.15,.85));blade.position.y=1.1;sword.add(blade);
const guard=new THREE.Mesh(new THREE.BoxGeometry(.9,.1,.18),material(0xe0a43d,.3,.6));sword.add(guard);sword.position.set(.8,1,0);sword.rotation.z=-.35;player.add(sword);

let enemies=[],particles=[],keys={};
let mouse=new THREE.Vector2(0,0),mouseWorld=new THREE.Vector3();
let hp=100,score=0,wave=1,attackTimer=0,dashTimer=0,playing=false,attackHeld=false;

function spawnEnemy(){const a=Math.random()*Math.PI*2,d=17+Math.random()*5,enemy=new THREE.Group();enemy.position.set(Math.cos(a)*d,0,Math.sin(a)*d);enemy.userData={hp:3+wave*.5,hitCooldown:0};const core=new THREE.Mesh(new THREE.DodecahedronGeometry(.85,1),material(0x762d25,.5,.2));core.position.y=.9;core.castShadow=true;enemy.add(core);const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.05,6,20),new THREE.MeshBasicMaterial({color:0xff4a25}));ring.rotation.x=Math.PI/2;ring.position.y=.05;enemy.add(ring);scene.add(enemy);enemies.push(enemy)}
function burst(position,color=0xffa52e,count=14){for(let i=0;i<count;i++){const particle=new THREE.Mesh(new THREE.IcosahedronGeometry(.08,0),new THREE.MeshBasicMaterial({color}));particle.position.copy(position);particle.userData={velocity:new THREE.Vector3((Math.random()-.5)*6,Math.random()*6,(Math.random()-.5)*6),life:.7};scene.add(particle);particles.push(particle)}}

function strike(){
  if(!playing || attackTimer>0) return false;
  attackTimer=.24;
  sword.rotation.z=-.35;
  const forward=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));
  for(const enemy of [...enemies]){
    const toEnemy=enemy.position.clone().sub(player.position);toEnemy.y=0;
    const distance=toEnemy.length(); if(!distance || distance>4.5) continue;
    const direction=toEnemy.normalize();
    if(forward.dot(direction)<-.25) continue;
    enemy.userData.hp-=2.5;
    burst(enemy.position.clone().add(new THREE.Vector3(0,1,0)),0xff5a2b,18);
    if(enemy.userData.hp<=0){score+=100;burst(enemy.position,0xffc44d,25);scene.remove(enemy);enemies.splice(enemies.indexOf(enemy),1)}
  }
  return true;
}

function hurt(amount){hp=Math.max(0,hp-amount);document.querySelector('#damageFlash').style.opacity=.3;setTimeout(()=>document.querySelector('#damageFlash').style.opacity=0,100);if(hp<=0){playing=false;attackHeld=false;document.querySelector('#messageTitle').textContent='FALLEN';document.querySelector('#messageSub').textContent=`Wave ${wave}  •  ${score} souls`;document.querySelector('#start').textContent='RISE AGAIN';document.querySelector('#message').style.display='grid'}}
function startGame(){playing=true;hp=100;score=0;wave=1;attackTimer=0;dashTimer=0;attackHeld=false;player.position.set(0,0,6);enemies.forEach(enemy=>scene.remove(enemy));enemies=[];for(let i=0;i<5;i++)spawnEnemy();document.querySelector('#message').style.display='none';document.querySelector('#hud').style.opacity=1;canvas.focus()}
document.querySelector('#start').addEventListener('click',startGame);

addEventListener('keydown',event=>{keys[event.code]=true;if((event.code==='ShiftLeft'||event.code==='ShiftRight')&&!dashTimer&&playing){const direction=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));if(!direction.length())direction.z=-1;player.position.addScaledVector(direction.normalize(),6);dashTimer=.9;burst(player.position,0xffbd43,18)}});
addEventListener('keyup',event=>{keys[event.code]=false});

canvas.addEventListener('pointerdown',event=>{if(event.button!==0||!playing)return;event.preventDefault();updateAim(event.clientX,event.clientY);attackHeld=true;strike();canvas.setPointerCapture?.(event.pointerId)});
canvas.addEventListener('pointermove',event=>updateAim(event.clientX,event.clientY));
canvas.addEventListener('pointerup',event=>{if(event.button===0)attackHeld=false});
canvas.addEventListener('pointercancel',()=>attackHeld=false);
addEventListener('blur',()=>{attackHeld=false;keys={}});
function updateAim(x,y){mouse.x=x/innerWidth*2-1;mouse.y=-(y/innerHeight*2-1)}

const raycaster=new THREE.Raycaster(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function updateAimWorld(){raycaster.setFromCamera(mouse,camera);if(!raycaster.ray.intersectPlane(groundPlane,mouseWorld))return;const aim=new THREE.Vector3(mouseWorld.x-player.position.x,0,mouseWorld.z-player.position.z);if(aim.lengthSq()>.01)player.rotation.y=Math.atan2(aim.x,aim.z)}

let last=performance.now();
function loop(time){
  const dt=Math.min((time-last)/1000,.033);last=time;
  if(playing){
    const movement=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
    if(movement.length())player.position.addScaledVector(movement.normalize(),dt*7);
    player.position.x=THREE.MathUtils.clamp(player.position.x,-19,19);player.position.z=THREE.MathUtils.clamp(player.position.z,-19,19);
    updateAimWorld();
    if(attackHeld && attackTimer<=0)strike();
    if(attackTimer>0){attackTimer-=dt;const progress=1-Math.max(0,attackTimer)/.24;sword.rotation.z=-.35-Math.sin(progress*Math.PI)*2.1;if(attackTimer<=0)sword.rotation.z=-.35}
    dashTimer=Math.max(0,dashTimer-dt);
    for(const enemy of enemies){const direction=player.position.clone().sub(enemy.position);direction.y=0;const distance=direction.length();if(distance>1.6){enemy.position.addScaledVector(direction.normalize(),dt*(1.5+wave*.08));enemy.rotation.y=Math.atan2(direction.x,direction.z)}else if(enemy.userData.hitCooldown<=0){hurt(7);enemy.userData.hitCooldown=.8}else enemy.userData.hitCooldown-=dt;enemy.children[0].rotation.y+=dt*2}
    if(enemies.length===0){wave++;for(let i=0;i<4+wave*2;i++)spawnEnemy()}
    for(let i=particles.length-1;i>=0;i--){const particle=particles[i];particle.userData.life-=dt;particle.position.addScaledVector(particle.userData.velocity,dt);particle.userData.velocity.y-=10*dt;if(particle.userData.life<0){scene.remove(particle);particles.splice(i,1)}}
    document.querySelector('#healthBar').style.width=hp+'%';document.querySelector('#healthText').textContent=`${Math.ceil(hp)} / 100`;document.querySelector('#score').textContent=score;document.querySelector('#wave').textContent=wave;document.querySelector('#dashBar').style.width=(dashTimer?100:0)+'%';
  }
  camera.position.lerp(new THREE.Vector3(player.position.x,8,player.position.z+11),.09);camera.lookAt(player.position.x,.8,player.position.z);fire.intensity=14+Math.sin(time*.006)*3;renderer.render(scene,camera);requestAnimationFrame(loop)
}
requestAnimationFrame(loop);
setTimeout(()=>{document.querySelector('#loading').style.opacity=0;setTimeout(()=>document.querySelector('#loading').remove(),700)},900);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
