import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { randomInt } from 'node:crypto';

const httpServer=createServer((req,res)=>{
  res.writeHead(200,{'content-type':'application/json'});
  res.end(JSON.stringify({name:'THE MOLE game server',status:'online'}));
});
const allowedOrigins=[...new Set(['http://localhost:5173','https://the-mole-3d.vercel.app',...(process.env.CLIENT_ORIGIN||'').split(',').map(value=>value.trim()).filter(Boolean)])];
const io=new Server(httpServer,{
  cors:{origin:allowedOrigins,methods:['GET','POST']}
});
// Every multiplayer socket must present a valid Supabase access token.
const supabaseUrl=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const supabaseAnonKey=process.env.SUPABASE_ANON_KEY||'';
io.use(async(socket,next)=>{
  try{
    const token=socket.handshake.auth?.accessToken;
    if(!supabaseUrl||!supabaseAnonKey||!token)return next(new Error('Please sign in to play online.'));
    const response=await fetch(supabaseUrl+'/auth/v1/user',{headers:{apikey:supabaseAnonKey,Authorization:'Bearer '+token}});
    if(!response.ok)return next(new Error('Your sign-in has expired. Please sign in again.'));
    const user=await response.json();
    const displayName=String(user.user_metadata?.display_name||user.email?.split('@')[0]||'PLAYER').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,16)||'PLAYER';
    socket.data.account={id:user.id,email:user.email};
    socket.data.displayName=displayName;
    next();
  }catch(error){next(new Error('Could not verify your account. Please try again.'));}
});
const accountName=socket=>cleanName(socket.data.displayName);
const rooms=new Map();
const boardPosts=[];
const BOARD_ROOM='public-discussion-board';
const BOARD_LIMIT=100;
const BOARD_COOLDOWN_MS=2500;
const MAX_PLAYERS=12, MIN_PLAYERS=4, DISCUSSION_MS=25000, RESULTS_MS=8000;
const cleanName=value=>String(value||'PLAYER').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,16)||'PLAYER';
const shuffle=list=>{for(let i=list.length-1;i>0;i--){const j=randomInt(i+1);[list[i],list[j]]=[list[j],list[i]];}return list;};
const alivePlayers=room=>[...room.players.values()].filter(p=>p.alive);
const publicRoom=room=>({
  code:room.code,hostId:room.hostId,started:room.started,phase:room.phase,day:room.day,
  players:[...room.players.values()].map(p=>({id:p.id,name:p.name,ready:p.ready,alive:p.alive,x:p.x,y:p.y||0,z:p.z,rotation:p.rotation}))
});
function sendRoom(room){io.to(room.code).emit('room:update',publicRoom(room));}
function clearTimer(room){if(room.timer){clearTimeout(room.timer);room.timer=null;}}
function sendState(room){
  io.to(room.code).emit('round:state',{
    ...publicRoom(room),phase:room.phase,day:room.day,deadline:room.deadline||null,
    voteCount:room.votes.size,votedIds:[...room.votes.keys()]
  });
  sendRoom(room);
}
function removePlayer(socket){
  const code=socket.data.roomCode;if(!code)return;
  const room=rooms.get(code);if(!room){socket.data.roomCode=null;return;}
  room.players.delete(socket.id);socket.leave(code);socket.data.roomCode=null;
  if(room.players.size===0){clearTimer(room);rooms.delete(code);return;}
  if(room.hostId===socket.id)room.hostId=room.players.keys().next().value;
  if(room.started){
    const winner=checkWinner(room);
    if(winner){finishRound(room,winner);return;}
  }
  sendState(room);
  if(room.started)advanceIfReady(room);
}
function checkWinner(room){
  const alive=alivePlayers(room),mafia=alive.filter(p=>p.role==='MAFIA').length;
  if(mafia===0)return 'PASSENGERS';
  if(mafia>=alive.length-mafia)return 'MAFIA';
  return null;
}
function finishRound(room,winner){
  clearTimer(room);room.phase='ENDED';room.winner=winner;
  io.to(room.code).emit('round:ended',{winner,players:alivePlayers(room).map(p=>({id:p.id,name:p.name}))});
  sendState(room);
}
function startDiscussion(room){
  clearTimer(room);room.phase='DISCUSSION';room.deadline=Date.now()+DISCUSSION_MS;
  io.to(room.code).emit('round:notice',{message:'Night is over. Discuss what happened, then vote.'});
  sendState(room);
  room.timer=setTimeout(()=>startVoting(room),DISCUSSION_MS);
}
function startVoting(room){
  if(!room.started||room.phase!=='DISCUSSION')return;
  clearTimer(room);room.phase='VOTE';room.deadline=Date.now()+45000;room.votes.clear();
  io.to(room.code).emit('round:notice',{message:'Voting is open. Choose one living player or skip.'});
  sendState(room);
  room.timer=setTimeout(()=>resolveVote(room),45000);
}
function beginNight(room){
  clearTimer(room);room.phase='NIGHT';room.day+=1;room.actions=new Map();room.votes.clear();room.deadline=Date.now()+30000;
  io.to(room.code).emit('round:notice',{message:'Night has fallen. Special roles, choose your action.'});
  sendState(room);
  room.timer=setTimeout(()=>{io.to(room.code).emit('round:notice',{message:'Night action time expired. Resolving the night.'});resolveNight(room);},30000);
  advanceIfReady(room);
}
function resolveNight(room){
  if(room.phase!=='NIGHT')return;
  clearTimer(room);
  const actions=[...room.actions.values()];
  const mafia=actions.find(a=>a.role==='MAFIA');
  const doctor=actions.find(a=>a.role==='DOCTOR');
  const detective=actions.find(a=>a.role==='DETECTIVE');
  if(detective){
    const target=room.players.get(detective.targetId);
    if(target)io.to(detective.playerId).emit('round:investigation',{name:target.name,result:target.role==='MAFIA'?'MAFIA':'NOT MAFIA'});
  }
  let removed=null;
  if(mafia&&mafia.targetId!==doctor?.targetId){
    removed=room.players.get(mafia.targetId);
    if(removed)removed.alive=false;
  }
  io.to(room.code).emit('round:nightResult',{
    removed:removed?{id:removed.id,name:removed.name,role:removed.role}:null,
    protected:!!(mafia&&doctor&&mafia.targetId===doctor.targetId)
  });
  const winner=checkWinner(room);
  if(winner){finishRound(room,winner);return;}
  startDiscussion(room);
}
function advanceIfReady(room){
  if(!room.started)return;
  if(room.phase==='NIGHT'){
    const required=alivePlayers(room).filter(p=>['MAFIA','DETECTIVE','DOCTOR'].includes(p.role));
    if(required.every(p=>room.actions.has(p.id)))resolveNight(room);
  }else if(room.phase==='VOTE'){
    const alive=alivePlayers(room);
    if(alive.every(p=>room.votes.has(p.id)))resolveVote(room);
  }
}
function resolveVote(room){
  if(room.phase!=='VOTE')return;
  clearTimer(room);
  const counts=new Map();
  for(const targetId of room.votes.values())if(targetId!=='SKIP')counts.set(targetId,(counts.get(targetId)||0)+1);
  const ranked=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
  let removed=null;
  if(ranked.length&&(!ranked[1]||ranked[0][1]>ranked[1][1])){
    removed=room.players.get(ranked[0][0]);
    if(removed)removed.alive=false;
  }
  room.phase='RESULTS';room.deadline=Date.now()+RESULTS_MS;
  io.to(room.code).emit('round:voteResult',{
    removed:removed?{id:removed.id,name:removed.name,role:removed.role}:null,
    skipped:!removed&&ranked.length===0,tied:!removed&&ranked.length>0
  });
  const winner=checkWinner(room);
  if(winner){finishRound(room,winner);return;}
  sendState(room);
  room.timer=setTimeout(()=>beginNight(room),RESULTS_MS);
}
io.on('connection',socket=>{
  socket.emit('server:hello',{message:'Connected to THE MOLE game server'});
  socket.on('board:join',()=>{
    socket.join(BOARD_ROOM);
    socket.emit('board:history',boardPosts);
  });
  socket.on('board:post',(payload={},ack=()=>{})=>{
    const message=String(payload?.message||'').replace(/\s+/g,' ').trim().slice(0,500);
    if(!message)return ack({ok:false,error:'Write a message first.'});
    const now=Date.now();
    if(now-(socket.data.lastBoardPost||0)<BOARD_COOLDOWN_MS)return ack({ok:false,error:'Please wait a moment before posting again.'});
    socket.data.lastBoardPost=now;
    const post={id:randomInt(1,0x7fffffff),name:accountName(socket),message,at:now};
    boardPosts.push(post);
    if(boardPosts.length>BOARD_LIMIT)boardPosts.splice(0,boardPosts.length-BOARD_LIMIT);
    io.to(BOARD_ROOM).emit('board:new-post',post);
    ack({ok:true});
  });
  socket.on('room:create',(payload={},ack=()=>{})=>{
    removePlayer(socket);
    let code;do{code=randomInt(100000,999999).toString();}while(rooms.has(code));
    const room={code,hostId:socket.id,started:false,phase:'LOBBY',day:0,players:new Map(),votes:new Map(),actions:new Map(),timer:null};
    room.players.set(socket.id,{id:socket.id,name:accountName(socket),ready:true,alive:true,role:null,x:0,y:0,z:5,rotation:0});
    rooms.set(code,room);socket.join(code);socket.data.roomCode=code;
    ack({ok:true,room:publicRoom(room),yourId:socket.id});sendState(room);
  });
  socket.on('room:join',(payload={},ack=()=>{})=>{
    const code=String(payload.code||'').replace(/\D/g,'').slice(0,6),room=rooms.get(code);
    if(!room)return ack({ok:false,error:'That room code was not found.'});
    if(room.started)return ack({ok:false,error:'This round has already started.'});
    if(room.players.size>=MAX_PLAYERS)return ack({ok:false,error:'This room is full.'});
    removePlayer(socket);
    room.players.set(socket.id,{id:socket.id,name:accountName(socket),ready:true,alive:true,role:null,x:0,y:0,z:5,rotation:0});
    socket.join(code);socket.data.roomCode=code;
    ack({ok:true,room:publicRoom(room),yourId:socket.id});sendState(room);
  });
  socket.on('room:leave',()=>removePlayer(socket));
  socket.on('round:start',(ack=()=>{})=>{
    const room=rooms.get(socket.data.roomCode);
    if(!room)return ack({ok:false,error:'Join a room first.'});
    if(room.hostId!==socket.id)return ack({ok:false,error:'Only the host can start the round.'});
    if(room.started)return ack({ok:false,error:'A round is already running.'});
    if(room.players.size<MIN_PLAYERS)return ack({ok:false,error:'At least four real players are needed to start.'});
    const players=shuffle([...room.players.values()]);
    const roles=shuffle(['MAFIA','DETECTIVE','DOCTOR',...Array(players.length-3).fill('CITIZEN')]);
    players.forEach((p,i)=>{p.role=roles[i];p.alive=true;io.to(p.id).emit('round:role',{role:p.role});});
    room.started=true;room.day=0;room.winner=null;room.votes.clear();room.actions.clear();
    ack({ok:true});beginNight(room);
  });
  socket.on('round:action',(payload={},ack=()=>{})=>{
    const room=rooms.get(socket.data.roomCode),player=room?.players.get(socket.id);
    if(!player||!room?.started||room.phase!=='NIGHT'||!player.alive)return ack({ok:false,error:'You cannot act right now.'});
    if(!['MAFIA','DETECTIVE','DOCTOR'].includes(player.role))return ack({ok:false,error:'Your role has no night action.'});
    if(room.actions.has(socket.id))return ack({ok:false,error:'You already submitted your night action.'});
    const targetId=String(payload.targetId||''),target=room.players.get(targetId);
    if(!target||!target.alive)return ack({ok:false,error:'Choose a living player.'});
    if(player.role!=='DOCTOR'&&targetId===socket.id)return ack({ok:false,error:'Choose another player.'});
    room.actions.set(socket.id,{playerId:socket.id,role:player.role,targetId});
    ack({ok:true});io.to(room.code).emit('round:actionCount',{count:room.actions.size,total:alivePlayers(room).filter(p=>['MAFIA','DETECTIVE','DOCTOR'].includes(p.role)).length});
    advanceIfReady(room);
  });
  socket.on('round:meeting',(ack=()=>{})=>{
    const room=rooms.get(socket.data.roomCode),player=room?.players.get(socket.id);
    if(!player||!room?.started||room.phase!=='DISCUSSION'||!player.alive)return ack({ok:false,error:'Voting is not open yet.'});
    startVoting(room);ack({ok:true});
  });
  socket.on('round:castVote',(payload={},ack=()=>{})=>{
    const room=rooms.get(socket.data.roomCode),player=room?.players.get(socket.id);
    if(!player||!room?.started||room.phase!=='VOTE'||!player.alive)return ack({ok:false,error:'Voting is not open for you.'});
    if(room.votes.has(socket.id))return ack({ok:false,error:'You have already voted.'});
    const targetId=String(payload.targetId||'');
    if(targetId!=='SKIP'){
      const target=room.players.get(targetId);
      if(!target||!target.alive||target.id===socket.id)return ack({ok:false,error:'Choose another living player.'});
    }
    room.votes.set(socket.id,targetId);ack({ok:true});sendState(room);advanceIfReady(room);
  });
  socket.on('round:restart',(ack=()=>{})=>{
    const room=rooms.get(socket.data.roomCode);
    if(!room||room.phase!=='ENDED')return ack({ok:false,error:'The round has not ended.'});
    if(room.hostId!==socket.id)return ack({ok:false,error:'Only the host can restart the room.'});
    clearTimer(room);room.started=false;room.phase='LOBBY';room.day=0;room.winner=null;room.votes.clear();room.actions.clear();
    for(const p of room.players.values()){p.alive=true;p.role=null;p.x=0;p.z=5;}
    io.to(room.code).emit('round:reset');sendState(room);ack({ok:true});
  });
  socket.on('player:move',pos=>{
    const room=rooms.get(socket.data.roomCode),p=room?.players.get(socket.id);
    if(!p||!room||(room.started&&!p.alive))return;
    // Server-side bounds prevent clients from walking outside the house.
    p.x=Math.max(-9.35,Math.min(17.35,Number(pos?.x)||0));p.y=Math.max(0,Math.min(12,Number(pos?.y)||0));p.z=Math.max(-7.15,Math.min(7.15,Number(pos?.z)||0));
    p.rotation=Number(pos?.rotation)||0;
    if(room.started&&p.alive){
      const floor=p.y>10?2:p.y>6?1:0;
      const traps=[[-6,-4,0],[5,-5,0],[6,4,0],[-6,-4,1],[5,-5,1],[6,4,1],[-6,-4,2],[5,-5,2],[6,4,2]];
      const hit=traps.some(([x,z,level])=>level===floor&&Math.hypot(p.x-x,p.z-z)<.88);
      if(hit){
        p.alive=false;
        io.to(p.id).emit('round:hazard',{message:'A cursed floor trap caught you. You are now spectating.'});
        io.to(room.code).emit('round:notice',{message:p.name+' triggered a cursed floor trap and is out of the round.'});
        const winner=checkWinner(room);
        if(winner){finishRound(room,winner);return;}
        sendState(room);advanceIfReady(room);return;
      }
    }
    socket.to(room.code).emit('player:moved',{id:socket.id,name:p.name,x:p.x,y:p.y,z:p.z,rotation:p.rotation});
  });
  socket.on('chat:send',payload=>{
    const room=rooms.get(socket.data.roomCode),p=room?.players.get(socket.id);
    const message=String(payload?.message||'').trim().slice(0,180);
    if(!p||!room||!message|| (room.started&&!p.alive))return;
    io.to(room.code).emit('chat:message',{name:p.name,message,at:Date.now()});
  });
  socket.on('chat:private',payload=>{
    const room=rooms.get(socket.data.roomCode),p=room?.players.get(socket.id),target=room?.players.get(String(payload?.to||''));
    const message=String(payload?.message||'').trim().slice(0,180);
    if(!p||!target||!message)return;
    const packet={from:p.name,to:target.name,message,at:Date.now()};
    io.to(target.id).emit('chat:private',packet);socket.emit('chat:private',packet);
  });
  socket.on('disconnect',()=>removePlayer(socket));
});
const port=Number(process.env.PORT)||3001;
httpServer.listen(port,'0.0.0.0',()=>console.log(`THE MOLE game server listening on ${port}`));
