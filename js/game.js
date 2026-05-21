/* === GAME v3: Loop, states, input, checkpoints, gravity zones === */
(function(){
var canvas=document.getElementById("gameCanvas"),ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=true;
var state="MENU",time=0,player=null,level=null,camX=0,attempts=0,deathTimer=0,flashAl=0,scale=1,gw=800,score=0;
var curLvl=0,jumpPressed=false,jumpJust=false,prevPress=false,lastCheckX=100;

function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
window.addEventListener("resize",resize);resize();

window.addEventListener("keydown",function(e){
  if(e.code==="Space"||e.key===" "){e.preventDefault();jumpPressed=true;}
  if(e.code==="Escape"){if(state==="PLAYING"){state="PAUSED";}else if(state==="PAUSED"){state="PLAYING";}}
});
window.addEventListener("keyup",function(e){if(e.code==="Space"||e.key===" ")jumpPressed=false;});
canvas.addEventListener("mousedown",function(e){e.preventDefault();jumpPressed=true;});
canvas.addEventListener("mouseup",function(){jumpPressed=false;});
canvas.addEventListener("touchstart",function(e){e.preventDefault();jumpPressed=true;},{passive:false});
canvas.addEventListener("touchend",function(){jumpPressed=false;});

function getClick(e){var r=canvas.getBoundingClientRect(),cx,cy;if(e.touches&&e.touches.length){cx=e.touches[0].clientX;cy=e.touches[0].clientY;}else{cx=e.clientX;cy=e.clientY;}return{x:cx-r.left,y:cy-r.top};}
function hitBtn(ck,b){return ck.x>=b.x&&ck.x<=b.x+b.w&&ck.y>=b.y&&ck.y<=b.y+b.h;}

canvas.addEventListener("click",function(e){
  e.preventDefault();var ck=getClick(e);if(transition.dir)return;
  if(state==="MENU"&&window._menuBtns){for(var i=0;i<_menuBtns.length;i++){var b=_menuBtns[i];if(hitBtn(ck,b)){
    initAudio();if(audioCtx&&audioCtx.state==="suspended")audioCtx.resume();playSFX("select");
    if(b.id==="play"){fadeOut(function(){startLevel(0,false);fadeIn();});}
    else if(b.id==="continue"){var sv=loadSave(),mx=0;for(var j=sv.unlocked.length-1;j>=0;j--)if(sv.unlocked[j]>mx)mx=sv.unlocked[j];fadeOut(function(){startLevel(mx,true);fadeIn();});}
    else if(b.id==="levels"){fadeOut(function(){state="LEVELS";fadeIn();});}return;}}}
  if(state==="LEVELS"){
    if(window._backBtn&&hitBtn(ck,_backBtn)){playSFX("select");fadeOut(function(){state="MENU";fadeIn();});return;}
    if(window._lvlBtns){for(var i=0;i<_lvlBtns.length;i++){var b2=_lvlBtns[i];if(hitBtn(ck,b2)){playSFX("select");fadeOut(function(){startLevel(b2.id,false);fadeIn();});return;}}}}
  if(state==="WON"&&window._winBtns){for(var i=0;i<_winBtns.length;i++){var b3=_winBtns[i];if(hitBtn(ck,b3)){playSFX("select");
    if(b3.id==="next"){var nx=curLvl+1;if(nx>=LEVELS.length)nx=0;fadeOut(function(){startLevel(nx,false);fadeIn();});}
    else{fadeOut(function(){state="MENU";fadeIn();});}return;}}}
  if(state==="PAUSED"&&window._pauseBtns){for(var i=0;i<_pauseBtns.length;i++){var b4=_pauseBtns[i];if(hitBtn(ck,b4)){playSFX("select");
    if(b4.id==="resume"){state="PLAYING";}
    else{fadeOut(function(){state="MENU";fadeIn();});}return;}}}
});

function startLevel(id,useCk){
  initAudio();if(audioCtx&&audioCtx.state==="suspended")audioCtx.resume();
  curLvl=id;level=loadLevel(LEVELS[id]);
  var savedCk=useCk?loadCheckpoint(id):0;if(!useCk)clearCheckpoint(id);
  var spawnX=savedCk||100;
  player=makePlayer(spawnX);
  level.orbs.forEach(function(o){o.used=false;});
  level.checkpoints.forEach(function(c){c.active=false;c.anim=0;if(savedCk&&c.x<=savedCk){c.active=true;}});
  particles=[];attempts=1;deathTimer=0;flashAl=0;lastCheckX=spawnX;camX=Math.max(0,spawnX-gw*.33);
  score=Math.floor(spawnX/10);
  playBeat(level.bpm);state="PLAYING";
}
function restart(){
  player=makePlayer(lastCheckX);
  level.orbs.forEach(function(o){if(o.x>=lastCheckX)o.used=false;});
  particles=[];attempts++;deathTimer=0;flashAl=0;camX=Math.max(0,lastCheckX-gw*.33);state="PLAYING";
}
function die(){
  player.dead=true;explode(player.x+player.sz/2,player.y+player.sz/2,level.dim.particleCol,25);
  playSFX("die");screenShake(.5);fx.flash=.3;fx.flashCol="#ff0033";deathTimer=0;
  var prog=level.endX>0?Math.min(1,player.x/level.endX):0;saveBest(curLvl,prog);saveScore(curLvl,score);state="DEAD";
}

function updatePlaying(){
  updateMusicData();
  var p=player,dim=level.dim;
  var speed=getMusicSpeed(level.speed,dim.speedMod);
  var grav=getMusicGravity(p.grav,dim.gravMod);
  jumpJust=jumpPressed&&!prevPress;prevPress=jumpPressed;
  /* Update mover positions + carry riding player */
  for(var i=0;i<level.movers.length;i++){var mv=level.movers[i];var prevY=mv.y;mv.phase+=mv.spd;mv.y=mv.baseY+Math.sin(mv.phase)*mv.range;if(p.onG){var phb=playerHB(p);if(Math.abs((p.y+p.sz)-prevY)<4&&phb.x+phb.w>mv.x&&phb.x<mv.x+mv.w){p.y+=mv.y-prevY;}}}
  p.x+=speed;score=Math.max(score,Math.floor(p.x/10));
  /* Horizontal collision */
  var hb=playerHB(p);
  for(var i=0;i<level.blocks.length;i++){var bl=level.blocks[i];if(aabb(hb,bl)){if(p.y+p.sz>bl.y+4){die();return;}}}
  for(var i=0;i<level.movers.length;i++){var mv=level.movers[i];if(aabb(hb,mv)){if(p.y+p.sz>mv.y+6){die();return;}}}
  /* Jump */
  if(p.onG&&jumpPressed){p.vy=p.jf;p.onG=false;p.tRot+=Math.PI/2;playSFX("jump");}
  if(jumpJust&&!p.onG){for(var i=0;i<level.orbs.length;i++){var o=level.orbs[i];if(!o.used&&aabb(playerHB(p),orbHB(o))){o.used=true;p.vy=p.jf;p.tRot+=Math.PI/2;sparkle(o.x+o.w/2,o.y+o.h/2,"#00ffff",10);playSFX("jump");break;}}}
  /* Gravity + gravity zones */
  var inZone=null;
  for(var i=0;i<level.gzones.length;i++){var gz=level.gzones[i];if(aabb(playerHB(p),gz)){inZone=gz.mode;break;}}
  if(inZone==="flip")p.vy-=grav*1.5;
  else if(inZone==="zero")p.vy+=grav*.1;
  else if(inZone==="low")p.vy+=grav*.5;
  else p.vy+=grav;
  p.y+=p.vy;
  /* Ground */
  if(p.y>=GROUND_Y-p.sz){p.y=GROUND_Y-p.sz;p.vy=0;p.onG=true;}
  /* Block collision */
  for(var i=0;i<level.blocks.length;i++){var bl=level.blocks[i];if(aabb(playerHB(p),bl)){if(p.vy>0){p.y=bl.y-p.sz;p.vy=0;p.onG=true;}else if(p.vy<0){p.y=bl.y+bl.h;p.vy=0;}}}
  /* Movers */
  for(var i=0;i<level.movers.length;i++){var mv=level.movers[i];var phb=playerHB(p);if(aabb(phb,mv)){if(p.vy>=0&&(p.y-p.vy)+p.sz<mv.y+24){p.y=mv.y-p.sz;p.vy=0;p.onG=true;}else{die();return;}}}
  /* Spikes */
  for(var i=0;i<level.spikes.length;i++){if(aabb(playerHB(p),spikeHB(level.spikes[i]))){die();return;}}
  /* Lasers */
  for(var i=0;i<level.lasers.length;i++){var la=level.lasers[i];if(la.on&&aabb(playerHB(p),{x:la.x+TILE/2-5,y:la.y,w:10,h:la.len})){die();return;}}
  /* Pads */
  for(var i=0;i<level.pads.length;i++){var pd=level.pads[i];if(aabb(playerHB(p),pd)){p.vy=pd.f;p.onG=false;p.tRot+=Math.PI/2;playSFX("jump");}}
  /* Checkpoints */
  for(var i=0;i<level.checkpoints.length;i++){var ck=level.checkpoints[i];if(!ck.active&&p.x>=ck.x&&p.x<ck.x+TILE*2){ck.active=true;ck.anim=1;lastCheckX=ck.x;saveCheckpoint(curLvl,ck.x);playSFX("checkpoint");sparkle(ck.x+TILE/2,GROUND_Y-TILE*2,"#39ff14",15);}}
  /* Win */
  if(level.endX>0&&p.x>=level.endX){state="WON";playSFX("win");saveBest(curLvl,1);saveAttempts(curLvl,attempts);saveScore(curLvl,score);clearCheckpoint(curLvl);if(curLvl+1<LEVELS.length)unlockLevel(curLvl+1);explode(p.x,p.y,level.dim.particleCol,30);return;}
  /* Rotation */
  var df=p.tRot-p.rot;p.rot+=df*.2;if(Math.abs(df)<.01)p.rot=p.tRot;
  if(p.onG)p.tRot=Math.round(p.tRot/(Math.PI/2))*(Math.PI/2);
  /* Trail */
  p.trail.push({x:p.x+p.sz/2,y:p.y+p.sz/2,al:.6,sz:p.sz*.3});
  for(var i=p.trail.length-1;i>=0;i--){p.trail[i].al-=.04;p.trail[i].sz*=.95;if(p.trail[i].al<=0)p.trail.splice(i,1);}
  camX=p.x-gw*.33;if(camX<0)camX=0;
  for(var i=0;i<level.checkpoints.length;i++){if(level.checkpoints[i].anim>0)level.checkpoints[i].anim-=.02;}
}

var last=0,DT=1/60,acc=0;
function loop(ts){
  var raw=(ts-last)/1000;last=ts;acc+=Math.min(raw,.1);
  while(acc>=DT){time+=DT;updateTransition(DT);updateFX();
    if(state==="PLAYING"){updatePlaying();updateParticles();}
    else if(state==="DEAD"){deathTimer+=DT;flashAl=Math.max(0,flashAl-DT*2);updateParticles();if(deathTimer>.6)restart();}
    acc-=DT;}
  var w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
  if(state==="MENU"){drawMenu(ctx,w,h,time);drawTransition(ctx,w,h);requestAnimationFrame(loop);return;}
  if(state==="LEVELS"){drawLevelSelect(ctx,w,h,time);drawTransition(ctx,w,h);requestAnimationFrame(loop);return;}
  scale=h/GH;gw=w/scale;
  ctx.save();ctx.translate(w/2,h/2);ctx.scale(scale*fx.zoom,scale*fx.zoom);ctx.translate(-gw/2+fx.shakeX,-GH/2+fx.shakeY);
  drawBG(ctx,gw,GH,level.dim,time);
  ctx.save();ctx.translate(-camX,0);
  drawGround(ctx,camX,gw+camX+TILE,GROUND_Y,GH,level.dim.gc);
  var L=camX-TILE*2,R=camX+gw+TILE*2;
  for(var i=0;i<level.gzones.length;i++){var gz=level.gzones[i];if(gz.x+gz.w>L&&gz.x<R)drawGravZone(ctx,gz,time);}
  for(var i=0;i<level.blocks.length;i++){var b=level.blocks[i];if(b.x>L&&b.x<R)drawBlock(ctx,b,level.dim.gc);}
  for(var i=0;i<level.spikes.length;i++){var s=level.spikes[i];if(s.x>L&&s.x<R)drawSpike(ctx,s,level.dim.ac);}
  for(var i=0;i<level.pads.length;i++){var p2=level.pads[i];if(p2.x>L&&p2.x<R)drawPad(ctx,p2,time);}
  for(var i=0;i<level.orbs.length;i++){var o=level.orbs[i];if(o.x>L&&o.x<R)drawOrb(ctx,o,time);}
  for(var i=0;i<level.lasers.length;i++){var la=level.lasers[i];if(la.x>L&&la.x<R)drawLaser(ctx,la,time);}
  for(var i=0;i<level.movers.length;i++){var mv=level.movers[i];if(mv.x>L&&mv.x<R)drawMover(ctx,mv,level.dim.gc);}
  for(var i=0;i<level.checkpoints.length;i++){var c=level.checkpoints[i];if(c.x>L&&c.x<R)drawCheckpoint(ctx,c,time);}
  if(!player.dead)drawPlayer(ctx,player,level.dim,time);
  drawParticles(ctx);ctx.restore();
  if(state==="PLAYING"||state==="DEAD"||state==="PAUSED"){var prog=level.endX>0?player.x/level.endX:0;drawHUD(ctx,gw,prog,attempts,level.name,score,loadScore(curLvl));}
  if(fx.flash>0){ctx.globalAlpha=fx.flash;ctx.fillStyle=fx.flashCol;ctx.fillRect(0,0,gw,GH);ctx.globalAlpha=1;}
  ctx.restore();
  if(state==="PAUSED")drawPause(ctx,w,h,time);
  if(state==="WON")drawVictory(ctx,w,h,time,attempts,level.name);
  drawTransition(ctx,w,h);
  requestAnimationFrame(loop);
}
requestAnimationFrame(function(ts){last=ts;loop(ts);});
})();
