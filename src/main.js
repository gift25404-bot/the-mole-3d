import * as THREE from 'three';
import { io } from 'socket.io-client';
import './style.css';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x243b46);
scene.fog = new THREE.FogExp2(0x243b46, 0.012);
const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, .1, 180);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping;
document.querySelector('#game').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffd7a0,0x4b3a2b,2.0));
const moon=new THREE.DirectionalLight(0xffd6a0,2.5); moon.position.set(-9,18,8); moon.castShadow=true; moon.shadow.mapSize.set(2048,2048); scene.add(moon);
const warm=new THREE.PointLight(0xffb35c,30,18); warm.position.set(0,3,0); scene.add(warm);
const hallLight=new THREE.PointLight(0xffd18a,16,10); hallLight.position.set(0,3,-8); scene.add(hallLight);

const mat=(color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness});
const floorMat=mat(0x75634b), wallMat=mat(0xb7a58a), darkMat=mat(0x343a38), wood=mat(0x68442e), trim=mat(0x3b3028), glass=new THREE.MeshStandardMaterial({color:0x7894a0,transparent:true,opacity:.28,roughness:.2});
function box(w,h,d,m,x,y,z, parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function plane(w,d,m,x,y,z){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.receiveShadow=true;scene.add(o);return o}
plane(90,90,mat(0x75684f),0,-.16,0);
// Lagos-inspired roadside setting: warm streetlights, kiosks, palms and overhead wires.
const roadMat=mat(0x343b3d), curbMat=mat(0xc9b58b), stallBlue=mat(0x277c86), stallRed=mat(0xb94f3e), palmMat=mat(0x3c6848);
box(90,.08,8,roadMat,0,-.105,17);
for(let x=-42;x<44;x+=8) box(3,.025,.12,mat(0xe7d39a),x,-.055,17);
for(const side of [-1,1]){
  box(90,.18,.45,curbMat,0,-.04,side*21);
  for(let x=-38;x<=38;x+=12){
    const pole=box(.16,6,.16,trim,x,3,side*16);
    box(1.5,.12,.12,trim,x+.65,5.8,side*16);
    const glow=new THREE.PointLight(0xffc477,5,11);glow.position.set(x+.7,5.5,side*16);scene.add(glow);
    // Small palm silhouettes along the road.
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,3.8,7),wood);trunk.position.set(x,1.8,side*25);scene.add(trunk);
    for(let f=0;f<6;f++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.24,3.2,5),palmMat);leaf.position.set(x+Math.cos(f*Math.PI/3)*1.15,3.7,side*25+Math.sin(f*Math.PI/3)*1.15);leaf.rotation.z=Math.cos(f*Math.PI/3)*.75;leaf.rotation.x=Math.sin(f*Math.PI/3)*.75;scene.add(leaf);}
  }
}
// A few colourful roadside kiosks give the arrival area a recognisable city feel.
for(const [x,z,color] of [[-22,12,stallBlue],[22,12,stallRed],[-25,23,stallRed],[25,23,stallBlue]]){
  const kiosk=new THREE.Group();scene.add(kiosk);kiosk.position.set(x,0,z);
  box(3.2,2.1,2.2,mat(0x9b7048),0,1,0,kiosk);
  box(3.6,.16,2.6,mat(color),0,2.15,0,kiosk);
  box(3.8,.12,2.8,mat(0xe7c46f),0,2.3,0,kiosk);
  box(2.5,.9,.08,mat(0x293a3b),0,1.25,1.12,kiosk);
}
// Simple overhead utility wires across the street.
for(const z of [14,19]){const wire=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,86,5),mat(0x25292a));wire.rotation.z=Math.PI/2;wire.position.set(0,7,z);scene.add(wire);}

const house=new THREE.Group();scene.add(house);
// House is split into connected rooms; door-sized gaps are left in the partitions.
box(20,.35,17,floorMat,0,0,0,house);
box(20,.5,17,trim,0,3.8,0,house);
box(.35,3.8,17,wallMat,-10,1.9,0,house); box(.35,3.8,6,wallMat,10,1.9,-5.5,house); box(.35,3.8,6,wallMat,10,1.9,5.5,house); // doorway into the east wing
box(20,3.8,.35,wallMat,0,1.9,-8.5,house); box(20,3.8,.35,wallMat,0,1.9,8.5,house);
// front wall has a central entry opening
box(7,3.8,.35,wallMat,-6.5,1.9,8.5,house); box(7,3.8,.35,wallMat,6.5,1.9,8.5,house);
// room partitions with door gaps
box(.22,3.8,5,wallMat,-2,1.9,-6,house); box(.22,3.8,4,wallMat,-2,1.9,5.5,house);
box(7,3.8,.22,wallMat,5.5,1.9,-1.8,house);
box(5,3.8,.22,wallMat,-7.5,1.9,1.5,house);
// window frames / windows
for(const x of [-7,-3,3,7]){box(1.7,1.35,.12,trim,x,2.35,-8.28,house);box(1.45,1.1,.05,glass,x,2.35,-8.18,house);box(1.8,.1,.2,wood,x,1.66,-8.2,house)}
// front porch, steps and roof
box(8,.25,2.5,wood,0,-.02,9.6,house);
// THREE-STOREY UNFINISHED CONCRETE BUILDING: open upper floors, exposed columns,
// unfinished blockwork, scaffolding and reinforcing bars. The ground floor
// remains the playable interior; upper levels form the visible construction shell.
const concrete=mat(0x77766f,.98),rawConcrete=mat(0x96948a,.98),blockwork=mat(0x625f57,.98),rustSteel=mat(0x754c36,.8),scaffoldMat=mat(0x394b50,.8);
const slab=(x,z,w,d,y)=>box(w,.34,d,concrete,x,y,z,house);
slab(0,0,20,17,7.6);slab(0,0,20,17,11.4);
// Stairwell openings keep both concrete flights clear through the floor slabs.
const slabPanel=(x,z,w,d,y)=>slab(x,z,w,d,y);
for(const y of [7.6]){
  slabPanel(11.05,0,2.1,15,y);
  slabPanel(16.2,0,3.6,15,y);
  slabPanel(13.25,-6.65,2.3,1.7,y);
  slabPanel(13.25,6.65,2.3,1.7,y);
}
for(const y of [11.4]){
  slabPanel(12.65,0,5.3,15,y);
  slabPanel(17.6,0,.8,15,y);
  slabPanel(16.25,-6.65,1.9,1.7,y);
  slabPanel(16.25,6.65,1.9,1.7,y);
}
// Reinforced-concrete columns at each structural bay.
for(const y of [5.7,9.5]){
 for(const [x,z] of [[-9.55,-8.05],[-3.2,-8.05],[3.2,-8.05],[9.55,-8.05],[-9.55,0],[9.55,0],[-9.55,8.05],[-3.2,8.05],[3.2,8.05],[9.55,8.05],[10.2,-7],[17.8,-7],[10.2,7],[17.8,7]]){
  box(.42,3.8,.42,rawConcrete,x,y,z,house);
 }
}
// Exposed beams and incomplete waist-high masonry on the second and third floors.
for(const y of [7.35,11.15]){
 for(const z of [-8.05,8.05])box(20,.42,.42,concrete,0,y,z,house);
 for(const x of [-9.55,9.55])box(.42,.42,17,concrete,x,y,0,house);
 for(const z of [-8.05,8.05])for(const x of [-7,-2,3,8])box(2.4,1.05,.22,blockwork,x,y-1.05,z,house);
 for(const x of [-9.55,9.55])for(const z of [-5,0,5])box(.22,1.05,2.2,blockwork,x,y-1.05,z,house);
}
// East wing continues the unfinished structure.
for(const y of [5.7,9.5])for(const [x,z] of [[10.2,-7],[14,-7],[17.8,-7],[10.2,0],[17.8,0],[10.2,7],[14,7],[17.8,7]])box(.4,3.8,.4,rawConcrete,x,y,z,house);
for(const y of [7.35,11.15]){box(8,.4,.4,concrete,14,y,-7,house);box(8,.4,.4,concrete,14,y,7,house);box(.4,.4,14,concrete,10.2,y,0,house);box(.4,.4,14,concrete,17.8,y,0,house);}
// Incomplete stair flights visible through the open side of the structure.
for(let floor=0;floor<2;floor++){
 const base=3.9+floor*3.8;
 for(let step=0;step<9;step++)box(1.15,.18,.62,rawConcrete,-6+step*.38,base+step*.38,-1+step*.58,house);
 box(.18,3.45,.18,scaffoldMat,-6,base+1.7,-1,house);
}
// Temporary steel-pipe scaffolding on the front and east elevations.
for(const x of [-11,-7,-3,1,5,9,13,17,19]){
 for(const z of [9.7,10.5])box(.09,11.8,.09,scaffoldMat,x,5.9,z,house);
}
for(const y of [1.2,4.8,8.6,11.8]){
 for(const z of [9.7,10.5])box(30,.09,.09,scaffoldMat,4,y,z,house);
 for(const x of [-11,19])box(.09,.09,18,scaffoldMat,x,y,1,house);
}
for(const x of [-11,-7,-3,1,5,9,13,17,19])box(.08,18,.08,scaffoldMat,x,5.8,10.5,house);
// Rebar protruding from the unfinished top slab.
for(const [x,z] of [[-9,-7],[-5,-7],[0,-7],[5,-7],[9,-7],[-9,0],[9,0],[-9,7],[-4,7],[2,7],[8,7],[12,-6],[17,-6],[12,6],[17,6]]){
 const rod=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.15,7),rustSteel);rod.position.set(x,12.15,z);rod.castShadow=true;house.add(rod);
}

// Playable interior staircases: ground floor -> first floor -> rooftop level.
const stairConcrete=mat(0xaaa79b,.98), stairEdge=mat(0x696960,.95);
for(let i=0;i<16;i++){
 const rise=(i+1)*.48, z=5.55-i*.70;
 box(2.25,.18,.78,stairConcrete,13.25,rise-.09,z,house);
 box(.12,.22,.8,stairEdge,12.12,rise-.11,z,house);
}
for(let i=0;i<16;i++){
 const rise=7.8+(i+1)*.2375, z=-5.55+i*.70;
 box(1.55,.18,.78,stairConcrete,16.25,rise-.09,z,house);
 box(.10,.22,.8,stairEdge,15.43,rise-.11,z,house);
}

// Construction clutter: stacked blocks, timber planks and cement sacks.
for(let i=0;i<5;i++){box(.75,.38,.55,blockwork,-8+i*.82,.2,10.8,house);box(1.8,.12,.22,wood,5+i*.45,.15,11.2,house);}
for(let i=0;i<3;i++){const sack=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),mat(0xaaa18a));sack.scale.set(1,.55,.72);sack.position.set(8+i*.7,.28,11.5);sack.castShadow=true;house.add(sack);}

// furniture and room details
box(4,.45,2,wood,-6,.5,-5,house);box(.15,1.1,.15,trim,-7.7,.25,-5,house);box(.15,1.1,.15,trim,-4.3,.25,-5,house);
box(2,.7,1.1,mat(0x58605a),5,.35,-5,house);box(2.2,.18,1.2,mat(0x8b765e),5,.78,-5,house);
box(1.2,1.7,.15,wood,0,.85,-8.22,house); // cabinet
for(let i=0;i<4;i++)box(1.4,.08,1.2,wood,5,.35+i*.36,2.8,house); // shelves
box(2,.12,2,wood,-6,.8,4,house);box(.12,1.2,.12,trim,-6.8,.2,4,house);box(.12,1.2,.12,trim,-5.2,.2,4,house);

// Collectible story clues. These are safe, non-graphic environmental story items.
const clueItems=[];
function addClue(name,description,x,z,color){
 const group=new THREE.Group();group.position.set(x,.72,z);scene.add(group);
 const body=new THREE.Mesh(new THREE.BoxGeometry(.42,.08,.3),mat(color));body.rotation.y=.25;body.castShadow=true;group.add(body);
 const glow=new THREE.PointLight(0xd5ad6b,2.4,2.4);glow.position.y=.3;group.add(glow);
 clueItems.push({name,description,group,collected:false,baseY:.72,phase:Math.random()*6});
}
addClue('OLD PHOTOGRAPH','A family photograph. Someone has circled the library window.',-6,-5,0xd7c7a3);
addClue('TORN NOTE','The note reads: “The clock remembers what the doors forget.”',5,-5,0xc8b48b);
addClue('BRASS KEY','A heavy key with the number 314 engraved on it.',5,4,0xc59a4d);
// East wing expansion: study, music room and conservatory.
const wingFloor=mat(0x393b38);box(8,.35,15,wingFloor,14,0,0,house);box(.3,3.8,15,wallMat,18,1.9,0,house);box(8,3.8,.3,wallMat,14,1.9,-7.5,house);box(8,3.8,.3,wallMat,14,1.9,7.5,house);box(.22,3.8,4,wallMat,10,1.9,-5,house);box(.22,3.8,4,wallMat,10,1.9,5,house);addClue('DUSTY DIARY','A diary entry says the east wing was locked after the last storm.',12,-5,0x9b7655);addClue('MUSIC BOX','A tiny music box bears the initials B.H.',16,0,0xb88d53);addClue('SEALED LETTER','A sealed letter mentions a hidden passage.',12,5,0x7f9b9b);

const sideMissionItems=[];
let moleCoins=0;
function updateCoins(){
 let counter=document.querySelector('#coin-counter');
 if(!counter){counter=document.createElement('div');counter.id='coin-counter';counter.className='coin-counter';document.querySelector('#game')?.append(counter);}
 counter.textContent='🪙 '+moleCoins+' COINS';
}
function addMissionPickup(name,x,z,color){
 const g=new THREE.Group();g.position.set(x,.45,z);scene.add(g);
 const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.42),mat(color,.35));
 gem.castShadow=true;g.add(gem);
 const halo=new THREE.PointLight(color,1.8,4);halo.position.y=.3;g.add(halo);
 sideMissionItems.push({name,group:g,collected:false,phase:Math.random()*6});
}
addMissionPickup('GENERATOR FUSE',-25,3,0xf2bd45);
addMissionPickup('WATER PUMP PART',26,4,0x68c5d0);
addMissionPickup('OLD MARKET TOKEN',-34,18,0xd69b55);
updateCoins();

// hanging lamps
for(const [x,z] of [[0,-4],[5,1],[-6,-2]]){box(.08,1,.08,trim,x,3.3,z,house);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),new THREE.MeshStandardMaterial({color:0xffc16e,emissive:0xff9a32,emissiveIntensity:1.3}));lamp.position.set(x,2.7,z);house.add(lamp);const l=new THREE.PointLight(0xffb45e,9,6);l.position.set(x,2.5,z);house.add(l)}
// exterior trees and fence-like silhouettes
for(let i=0;i<22;i++){const a=i/22*Math.PI*2, r=14+Math.sin(i*4)*2,x=Math.cos(a)*r,z=Math.sin(a)*r;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,2.2,5),wood);trunk.position.set(x,1,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.ConeGeometry(1.25,3.2,6),mat(0x263a35));crown.position.set(x,3.3,z);crown.castShadow=true;scene.add(crown)}
// Fill the empty lots with overgrown trees and abandoned, weathered vehicles.
const forestLeafMats = [mat(0x203d2b), mat(0x294a31), mat(0x365638), mat(0x455b36)];
const barkMat = mat(0x49372a);
function addOvergrownTree(x,z,scale=1){
  const tree = new THREE.Group();
  tree.position.set(x,0,z);
  tree.scale.setScalar(scale);
  scene.add(tree);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.2,.38,3.8,7),barkMat);
  trunk.position.y=1.9; trunk.castShadow=true; trunk.receiveShadow=true; tree.add(trunk);
  for(const [y,radius,height,offset] of [[3.2,1.55,2.7,0],[4.15,1.25,2.35,.45],[4.8,.88,1.8,-.3]]){
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(radius,1),forestLeafMats[Math.floor(Math.random()*forestLeafMats.length)]);
    crown.position.set(offset,y,0); crown.scale.set(1,height/radius,.92); crown.castShadow=true; crown.receiveShadow=true; tree.add(crown);
  }
  // Low bushes make the neglected ground feel overgrown.
  for(let i=0;i<3;i++){
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(.7,1),forestLeafMats[(i+1)%forestLeafMats.length]);
    bush.position.set((i-1)*.75,.48,((i%2)*.8)-.4); bush.scale.set(1,.7,1); bush.castShadow=true; tree.add(bush);
  }
}
function addWreckedCar(x,z,rotation=0,color=0x6c6251){
  const wreck = new THREE.Group();
  wreck.position.set(x,0,z); wreck.rotation.y=rotation; scene.add(wreck);
  const rust = mat(0x59463a), faded = mat(color), darkGlass = new THREE.MeshStandardMaterial({color:0x26383a,roughness:.5,transparent:true,opacity:.72});
  const body = box(4.1,.82,1.85,faded,0,.72,0,wreck);
  body.rotation.z=-.035;
  box(2.25,.92,1.55,rust,-.15,1.48,0,wreck).rotation.z=.035;
  box(1.85,.68,1.58,darkGlass,-.15,1.52,0,wreck);
  // Missing side panels, a crooked bonnet and a visibly damaged bumper.
  box(1.3,.16,1.9,rust,1.55,.55,.02,wreck).rotation.z=-.13;
  box(.22,.25,2.05,rust,2.08,.38,0,wreck).rotation.z=.08;
  for(const [wx,wz] of [[-1.35,-.98],[1.25,-.98],[-1.35,.98],[1.25,.98]]){
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.24,12),mat(0x171918));
    wheel.rotation.z=Math.PI/2; wheel.position.set(wx,.43,wz); wheel.castShadow=true; wreck.add(wheel);
  }
  // One door hangs open and the roof has a dented plate.
  const looseDoor=box(1.15,.12,.12,rust,-.45,.78,1.08,wreck); looseDoor.rotation.z=-.48; looseDoor.rotation.y=-.2;
  const dent=box(.9,.08,.7,rust,-.2,2.0,-.12,wreck); dent.rotation.z=.08;
  const lampMat=new THREE.MeshStandardMaterial({color:0x8e6c3d,emissive:0x24180c});
  for(const side of [-1,1])box(.18,.22,.08,lampMat,2.12,.78,side*.58,wreck);
}
// Dense pockets of vegetation around the perimeter, leaving the bus, road and
// mansion entrance clear for players to move through.
for(const [x,z,s] of [
  [-38,-30,1.35],[-29,-34,1.15],[-18,-35,1.3],[-5,-36,1.1],[10,-35,1.3],[25,-34,1.2],[38,-29,1.35],
  [-39,-15,1.1],[-34,2,1.25],[-39,29,1.35],[-29,34,1.1],[-17,31,1.3],[2,35,1.15],[19,34,1.25],[34,31,1.3],
  [39,12,1.15],[36,-8,1.2],[-27,-22,1.1],[28,-20,1.15],[-24,27,1.1],[27,26,1.1]
]) addOvergrownTree(x,z,s);
// Extra saplings and bushes fill the gaps between larger trees.
for(let i=0;i<34;i++){
  const x=-38+((i*17)%77), z=-32+((i*23)%66);
  if(Math.abs(x)<21 && Math.abs(z)<13) continue;
  if(Math.abs(z-17)<5 && Math.abs(x)<30) continue;
  addOvergrownTree(x,z,.48+((i%4)*.09));
}
// Abandoned cars left to rust around the neglected roadside and empty lots.
addWreckedCar(-31,7,.18,0x75664f);
addWreckedCar(30,7,-.32,0x52605b);
addWreckedCar(-30,-23,.55,0x65534a);
addWreckedCar(29,-24,-.42,0x6b6656);
addWreckedCar(34,25,.12,0x5a5d57);
addWreckedCar(-35,27,-.2,0x766047);

// Neighbourhood landmarks: kiosks, generator sheds, water tanks and utility poles.
const kioskWall=mat(0x8b6948), fadedPaint=mat(0x9c7654), tankMat=mat(0x52656a);
for(const [x,z] of [[-36,-5],[36,-3],[-34,18],[35,18]]){
 const hut=new THREE.Group();hut.position.set(x,0,z);scene.add(hut);
 box(5,2.7,.22,kioskWall,0,1.35,0,hut);
 box(5.4,.18,3.5,mat(0x5c5142),0,2.75,-1.5,hut);
 box(1.4,1.8,.12,trim,-1.35,.9,.14,hut);
 box(1.1,.85,.1,mat(0x263538),1.25,1.1,.14,hut);
 box(2.4,.12,.25,fadedPaint,0,2.15,.16,hut);
}
for(const [x,z] of [[-25,3],[26,4],[-24,20],[24,20]]){
 box(1.8,1.3,1.25,mat(0x3f4946),x,.68,z);
 for(let k=0;k<4;k++)box(.12,.42,.12,rustSteel,x-.55+k*.36,1.42,z+.25);
 const tank=new THREE.Mesh(new THREE.CylinderGeometry(.95,.95,1.45,12),tankMat);
 tank.position.set(x+2.2,4.1,z);tank.castShadow=true;scene.add(tank);
 for(const [a,b] of [[-.65,-.65],[.65,-.65],[-.65,.65],[.65,.65]])box(.12,2.2,.12,scaffoldMat,x+2.2+a,1.1,z+b);
}
for(let x=-40;x<=40;x+=10){
 box(.18,7,.18,trim,x,3.5,-27);
 box(2.1,.12,.12,trim,x+1,6.4,-27);
}

// minibus
// Live rain particles and a distant lightning flash make the night storm visible.
const rainCount=950, rainPositions=new Float32Array(rainCount*3);
for(let i=0;i<rainCount;i++){
 rainPositions[i*3]=(Math.random()-.5)*86;
 rainPositions[i*3+1]=Math.random()*25;
 rainPositions[i*3+2]=(Math.random()-.5)*86;
}
const rainGeometry=new THREE.BufferGeometry();
rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
const rain=new THREE.Points(rainGeometry,new THREE.PointsMaterial({color:0xb9d5df,size:.075,transparent:true,opacity:.58}));
scene.add(rain);
const lightning=new THREE.DirectionalLight(0xc7d9ff,0);lightning.position.set(-20,25,-10);scene.add(lightning);
let nextStormFlash=9+Math.random()*12,flashRemaining=0,nextSpookyEvent=24+Math.random()*18;
const bus=new THREE.Group();scene.add(bus);bus.position.set(-24,0,8);
box(4.5,1.8,2.1,mat(0xe4b52f),0,1,0,bus);box(3.6,.65,2.08,mat(0xf0d77d),-.15,2.05,0,bus);
box(4.55,.22,2.14,mat(0x202426),0,1.48,0,bus); // classic yellow-and-black minibus stripe
for(const x of [-1.35,-.35,.65,1.55])box(.65,.58,.05,glass,x,2.05,1.06,bus);
for(const x of [-1.5,1.5])for(const z of [-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.22,12),mat(0x151719));w.rotation.z=Math.PI/2;w.position.set(x,.45,z);bus.add(w)}
// doors are hinged panels
const doorPivot=new THREE.Group();doorPivot.position.set(0,0,8.32);house.add(doorPivot);const door=box(1.65,2.9,.16,wood,.82,1.45,0,doorPivot);
let doorOpen=false;
// Characters: cute low-poly Bitmoji-ish avatars with animated arms/legs.
function makeAvatar(name,shirt,skin,hair,x,z,isPlayer=false){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const skinMat=mat(skin,.72),hairMat=mat(hair,.9),shirtMat=mat(shirt,.78),pantsMat=mat(0x30343b,.9),shoeMat=mat(0x17191c,.8);
 const dark=mat(0x211b1a,.6),white=mat(0xfff8ed,.45),iris=mat(0x30251f,.4);
 const sphere=(radius,material,px,py,pz,sx=1,sy=1,sz=1)=>{
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),material);
  mesh.position.set(px,py,pz);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;g.add(mesh);return mesh;
 };
 // Oversized rounded head and neck create a friendly cartoon silhouette.
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.22,12),skinMat);neck.position.y=1.48;g.add(neck);
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.37,.48,5,12),shirtMat);torso.position.y=1.12;torso.scale.set(1,.94,.72);torso.castShadow=true;g.add(torso);
 const head=sphere(.39,skinMat,0,1.94,0,1,.99,.88);
 // Ears and a small rounded nose.
 sphere(.105,skinMat,-.385,1.92,0,1,.9,.72);sphere(.105,skinMat,.385,1.92,0,1,.9,.72);
 sphere(.055,skinMat,0,1.84,.345,.85,.8,.8);
 // Hair cap, fringe and side locks.
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.405,16,12,0,Math.PI*2,0,Math.PI*.57),hairMat);
 cap.position.set(0,2.075,-.018);cap.castShadow=true;g.add(cap);
 const hairPieces=[cap];
 for(const [hx,hy,hz,scale] of [[-.22,2.08,.245,.78],[0,2.12,.29,.72],[.22,2.08,.245,.78]]){
  hairPieces.push(sphere(.16,hairMat,hx,hy,hz,scale,.78,.65));
 }
 hairPieces.push(sphere(.13,hairMat,-.34,1.91,-.015,.75,1.2,.8));
 hairPieces.push(sphere(.13,hairMat,.34,1.91,-.015,.75,1.2,.8));
 // Large bright eyes, pupils and expressive eyebrows.
 for(const ex of [-.145,.145]){
  sphere(.092,white,ex,1.965,.306,1,.92,.5);
  sphere(.046,iris,ex+.012,1.96,.35,.92,1,.55);
  sphere(.019,dark,ex+.012,1.96,.372,1,1,.6);
  sphere(.018,white,ex-.005,1.982,.385,1,1,.6);
  const brow=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.105,3,6),hairMat);
  brow.position.set(ex,2.105,.302);brow.rotation.z=ex<0?-.12:.12;g.add(brow);
 }
 // A small curved smile gives each passenger a friendly avatar expression.
 const smileCurve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(-.09,1.755,.326),new THREE.Vector3(0,1.725,.35),new THREE.Vector3(.09,1.755,.326)
 ]);
 const smile=new THREE.Mesh(new THREE.TubeGeometry(smileCurve,12,.012,5,false),dark);g.add(smile);
 // Clothing details: collar, sleeves, hands, trousers and shoes.
 const collar=new THREE.Mesh(new THREE.ConeGeometry(.115,.13,4),mat(0xe5d6bc,.8));
 collar.position.set(0,1.48,.19);collar.rotation.y=Math.PI/4;g.add(collar);
 const limbs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.36,1.34,0);
  const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.32,4,8),shirtMat);sleeve.position.y=-.13;sleeve.rotation.z=side*-.12;arm.add(sleeve);
  const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,12,10),skinMat);hand.position.set(side*-.015,-.38,.015);arm.add(hand);
  g.add(arm);limbs.push(arm);
  const leg=new THREE.Group();leg.position.set(side*.17,.62,0);
  const trouser=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.39,4,8),pantsMat);trouser.position.y=-.22;leg.add(trouser);
  const shoe=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),shoeMat);shoe.scale.set(1,.55,1.45);shoe.position.set(0,-.48,.055);leg.add(shoe);
  g.add(leg);limbs.push(leg);
 }
 const label=makeLabel(name);label.position.set(0,2.62,0);g.add(label);
 return {group:g,limbs,name,isPlayer,phase:Math.random()*6,appearance:{skinMat,hairMat,shirtMat,pantsMat,shoeMat,hairPieces}};
}
function makeLabel(t){const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='rgba(9,14,18,.75)';ctx.fillRect(0,0,256,64);ctx.fillStyle='#f2e7d2';ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.fillText(t,128,42);const tex=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));s.scale.set(1.35,.34,1);return s}
const player=makeAvatar('ALEX',0x477c8c,0x9a674b,0x211b1a,-10,8,true);
const avatarLooks={
 sunset:{name:'Sunset',skin:0x9a674b,hair:0x211b1a,shirt:0xc96f62,pants:0x30343b},
 midnight:{name:'Midnight',skin:0x603b2d,hair:0x101315,shirt:0x477caa,pants:0x252b35},
 cocoa:{name:'Cocoa',skin:0x815238,hair:0x39251d,shirt:0x527b5c,pants:0x35343b},
 golden:{name:'Golden',skin:0xd49b76,hair:0x743d27,shirt:0x8064a6,pants:0x343044},
 cloud:{name:'Cloud',skin:0xe0b99a,hair:0xc79b55,shirt:0xa94f4f,pants:0x34343b},
 ocean:{name:'Ocean',skin:0x9b7957,hair:0x29201c,shirt:0x39858a,pants:0x283b45}
};
let selectedLook='sunset';
function applyPlayerLook(key){
 const look=avatarLooks[key]||avatarLooks.sunset;
 player.appearance.skinMat.color.setHex(look.skin);
 player.appearance.hairMat.color.setHex(look.hair);
 player.appearance.shirtMat.color.setHex(look.shirt);
 player.appearance.pantsMat.color.setHex(look.pants);
 selectedLook=key;
 document.querySelectorAll('.look-option').forEach(button=>button.classList.toggle('selected',button.dataset.look===key));
 const feedback=document.querySelector('#look-feedback');if(feedback)feedback.textContent='Selected: '+look.name;
}
const npcs=[
 makeAvatar('MAYA',0x9b5c6e,0xc88b67,0x30201b,-14,5),
 makeAvatar('TUNDE',0x4c755a,0x70452f,0x111315,-11,11),
 makeAvatar('ZARA',0x7560a0,0xd49b76,0x241b18,-8,5),
 makeAvatar('KAI',0xb17b3f,0x9c6a4c,0x211b1a,-15,10),
 makeAvatar('NOAH',0x52728d,0xd1a17b,0x493327,-10,12)
];
const all=[player,...npcs];
let cameraMode=0;const modes=['ISOMETRIC','THIRD PERSON','FIRST PERSON'];
const keys={};let noticeTimer;
function addChat(name,message,isSystem=false){
 const log=document.querySelector('#chat-log');
 if(!log)return;
 const row=document.createElement('p');
 if(isSystem)row.className='system-message';
 const who=document.createElement('b');who.textContent=name+':';
 const msg=document.createElement('span');msg.textContent=' '+message;
 row.append(who,msg);log.append(row);log.scrollTop=log.scrollHeight;
}
function speak(text){
 if(!('speechSynthesis' in window))return;
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text);
 utterance.rate=.92;utterance.pitch=.82;utterance.volume=.9;
 window.speechSynthesis.speak(utterance);
}
function notice(t){const n=document.querySelector('#notice');n.textContent=t;n.classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>n.classList.remove('show'),2300)}

// Procedural game audio: rain, night wind and a quiet bus engine. Browser audio
// is started only after a player presses the sound button.
let audioCtx=null, ambienceOn=false, ambienceNodes=[];
function setAmbience(on){
 ambienceOn=on;
 const button=document.querySelector('#sound');
 if(button)button.textContent=`SOUND: ${on?'ON':'OFF'}`;
 if(!on){ambienceNodes.forEach(n=>{try{n.stop?.();n.disconnect?.()}catch{}});ambienceNodes=[];return;}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 audioCtx=audioCtx||new AC();audioCtx.resume();
 const addTone=(frequency,type,volume,filterHz)=>{
  const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();
  osc.type=type;osc.frequency.value=frequency;filter.type='lowpass';filter.frequency.value=filterHz;
  gain.gain.value=volume;osc.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);osc.start();ambienceNodes.push(osc,gain,filter);
 };
 addTone(42,'sawtooth',.012,90); // distant engine rumble
 addTone(115,'sine',.006,180); // low night wind
 // Soft, non-looping rain-like noise bed made from a short generated buffer.
 const length=audioCtx.sampleRate*2,buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*.12;
 const noise=audioCtx.createBufferSource(),ng=audioCtx.createGain(),nf=audioCtx.createBiquadFilter();
 noise.buffer=buffer;noise.loop=true;nf.type='lowpass';nf.frequency.value=850;ng.gain.value=.035;
 noise.connect(nf);nf.connect(ng);ng.connect(audioCtx.destination);noise.start();ambienceNodes.push(noise,ng,nf);
}
if(!document.querySelector('#sound')){
 const sound=document.createElement('button');sound.id='sound';sound.textContent='SOUND: OFF';sound.className='sound-toggle';document.querySelector('.actions')?.append(sound);
}

document.querySelector('#sound').onclick=()=>setAmbience(!ambienceOn);

// Player flashlight: press F or use the on-screen control while exploring.
const flashlight=new THREE.SpotLight(0xe8f2ff,0,22,Math.PI/7,.42,1.5);
flashlight.position.set(0,1.72,.12);
const flashlightTarget=new THREE.Object3D();
flashlightTarget.position.set(0,1.35,9);
player.group.add(flashlightTarget);
player.group.add(flashlight);
flashlight.target=flashlightTarget;
let flashlightOn=false;
if(!document.querySelector('#flashlight')){
 const button=document.createElement('button');
 button.id='flashlight';
 button.type='button';
 button.textContent='FLASHLIGHT: OFF';
 button.setAttribute('aria-pressed','false');
 document.querySelector('.actions')?.append(button);
}
function toggleFlashlight(){
 flashlightOn=!flashlightOn;
 flashlight.intensity=flashlightOn?18:0;
 const button=document.querySelector('#flashlight');
 if(button){
  button.textContent=`FLASHLIGHT: ${flashlightOn?'ON':'OFF'}`;
  button.setAttribute('aria-pressed',String(flashlightOn));
 }
 notice(flashlightOn?'Flashlight switched on.':'Flashlight switched off.');
}
document.querySelector('#flashlight').onclick=toggleFlashlight;

// Online room layer. Set VITE_SERVER_URL when deploying the frontend separately.
const serverUrl=import.meta.env.VITE_SERVER_URL||'';
const socket=io(serverUrl||window.location.origin,{autoConnect:false,reconnection:true,timeout:5000});
let onlineRoom=null,onlineName='ALEX',onlineRole=null,onlineRoundState=null,onlinePromptKey='';
const remoteAvatars=new Map();
function syncRemotePlayers(room){
 const present=new Set();
 for(const p of room.players||[]){
  if(p.id===socket.id)continue;
  present.add(p.id);
  let avatar=remoteAvatars.get(p.id);
  if(!avatar){avatar=makeAvatar(p.name,0x647c9b,0xb77f60,0x211b1a,p.x||0,p.z||0);remoteAvatars.set(p.id,avatar);}
  avatar.group.position.set(Number(p.x)||0,Number(p.y)||0,Number(p.z)||0);
  avatar.group.rotation.y=Number(p.rotation)||0;
 }
 for(const [id,avatar] of remoteAvatars){
  if(!present.has(id)){scene.remove(avatar.group);remoteAvatars.delete(id);}
 }
}
socket.on('connect',()=>{document.querySelector('#online').textContent='ONLINE LOBBY';});
socket.on('connect_error',()=>{document.querySelector('#online').textContent='OFFLINE MODE';});
socket.on('disconnect',()=>{remoteAvatars.forEach(a=>scene.remove(a.group));remoteAvatars.clear();});
socket.on('room:update',room=>{
 onlineRoom=room;
 const list=room.players.map(p=>`<div class="passenger-row"><span class="passenger-dot"></span><b>${p.name}</b><small>${p.id===room.hostId?'HOST':'PLAYER'}</small></div>`).join('');
 const content=`<div class="lobby-code">ROOM CODE <strong>${room.code}</strong></div><div class="passenger-list">${list}</div>${room.hostId===socket.id?'<button class="vote-option" id="host-start">START ROUND (4+ PLAYERS)</button>':''}<button class="vote-option" id="leave-room">LEAVE ROOM</button>`;
 if(!document.querySelector('#modal').classList.contains('hidden') && document.querySelector('#modal-title').textContent==='ONLINE LOBBY'){
  document.querySelector('#modal-content').innerHTML=content;wireLobbyButtons();
 }
});
socket.on('round:role',data=>{
 onlineRole=data.role;playerRole=data.role;
 document.querySelector('#role-label').textContent=`ONLINE ${data.role}`;
 addChat('SYSTEM',`Your secret online role is ${data.role}.`,true);
 notice(`YOUR SECRET ROLE: ${data.role}`);
});
socket.on('round:started',()=>{document.querySelector('#phase').textContent='NIGHT 1';notice('The online round has started!');});
socket.on('round:state',state=>{
 onlineRoundState=state;onlineRoom=state;syncRemotePlayers(state);
 document.querySelector('#phase').textContent=state.phase==='LOBBY'?'GATHERING':state.phase==='ENDED'?'ROUND OVER':state.phase+(state.day?' '+state.day:'');
 const alive=state.players.filter(p=>p.alive).length;
 document.querySelector('#house-status').textContent=`PLAYERS: ${alive}/${state.players.length} • ONLINE`;
 if(state.phase==='NIGHT')showOnlineNightAction(state);
 if(state.phase==='DISCUSSION')showOnlineDiscussion(state);
 if(state.phase==='VOTE')showOnlineVote(state);
 if(state.phase==='RESULTS'&&onlinePromptKey!==`RESULTS:${state.day}`){onlinePromptKey=`RESULTS:${state.day}`;modal('VOTE COMPLETE','The group decision is being revealed. The next night begins shortly.','<p>Stay alert. Watch who changes their story.</p>');}
 if(state.phase==='LOBBY'||state.phase==='ENDED')onlinePromptKey='';
});
socket.on('round:notice',data=>notice(data.message));
socket.on('round:actionCount',data=>notice(`NIGHT ACTIONS: ${data.count}/${data.total}`));
socket.on('round:investigation',data=>modal('DETECTIVE REPORT',`${data.name} is ${data.result}.`,'<p>This result is private to you.</p>'));
socket.on('round:nightResult',data=>{
 if(data.removed){addChat('SYSTEM',`${data.removed.name} was eliminated overnight. Role: ${data.removed.role}.`,true);if(data.removed.id===socket.id){onlineRole='GHOST';document.querySelector('#role-label').textContent='ELIMINATED';modal('YOU HAVE BEEN ELIMINATED','You can watch the rest of this round, but you cannot vote or use a role action.');}}
 else if(data.protected)addChat('SYSTEM','The Doctor protected the Mafia target. Nobody was eliminated overnight.',true);
 else addChat('SYSTEM','Nobody was eliminated overnight.',true);
});
socket.on('round:voteResult',data=>{
 if(data.removed){addChat('SYSTEM',`${data.removed.name} was voted out. Role: ${data.removed.role}.`,true);if(data.removed.id===socket.id){onlineRole='GHOST';document.querySelector('#role-label').textContent='ELIMINATED';modal('YOU HAVE BEEN ELIMINATED','You can watch the rest of this round, but you cannot vote or use a role action.');}}
 else addChat('SYSTEM',data.tied?'The vote was tied. Nobody was removed.':'The group skipped the vote.',true);
});
socket.on('round:ended',data=>{
 onlinePromptKey='';const mafia=data.winner==='MAFIA';
 modal(mafia?'MAFIA WINS':'PASSENGERS WIN',mafia?'The Mafia outnumbered the remaining passengers.':'The Mafia has been found. The passengers win!',onlineRoom?.hostId===socket.id?'<button class="vote-option" id="online-restart">PLAY AGAIN</button>':'<p>Waiting for the room host to start another round.</p>');
 document.querySelector('#online-restart')?.addEventListener('click',()=>socket.emit('round:restart',res=>{if(!res?.ok)notice(res?.error||'Could not restart.');else closeModal();}));
});
socket.on('round:reset',()=>{onlineRole=null;onlinePromptKey='';document.querySelector('#role-label').textContent='PASSENGER';closeModal();notice('New round lobby is ready.');});
socket.on('player:moved',data=>{
 let a=remoteAvatars.get(data.id);
 if(!a){a=makeAvatar(data.name,0x647c9b,0xb77f60,0x211b1a,data.x,data.z);remoteAvatars.set(data.id,a);}
 a.group.position.set(data.x,Number(data.y)||0,data.z);a.group.rotation.y=data.rotation;
});
socket.on('chat:message',data=>addChat(data.name,data.message,data.name==='SYSTEM'));
socket.on('round:voteCount',data=>notice(`VOTES CAST: ${data.count}/${data.total}`));
function showOnlineNightAction(state){
 const key=`NIGHT:${state.day}`;if(onlinePromptKey===key)return;onlinePromptKey=key;
 const role=onlineRole;
 if(role==='GHOST'){modal('SPECTATOR MODE','You have been eliminated. Watch the remaining players until the round ends.');return;}
 if(!['MAFIA','DETECTIVE','DOCTOR'].includes(role)){modal('NIGHT AT BLACKWOOD','You are a Citizen. Stay quiet and wait for morning.');return;}
 const targets=state.players.filter(p=>p.alive&&(role==='DOCTOR'||p.id!==socket.id));
 const title=role==='MAFIA'?'MAFIA: CHOOSE A TARGET':role==='DETECTIVE'?'DETECTIVE: INVESTIGATE':'DOCTOR: PROTECT A PLAYER';
 const copy=role==='MAFIA'?'Choose one living player. Your choice is secret.':role==='DETECTIVE'?'Choose one living player to investigate. Only you see the result.':'Choose one living player to protect tonight.';
 const content=targets.map(p=>`<button class="vote-option" data-online-target="${p.id}">${p.name}</button>`).join('');
 modal(title,copy,content||'<p>Waiting for the other players.</p>');
 document.querySelectorAll('[data-online-target]').forEach(button=>button.onclick=()=>{
  socket.emit('round:action',{targetId:button.dataset.onlineTarget},res=>{if(!res?.ok){notice(res?.error||'Action not accepted.');return;}onlinePromptKey=`NIGHT-SENT:${state.day}`;modal('ACTION SUBMITTED','Your night action is locked in. Waiting for the other special roles.');});
 });
}
function showOnlineDiscussion(state){
 const key=`DISCUSSION:${state.day}`;if(onlinePromptKey===key)return;onlinePromptKey=key;
 if(onlineRole==='GHOST'){modal('SPECTATOR MODE','You have been eliminated. The living passengers are discussing the round.');return;}
 modal('DISCUSSION TIME','Discuss what happened with your room. When ready, anyone still alive can open the vote.', '<button class="vote-option" id="open-online-vote">START VOTING</button>');
 document.querySelector('#open-online-vote').onclick=()=>socket.emit('round:meeting',res=>{if(!res?.ok)notice(res?.error||'Voting is not ready.');});
}
function showOnlineVote(state){
 const key=`VOTE:${state.day}`;if(onlinePromptKey===key)return;onlinePromptKey=key;
 if(onlineRole==='GHOST'){modal('SPECTATOR MODE','You have been eliminated. Watch the vote, but you cannot vote again.');return;}
 if(state.votedIds?.includes(socket.id)){modal('VOTE SUBMITTED','Your vote is locked. Waiting for the other passengers.');return;}
 const targets=state.players.filter(p=>p.alive&&p.id!==socket.id);
 const content=targets.map(p=>`<button class="vote-option" data-online-vote="${p.id}">VOTE: ${p.name}</button>`).join('')+'<button class="vote-option" data-online-vote="SKIP">SKIP VOTE</button>';
 modal('EMERGENCY VOTE','Choose one living player you suspect, or skip. Your vote is private.',content);
 document.querySelectorAll('[data-online-vote]').forEach(button=>button.onclick=()=>{
  socket.emit('round:castVote',{targetId:button.dataset.onlineVote},res=>{if(!res?.ok){notice(res?.error||'Vote not accepted.');return;}modal('VOTE SUBMITTED','Your vote is locked. Waiting for the other passengers.');});
 });
}
function wireLobbyButtons(){
 document.querySelector('#host-start')?.addEventListener('click',()=>{
  socket.emit('round:start',result=>{if(!result?.ok)notice(result?.error||'Could not start round.');else closeModal();});
 });
 document.querySelector('#leave-room')?.addEventListener('click',()=>{socket.emit('room:leave');onlineRoom=null;closeModal();notice('You left the online room.');});
}
function openOnlineLobby(){
 const content=`<label class="lobby-label">YOUR DISPLAY NAME</label><input id="lobby-name" maxlength="16" value="${onlineName}" class="lobby-input"><button class="vote-option" id="create-room">CREATE A ROOM</button><div class="lobby-divider">OR JOIN A ROOM</div><input id="room-code" maxlength="6" inputmode="numeric" placeholder="6-DIGIT ROOM CODE" class="lobby-input"><button class="vote-option" id="join-room">JOIN ROOM</button><p class="lobby-help">Online rooms need the game server running. At least four real players are needed to start a round.</p>`;
 modal('ONLINE LOBBY','Create a private room and share its code with friends.',content);
 const getName=()=>{onlineName=document.querySelector('#lobby-name').value.trim().slice(0,16)||'PLAYER';return onlineName;};
 document.querySelector('#create-room').onclick=()=>{if(!serverUrl){notice('Multiplayer is being connected to Render. Try again after the server is deployed.');return;}socket.emit('room:create',{name:getName()},res=>{if(!res?.ok)notice(res?.error||'Could not create room.');else{onlineRoom=res.room;notice(`ROOM CREATED: ${res.room.code}`);showRoomPanel(res.room);}});};
 document.querySelector('#join-room').onclick=()=>{if(!serverUrl){notice('Multiplayer is being connected to Render. Try again after the server is deployed.');return;}socket.emit('room:join',{name:getName(),code:document.querySelector('#room-code').value},res=>{if(!res?.ok)notice(res?.error||'Could not join room.');else{onlineRoom=res.room;notice('You joined the room.');showRoomPanel(res.room);}});};
}
function showRoomPanel(room){
 const list=room.players.map(p=>`<div class="passenger-row"><span class="passenger-dot"></span><b>${p.name}</b><small>${p.id===room.hostId?'HOST':'PLAYER'}</small></div>`).join('');
 modal('ONLINE LOBBY',`Share room code ${room.code} with your friends.`, `<div class="lobby-code">ROOM CODE <strong>${room.code}</strong></div><div class="passenger-list">${list}</div>${room.hostId===socket.id?'<button class="vote-option" id="host-start">START ROUND (4+ PLAYERS)</button>':''}<button class="vote-option" id="leave-room">LEAVE ROOM</button>`);
 wireLobbyButtons();
}
document.querySelector('#online').onclick=openOnlineLobby;

function modal(title,copy,content=''){document.querySelector('#modal-title').textContent=title;document.querySelector('#modal-copy').textContent=copy;document.querySelector('#modal-content').innerHTML=content;document.querySelector('#modal').classList.remove('hidden')}
function closeModal(){document.querySelector('#modal').classList.add('hidden')}
document.querySelector('#close-modal').onclick=closeModal;
document.querySelector('#rules-button')?.addEventListener('click',()=>modal('HOW TO PLAY','Find clues, explore Blackwood House and work out who is the Mafia.', '<div class="room-list"><div>MAFIA — secretly disrupts the group</div><div>DETECTIVE — investigates a player</div><div>DOCTOR — protects a player</div><div>CITIZEN — studies clues and votes</div></div>'));
document.querySelector('#chat-button')?.addEventListener('click',()=>{
 modal('MESSAGES','Group chat is available when you join an online room.', '<div id="chat-log" class="chat-log"></div><form id="chat-form"><input id="chat-input" maxlength="180" placeholder="Write a group message" autocomplete="off"><button type="submit">SEND</button></form>');
 document.querySelector('#chat-form')?.addEventListener('submit',event=>{
  event.preventDefault();const input=document.querySelector('#chat-input');const message=input.value.trim();
  if(!message)return;
  if(!onlineRoom||!socket.connected){notice('Join an online room before sending group messages.');return;}
  socket.emit('chat:send',{message});input.value='';
 });
});
// Supabase Auth stores account credentials securely; this game never stores passwords.
const supabaseUrl=(import.meta.env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
const supabaseAnonKey=import.meta.env.VITE_SUPABASE_ANON_KEY||'';
let authMode='signin',authSession=null;
const authFeedback=document.querySelector('#auth-feedback');
const authForm=document.querySelector('#auth-form');
const authEmail=document.querySelector('#auth-email');
const authUsername=document.querySelector('#auth-username');
const authPassword=document.querySelector('#auth-password');
function setAuthMode(mode){
 authMode=mode;
 document.querySelector('#auth-tab-signin').classList.toggle('active',mode==='signin');
 document.querySelector('#auth-tab-signup').classList.toggle('active',mode==='signup');
 document.querySelector('#auth-username-wrap').classList.toggle('hidden',mode==='signin');
 authUsername.required=mode==='signup';
 authPassword.autocomplete=mode==='signin'?'current-password':'new-password';
 document.querySelector('#auth-submit').textContent=mode==='signin'?'SIGN IN TO THE GAME':'CREATE PLAYER ACCOUNT';
 authFeedback.textContent=mode==='signin'?'Enter your email and password to sign in.':'Choose a username and password with at least 8 characters.';
}
document.querySelector('#auth-tab-signin').onclick=()=>setAuthMode('signin');
document.querySelector('#auth-tab-signup').onclick=()=>setAuthMode('signup');
function saveAuthSession(session){
 authSession=session;
 try{
  if(session?.refresh_token)sessionStorage.setItem('mole-refresh-token',session.refresh_token);
  else sessionStorage.removeItem('mole-refresh-token');
 }catch{}
}
async function authRequest(path,body,accessToken=''){
 if(!supabaseUrl||!supabaseAnonKey)throw new Error('The account service is not configured yet. The site owner must finish the secure setup.');
 const response=await fetch(supabaseUrl+'/auth/v1/'+path,{method:'POST',headers:{'Content-Type':'application/json','apikey':supabaseAnonKey,...(accessToken?{Authorization:'Bearer '+accessToken}:{})},body:JSON.stringify(body)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.msg||data.message||data.error_description||data.error||'Account request failed. Please try again.');
 return data;
}
function enterGuest(){
  const chosenName=String(authUsername.value.trim()||'GUEST').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,16)||'GUEST';
  try{sessionStorage.removeItem('mole-refresh-token');localStorage.setItem('mole-player-name',chosenName);}catch{}
  authSession=null;
  onlineName=chosenName;
  socket.auth={};
  socket.disconnect();
  document.querySelector('#player-name').textContent=onlineName.toUpperCase();
  player.name=onlineName.toUpperCase();
  const oldLabel=player.group.children.find(child=>child.isSprite);
  if(oldLabel)player.group.remove(oldLabel);
  const nameLabel=makeLabel(player.name);nameLabel.position.set(0,2.62,0);player.group.add(nameLabel);
  document.querySelector('#auth-screen').classList.add('hidden');
  document.querySelector('#avatar-screen').classList.remove('hidden');
  notice('Welcome, '+chosenName+'. Guest mode is local play; online rooms need account setup.');
}
document.querySelector('#continue-guest')?.addEventListener('click',enterGuest);
function enterAccount(user,session){
 const metadata=user?.user_metadata||{};
 const chosenName=String(metadata.display_name||authUsername.value.trim()||user?.email?.split('@')[0]||'PLAYER').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,16)||'PLAYER';
 saveAuthSession(session);
 onlineName=chosenName;
 socket.auth={accessToken:session.access_token};
 if(serverUrl)socket.connect();
 document.querySelector('#player-name').textContent=onlineName.toUpperCase();
 player.name=onlineName.toUpperCase();
 const oldLabel=player.group.children.find(child=>child.isSprite);
 if(oldLabel)player.group.remove(oldLabel);
 const nameLabel=makeLabel(player.name);nameLabel.position.set(0,2.62,0);player.group.add(nameLabel);
 document.querySelector('#auth-screen').classList.add('hidden');
 document.querySelector('#avatar-screen').classList.remove('hidden');
}
authForm.addEventListener('submit',async event=>{
 event.preventDefault();
 const email=authEmail.value.trim(),password=authPassword.value;
 const username=authUsername.value.trim();
 if(!supabaseUrl||!supabaseAnonKey){authFeedback.textContent='Secure sign-in setup is not finished. Ask the site owner to connect the account service.';return;}
 if(authMode==='signup'&&(username.length<3||username.length>16)){authFeedback.textContent='Your username must be 3–16 characters.';return;}
 if(password.length<8){authFeedback.textContent='Your password must contain at least 8 characters.';return;}
 const submit=document.querySelector('#auth-submit');submit.disabled=true;authFeedback.textContent=authMode==='signin'?'Signing in securely…':'Creating your account…';
 try{
  if(authMode==='signup'){
   const data=await authRequest('signup',{email,password,data:{display_name:username}});
   if(!data.access_token){authFeedback.textContent='Account created. Check your email for the verification link, then return here and sign in.';setAuthMode('signin');authEmail.value=email;authPassword.value='';return;}
   enterAccount(data.user,data);
  }else{
   const data=await authRequest('token?grant_type=password',{email,password});
   enterAccount(data.user,data);
  }
 }catch(error){authFeedback.textContent=error.message||'Could not sign in. Check your details and try again.';}
 finally{submit.disabled=false;}
});
async function restoreAccountSession(){
 let refreshToken='';try{refreshToken=sessionStorage.getItem('mole-refresh-token')||'';}catch{}
 if(!refreshToken||!supabaseUrl||!supabaseAnonKey)return;
 try{
  const data=await authRequest('token?grant_type=refresh_token',{refresh_token:refreshToken});
  enterAccount(data.user,data);
 }catch{try{sessionStorage.removeItem('mole-refresh-token');}catch{}}
}
setAuthMode('signin');
restoreAccountSession();
document.querySelectorAll('.look-option').forEach(button=>button.addEventListener('click',()=>applyPlayerLook(button.dataset.look)));
document.querySelector('#confirm-look')?.addEventListener('click',()=>{
 const look=avatarLooks[selectedLook];
 try{localStorage.setItem('mole-avatar-look',selectedLook);localStorage.setItem('mole-player-name',onlineName);}catch{}
 document.querySelector('#avatar-screen').classList.add('hidden');
 notice(look.name+' look selected. Welcome to Blackwood.');
});
let arrivalActive=false,arrivalComplete=false,arrivalStartedAt=0,arrivalPassengerTargets=[];
const arrivalStartBusX=-24,arrivalEndBusX=-13;
const arrivalCaption=document.querySelector('#arrival-caption');
const arrivalSkip=document.querySelector('#skip-arrival');
function finishArrival(){
 arrivalActive=false;arrivalComplete=true;bus.position.x=arrivalEndBusX;
 npcs.forEach((n,i)=>{const target=arrivalPassengerTargets[i];if(target)n.group.position.copy(target);});
 if(arrivalCaption)arrivalCaption.textContent='BLACKWOOD HOUSE. NO ONE KNOWS WHY THE BUS STOPPED HERE.';
 if(arrivalSkip)arrivalSkip.hidden=true;
 const start=document.querySelector('#begin-game');
 if(start){start.textContent='ENTER THE HOUSE';start.dataset.phase='enter';}
}
function startArrival(){
 if(arrivalActive||arrivalComplete)return;
 arrivalActive=true;arrivalStartedAt=elapsed;
 arrivalPassengerTargets=npcs.map(n=>n.group.position.clone());
 npcs.forEach((n,i)=>n.group.position.set(arrivalStartBusX+(i-2)*.52,0,8));
 bus.position.set(arrivalStartBusX,0,8);
 camera.position.set(-23,6,22);camera.lookAt(-13,1.5,8);
 if(arrivalCaption)arrivalCaption.textContent='THE LAST BUS OF THE NIGHT…';
 speak('It is almost midnight. The last bus rattles along an empty road. The rain is getting heavier.');
}
document.querySelector('#begin-game')?.addEventListener('click',()=>{
 if(!arrivalComplete){startArrival();return;}
 document.querySelector('#bus-intro')?.classList.add('intro-hidden');
 speak('The bus has broken down. The road is empty. Ahead, a house stands beneath the storm. Stay together. Your role is being revealed.');
 setAmbience(true);
 showRole();
});
arrivalSkip?.addEventListener('click',()=>{
 if(!arrivalActive&&!arrivalComplete)startArrival();
 finishArrival();
});
function switchCamera(){cameraMode=(cameraMode+1)%3;document.querySelector('#camera').textContent='CAMERA: '+modes[cameraMode];notice('CAMERA MODE: '+modes[cameraMode])}
document.querySelector('#camera').onclick=switchCamera;
document.querySelector('#map').onclick=()=>modal('HOUSE MAP','You are inside Blackwood House. Explore the rooms and speak to the other passengers.',`<div class="room-list"><div>01 — ENTRY HALL</div><div>02 — LIVING ROOM</div><div>03 — LIBRARY</div><div>04 — KITCHEN</div><div>05 — EAST BEDROOM</div><div>06 — STORAGE</div><div>07 — EAST STUDY</div><div>08 — MUSIC ROOM</div><div>09 — SEALED CONSERVATORY</div><div>10 — SECOND FLOOR</div><div>11 — THIRD FLOOR / ROOFTOP</div><div>12 — EAST WING STAIRCASE</div></div>`);

// Local social-deduction round: one hidden Mole, one Detective, one Doctor.
const roster = [player, ...npcs];
const roleDeck = ['MAFIA','DETECTIVE','DOCTOR','CITIZEN','CITIZEN','CITIZEN'];
for (let i=roleDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[roleDeck[i],roleDeck[j]]=[roleDeck[j],roleDeck[i]];}
roster.forEach((a,i)=>a.role=roleDeck[i]);
let roundPhase='DAY', eliminated=[], protectedName=null, investigatedName=null;
let playerRole=player.role;
document.querySelector('#role-label').textContent=playerRole;
document.querySelector('#phase').textContent='DAY 1';
function living(){return roster.filter(a=>!eliminated.includes(a.name))}
function updateStatus(){document.querySelector('#house-status').textContent=`PASSENGERS: ${living().length} • POWER: UNSTABLE`;}
function roleDescription(){
 if(playerRole==='MAFIA') return 'You are the secret Mafia member. Blend in, misdirect the others and avoid being voted out.';
 if(playerRole==='DETECTIVE') return 'You are the Detective. Use your ability at night to check one passenger. The result is private.';
 if(playerRole==='DOCTOR') return 'You are the Doctor. Choose one passenger to protect during the night.';
 return 'You are a Citizen. Listen carefully, compare stories and help identify the Mole.';
}
function showRole(){modal(`YOUR ROLE: ${playerRole}`,roleDescription(),'<button class="vote-option" id="role-ready">I UNDERSTAND</button>');document.querySelector('#role-ready').onclick=closeModal;}
function voteMeeting(){
 const candidates=living().filter(a=>a!==player);
 if(!candidates.length){notice('There is nobody else to question.');return;}
 modal('EMERGENCY MEETING','Talk it through, then vote for the passenger you suspect. This is a local practice round.',candidates.map(n=>`<button class="vote-option" data-vote="${n.name}">VOTE: ${n.name}</button>`).join('')+'<button class="vote-option" id="skip-vote">SKIP THIS VOTE</button>');
 document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>{
   const target=b.dataset.vote;eliminated.push(target);closeModal();updateStatus();
   const removed=roster.find(a=>a.name===target);
   notice(`${target} was voted out. Their role was ${removed.role}.`);
   checkWin();
 });
 document.querySelector('#skip-vote').onclick=()=>{closeModal();notice('The group decided not to vote anyone out.');nightPhase();};
}
function checkWin(){
 const alive=living(), moleAlive=alive.some(a=>a.role==='MAFIA');
 if(!moleAlive){modal('PASSENGERS WIN','The Mole has been found. The group survives this round.','<button class="vote-option" id="restart">PLAY ANOTHER ROUND</button>');}
 else if(alive.filter(a=>a.role!=='MAFIA').length<=1){modal('THE MOLE WINS','The Mole has outlasted the other passengers.','<button class="vote-option" id="restart">PLAY ANOTHER ROUND</button>');}
 const r=document.querySelector('#restart');if(r)r.onclick=()=>location.reload();
}
function chooseTarget(title,copy,callback){
 const candidates=living().filter(a=>a!==player);
 modal(title,copy,candidates.map(n=>`<button class="vote-option" data-target="${n.name}">SELECT ${n.name}</button>`).join(''));
 document.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>{callback(b.dataset.target);closeModal();});
}

function resolveNight(protectedTarget=null){
 const mole=roster.find(a=>a.role==='MAFIA');
 if(playerRole==='MAFIA'){
   if(investigatedName && !eliminated.includes(investigatedName)){
     eliminated.push(investigatedName);
     const target=roster.find(a=>a.name===investigatedName);
     notice(`${target.name} was missing at breakfast. Their role was ${target.role}.`);
   }
 }else{
   const possible=living().filter(a=>a!==mole);
   const attack=possible[Math.floor(Math.random()*possible.length)];
   if(attack && attack.name!==protectedTarget){
     eliminated.push(attack.name);
     notice(`${attack.name} was missing at breakfast. Their role was ${attack.role}.`);
   }else if(attack){
     notice('Someone was protected during the night. Everyone made it to breakfast.');
   }
 }
 investigatedName=null;updateStatus();
 if(checkWin())return;
 roundPhase='DAY';document.querySelector('#phase').textContent='DAY 2';
 modal('MORNING AT BLACKWOOD','The house is quiet. Compare what everyone says, then call a meeting.', '<button class="vote-option" id="morning-meeting">CALL A MEETING</button>');
 document.querySelector('#morning-meeting').onclick=()=>{closeModal();voteMeeting();};
}
function nightPhase(){
 roundPhase='NIGHT';document.querySelector('#phase').textContent='NIGHT 1';
 notice('Night falls over Blackwood House…');
 if(playerRole==='MAFIA'){
  chooseTarget('MOLE: SECRET MOVE','Choose a passenger to secretly remove from the next round.',name=>{
   investigatedName=name;resolveNight();
  });
  return;
 }
 if(playerRole==='DETECTIVE'){
  chooseTarget('DETECTIVE INVESTIGATION','Choose one passenger to check. Your result is private.',name=>{
   const target=roster.find(a=>a.name===name);
   addChat('SYSTEM',`Private investigation: ${name} is ${target.role==='MAFIA'?'SUSPICIOUS':'NOT THE MOLE'}.`,true);
   resolveNight();
  });
  return;
 }
 if(playerRole==='DOCTOR'){
  chooseTarget('DOCTOR: PROTECT','Choose one passenger to protect tonight.',name=>{
   notice(`${name} is under your protection tonight.`);
   resolveNight(name);
  });
  return;
 }
 resolveNight();
}
document.querySelector('#start-vote').onclick=()=>{
 if(onlineRoom?.started){socket.emit('round:meeting',res=>{if(!res?.ok)notice(res?.error||'Discussion is not open yet.');});return;}
 voteMeeting();
};
document.querySelector('#ability').onclick=()=>{
 if(onlineRoom?.started){notice(onlineRoundState?.phase==='NIGHT'?'Your night action appears automatically.':'Wait for your role phase.');return;}
 if(playerRole==='DETECTIVE'||playerRole==='DOCTOR'||playerRole==='MAFIA')nightPhase();
 else notice('Citizen ability: listen, explore and question passengers.');
};
updateStatus();
// The role reveal is shown after the player enters the house from the bus scene.

document.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='c')switchCamera();if(e.key.toLowerCase()==='e')interact();if(e.key.toLowerCase()==='f'&&!e.repeat)toggleFlashlight()});
document.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',()=>keys[k]=true);['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false))});
let cluesFound=0, exitUnlocked=false;
function updateObjective(){
 const count=document.querySelector('#clue-count'),objective=document.querySelector('#objective-text');
 if(count)count.textContent=`CLUES FOUND: ${cluesFound} / 6`;
 if(objective)objective.textContent=cluesFound<6?'SEARCH THE HOUSE FOR CLUES':'RETURN TO THE FRONT DOOR';
}
function interact(){
 const p=player.group.position;
 // Pick up the nearest clue.
 let nearestClue=null,clueDist=2.4;
 for(const clue of clueItems){if(clue.collected)continue;const d=p.distanceTo(clue.group.position);if(d<clueDist){clueDist=d;nearestClue=clue}}
 if(nearestClue){
  nearestClue.collected=true;scene.remove(nearestClue.group);cluesFound++;updateObjective();
  notice(`${nearestClue.name} collected.`);
  if(cluesFound===6){exitUnlocked=true;notice('All six clues found. The front door lock has released!');}
  return;
 }
 // Collect optional neighbourhood supplies for bonus coins.
 let supply=null,supplyDist=2.7;
 for(const item of sideMissionItems){if(item.collected)continue;const d=p.distanceTo(item.group.position);if(d<supplyDist){supplyDist=d;supply=item;}}
 if(supply){
  supply.collected=true;scene.remove(supply.group);moleCoins+=25;updateCoins();
  notice(supply.name+' recovered • +25 coins');playCue();return;
 }
 const dDoor=p.distanceTo(new THREE.Vector3(0,0,8.5));
 if(dDoor<3.2){
  if(!exitUnlocked){notice(`The lock is jammed. Find all 6 clues first (${cluesFound}/6).`);return}
  doorOpen=!doorOpen;doorPivot.rotation.y=doorOpen?-1.45:0;
  if(doorOpen){modal('YOU FOUND THE WAY OUT','The group has uncovered the house secret and opened the front door. This exploration chapter is complete.','<button class="vote-option" id="continue-round">RETURN TO THE HOUSE</button>');document.querySelector('#continue-round').onclick=closeModal;}
  else notice('The front door closes.');
  return;
 }
 let closest=null,dist=3.1;for(const n of npcs){const d=p.distanceTo(n.group.position);if(d<dist){dist=d;closest=n}}
 if(closest){addChat?.(closest.name,'I saw something strange in the rooms. Have you found any clues?');notice(`${closest.name}: “We need to find a way out of here.”`);return}
 if(p.distanceTo(bus.position)<4){notice('The bus has broken down. The passengers are gathering outside.');return}
 notice('Nothing to interact with here.');
}
updateObjective();
let currentFloor=0;
const clock=new THREE.Clock();let elapsed=0,lastNetworkMove=0;
const floorBadge=document.createElement('div');
floorBadge.id='floor-indicator';
floorBadge.textContent='GROUND FLOOR';
document.querySelector('#game').append(floorBadge);

function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;
 // Animate the rain around the world and occasionally illuminate the skyline.
 const rainPos=rain.geometry.attributes.position;
 for(let i=0;i<rainCount;i++){
  rainPos.array[i*3+1]-=dt*19;
  rainPos.array[i*3]+=dt*.7;
  if(rainPos.array[i*3+1]<0){rainPos.array[i*3+1]=18+Math.random()*9;rainPos.array[i*3]=(Math.random()-.5)*86;rainPos.array[i*3+2]=(Math.random()-.5)*86;}
 }
 rainPos.needsUpdate=true;
 if(elapsed>nextStormFlash){flashRemaining=.22;nextStormFlash=elapsed+13+Math.random()*18;}
 if(flashRemaining>0){flashRemaining-=dt;lightning.intensity=flashRemaining>.12?2.8:1.1;}
 else lightning.intensity=0;
 if(elapsed>nextSpookyEvent){
  const events=['A distant generator suddenly starts.','A streetlight flickers behind you.','A metal gate rattles somewhere nearby.','A strange sound echoes from the empty market.'];
  notice(events[Math.floor(Math.random()*events.length)]);
  flashRemaining=.5;nextSpookyEvent=elapsed+28+Math.random()*28;
 }
 const p=player.group;let dx=0,dz=0;
 const floorName=p.position.y>11?'THIRD FLOOR':p.position.y>7?'SECOND FLOOR':'GROUND FLOOR';
 floorBadge.textContent=floorName;
if(keys.w)dz-=1;if(keys.s)dz+=1;if(keys.a)dx-=1;if(keys.d)dx+=1;
 const moving=dx!==0||dz!==0;const speed=keys.shift?5.2:3.1;
 if(moving){const len=Math.hypot(dx,dz);dx/=len;dz/=len;p.position.x+=dx*speed*dt;p.position.z+=dz*speed*dt;p.rotation.y=Math.atan2(dx,dz);p.position.x=THREE.MathUtils.clamp(p.position.x,-42,42);p.position.z=THREE.MathUtils.clamp(p.position.z,-40,40);}
 // Keep the avatar grounded on the current storey and follow either stair flight.
 const onFirstStairs=p.position.x>12.05&&p.position.x<14.45&&p.position.z>-5.95&&p.position.z<5.95;
 const onSecondStairs=p.position.x>15.35&&p.position.x<17.15&&p.position.z>-5.95&&p.position.z<5.95;
 if(onFirstStairs&&currentFloor<=1){
  const progress=THREE.MathUtils.clamp((5.6-p.position.z)/11.2,0,1);
  p.position.y=progress*7.8;
  if(progress<.025)currentFloor=0;else if(progress>.975)currentFloor=1;
 }else if(onSecondStairs&&currentFloor>=1){
  const progress=THREE.MathUtils.clamp((p.position.z+5.6)/11.2,0,1);
  p.position.y=7.8+progress*3.8;
  if(progress<.025)currentFloor=1;else if(progress>.975)currentFloor=2;
 }else{
  p.position.y=[0,7.8,11.6][currentFloor];
 }
 player.limbs.forEach((l,i)=>{l.rotation.x=moving?Math.sin(elapsed*10+i*Math.PI)*.65:Math.sin(elapsed*2+i)*.035});
 npcs.forEach((n,i)=>{n.phase+=dt;const t=n.phase; n.group.position.x+=Math.sin(t*.24+i)*.0015;n.group.position.z+=Math.cos(t*.22+i)*.0015;n.limbs.forEach((l,j)=>l.rotation.x=Math.sin(t*2+j)*.08)});
 sideMissionItems.forEach(item=>{if(!item.collected){item.group.position.y=.45+Math.sin(elapsed*2+item.phase)*.13;item.group.rotation.y+=dt*.8;}});
 // clue items hover gently until collected
 clueItems.forEach(c=>{if(!c.collected)c.group.position.y=c.baseY+Math.sin(elapsed*2+c.phase)*.09;});
 // flicker the old house lights
 warm.intensity=35+Math.sin(elapsed*8)*2+(Math.sin(elapsed*23)>.985?-22:0);
 // Send player movement at a modest rate when connected to an online room.
 if(onlineRoom&&socket.connected&&elapsed-lastNetworkMove>.09){socket.emit('player:move',{x:p.position.x,y:p.position.y,z:p.position.z,rotation:p.rotation.y});lastNetworkMove=elapsed;}
 // Cinematic arrival camera: bus approach, breakdown, then reveal Blackwood House.
 if(arrivalActive){
  const t=elapsed-arrivalStartedAt;
  const smooth=v=>{v=THREE.MathUtils.clamp(v,0,1);return v*v*(3-2*v)};
  bus.position.x=THREE.MathUtils.lerp(arrivalStartBusX,arrivalEndBusX,smooth(t/4));
  let shotPos,shotTarget,caption;
  if(t<4){
   shotPos=new THREE.Vector3(-23,6,22);shotTarget=new THREE.Vector3(bus.position.x,1.4,8);
   caption='THE LAST BUS OF THE NIGHT…';
  }else if(t<8){
   const exitProgress=smooth((t-4)/4);
   npcs.forEach((n,i)=>{
    const target=arrivalPassengerTargets[i];
    if(target){n.group.position.x=THREE.MathUtils.lerp(arrivalStartBusX+(i-2)*.52,target.x,exitProgress);n.group.position.z=THREE.MathUtils.lerp(8,target.z,exitProgress);}
   });
   shotPos=new THREE.Vector3(-17,4.2,14);shotTarget=new THREE.Vector3(-13,1.5,8);
   caption='A sudden jolt. The engine falls silent. Passengers step into the rain.';
  }else if(t<12){
   shotPos=new THREE.Vector3(15,10,22);shotTarget=new THREE.Vector3(0,4,0);
   caption='Through the rain, a strange building appears…';
  }else if(t<16){
   shotPos=new THREE.Vector3(4,6,17);shotTarget=new THREE.Vector3(0,4,0);
   caption='BLACKWOOD HOUSE. THE ONLY SHELTER FOR MILES.';
  }else{
   finishArrival();
  }
  if(arrivalActive){
   camera.position.lerp(shotPos,.035);camera.lookAt(shotTarget);
   if(arrivalCaption&&arrivalCaption.textContent!==caption)arrivalCaption.textContent=caption;
  }
 }else{
  // Normal player camera rigs
  const target=new THREE.Vector3(p.position.x,p.position.y+1.2,p.position.z);
  if(cameraMode===0){const desired=new THREE.Vector3(p.position.x+11,12+p.position.y,p.position.z+13);camera.position.lerp(desired,.08);camera.lookAt(p.position.x,p.position.y+.7,p.position.z)}
  else if(cameraMode===1){const behind=new THREE.Vector3(p.position.x-Math.sin(p.rotation.y)*5,3.2+p.position.y,p.position.z-Math.cos(p.rotation.y)*5);camera.position.lerp(behind,.12);camera.lookAt(target)}
  else {const eye=new THREE.Vector3(p.position.x,p.position.y+1.72,p.position.z);camera.position.lerp(eye,.25);camera.rotation.set(0,p.rotation.y,0);camera.rotateY(Math.PI)}
 }
 // labels face camera
 all.forEach(a=>a.group.children.forEach(c=>{if(c.isSprite)c.quaternion.copy(camera.quaternion)}));
 renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))});
notice('THE BUS HAS BROKEN DOWN — GATHER WITH THE PASSENGERS');


// Private player messages (online rooms only).
const privateButton=document.createElement('button');privateButton.id='private-chat-button';privateButton.textContent='✉ PRIVATE';document.querySelector('.social-tools')?.append(privateButton);
privateButton.onclick=()=>{
 if(!onlineRoom||!socket.connected){notice('Join an online room before sending private messages.');return;}
 const others=onlineRoom.players.filter(p=>p.id!==socket.id);if(!others.length){notice('No other players are in this room yet.');return;}
 modal('PRIVATE MESSAGES','Only you and the selected player receive this message.','<label class="private-label">MESSAGE PLAYER</label><select id="private-target" class="private-input"></select><div id="private-thread" class="private-thread"></div><form id="private-form"><input id="private-input" class="private-input" maxlength="180" placeholder="Write a private message"><button>SEND</button></form>');
 const select=document.querySelector('#private-target');others.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;select.append(o)});
 document.querySelector('#private-form').onsubmit=e=>{e.preventDefault();const input=document.querySelector('#private-input'),message=input.value.trim();if(message){socket.emit('chat:private',{to:select.value,message});input.value=''}};
};
socket.on('chat:private',packet=>{const thread=document.querySelector('#private-thread');if(!thread){notice('New private message from '+packet.from+'.');return;}const p=document.createElement('p');p.textContent=packet.from+' → '+packet.to+': '+packet.message;thread.append(p);thread.scrollTop=thread.scrollHeight;});

// Public community discussion board, separate from private game-room chat.
const boardButton=document.createElement('button');
boardButton.id='discussion-board-button';
boardButton.textContent='▤ DISCUSSION BOARD';
document.querySelector('.social-tools')?.append(boardButton);
let boardPosts=[];
function renderBoardPosts(){
 const list=document.querySelector('#board-post-list');
 if(!list)return;
 list.replaceChildren();
 if(!boardPosts.length){
  const empty=document.createElement('p');empty.className='board-empty';empty.textContent='No posts yet. Start the conversation!';list.append(empty);return;
 }
 boardPosts.forEach(post=>{
  const article=document.createElement('article');article.className='board-post';
  const head=document.createElement('div');head.className='board-post-head';
  const author=document.createElement('strong');author.textContent=post.name||'PLAYER';
  const time=document.createElement('time');time.textContent=new Date(post.at).toLocaleString();
  head.append(author,time);
  const body=document.createElement('p');body.textContent=post.message||'';
  article.append(head,body);list.append(article);
 });
 list.scrollTop=list.scrollHeight;
}
socket.on('board:history',posts=>{boardPosts=Array.isArray(posts)?posts:[];renderBoardPosts();});
socket.on('board:new-post',post=>{
 if(!boardPosts.some(item=>item.id===post.id)){boardPosts.push(post);if(boardPosts.length>100)boardPosts.shift();}
 renderBoardPosts();
});
boardButton.onclick=()=>{
 if(!socket.connected){notice('The public discussion board needs the online server. Please try again when ONLINE LOBBY is showing.');return;}
 modal('PUBLIC DISCUSSION BOARD','Talk with the THE MOLE community. Keep posts friendly and do not share private information.','<div class="board-room-label">BLACKWOOD COMMUNITY ROOM · PUBLIC POSTS</div><div id="board-post-list" class="board-post-list"></div><form id="board-post-form" class="board-post-form"><textarea id="board-post-input" maxlength="500" rows="3" placeholder="Share a theory, question or game idea..."></textarea><button type="submit">POST MESSAGE</button></form><p class="board-note">Posts are visible to everyone who opens this board. Latest 100 posts are kept while the game server is running.</p>');
 socket.emit('board:join');
 renderBoardPosts();
 document.querySelector('#board-post-form')?.addEventListener('submit',event=>{
  event.preventDefault();
  const input=document.querySelector('#board-post-input'),message=input.value.trim();
  if(!message)return;
  socket.emit('board:post',{name:onlineName,message},result=>{
   if(!result?.ok){notice(result?.error||'Your post could not be sent.');return;}
   input.value='';
  });
 });
};

// Additional avatar controls.
const preview=document.createElement('div');preview.className='live-avatar-preview';preview.innerHTML='<div class="boutique-stage"><span class="stage-label">FULL LOOK</span><div class="preview-person" id="preview-person" data-hair="curly" data-accessory="none"><span class="preview-shadow"></span><span class="preview-hair"></span><span class="preview-face"><i></i><i></i><b></b></span><span class="preview-neck"></span><span class="preview-body"><i class="preview-collar"></i><i class="preview-seam"></i></span><span class="preview-arm preview-arm-left"><i></i></span><span class="preview-arm preview-arm-right"><i></i></span><span class="preview-leg preview-leg-left"><i></i></span><span class="preview-leg preview-leg-right"><i></i></span><span class="preview-shoe preview-shoe-left"></span><span class="preview-shoe preview-shoe-right"></span><span class="preview-accessory"></span></div><span class="stage-floor"></span></div><div class="preview-copy"><b>THE MOLE BOUTIQUE</b><strong>YOUR CHARACTER, HEAD TO TOE</strong><small>Try a complete look. Your choices update the passenger before you enter the game.</small><span class="preview-tag">STYLE STUDIO · LOOKBOOK 01</span></div>';
document.querySelector('.avatar-card .look-grid')?.before(preview);
const studio=document.createElement('div');studio.className='avatar-customizer';studio.innerHTML='<label>SKIN TONE<select id="skin-choice"><option value="603b2d">Deep espresso</option><option value="70452f">Rich brown</option><option value="815238">Cocoa</option><option value="9a674b" selected>Warm brown</option><option value="ad7654">Caramel</option><option value="bd8967">Copper</option><option value="d49b76">Golden</option><option value="e0b99a">Light beige</option><option value="f0c9a8">Fair peach</option><option value="9b7957">Olive</option></select></label><label>HAIR COLOUR<select id="hair-choice"><option value="211b1a">Natural black</option><option value="39251d">Dark brown</option><option value="573522">Chestnut</option><option value="743d27">Auburn</option><option value="c79b55">Golden blonde</option><option value="9aa4ad">Silver</option><option value="9b526e">Rose</option><option value="343b62">Blue-black</option></select></label><label>HAIR STYLE<select id="hair-style"><option value="curly">Curly afro</option><option value="short">Short crop</option><option value="fade">Low fade</option><option value="braids">Braids</option><option value="locs">Locs</option><option value="bun">High bun</option><option value="ponytail">Ponytail</option><option value="long">Long sides</option></select></label><label>OUTFIT<select id="outfit-choice"><option value="c96f62">Coral hoodie</option><option value="477caa">Blue jacket</option><option value="527b5c">Forest green</option><option value="8064a6">Violet sweater</option><option value="39858a">Teal streetwear</option><option value="252d3c">Midnight black</option><option value="e2d6c4">Cream sweatshirt</option><option value="b48a42">Mustard jacket</option><option value="a94f4f">Red varsity</option><option value="48606a">Slate denim</option><option value="6b4b3b">Earth brown</option><option value="d28caa">Pink jacket</option></select></label><label>BOTTOMS<select id="bottom-choice"><option value="30343b">Classic joggers</option><option value="222936">Cargo trousers</option><option value="4a5260">Blue denim</option><option value="5c493c">Brown cargos</option><option value="e0d5c1">Cream trousers</option><option value="263f38">Olive cargos</option><option value="4b345f">Purple trousers</option></select></label><label>SHOES<select id="shoe-choice"><option value="17191c">Black trainers</option><option value="eee5d4">White sneakers</option><option value="a94f35">Red sneakers</option><option value="c59a4d">Gold high-tops</option><option value="344c68">Blue runners</option><option value="654b38">Brown boots</option></select></label><label>ACCESSORY<select id="accessory-choice"><option value="none">None</option><option value="cap">Explorer cap</option><option value="crown">Mystery crown</option></select></label>';
document.querySelector('.avatar-card .look-grid')?.after(studio);
 // Turn the old dropdown wardrobe into a visual, Lagos-inspired character creator.
 const pickerGroups=[
  {id:'skin-choice',title:'SKIN TONE',kind:'swatch'},
  {id:'hair-style',title:'HAIRSTYLE',kind:'tile'},
  {id:'hair-choice',title:'HAIR COLOUR',kind:'swatch'},
  {id:'outfit-choice',title:'OUTFIT',kind:'tile'},
  {id:'bottom-choice',title:'TROUSERS',kind:'tile'},
  {id:'shoe-choice',title:'FOOTWEAR',kind:'tile'},
  {id:'accessory-choice',title:'ACCESSORIES',kind:'tile'}
 ];
 pickerGroups.forEach(group=>{
  const select=document.getElementById(group.id);if(!select)return;
  const label=select.closest('label');if(!label)return;
  const panel=document.createElement('section');panel.className='creator-section';
  const heading=document.createElement('h3');heading.textContent=group.title;panel.append(heading);
  const choices=document.createElement('div');choices.className='creator-choices '+(group.kind==='swatch'?'swatch-choices':'tile-choices');
  [...select.options].forEach(option=>{
   const btn=document.createElement('button');btn.type='button';btn.className='creator-choice';
   btn.setAttribute('aria-label',option.textContent);btn.title=option.textContent;
   if(group.kind==='swatch'){const dot=document.createElement('i');dot.className='choice-dot';dot.style.backgroundColor='#'+option.value;btn.append(dot);}
   const name=document.createElement('span');name.textContent=option.textContent;btn.append(name);
   btn.classList.toggle('active',option.value===select.value);
   btn.addEventListener('click',()=>{
    select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));
    choices.querySelectorAll('.creator-choice').forEach(item=>item.classList.toggle('active',item===btn));
   });
   choices.append(btn);
  });
  select.hidden=true;label.hidden=true;panel.append(choices);studio.append(panel);
 });
 const randomBtn=document.createElement('button');randomBtn.type='button';randomBtn.className='creator-random';randomBtn.textContent='↻ RANDOM LOOK';
 randomBtn.addEventListener('click',()=>{
  pickerGroups.forEach(group=>{
   const select=document.getElementById(group.id);if(!select)return;
   const options=[...select.options];const chosen=options[Math.floor(Math.random()*options.length)];
   select.value=chosen.value;select.dispatchEvent(new Event('change',{bubbles:true}));
   const panel=studio.querySelectorAll('.creator-section')[pickerGroups.indexOf(group)];
   panel?.querySelectorAll('.creator-choice').forEach(btn=>btn.classList.toggle('active',btn.getAttribute('aria-label')===chosen.textContent));
  });
 });
 studio.append(randomBtn);
 document.querySelector('.avatar-card .look-grid')?.setAttribute('hidden','');

const previewPerson=document.querySelector('#preview-person');
function refreshAvatarPreview(){if(!previewPerson)return;previewPerson.style.setProperty('--preview-skin','#'+document.querySelector('#skin-choice').value);previewPerson.style.setProperty('--preview-hair','#'+document.querySelector('#hair-choice').value);previewPerson.style.setProperty('--preview-shirt','#'+document.querySelector('#outfit-choice').value);previewPerson.style.setProperty('--preview-pants','#'+document.querySelector('#bottom-choice').value);previewPerson.style.setProperty('--preview-shoes','#'+document.querySelector('#shoe-choice').value);previewPerson.dataset.hair=document.querySelector('#hair-style').value;previewPerson.dataset.accessory=document.querySelector('#accessory-choice').value;}
document.querySelector('#skin-choice')?.addEventListener('change',e=>{player.appearance.skinMat.color.setHex(parseInt(e.target.value,16));refreshAvatarPreview()});
document.querySelector('#hair-choice')?.addEventListener('change',e=>{player.appearance.hairMat.color.setHex(parseInt(e.target.value,16));refreshAvatarPreview()});
document.querySelector('#outfit-choice')?.addEventListener('change',e=>{player.appearance.shirtMat.color.setHex(parseInt(e.target.value,16));refreshAvatarPreview()});
document.querySelector('#bottom-choice')?.addEventListener('change',e=>{player.appearance.pantsMat.color.setHex(parseInt(e.target.value,16));refreshAvatarPreview()});
document.querySelector('#shoe-choice')?.addEventListener('change',e=>{player.appearance.shoeMat.color.setHex(parseInt(e.target.value,16));refreshAvatarPreview()});
// Build extra hairstyle silhouettes once, then switch them instantly from the studio.
const hairstyleMeshes={};
function addHairShape(style,geometry,x,y,z,sx=1,sy=1,sz=1){
 const mesh=new THREE.Mesh(geometry,player.appearance.hairMat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.visible=false;player.group.add(mesh);(hairstyleMeshes[style]??=[]).push(mesh);return mesh;
}
addHairShape('curly',new THREE.SphereGeometry(.46,16,12),0,2.13,-.015,1.12,.92,1.04);
for(let side of [-1,1]){
 for(let i=0;i<4;i++){
  addHairShape('braids',new THREE.CapsuleGeometry(.045,.38,4,8),side*(.31+i*.035),1.88-i*.08,.04,.9,1,.9);
  addHairShape('locs',new THREE.CapsuleGeometry(.065,.43,4,8),side*(.31+i*.035),1.82-i*.07,.02,1,1,.95);
 }
}
addHairShape('bun',new THREE.SphereGeometry(.19,12,10),0,2.37,-.24,1,1,1);
addHairShape('ponytail',new THREE.SphereGeometry(.15,12,10),0,2.12,-.35,1,1,1);
addHairShape('ponytail',new THREE.CapsuleGeometry(.09,.42,4,8),0,1.82,-.4,1,1,1);
function setHairStyle(style){
 const parts=player.appearance.hairPieces;
 parts.forEach((part,i)=>{part.visible=style!=='curly'&&style!=='braids'&&style!=='locs'&&style!=='bun'&&style!=='ponytail'||i===0;});
 parts[0].scale.set(1,style==='short'||style==='fade'?.76:style==='long'?1.05:1.12,style==='short'||style==='fade'?.9:1.06);
 parts[1].visible=style==='long';parts[2].visible=style==='long';parts[3].visible=style==='long';
 parts[4].scale.y=style==='long'?2:style==='short'||style==='fade'?.8:1.2;
 parts[5].scale.y=style==='long'?2:style==='short'||style==='fade'?.8:1.2;
 Object.entries(hairstyleMeshes).forEach(([key,meshes])=>meshes.forEach(mesh=>mesh.visible=key===style));
 refreshAvatarPreview();
}
document.querySelector('#hair-style')?.addEventListener('change',e=>setHairStyle(e.target.value));
setHairStyle('curly');
refreshAvatarPreview();
document.querySelector('#outfit-choice')?.addEventListener('change',e=>player.appearance.shirtMat.color.setHex(parseInt(e.target.value,16)));
let headAccessory=null;
document.querySelector('#accessory-choice')?.addEventListener('change',e=>{
 refreshAvatarPreview();
 if(headAccessory)player.group.remove(headAccessory);headAccessory=null;if(e.target.value==='none')return;
 headAccessory=new THREE.Group();const goldMat=mat(e.target.value==='crown'?0xd5ad6b:0x293d4a);
 const shape=new THREE.Mesh(new THREE.TorusGeometry(.29,.06,8,20),goldMat);shape.position.y=2.3;shape.rotation.x=Math.PI/2;headAccessory.add(shape);
 if(e.target.value==='cap'){const brim=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.05,20),goldMat);brim.position.y=2.2;headAccessory.add(brim)}
 player.group.add(headAccessory);
});

// Small synthesized sound cues for collected clues and discoveries.
function playCue(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=audioCtx||new AC();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=660;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.14);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.15)}catch{}}
const oldNotice=notice;notice=function(message){oldNotice(message);if(/collected|released|switched on|opened/i.test(message))playCue()};
