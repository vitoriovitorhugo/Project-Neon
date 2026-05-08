/* === RENDER: Background, ground, objects, UI === */
var menuParts=[];
function initMenuParts(w,h){if(menuParts.length)return;for(var i=0;i<40;i++)menuParts.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.5,vy:-.3-Math.random()*.5,sz:2+Math.random()*4,al:.2+Math.random()*.4,col:["#00ffff","#ff00ff","#39ff14","#ffcc00"][Math.floor(Math.random()*4)]});}

function drawBG(ctx,w,h,bg,t){
  var g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,bg||"#0a0a2e");g.addColorStop(.6,"#0d0d3a");g.addColorStop(1,"#1a0a2e");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
}
function drawGround(ctx,camX,gw,gy,gh,gc,t){
  ctx.fillStyle=gc||"#1a1aff";ctx.fillRect(0,gy,gw,gh-gy);
  var gg=ctx.createLinearGradient(0,gy,0,gh);gg.addColorStop(0,"rgba(255,255,255,.08)");gg.addColorStop(1,"rgba(0,0,0,.3)");ctx.fillStyle=gg;ctx.fillRect(0,gy,gw,gh-gy);
  ctx.save();ctx.shadowColor=gc||"#1a1aff";ctx.shadowBlur=12;ctx.strokeStyle="#4d4dff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(gw,gy);ctx.stroke();ctx.restore();
  ctx.strokeStyle="rgba(100,100,255,.15)";ctx.lineWidth=1;
  var sc=Math.floor(camX/TILE)*TILE-camX;
  for(var x=sc;x<gw;x+=TILE){ctx.beginPath();ctx.moveTo(x,gy);ctx.lineTo(x,gh);ctx.stroke();}
  for(var y=gy+TILE;y<gh;y+=TILE){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(gw,y);ctx.stroke();}
}
function drawBlock(ctx,b,col){ctx.fillStyle=col||"#1a1aff";ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle="#4d4dff";ctx.lineWidth=1.5;ctx.strokeRect(b.x+.5,b.y+.5,b.w-1,b.h-1);}
function drawSpike(ctx,s){
  var cx=s.x+s.w/2;ctx.beginPath();ctx.moveTo(cx,s.y);ctx.lineTo(s.x+s.w,s.y+s.h);ctx.lineTo(s.x,s.y+s.h);ctx.closePath();ctx.fillStyle="#ff3366";ctx.fill();
  ctx.save();ctx.shadowColor="#ff3366";ctx.shadowBlur=10;ctx.strokeStyle="#ff6699";ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}
function drawPad(ctx,p,t){
  var pulse=.8+.2*Math.sin(t*8),h=p.h*pulse;
  ctx.save();ctx.shadowColor="#ffaa00";ctx.shadowBlur=12;ctx.fillStyle="#ffcc00";ctx.fillRect(p.x+2,p.y+p.h-h,p.w-4,h);ctx.restore();
  var cx=p.x+p.w/2,ay=p.y-6;ctx.fillStyle="#ffcc00";ctx.beginPath();ctx.moveTo(cx,ay-6);ctx.lineTo(cx+5,ay);ctx.lineTo(cx-5,ay);ctx.closePath();ctx.fill();
}
function drawOrb(ctx,o,t){
  if(o.used)return;var cx=o.x+o.w/2,cy=o.y+o.h/2,r=TILE/2-4;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r+6+Math.sin(t*4)*3,0,Math.PI*2);ctx.strokeStyle="rgba(0,255,255,.25)";ctx.lineWidth=2;ctx.stroke();ctx.restore();
  ctx.save();ctx.shadowColor="#00ffff";ctx.shadowBlur=18;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle="#00ffff";ctx.fill();ctx.restore();
  ctx.beginPath();ctx.arc(cx-3,cy-3,r*.4,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,.5)";ctx.fill();
}
function drawPlayer(ctx,pl){
  for(var i=0;i<pl.trail.length;i++){var tr=pl.trail[i];ctx.globalAlpha=tr.al*.5;ctx.fillStyle=pl.color;ctx.fillRect(tr.x-tr.sz/2,tr.y-tr.sz/2,tr.sz,tr.sz);}ctx.globalAlpha=1;
  var cx=pl.x+pl.sz/2,cy=pl.y+pl.sz/2;ctx.save();ctx.translate(cx,cy);ctx.rotate(pl.rot);
  ctx.shadowColor=pl.color;ctx.shadowBlur=16;ctx.fillStyle=pl.color;ctx.fillRect(-pl.sz/2,-pl.sz/2,pl.sz,pl.sz);
  ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.strokeRect(-pl.sz/2,-pl.sz/2,pl.sz,pl.sz);
  ctx.fillStyle="rgba(255,255,255,.3)";ctx.fillRect(-pl.sz/4,-pl.sz/4,pl.sz/2,pl.sz/2);ctx.restore();
}
function drawParticles(ctx){for(var i=0;i<particles.length;i++){var p=particles[i];ctx.globalAlpha=Math.max(0,p.al);ctx.fillStyle=p.col;ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);}ctx.globalAlpha=1;}
function drawHUD(ctx,w,prog,att){
  var bw=w*.4,bh=6,bx=w/2-bw/2,by=20;ctx.fillStyle="rgba(255,255,255,.1)";ctx.fillRect(bx,by,bw,bh);
  var fw=bw*Math.min(1,Math.max(0,prog));if(fw>0){var bg=ctx.createLinearGradient(bx,0,bx+bw,0);bg.addColorStop(0,"#00ffff");bg.addColorStop(1,"#ff00ff");ctx.fillStyle=bg;ctx.fillRect(bx,by,fw,bh);}
  ctx.textAlign="center";ctx.textBaseline="top";ctx.font="11px Orbitron";ctx.fillStyle="rgba(255,255,255,.5)";ctx.fillText(Math.floor(prog*100)+"%",w/2,by+bh+4);
  if(att>0){ctx.textAlign="right";ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillText("Attempt "+att,w-20,20);}
}
function drawMenu(ctx,w,h,t){
  initMenuParts(w,h);var g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#0a0a2e");g.addColorStop(.5,"#150a30");g.addColorStop(1,"#0a0a2e");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(var i=0;i<menuParts.length;i++){var p=menuParts[i];p.x+=p.vx;p.y+=p.vy;if(p.y<-10){p.y=h+10;p.x=Math.random()*w;}ctx.globalAlpha=p.al*(.5+.5*Math.sin(t*2+p.x));ctx.fillStyle=p.col;ctx.fillRect(p.x,p.y,p.sz,p.sz);}ctx.globalAlpha=1;
  var ty=h*.3,pu=1+.03*Math.sin(t*3),fs=Math.min(w*.09,72);ctx.save();ctx.translate(w/2,ty);ctx.scale(pu,pu);ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+fs+"px Orbitron";
  ctx.shadowColor="#00ffff";ctx.shadowBlur=30;ctx.fillStyle="#00ffff";ctx.fillText("NEON",0,-Math.min(w*.05,40));
  ctx.shadowColor="#ff00ff";ctx.fillStyle="#ff00ff";ctx.fillText("JUMP",0,Math.min(w*.05,40));ctx.restore();
  ctx.textAlign="center";ctx.font=Math.min(w*.025,16)+"px Orbitron";ctx.fillStyle="rgba(255,255,255,.5)";ctx.fillText("RHYTHM ACTION PLATFORMER",w/2,ty+Math.min(w*.1,80));
  var bw=Math.min(240,w*.35),bh=56,bx=w/2-bw/2,by=h*.55;
  ctx.save();ctx.shadowColor="#00ffcc";ctx.shadowBlur=15*(.6+.4*Math.sin(t*4));ctx.fillStyle="rgba(0,255,204,.1)";ctx.strokeStyle="#00ffcc";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,8);ctx.fill();ctx.stroke();ctx.restore();
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+Math.min(24,w*.04)+"px Orbitron";ctx.fillStyle="#00ffcc";ctx.fillText("\u25b6  PLAY",w/2,by+bh/2);
  window._playBtn={x:bx,y:by,w:bw,h:bh};
  ctx.font=Math.min(13,w*.02)+"px Orbitron";ctx.fillStyle="rgba(255,255,255,.3)";ctx.fillText("SPACE / CLICK / TAP TO JUMP",w/2,h*.75);
  ctx.font=Math.min(11,w*.015)+"px Orbitron";ctx.fillStyle="rgba(255,255,255,.15)";ctx.fillText("PROJECT NEON JUMP",w/2,h-30);
}
function drawVictory(ctx,w,h,t,att){
  ctx.fillStyle="rgba(0,0,0,.7)";ctx.fillRect(0,0,w,h);
  var pu=1+.04*Math.sin(t*5);ctx.save();ctx.translate(w/2,h*.35);ctx.scale(pu,pu);ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+Math.min(48,w*.07)+"px Orbitron";ctx.shadowColor="#39ff14";ctx.shadowBlur=25;ctx.fillStyle="#39ff14";ctx.fillText("LEVEL COMPLETE!",0,0);ctx.restore();
  ctx.textAlign="center";ctx.font=Math.min(18,w*.03)+"px Orbitron";ctx.fillStyle="rgba(255,255,255,.7)";ctx.fillText("Attempts: "+att,w/2,h*.5);
  if(Math.sin(t*4)>0){ctx.font=Math.min(14,w*.022)+"px Orbitron";ctx.fillStyle="rgba(255,255,255,.4)";ctx.fillText("CLICK TO RETURN TO MENU",w/2,h*.65);}
}
