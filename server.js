import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { randomInt } from 'node:crypto';

const httpServer = createServer((req,res)=>{
  res.writeHead(200, {'content-type':'application/json'});
  res.end(JSON.stringify({name:'THE MOLE game server',status:'online'}));
});
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'], methods:['GET','POST'] }
});
const rooms = new Map();
const MAX_PLAYERS = 12;
const cleanName = value => String(value || 'PLAYER').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,16) || 'PLAYER';
const publicRoom = room => ({
  code: room.code,
  hostId: room.hostId,
  started: room.started,
  players: [...room.players.values()].map(p=>({id:p.id,name:p.name,ready:p.ready,alive:p.alive}))
});
function sendRoom(room){
  io.to(room.code).emit('room:update', publicRoom(room));
}
function removePlayer(socket){
  const code=socket.data.roomCode;
  if(!code)return;
  const room=rooms.get(code);
  if(!room)return;
  room.players.delete(socket.id);
  socket.leave(code);
  socket.data.roomCode=null;
  if(room.players.size===0){rooms.delete(code);return;}
  if(room.hostId===socket.id)room.hostId=room.players.keys().next().value;
  sendRoom(room);
}
io.on('connection', socket=>{
  socket.emit('server:hello',{message:'Connected to THE MOLE server'});
  socket.on('room:create',(payload={},ack=()=>{})=>{
    removePlayer(socket);
    let code;
    do { code=randomInt(100000,999999).toString(); } while(rooms.has(code));
    const room={code,hostId:socket.id,started:false,players:new Map(),votes:new Map(),roles:new Map()};
    room.players.set(socket.id,{id:socket.id,name:cleanName(payload.name),ready:true,alive:true,x:0,z:5,rotation:0});
    rooms.set(code,room);socket.join(code);socket.data.roomCode=code;
    ack({ok:true,room:publicRoom(room),yourId:socket.id});
    sendRoom(room);
  });
  socket.on('room:join',(payload={},ack=()=>{})=>{
    const code=String(payload.code||'').replace(/\D/g,'').slice(0,6);
    const room=rooms.get(code);
    if(!room)return ack({ok:false,error:'That room code was not found.'});
    if(room.started)return ack({ok:false,error:'This round has already started.'});
    if(room.players.size>=MAX_PLAYERS)return ack({ok:false,error:'This room is full.'});
    removePlayer(socket);
    room.players.set(socket.id,{id:socket.id,name:cleanName(payload.name),ready:true,alive:true,x:0,z:5,rotation:0});
    socket.join(code);socket.data.roomCode=code;
    ack({ok:true,room:publicRoom(room),yourId:socket.id});
    sendRoom(room);
  });
  socket.on('room:leave',()=>removePlayer(socket));
  socket.on('round:start',ack=>{
    const code=socket.data.roomCode,room=rooms.get(code);
    if(!room)return ack?.({ok:false,error:'Join a room first.'});
    if(room.hostId!==socket.id)return ack?.({ok:false,error:'Only the host can start the round.'});
    if(room.players.size<4)return ack?.({ok:false,error:'At least 4 real players are needed to start.'});
    const ids=[...room.players.keys()];
    const roles=ids.map((id,i)=>i===0?'MOLE':i===1?'DETECTIVE':i===2?'DOCTOR':'CITIZEN');
    for(let i=roles.length-1;i>0;i--){const j=randomInt(i+1);[roles[i],roles[j]]=[roles[j],roles[i]];}
    room.started=true;room.votes.clear();
    ids.forEach((id,i)=>io.to(id).emit('round:role',{role:roles[i]}));
    io.to(code).emit('round:started',{players:publicRoom(room).players});
    ack?.({ok:true});
  });
  socket.on('player:move',pos=>{
    const code=socket.data.roomCode,room=rooms.get(code),p=room?.players.get(socket.id);
    if(!p||!room.started)return;
    p.x=Math.max(-9.3,Math.min(9.3,Number(pos?.x)||0));
    p.z=Math.max(-7.8,Math.min(10.8,Number(pos?.z)||0));
    p.rotation=Number(pos?.rotation)||0;
    socket.to(code).emit('player:moved',{id:socket.id,name:p.name,x:p.x,z:p.z,rotation:p.rotation});
  });
  socket.on('chat:send',payload=>{
    const code=socket.data.roomCode,room=rooms.get(code),p=room?.players.get(socket.id);
    if(!p||!room||!String(payload?.message||'').trim())return;
    const message=String(payload.message).trim().slice(0,180);
    io.to(code).emit('chat:message',{name:p.name,message,at:Date.now()});
  });
  socket.on('round:vote',payload=>{
    const code=socket.data.roomCode,room=rooms.get(code),p=room?.players.get(socket.id);
    const target=String(payload?.target||'');
    if(!p||!room?.started||!room.players.has(target)||target===socket.id)return;
    room.votes.set(socket.id,target);
    io.to(code).emit('round:voteCount',{count:room.votes.size,total:room.players.size});
  });
  socket.on('disconnect',()=>removePlayer(socket));
});
const port=Number(process.env.PORT)||3001;
httpServer.listen(port,'0.0.0.0',()=>console.log(`THE MOLE server listening on ${port}`));
