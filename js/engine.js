/* === ENGINE v3: Physics, Audio, Particles, FX === */
var TILE=40,GROUND_Y=440,GH=500;

/* Save */
var SAVE_KEY="neonjump_v3";
function loadSave(){try{var s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):{unlocked:[0],best:{},attempts:{},checkpoints:{},scores:{}};}catch(e){return{unlocked:[0],best:{},attempts:{},checkpoints:{},scores:{}};}}
function writeSave(sv){try{localStorage.setItem(SAVE_KEY,JSON.stringify(sv));}catch(e){}}
function unlockLevel(id){var sv=loadSave();if(sv.unlocked.indexOf(id)<0)sv.unlocked.push(id);writeSave(sv);}
function saveBest(id,p){var sv=loadSave();if(!sv.best[id]||p>sv.best[id])sv.best[id]=p;writeSave(sv);}
function saveAttempts(id,n){var sv=loadSave();sv.attempts[id]=n;writeSave(sv);}
function saveCheckpoint(id,x){var sv=loadSave();sv.checkpoints=sv.checkpoints||{};sv.checkpoints[id]=x;writeSave(sv);}
function loadCheckpoint(id){var sv=loadSave();return(sv.checkpoints&&sv.checkpoints[id])||0;}
function clearCheckpoint(id){var sv=loadSave();if(sv.checkpoints)delete sv.checkpoints[id];writeSave(sv);}
function saveScore(id,s){var sv=loadSave();sv.scores=sv.scores||{};if(!sv.scores[id]||s>sv.scores[id])sv.scores[id]=s;writeSave(sv);}
function loadScore(id){var sv=loadSave();return(sv.scores&&sv.scores[id])||0;}

/* Audio + Analyser */
var audioCtx=null,audioGain=null,analyser=null,freqData=null;
var musicData={bass:0,mid:0,high:0,intensity:0,beat:false,beatTimer:0,energy:0,prevEnergy:0};
function initAudio(){
  if(audioCtx)return;
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  analyser=audioCtx.createAnalyser();analyser.fftSize=256;analyser.smoothingTimeConstant=.75;
  freqData=new Uint8Array(analyser.frequencyBinCount);
  audioGain=audioCtx.createGain();audioGain.gain.value=.25;
  analyser.connect(audioGain);audioGain.connect(audioCtx.destination);
}
function updateMusicData(){
  if(!analyser||!freqData)return;
  analyser.getByteFrequencyData(freqData);
  var b=0,m=0,h=0;
  for(var i=0;i<10;i++)b+=freqData[i];b/=(10*255);
  for(var i=10;i<40;i++)m+=freqData[i];m/=(30*255);
  for(var i=40;i<80;i++)h+=freqData[i];h/=(40*255);
  musicData.bass=b;musicData.mid=m;musicData.high=h;
  musicData.prevEnergy=musicData.energy;
  musicData.energy=(b*1.5+m+h*.8)/3.3;
  musicData.intensity=musicData.energy;
  musicData.beatTimer-=1/60;
  if(musicData.energy>musicData.prevEnergy+.07&&musicData.beatTimer<=0){musicData.beat=true;musicData.beatTimer=.1;}
  else musicData.beat=false;
}
function getMusicGravity(base,mod){var g=base*(mod||1);return g*(.85+musicData.bass*.4+(musicData.intensity>.6?(musicData.intensity-.6)*.4:0));}
function getMusicSpeed(base,mod){return base*(mod||1)*(.95+musicData.intensity*.12);}

/* SFX */
function _sfxNode(type,freq,end,dur,gain,ramp){
  if(!audioCtx)return;var n=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,n);if(end)o.frequency.exponentialRampToValueAtTime(end,n+ramp||n+dur);
  g.gain.setValueAtTime(gain,n);g.gain.exponentialRampToValueAtTime(.001,n+dur);
  o.connect(g);g.connect(analyser||audioGain);o.start(n);o.stop(n+dur);
}
function playSFX(t){
  if(!audioCtx)return;
  if(t==="jump"){_sfxNode("square",400,800,.1,.1,.08);}
  else if(t==="die"){_sfxNode("sawtooth",300,50,.35,.18,.3);}
  else if(t==="select"){_sfxNode("sine",660,null,.12,.08);}
  else if(t==="gravzone"){_sfxNode("sine",200,600,.25,.06,.2);}
  else if(t==="checkpoint"){[600,800,1000].forEach(function(f,i){setTimeout(function(){_sfxNode("triangle",f,null,.2,.1);},i*80);});}
  else if(t==="win"){[523,659,784,1047].forEach(function(f,i){setTimeout(function(){_sfxNode("sine",f,null,.4,.12);},i*100);});}
}
function playBeat(bpm){
  if(!audioCtx)return;var beat=60/bpm,n=audioCtx.currentTime;
  for(var i=0;i<Math.floor(180/beat);i++){
    var t=n+i*beat,o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type="sine";o.frequency.setValueAtTime(i%4===0?160:120,t);o.frequency.exponentialRampToValueAtTime(30,t+.12);
    g.gain.setValueAtTime(i%4===0?.2:.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.15);
    o.connect(g);g.connect(analyser||audioGain);o.start(t);o.stop(t+.15);
    if(i%2===1){var h2=audioCtx.createOscillator(),hg=audioCtx.createGain();h2.type="square";h2.frequency.value=700+Math.random()*500;hg.gain.setValueAtTime(.04,t);hg.gain.exponentialRampToValueAtTime(.001,t+.04);h2.connect(hg);hg.connect(analyser||audioGain);h2.start(t);h2.stop(t+.04);}
  }
}

/* Level Loader */
function loadLevel(d){
  var bl=[],sp=[],pa=[],or=[],ck=[],lasers=[],movers=[],gzones=[],endX=0;
  var dim=DIMS[d.dim]||DIMS.neon;
  d.objects.forEach(function(o){
    var x=o.c*TILE,y=GROUND_Y-(o.r+1)*TILE;
    if(o.t==="b")bl.push({x:x,y:y,w:TILE,h:TILE});
    else if(o.t==="s")sp.push({x:x,y:y,w:TILE,h:TILE});
    else if(o.t==="p")pa.push({x:x,y:y+TILE*2/3,w:TILE,h:TILE/3,f:o.f||-18});
    else if(o.t==="o")or.push({x:x,y:y,w:TILE,h:TILE,used:false});
    else if(o.t==="k")ck.push({x:x,y:GROUND_Y-TILE*3,w:TILE,h:TILE*3,active:false,anim:0});
    else if(o.t==="L")lasers.push({x:x,y:GROUND_Y-(o.len+1)*TILE,len:(o.len||3)*TILE,on:true,phase:Math.random()*6.28});
    else if(o.t==="M")movers.push({x:x,y:y,baseY:y,w:TILE*2,h:TILE*.5,range:(o.range||2)*TILE,spd:o.spd||.02,phase:Math.random()*6.28});
    else if(o.t==="G")gzones.push({x:x,y:0,w:(o.len||4)*TILE,h:GROUND_Y,mode:o.mode||"low"});
    else if(o.t==="e")endX=x;
  });
  return{id:d.id,name:d.name,diff:d.diff,dim:dim,blocks:bl,spikes:sp,pads:pa,orbs:or,checkpoints:ck,lasers:lasers,movers:movers,gzones:gzones,endX:endX,speed:d.speed,bpm:d.bpm};
}

/* Collision */
function aabb(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function playerHB(p){var s=6;return{x:p.x+s,y:p.y+s,w:p.sz-s*2,h:p.sz-s*2};}
function spikeHB(s){var k=8;return{x:s.x+k,y:s.y+k,w:s.w-k*2,h:s.h-k};}
function orbHB(o){return{x:o.x-4,y:o.y-4,w:o.w+8,h:o.h+8};}

/* Player factory */
function makePlayer(sx){return{x:sx||100,y:GROUND_Y-TILE,sz:TILE,vy:0,grav:.9,jf:-14,onG:true,dead:false,rot:0,tRot:0,trail:[],spawnX:sx||100};}

/* Particles */
var particles=[];
function explode(x,y,cols,cnt){
  if(!cols)cols=["#fff"];if(typeof cols==="string")cols=[cols];
  for(var i=0;i<(cnt||22);i++){var a=Math.PI*2*i/cnt+Math.random()*.4,sp=2+Math.random()*7;
    particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-3,sz:2+Math.random()*7,al:1,col:cols[i%cols.length],gr:.12,dc:.012+Math.random()*.012,type:Math.random()>.5?"circle":"square"});}
}
function sparkle(x,y,col,cnt){
  for(var i=0;i<(cnt||12);i++){var a=Math.PI*2*i/cnt,sp=1+Math.random()*3;
    particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-4,sz:2+Math.random()*3,al:1,col:col,gr:.05,dc:.02,type:"circle"});}
}
function updateParticles(){for(var i=particles.length-1;i>=0;i--){var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=p.gr;p.al-=p.dc;p.sz*=.97;if(p.al<=0)particles.splice(i,1);}}

/* Screen FX */
var fx={shake:0,shakeX:0,shakeY:0,zoom:1,zoomT:1,flash:0,flashCol:"#fff"};
function screenShake(a){fx.shake=Math.max(fx.shake,a);}
function updateFX(){
  if(fx.shake>0){fx.shakeX=(Math.random()-.5)*fx.shake*10;fx.shakeY=(Math.random()-.5)*fx.shake*10;fx.shake*=.85;if(fx.shake<.01){fx.shake=0;fx.shakeX=0;fx.shakeY=0;}}
  fx.zoom+=(fx.zoomT-fx.zoom)*.12;fx.zoomT+=(1-fx.zoomT)*.06;
  if(fx.flash>0)fx.flash-=.025;
  if(musicData.beat){screenShake(.1+musicData.intensity*.15);fx.zoomT=1.025;}
}

/* Transition */
var transition={alpha:0,dir:0,cb:null};
function fadeOut(cb){transition.alpha=0;transition.dir=1;transition.cb=cb;}
function fadeIn(){transition.alpha=1;transition.dir=-1;transition.cb=null;}
function updateTransition(dt){
  if(!transition.dir)return;
  transition.alpha+=transition.dir*dt*3;
  if(transition.alpha>=1&&transition.dir===1){transition.alpha=1;transition.dir=0;if(transition.cb)transition.cb();transition.cb=null;}
  if(transition.alpha<=0&&transition.dir===-1){transition.alpha=0;transition.dir=0;}
}
