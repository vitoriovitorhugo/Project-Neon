/* === CORE: Constants, Level Data, Player, Audio === */
var TILE=40,GROUND_Y=440,GH=500,LEVEL1={name:"First Flight",bpm:140,speed:8,bg:"#0a0a2e",gc:"#1a1aff",ac:"#00ffff",objects:[
{t:"s",c:18,r:0},{t:"s",c:24,r:0},{t:"s",c:30,r:0},{t:"s",c:31,r:0},
{t:"b",c:38,r:0},{t:"b",c:39,r:0},{t:"s",c:40,r:0},
{t:"s",c:48,r:0},{t:"b",c:50,r:0},{t:"b",c:50,r:1},{t:"s",c:51,r:0},
{t:"s",c:60,r:0},{t:"s",c:61,r:0},{t:"s",c:62,r:0},
{t:"b",c:70,r:0},{t:"b",c:71,r:0},{t:"b",c:72,r:0},{t:"s",c:72,r:1},
{t:"p",c:80,r:0,f:-18},{t:"s",c:84,r:0},{t:"s",c:85,r:0},
{t:"b",c:93,r:0},{t:"b",c:94,r:0},{t:"b",c:94,r:1},{t:"b",c:95,r:0},{t:"b",c:95,r:1},{t:"b",c:95,r:2},{t:"s",c:96,r:0},
{t:"s",c:105,r:0},{t:"o",c:107,r:3},{t:"s",c:109,r:0},{t:"s",c:110,r:0},
{t:"b",c:118,r:0},{t:"b",c:119,r:0},{t:"p",c:119,r:1,f:-20},{t:"s",c:123,r:0},{t:"s",c:124,r:0},{t:"s",c:125,r:0},
{t:"b",c:133,r:0},{t:"b",c:134,r:0},{t:"b",c:134,r:1},{t:"s",c:135,r:0},{t:"s",c:136,r:0},{t:"b",c:138,r:0},{t:"s",c:139,r:0},
{t:"s",c:148,r:0},{t:"s",c:149,r:0},{t:"o",c:150,r:3},{t:"s",c:152,r:0},{t:"s",c:153,r:0},
{t:"b",c:162,r:0},{t:"b",c:163,r:0},{t:"b",c:163,r:1},{t:"b",c:164,r:0},{t:"b",c:164,r:1},{t:"b",c:164,r:2},{t:"p",c:164,r:3,f:-16},
{t:"s",c:168,r:0},{t:"s",c:169,r:0},{t:"s",c:170,r:0},
{t:"s",c:180,r:0},{t:"b",c:182,r:0},{t:"b",c:183,r:0},{t:"b",c:183,r:1},{t:"s",c:184,r:0},{t:"o",c:186,r:3},{t:"s",c:188,r:0},{t:"s",c:189,r:0},
{t:"s",c:198,r:0},{t:"s",c:199,r:0},{t:"s",c:200,r:0},{t:"b",c:203,r:0},{t:"b",c:204,r:0},{t:"s",c:205,r:0},{t:"s",c:206,r:0},{t:"s",c:207,r:0},
{t:"e",c:230,r:0}]};

function loadLevel(d){
  var bl=[],sp=[],pa=[],or=[],endX=0;
  d.objects.forEach(function(o){
    var x=o.c*TILE,y=GROUND_Y-(o.r+1)*TILE;
    if(o.t==="b")bl.push({x:x,y:y,w:TILE,h:TILE});
    else if(o.t==="s")sp.push({x:x,y:y,w:TILE,h:TILE});
    else if(o.t==="p")pa.push({x:x,y:y+TILE*2/3,w:TILE,h:TILE/3,f:o.f||-18});
    else if(o.t==="o")or.push({x:x,y:y,w:TILE,h:TILE,used:false});
    else if(o.t==="e")endX=x;
  });
  return{blocks:bl,spikes:sp,pads:pa,orbs:or,endX:endX,speed:d.speed,bg:d.bg,gc:d.gc,ac:d.ac,bpm:d.bpm};
}

function aabb(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function playerHB(p){var s=5;return{x:p.x+s,y:p.y+s,w:p.sz-s*2,h:p.sz-s*2};}
function spikeHB(s){var k=8;return{x:s.x+k,y:s.y+k,w:s.w-k*2,h:s.h-k};}
function orbHB(o){return{x:o.x-4,y:o.y-4,w:o.w+8,h:o.h+8};}

function makePlayer(){
  return{x:100,y:GROUND_Y-TILE,sz:TILE,vy:0,grav:0.9,jf:-14,onG:true,dead:false,
    rot:0,tRot:0,trail:[],color:"#00ffcc"};
}

/* Audio */
var audioCtx=null,audioGain=null;
function initAudio(){
  if(audioCtx)return;
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  audioGain=audioCtx.createGain();audioGain.gain.value=0.3;audioGain.connect(audioCtx.destination);
}
function playSFX(type){
  if(!audioCtx)return;var n=audioCtx.currentTime;
  if(type==="jump"){var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="square";o.frequency.setValueAtTime(400,n);o.frequency.exponentialRampToValueAtTime(800,n+.08);g.gain.setValueAtTime(.12,n);g.gain.exponentialRampToValueAtTime(.001,n+.1);o.connect(g);g.connect(audioGain);o.start(n);o.stop(n+.1);}
  else if(type==="die"){var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sawtooth";o.frequency.setValueAtTime(300,n);o.frequency.exponentialRampToValueAtTime(50,n+.3);g.gain.setValueAtTime(.2,n);g.gain.exponentialRampToValueAtTime(.001,n+.35);o.connect(g);g.connect(audioGain);o.start(n);o.stop(n+.35);}
  else if(type==="win"){[523,659,784].forEach(function(f,i){var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(.15,n+i*.12);g.gain.exponentialRampToValueAtTime(.001,n+i*.12+.3);o.connect(g);g.connect(audioGain);o.start(n+i*.12);o.stop(n+i*.12+.3);});}
}
function playBeat(bpm){
  if(!audioCtx)return;var beat=60/bpm,dur=120,n=audioCtx.currentTime;
  for(var i=0;i<Math.floor(dur/beat);i++){var t=n+i*beat;
    var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(30,t+.1);g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(audioGain);o.start(t);o.stop(t+.15);
  }
}

/* Particles */
var particles=[];
function explode(x,y,col,cnt){
  for(var i=0;i<(cnt||20);i++){var a=Math.PI*2*i/cnt+Math.random()*.3,sp=3+Math.random()*6;
    particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,sz:3+Math.random()*6,al:1,col:col,gr:.15,dc:.015+Math.random()*.01});}
}
function updateParticles(){
  for(var i=particles.length-1;i>=0;i--){var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=p.gr;p.al-=p.dc;p.sz*=.98;if(p.al<=0)particles.splice(i,1);}
}
