import * as THREE from 'three';
import { io } from 'socket.io-client';
import './style.css';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101820);
scene.fog = new THREE.FogExp2(0x101820, 0.027);
const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, .1, 180);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping;
document.querySelector('#game').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9eafc2,0x241b16,1.45));
const moon=new THREE.DirectionalLight(0x9db7d1,2.1); moon.position.set(-9,18,8); moon.castShadow=true; moon.shadow.mapSize.set(2048,2048); scene.add(moon);
const warm=new THREE.PointLight(0xffb35c,38,15); warm.position.set(0,3,0); scene.add(warm);
const hallLight=new THREE.PointLight(0xffd18a,16,10); hallLight.position.set(0,3,-8); scene.add(hallLight);

const mat=(color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness});
const floorMat=mat(0x514a3e), wallMat=mat(0x655d50), darkMat=mat(0x242a2a), wood=mat(0x49352a), trim=mat(0x302820), glass=new THREE.MeshStandardMaterial({color:0x7894a0,transparent:true,opacity:.28,roughness:.2});
function box(w,h,d,m,x,y,z, parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function plane(w,d,m,x,y,z){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.receiveShadow=true;scene.add(o);return o}
plane(60,60,mat(0x202b2b),0,-.16,0);
const house=new THREE.Group();scene.add(house);
// House is split into connected rooms; door-sized gaps are left in the partitions.
box(20,.35,17,floorMat,0,0,0,house);
box(20,.5,17,trim,0,3.8,0,house);
box(.35,3.8,17,wallMat,-10,1.9,0,house); box(.35,3.8,17,wallMat,10,1.9,0,house);
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
box(8,.25,2.5,wood,0,-.02,9.6,house);box(8,.18,2,trim,0,3.9,0,house);
const roof=new THREE.Mesh(new THREE.ConeGeometry(12,4,4),mat(0x292e31));roof.rotation.y=Math.PI/4;roof.position.set(0,5.3,0);roof.scale.set(1,.75,.95);roof.castShadow=true;house.add(roof);
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

// hanging lamps
for(const [x,z] of [[0,-4],[5,1],[-6,-2]]){box(.08,1,.08,trim,x,3.3,z,house);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),new THREE.MeshStandardMaterial({color:0xffc16e,emissive:0xff9a32,emissiveIntensity:1.3}));lamp.position.set(x,2.7,z);house.add(lamp);const l=new THREE.PointLight(0xffb45e,9,6);l.position.set(x,2.5,z);house.add(l)}
// exterior trees and fence-like silhouettes
for(let i=0;i<22;i++){const a=i/22*Math.PI*2, r=14+Math.sin(i*4)*2,x=Math.cos(a)*r,z=Math.sin(a)*r;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,2.2,5),wood);trunk.position.set(x,1,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.ConeGeometry(1.25,3.2,6),mat(0x263a35));crown.position.set(x,3.3,z);crown.castShadow=true;scene.add(crown)}
// minibus
const bus=new THREE.Group();scene.add(bus);bus.position.set(-13,0,8);
box(4.5,1.8,2.1,mat(0xc99b36),0,1,0,bus);box(3.6,.65,2.08,mat(0xdbc27a),-.15,2.05,0,bus);
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

// Online room layer. Set VITE_SERVER_URL when deploying the frontend separately.
const serverUrl=import.meta.env.VITE_SERVER_URL||'https://the-mole-3d.onrender.com';
const socket=io(serverUrl,{autoConnect:true,reconnection:true,timeout:5000});
let onlineRoom=null,onlineName='ALEX',onlineRole=null;
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
 addChat('SYSTEM',`Your online role is ${data.role}.`,true);
 notice(`ONLINE ROLE ASSIGNED: ${data.role}`);
});
socket.on('round:started',()=>{document.querySelector('#phase').textContent='ONLINE ROUND';notice('The online round has started!');});
socket.on('player:moved',data=>{
 let a=remoteAvatars.get(data.id);
 if(!a){a=makeAvatar(data.name,0x647c9b,0xb77f60,0x211b1a,data.x,data.z);remoteAvatars.set(data.id,a);}
 a.group.position.set(data.x,0,data.z);a.group.rotation.y=data.rotation;
});
socket.on('chat:message',data=>addChat(data.name,data.message,data.name==='SYSTEM'));
socket.on('round:voteCount',data=>notice(`VOTES CAST: ${data.count}/${data.total}`));
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
document.querySelector('#chat-button')?.addEventListener('click',()=>modal('MESSAGES','Group chat is available when you join an online room. Private chat is not enabled yet.', '<div id="chat-log" class="chat-log"></div><form id="chat-form"><input id="chat-input" maxlength="180" placeholder="Write a group message"><button type="submit">SEND</button></form>'));
// Account screen is shown before the bus intro. Real account creation/sign-in
// is intentionally blocked until a trusted authentication provider is configured.
let authMode='signin';
const authFeedback=document.querySelector('#auth-feedback');
function setAuthMode(mode){
 authMode=mode;
 document.querySelector('#auth-tab-signin').classList.toggle('active',mode==='signin');
 document.querySelector('#auth-tab-signup').classList.toggle('active',mode==='signup');
 document.querySelector('#auth-submit').textContent=mode==='signin'?'SIGN IN TO THE GAME':'CREATE PLAYER ACCOUNT';
 document.querySelector('#auth-password').autocomplete=mode==='signin'?'current-password':'new-password';
 authFeedback.textContent=mode==='signin'?'Sign-in service is not connected yet. Your password will not be stored here.':'Account creation is not connected yet. Your password will not be stored here.';
}
document.querySelector('#auth-tab-signin').onclick=()=>setAuthMode('signin');
document.querySelector('#auth-tab-signup').onclick=()=>setAuthMode('signup');
document.querySelector('#auth-form').addEventListener('submit',event=>{
 event.preventDefault();
 const email=document.querySelector('#auth-email').value.trim();
 const username=document.querySelector('#auth-username').value.trim();
 const password=document.querySelector('#auth-password').value;
 if(!email.toLowerCase().endsWith('@gmail.com')){authFeedback.textContent='Please enter a Gmail address ending in @gmail.com.';return;}
 if(username.length<3){authFeedback.textContent='Your username must have at least 3 characters.';return;}
 if(password.length<8){authFeedback.textContent='Use a password with at least 8 characters.';return;}
 // Demo flow only: secure sign-in is not connected; discard the password.
 onlineName=username.slice(0,16);
 document.querySelector('#player-name').textContent=onlineName.toUpperCase();
 player.name=onlineName.toUpperCase();
 const oldLabel=player.group.children.find(child=>child.isSprite);
 if(oldLabel)player.group.remove(oldLabel);
 const nameLabel=makeLabel(player.name);nameLabel.position.set(0,2.62,0);player.group.add(nameLabel);
 document.querySelector('#auth-screen').classList.add('hidden');
 document.querySelector('#avatar-screen').classList.remove('hidden');
 document.querySelector('#auth-password').value='';
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
 speak('The bus has broken down. The road is empty. Ahead, a house stands beneath the storm. Stay together. Your roles will be revealed when you arrive.');
 setAmbience(true);
});
function switchCamera(){cameraMode=(cameraMode+1)%3;document.querySelector('#camera').textContent='CAMERA: '+modes[cameraMode];notice('CAMERA MODE: '+modes[cameraMode])}
document.querySelector('#camera').onclick=switchCamera;
document.querySelector('#map').onclick=()=>modal('HOUSE MAP','You are inside Blackwood House. Explore the rooms and speak to the other passengers.',`<div class="room-list"><div>01 — ENTRY HALL</div><div>02 — LIVING ROOM</div><div>03 — LIBRARY</div><div>04 — KITCHEN</div><div>05 — EAST BEDROOM</div><div>06 — STORAGE</div></div>`);

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
document.querySelector('#start-vote').onclick=voteMeeting;
document.querySelector('#ability').onclick=()=>{
 if(playerRole==='DETECTIVE'||playerRole==='DOCTOR'||playerRole==='MAFIA')nightPhase();
 else notice('Citizen ability: listen, explore and question passengers.');
};
updateStatus();
setTimeout(showRole,500);

document.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='c')switchCamera();if(e.key.toLowerCase()==='e')interact()});
document.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',()=>keys[k]=true);['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false))});
let cluesFound=0, exitUnlocked=false;
function updateObjective(){
 const count=document.querySelector('#clue-count'),objective=document.querySelector('#objective-text');
 if(count)count.textContent=`CLUES FOUND: ${cluesFound} / 3`;
 if(objective)objective.textContent=cluesFound<3?'SEARCH THE HOUSE FOR CLUES':'RETURN TO THE FRONT DOOR';
}
function interact(){
 const p=player.group.position;
 // Pick up the nearest clue.
 let nearestClue=null,clueDist=2.4;
 for(const clue of clueItems){if(clue.collected)continue;const d=p.distanceTo(clue.group.position);if(d<clueDist){clueDist=d;nearestClue=clue}}
 if(nearestClue){
  nearestClue.collected=true;scene.remove(nearestClue.group);cluesFound++;updateObjective();
  notice(`${nearestClue.name} collected.`);
  if(cluesFound===3){exitUnlocked=true;notice('All clues found. The front door lock has released!');}
  return;
 }
 const dDoor=p.distanceTo(new THREE.Vector3(0,0,8.5));
 if(dDoor<3.2){
  if(!exitUnlocked){notice(`The lock is jammed. Find all 3 clues first (${cluesFound}/3).`);return}
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
 if(moving){const len=Math.hypot(dx,dz);dx/=len;dz/=len;p.position.x+=dx*speed*dt;p.position.z+=dz*speed*dt;p.rotation.y=Math.atan2(dx,dz);p.position.x=THREE.MathUtils.clamp(p.position.x,-9.3,9.3);p.position.z=THREE.MathUtils.clamp(p.position.z,-7.8,10.8)}
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
