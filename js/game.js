/* === GAME: Main loop, state machine, input === */
(function(){
var canvas=document.getElementById("gameCanvas"),ctx=canvas.getContext("2d");
var state="MENU",time=0,player,level,camX=0,attempts=0,deathTimer=0,flashAl=0,scale=1,gw=800;
var jumpPressed=false,jumpJust=false,prevPress=false;

function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
window.addEventListener("resize",resize);resize();

// Input
window.addEventListener("keydown",function(e){if(e.code==="Space"||e.key===" "){e.preventDefault();jumpPressed=true;}});
window.addEventListener("keyup",function(e){if(e.code==="Space"||e.key===" ")jumpPressed=false;});
canvas.addEventListener("mousedown",function(e){e.preventDefault();jumpPressed=true;});
canvas.addEventListener("mouseup",function(){jumpPressed=false;});
canvas.addEventListener("touchstart",function(e){e.preventDefault();jumpPressed=true;},{passive:false});
canvas.addEventListener("touchend",function(){jumpPressed=false;});

// Menu click
function handleClick(e){
  var rect=canvas.getBoundingClientRect(),cx,cy;
  if(e.touches){cx=e.touches[0].clientX;cy=e.touches[0].clientY;}else{cx=e.clientX;cy=e.clientY;}
  var mx=(cx-rect.left)/scale,my=(cy-rect.top)/scale;
  if(state==="MENU"&&window._playBtn){
    var b=window._playBtn;
    // Scale button coords from game space to screen space
    if(cx>=rect.left+b.x*scale&&cx<=rect.left+(b.x+b.w)*scale&&cy>=rect.top+b.y*scale&&cy<=rect.top+(b.y+b.h)*scale){startGame();}
  }else if(state==="WON"){state="MENU";}
}
canvas.addEventListener("click",handleClick);

function startGame(){
  initAudio();if(audioCtx&&audioCtx.state==="suspended")audioCtx.resume();
  level=loadLevel(LEVEL1);player=makePlayer();
  level.orbs.forEach(function(o){o.used=false;});
  particles=[];attempts=1;deathTimer=0;flashAl=0;
  playBeat(level.bpm);state="PLAYING";
}
function restart(){
  player=makePlayer();level.orbs.forEach(function(o){o.used=false;});
  particles=[];attempts++;deathTimer=0;flashAl=0;
  playBeat(level.bpm);state="PLAYING";
}
function die(){
  player.dead=true;explode(player.x+player.sz/2,player.y+player.sz/2,player.color,25);
  playSFX("die");flashAl=.5;deathTimer=0;state="DEAD";
}

function updatePlaying(){
  var p=player,sp=level.speed;
  jumpJust=jumpPressed&&!prevPress;prevPress=jumpPressed;
  // Move X
  p.x+=sp;
  var hb=playerHB(p);
  for(var i=0;i<level.blocks.length;i++){var bl=level.blocks[i];
    if(aabb(hb,bl)){var pBot=p.y+p.sz;if(pBot>bl.y+4){die();return;}}}
  // Jump
  if(p.onG&&jumpPressed){p.vy=p.jf;p.onG=false;p.tRot+=Math.PI/2;playSFX("jump");}
  // Orbs
  if(jumpJust&&!p.onG){for(var i=0;i<level.orbs.length;i++){var o=level.orbs[i];
    if(!o.used&&aabb(playerHB(p),orbHB(o))){o.used=true;p.vy=p.jf;p.tRot+=Math.PI/2;playSFX("jump");break;}}}
  // Gravity
  p.vy+=p.grav;p.y+=p.vy;
  if(p.y>=GROUND_Y-p.sz){p.y=GROUND_Y-p.sz;p.vy=0;p.onG=true;}
  // Block vertical
  for(var i=0;i<level.blocks.length;i++){var bl=level.blocks[i];
    if(aabb(playerHB(p),bl)){if(p.vy>0){p.y=bl.y-p.sz;p.vy=0;p.onG=true;}else if(p.vy<0){p.y=bl.y+bl.h;p.vy=0;}}}
  // Spikes
  for(var i=0;i<level.spikes.length;i++){if(aabb(playerHB(p),spikeHB(level.spikes[i]))){die();return;}}
  // Pads
  for(var i=0;i<level.pads.length;i++){var pd=level.pads[i];if(aabb(playerHB(p),pd)){p.vy=pd.f;p.onG=false;p.tRot+=Math.PI/2;playSFX("jump");}}
  // Win
  if(level.endX>0&&p.x>=level.endX){state="WON";playSFX("win");return;}
  // Rotation
  var df=p.tRot-p.rot;p.rot+=df*.2;if(Math.abs(df)<.01)p.rot=p.tRot;
  if(p.onG)p.tRot=Math.round(p.tRot/(Math.PI/2))*(Math.PI/2);
  // Trail
  p.trail.push({x:p.x,y:p.y+p.sz/2,al:.6,sz:p.sz*.3});
  for(var i=p.trail.length-1;i>=0;i--){p.trail[i].al-=.04;p.trail[i].sz*=.95;if(p.trail[i].al<=0)p.trail.splice(i,1);}
  // Camera
  camX=p.x-gw*.33;if(camX<0)camX=0;
}

// Main loop
var last=0,DT=1/60,acc=0;
function loop(ts){
  var raw=(ts-last)/1000;last=ts;acc+=Math.min(raw,.1);
  while(acc>=DT){time+=DT;
    if(state==="PLAYING")updatePlaying();
    else if(state==="DEAD"){deathTimer+=DT;flashAl=Math.max(0,flashAl-DT*2);updateParticles();if(deathTimer>.5)restart();}
    acc-=DT;
  }
  // Render
  var w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
  if(state==="MENU"){drawMenu(ctx,w,h,time);scale=1;requestAnimationFrame(loop);return;}
  scale=h/GH;gw=w/scale;
  ctx.save();ctx.scale(scale,scale);
  drawBG(ctx,gw,GH,level.bg,time);
  ctx.save();ctx.translate(-camX,0);
  drawGround(ctx,camX,gw+camX+TILE,GROUND_Y,GH,level.gc,time);
  var L=camX-TILE,R=camX+gw+TILE;
  for(var i=0;i<level.blocks.length;i++){var b=level.blocks[i];if(b.x>L&&b.x<R)drawBlock(ctx,b,level.gc);}
  for(var i=0;i<level.spikes.length;i++){var s=level.spikes[i];if(s.x>L&&s.x<R)drawSpike(ctx,s);}
  for(var i=0;i<level.pads.length;i++){var p=level.pads[i];if(p.x>L&&p.x<R)drawPad(ctx,p,time);}
  for(var i=0;i<level.orbs.length;i++){var o=level.orbs[i];if(o.x>L&&o.x<R)drawOrb(ctx,o,time);}
  if(state!=="DEAD")drawPlayer(ctx,player);
  drawParticles(ctx);
  ctx.restore();
  if(state==="PLAYING"||state==="DEAD"){var prog=level.endX>0?player.x/level.endX:0;drawHUD(ctx,gw,prog,attempts);}
  if(flashAl>0){ctx.globalAlpha=flashAl;ctx.fillStyle="#ff0033";ctx.fillRect(0,0,gw,GH);ctx.globalAlpha=1;}
  ctx.restore();
  if(state==="WON")drawVictory(ctx,w,h,time,attempts);
  requestAnimationFrame(loop);
}
requestAnimationFrame(function(ts){last=ts;loop(ts);});
})();
