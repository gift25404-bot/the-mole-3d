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
  box(3.6,.16,2.6,mat(color.color.getHex()),0,2.15,0,kiosk);
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
slab(14,0,8,15,7.6);slab(14,0,8,15,11.4);
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

// hanging lamps
for(const [x,z] of [[0,-4],[5,1],[-6,-2]]){box(.08,1,.08,trim,x,3.3,z,house);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),new THREE.MeshStandardMaterial({color:0xffc16e,emissive:0xff9a32,emissiveIntensity:1.3}));lamp.position.set(x,2.7,z);house.add(lamp);const l=new THREE.PointLight(0xffb45e,9,6);l.position.set(x,2.5,z);house.add(l)}
// exterior trees and fence-like silhouettes
for(let i=0;i<22;i++){const a=i/22*Math.PI*2, r=14+Math.sin(i*4)*2,x=Math.cos(a)*r,z=Math.sin(a)*r;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,2.2,5),wood);trunk.position.set(x,1,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.ConeGeometry(1.25,3.2,6),mat(0x263a35));crown.position.set(x,3.3,z);crown.castShadow=true;scene.add(crown)}
// minibus
const bus=new THREE.Group();scene.add(bus);bus.position.set(-13,0,8);
box(4.5,1.8,2.1,mat(0xe4b52f),0,1,0,bus);box(3.6,.65,2.08,mat(0xf0d77d),-.15,2.05,0,bus);\nbox(4.55,.22,2.14,mat(0x202426),0,1.48,0,bus); // classic yellow-and-black minibus stripe
for(const x of [-1.35,-.35,.65,1.55])box(.65,.58,.05,glass,x,2.05,1.06,bus);
for(const x of [-1.5,1.5])for(const z of [-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.22,12),mat(0x151719));w.rotation.z=Math.PI/2;w.position.set(x,.45,z);bus.add(w)}
// doors are hinged panels
const doorPivot=new THREE.Group();doorPivot.position.set(0,0,8.32);house.add(doorPivot);const door=box(1.65,2.9,.16,wood,.82,1.45,0,doorPivot);
let doorOpen=false;
// Characters: cute low-poly Bitmoji-ish avatars with animated arms/legs.
function makeAvatar(name,shirt,skin,hair,x,z,isPlayer=false){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const skinMat=mat(skin,.72),hairMat=mat(hair,.9),shirtMat=mat(shirt,.78),pantsMat=mat(0x30343b,.9);
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
 for(const [hx,hy,hz,scale] of [[-.22,2.08,.245,.78],[0,2.12,.29,.72],[.22,2.08,.245,.78]]){
  sphere(.16,hairMat,hx,hy,hz,scale, .78, .65);
 }
 sphere(.13,hairMat,-.34,1.91,-.015,.75,1.2,.8);
 sphere(.13,hairMat,.34,1.91,-.015,.75,1.2,.8);
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
  const shoe=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),mat(0x17191c,.8));shoe.scale.set(1,.55,1.45);shoe.position.set(0,-.48,.055);leg.add(shoe);
  g.add(leg);limbs.push(leg);
 }
 const label=makeLabel(name);label.position.set(0,2.62,0);g.add(label);
 return {group:g,limbs,name,isPlayer,phase:Math.random()*6,appearance:{skinMat,hairMat,shirtMat,pantsMat}};
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
const serverUrl=import.meta.env.VITE_SERVER_URL||'https://the-mole-3d.onrender.com';
const socket=io(serverUrl,{autoConnect:true,reconnection:true,timeout:5000});
let onlineRoom=null,onlineName='ALEX',onlineRole=null,onlineRoundState=null,onlinePromptKey='';
const remoteAvatars=new Map();
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
 onlineRoundState=state;onlineRoom=state;
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
 a.group.position.set(data.x,0,data.z);a.group.rotation.y=data.rotation;
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
 document.querySelector('#create-room').onclick=()=>socket.emit('room:create',{name:getName()},res=>{if(!res?.ok)notice(res?.error||'Could not create room.');else{onlineRoom=res.room;notice(`ROOM CREATED: ${res.room.code}`);showRoomPanel(res.room);}});
 document.querySelector('#join-room').onclick=()=>socket.emit('room:join',{name:getName(),code:document.querySelector('#room-code').value},res=>{if(!res?.ok)notice(res?.error||'Could not join room.');else{onlineRoom=res.room;notice('You joined the room.');showRoomPanel(res.room);}});
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
// Account screen is shown before the bus intro. Real account creation/sign-in
// is intentionally blocked until a trusted authentication provider is configured.
let authMode='signin';
const authFeedback=document.querySelector('#auth-feedback');
function setAuthMode(mode){
 authMode=mode;
 document.querySelector('#auth-tab-signin').classList.toggle('active',mode==='signin');
 document.querySelector('#auth-tab-signup').classList.toggle('active',mode==='signup');
 document.querySelector('#auth-submit').textContent=mode==='signin'?'SIGN IN TO THE GAME':'CREATE PLAYER ACCOUNT';
 // No password field is shown until secure authentication is configured.
 authFeedback.textContent=mode==='signin'?'Sign-in service is not connected yet. Your password will not be stored here.':'Account creation is not connected yet. Your password will not be stored here.';
}
document.querySelector('#auth-tab-signin').onclick=()=>setAuthMode('signin');
document.querySelector('#auth-tab-signup').onclick=()=>setAuthMode('signup');
document.querySelector('#auth-form').addEventListener('submit',event=>{
 event.preventDefault();
 const email=document.querySelector('#auth-email').value.trim();
 const username=document.querySelector('#auth-username').value.trim();
 if(!email.toLowerCase().endsWith('@gmail.com')){authFeedback.textContent='Please enter a Gmail address ending in @gmail.com.';return;}
 if(username.length<3){authFeedback.textContent='Your username must have at least 3 characters.';return;}
 // Demo flow only: secure sign-in is not connected; no password is requested or stored.
 onlineName=username.slice(0,16);
 document.querySelector('#player-name').textContent=onlineName.toUpperCase();
 player.name=onlineName.toUpperCase();
 const oldLabel=player.group.children.find(child=>child.isSprite);
 if(oldLabel)player.group.remove(oldLabel);
 const nameLabel=makeLabel(player.name);nameLabel.position.set(0,2.62,0);player.group.add(nameLabel);
 document.querySelector('#auth-screen').classList.add('hidden');
 document.querySelector('#avatar-screen').classList.remove('hidden');
 authFeedback.textContent='Demo only — secure sign-in is not connected.';
});
document.querySelectorAll('.look-option').forEach(button=>button.addEventListener('click',()=>applyPlayerLook(button.dataset.look)));
document.querySelector('#confirm-look')?.addEventListener('click',()=>{
 const look=avatarLooks[selectedLook];
 try{localStorage.setItem('mole-avatar-look',selectedLook);localStorage.setItem('mole-player-name',onlineName);}catch{}
 document.querySelector('#avatar-screen').classList.add('hidden');
 notice(look.name+' look selected. Welcome to Blackwood.');
});
document.querySelector('#begin-game')?.addEventListener('click',()=>{
 document.querySelector('#bus-intro')?.classList.add('intro-hidden');
 speak('The bus has broken down. The road is empty. Ahead, a house stands beneath the storm. Stay together. Your role is being revealed.');
 setAmbience(true);
 showRole();
});
function switchCamera(){cameraMode=(cameraMode+1)%3;document.querySelector('#camera').textContent='CAMERA: '+modes[cameraMode];notice('CAMERA MODE: '+modes[cameraMode])}
document.querySelector('#camera').onclick=switchCamera;
document.querySelector('#map').onclick=()=>modal('HOUSE MAP','You are inside Blackwood House. Explore the rooms and speak to the other passengers.',`<div class="room-list"><div>01 — ENTRY HALL</div><div>02 — LIVING ROOM</div><div>03 — LIBRARY</div><div>04 — KITCHEN</div><div>05 — EAST BEDROOM</div><div>06 — STORAGE</div><div>07 — EAST STUDY</div><div>08 — MUSIC ROOM</div><div>09 — SEALED CONSERVATORY</div></div>`);

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
const clock=new THREE.Clock();let elapsed=0,lastNetworkMove=0;
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;
 const p=player.group;let dx=0,dz=0;if(keys.w)dz-=1;if(keys.s)dz+=1;if(keys.a)dx-=1;if(keys.d)dx+=1;
 const moving=dx!==0||dz!==0;const speed=keys.shift?5.2:3.1;
 if(moving){const len=Math.hypot(dx,dz);dx/=len;dz/=len;p.position.x+=dx*speed*dt;p.position.z+=dz*speed*dt;p.rotation.y=Math.atan2(dx,dz);p.position.x=THREE.MathUtils.clamp(p.position.x,-9.3,17.2);p.position.z=THREE.MathUtils.clamp(p.position.z,-7.8,10.8)}
 player.limbs.forEach((l,i)=>{l.rotation.x=moving?Math.sin(elapsed*10+i*Math.PI)*.65:Math.sin(elapsed*2+i)*.035});
 npcs.forEach((n,i)=>{n.phase+=dt;const t=n.phase; n.group.position.x+=Math.sin(t*.24+i)*.0015;n.group.position.z+=Math.cos(t*.22+i)*.0015;n.limbs.forEach((l,j)=>l.rotation.x=Math.sin(t*2+j)*.08)});
 // clue items hover gently until collected
 clueItems.forEach(c=>{if(!c.collected)c.group.position.y=c.baseY+Math.sin(elapsed*2+c.phase)*.09;});
 // flicker the old house lights
 warm.intensity=35+Math.sin(elapsed*8)*2+(Math.sin(elapsed*23)>.985?-22:0);
 // Send player movement at a modest rate when connected to an online room.
 if(onlineRoom&&socket.connected&&elapsed-lastNetworkMove>.09){socket.emit('player:move',{x:p.position.x,z:p.position.z,rotation:p.rotation.y});lastNetworkMove=elapsed;}
 // Camera rigs
 const target=new THREE.Vector3(p.position.x,p.position.y+1.2,p.position.z);
 if(cameraMode===0){const desired=new THREE.Vector3(p.position.x+11,12,p.position.z+13);camera.position.lerp(desired,.08);camera.lookAt(p.position.x,0,p.position.z)}
 else if(cameraMode===1){const behind=new THREE.Vector3(p.position.x-Math.sin(p.rotation.y)*5,3.2,p.position.z-Math.cos(p.rotation.y)*5);camera.position.lerp(behind,.12);camera.lookAt(target)}
 else {const eye=new THREE.Vector3(p.position.x,p.position.y+1.72,p.position.z);camera.position.lerp(eye,.25);camera.rotation.set(0,p.rotation.y,0);camera.rotateY(Math.PI)}
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

// Additional avatar controls.
const studio=document.createElement('div');studio.className='avatar-customizer';studio.innerHTML='<label>HAIR COLOUR<select id="hair-choice"><option value="211b1a">Midnight</option><option value="573522">Chestnut</option><option value="c79b55">Golden</option><option value="9aa4ad">Silver</option><option value="9b526e">Rose</option></select></label><label>OUTFIT COLOUR<select id="outfit-choice"><option value="c96f62">Coral</option><option value="477caa">Blue</option><option value="527b5c">Forest</option><option value="8064a6">Violet</option><option value="39858a">Teal</option></select></label><label>ACCESSORY<select id="accessory-choice"><option value="none">None</option><option value="cap">Explorer cap</option><option value="crown">Mystery crown</option></select></label>';
document.querySelector('.avatar-card .look-grid')?.after(studio);
document.querySelector('#hair-choice')?.addEventListener('change',e=>player.appearance.hairMat.color.setHex(parseInt(e.target.value,16)));
document.querySelector('#outfit-choice')?.addEventListener('change',e=>player.appearance.shirtMat.color.setHex(parseInt(e.target.value,16)));
let headAccessory=null;
document.querySelector('#accessory-choice')?.addEventListener('change',e=>{
 if(headAccessory)player.group.remove(headAccessory);headAccessory=null;if(e.target.value==='none')return;
 headAccessory=new THREE.Group();const goldMat=mat(e.target.value==='crown'?0xd5ad6b:0x293d4a);
 const shape=new THREE.Mesh(new THREE.TorusGeometry(.29,.06,8,20),goldMat);shape.position.y=2.3;shape.rotation.x=Math.PI/2;headAccessory.add(shape);
 if(e.target.value==='cap'){const brim=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.05,20),goldMat);brim.position.y=2.2;headAccessory.add(brim)}
 player.group.add(headAccessory);
});

// Small synthesized sound cues for collected clues and discoveries.
function playCue(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=audioCtx||new AC();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=660;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.14);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.15)}catch{}}
const oldNotice=notice;notice=function(message){oldNotice(message);if(/collected|released|switched on|opened/i.test(message))playCue()};
