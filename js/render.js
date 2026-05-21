/* === RENDER v3 === */
var _stars=[],_mparts=[];
function _iS(w,h){if(!_stars.length)for(var i=0;i<80;i++)_stars.push({x:Math.random()*w*3,y:Math.random()*h*.8,r:.5+Math.random()*1.5,f:Math.random()*6.28});}
function _iM(w,h){if(!_mparts.length)for(var i=0;i<40;i++)_mparts.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.4,vy:-.2-Math.random()*.5,sz:2+Math.random()*5,al:.2+Math.random()*.3,col:["#00ffff","#ff00ff","#39ff14","#ffcc00","#ff3366"][i%5]});}

function drawBG(ctx,w,h,dim,t){
  var g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,dim.bg1);g.addColorStop(1,dim.bg2);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  var it=musicData.intensity;_iS(w,h);
  if(dim.bgFx==="stars"||dim.bgFx==="void"){for(var i=0;i<_stars.length;i++){var s=_stars[i];ctx.globalAlpha=(.2+.4*Math.sin(t*2+s.f))*(.7+it*.5);ctx.fillStyle=dim.bgFx==="void"?"#ff0044":"#fff";ctx.beginPath();ctx.arc(s.x%w,s.y,s.r*(1+it*.3),0,6.28);ctx.fill();}}
  else if(dim.bgFx==="matrix"){ctx.font="14px monospace";ctx.fillStyle=dim.ac;for(var i=0;i<_stars.length;i++){var s=_stars[i];ctx.globalAlpha=.15+it*.2;ctx.fillText(String.fromCharCode(0x30A0+((t*10+i*7)%96)),s.x%w,((s.y+t*40*s.r)%h));}}
  else if(dim.bgFx==="synthwave"){ctx.strokeStyle=dim.ac;ctx.lineWidth=1;ctx.globalAlpha=.1+it*.15;for(var i=0;i<w;i+=60){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,h);ctx.stroke();}for(var j=0;j<h;j+=40){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(w,j);ctx.stroke();}}
  else if(dim.bgFx==="psychedelic"){var hue=(t*30)%360;ctx.globalAlpha=.06+it*.05;ctx.fillStyle="hsl("+hue+",80%,50%)";ctx.fillRect(0,0,w,h);for(var i=0;i<_stars.length;i++){var s=_stars[i];ctx.globalAlpha=.1+it*.15;ctx.fillStyle="hsl("+(hue+i*30)%360+",70%,60%)";ctx.beginPath();ctx.arc(s.x%w,s.y,s.r*3,0,6.28);ctx.fill();}}
  else if(dim.bgFx==="industrial"){ctx.globalAlpha=.05+it*.05;for(var i=0;i<_stars.length;i+=3){var s=_stars[i];ctx.fillStyle="#ff8800";ctx.fillRect(s.x%w,s.y,2+it*4,1);}}
  ctx.globalAlpha=1;
}
function drawGround(ctx,camX,gw,gy,gh,gc){
  ctx.fillStyle=gc;ctx.fillRect(0,gy,gw,gh-gy);
  var gg=ctx.createLinearGradient(0,gy,0,gh);gg.addColorStop(0,"rgba(255,255,255,.1)");gg.addColorStop(1,"rgba(0,0,0,.4)");ctx.fillStyle=gg;ctx.fillRect(0,gy,gw,gh-gy);
  ctx.save();ctx.shadowColor=gc;ctx.shadowBlur=15;ctx.strokeStyle="rgba(255,255,255,.4)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(gw,gy);ctx.stroke();ctx.restore();
  ctx.strokeStyle="rgba(255,255,255,.06)";ctx.lineWidth=1;var sc=Math.floor(camX/TILE)*TILE-camX;
  for(var x=sc;x<gw;x+=TILE){ctx.beginPath();ctx.moveTo(x,gy);ctx.lineTo(x,gh);ctx.stroke();}
}
function drawBlock(ctx,b,gc){
  ctx.save();ctx.shadowColor=gc;ctx.shadowBlur=6;var g=ctx.createLinearGradient(b.x,b.y,b.x,b.y+b.h);g.addColorStop(0,gc);g.addColorStop(1,"#0a0a33");ctx.fillStyle=g;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle="rgba(255,255,255,.15)";ctx.lineWidth=1;ctx.strokeRect(b.x+.5,b.y+.5,b.w-1,b.h-1);ctx.restore();
}
function drawSpike(ctx,s,ac){
  var cx=s.x+s.w/2;ctx.beginPath();ctx.moveTo(cx,s.y+2);ctx.lineTo(s.x+s.w-2,s.y+s.h);ctx.lineTo(s.x+2,s.y+s.h);ctx.closePath();
  var g=ctx.createLinearGradient(cx,s.y,cx,s.y+s.h);g.addColorStop(0,"#ff6699");g.addColorStop(1,"#cc0033");ctx.fillStyle=g;ctx.fill();
  ctx.save();ctx.shadowColor="#ff3366";ctx.shadowBlur=14;ctx.strokeStyle="#ff99aa";ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}
function drawPad(ctx,p,t){
  ctx.save();ctx.shadowColor="#ffaa00";ctx.shadowBlur=14;var g=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h);g.addColorStop(0,"#ffee66");g.addColorStop(1,"#ff8800");ctx.fillStyle=g;ctx.fillRect(p.x+2,p.y,p.w-4,p.h);ctx.restore();
  var cx=p.x+p.w/2;ctx.fillStyle="#ffcc00";ctx.globalAlpha=.5+.5*Math.sin(t*6);ctx.beginPath();ctx.moveTo(cx,p.y-12);ctx.lineTo(cx+6,p.y-4);ctx.lineTo(cx-6,p.y-4);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
}
function drawOrb(ctx,o,t){
  if(o.used)return;var cx=o.x+o.w/2,cy=o.y+o.h/2,r=TILE/2-4;
  ctx.save();ctx.globalAlpha=.15+.1*Math.sin(t*3);ctx.beginPath();ctx.arc(cx,cy,r+12+Math.sin(t*4)*4,0,6.28);ctx.fillStyle="#00ffff";ctx.fill();ctx.restore();
  ctx.save();ctx.shadowColor="#00ffff";ctx.shadowBlur=22;ctx.beginPath();ctx.arc(cx,cy,r,0,6.28);var g=ctx.createRadialGradient(cx-2,cy-2,0,cx,cy,r);g.addColorStop(0,"#aaffff");g.addColorStop(1,"#0088cc");ctx.fillStyle=g;ctx.fill();ctx.restore();
}
function drawLaser(ctx,l,t){
  var on=Math.sin(t*8+l.phase)>.1;l.on=on;if(!on)return;
  var cx=l.x+TILE/2,ty=l.y,by=l.y+l.len,it=musicData.intensity;
  ctx.save();
  var grd=ctx.createLinearGradient(cx-16,ty,cx+16,ty);grd.addColorStop(0,"rgba(255,0,50,0)");grd.addColorStop(0.3,"rgba(255,0,50,0.07)");grd.addColorStop(0.5,"rgba(255,0,50,0.14)");grd.addColorStop(0.7,"rgba(255,0,50,0.07)");grd.addColorStop(1,"rgba(255,0,50,0)");
  ctx.fillStyle=grd;ctx.globalAlpha=.5+.5*Math.sin(t*12);ctx.fillRect(cx-16,ty,32,l.len);
  ctx.shadowColor="#ff0033";ctx.shadowBlur=20+it*22;ctx.strokeStyle="#ff2244";ctx.lineWidth=5+it*3;ctx.globalAlpha=.6+.3*Math.sin(t*10);ctx.beginPath();ctx.moveTo(cx,ty);ctx.lineTo(cx,by);ctx.stroke();
  ctx.shadowBlur=6;ctx.strokeStyle="#ffaacc";ctx.lineWidth=1.5;ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(cx,ty);ctx.lineTo(cx,by);ctx.stroke();
  ctx.shadowColor="#ff3366";ctx.shadowBlur=10;ctx.fillStyle="#cc0033";ctx.globalAlpha=1;ctx.fillRect(cx-7,ty-5,14,7);ctx.fillStyle="#ff6688";ctx.fillRect(cx-4,ty-3,8,4);
  ctx.fillStyle="#cc0033";ctx.fillRect(cx-7,by-2,14,7);ctx.fillStyle="#ff6688";ctx.fillRect(cx-4,by-1,8,4);
  for(var i=0;i<6;i++){var py=ty+((i*l.len/6+t*80)%l.len),px=cx+(Math.sin(t*12+i*2))*4;ctx.globalAlpha=.25+.3*Math.random();ctx.fillStyle="#ff6688";ctx.beginPath();ctx.arc(px,py,1+Math.random()*1.5,0,6.28);ctx.fill();}
  ctx.restore();ctx.globalAlpha=1;
}
function drawMover(ctx,m,gc){
  ctx.save();ctx.shadowColor=gc||"#ffcc00";ctx.shadowBlur=8;var g=ctx.createLinearGradient(m.x,m.y,m.x+m.w,m.y);g.addColorStop(0,"#ffcc00");g.addColorStop(1,gc||"#ff8800");ctx.fillStyle=g;ctx.fillRect(m.x,m.y,m.w,m.h);ctx.strokeStyle="rgba(255,255,255,.3)";ctx.lineWidth=1;ctx.strokeRect(m.x,m.y,m.w,m.h);ctx.restore();
}
function drawGravZone(ctx,gz,t){
  var bc,label;
  if(gz.mode==="flip"){bc="#ff0066";label="\u2B06\u2B07 FLIP GRAVITY";}else if(gz.mode==="zero"){bc="#00ffcc";label="\u25CE ZERO GRAVITY";}else{bc="#6666ff";label="\u223C LOW GRAVITY";}
  var grd=ctx.createLinearGradient(gz.x,gz.y,gz.x+gz.w,gz.y);grd.addColorStop(0,"rgba(0,0,0,0)");grd.addColorStop(0.15,gz.mode==="flip"?"rgba(255,0,100,.1)":gz.mode==="zero"?"rgba(0,255,200,.1)":"rgba(100,100,255,.1)");grd.addColorStop(0.85,gz.mode==="flip"?"rgba(255,0,100,.1)":gz.mode==="zero"?"rgba(0,255,200,.1)":"rgba(100,100,255,.1)");grd.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=grd;ctx.fillRect(gz.x,gz.y,gz.w,gz.h);
  var pc=Math.floor(gz.w/TILE)*3;ctx.save();
  for(var i=0;i<pc;i++){var px=gz.x+((i*37+t*20*(gz.mode==="flip"?-1:1))%gz.w+gz.w)%gz.w;var py=gz.y+((i*53+(gz.mode==="flip"?-t*40:t*30))%gz.h+gz.h)%gz.h;var sz=2+Math.sin(t*3+i)*1.2;ctx.globalAlpha=.18+.12*Math.sin(t*2+i*1.7)+musicData.intensity*.12;ctx.fillStyle=bc;ctx.beginPath();ctx.arc(px,py,sz,0,6.28);ctx.fill();}
  ctx.restore();
  ctx.save();ctx.shadowColor=bc;ctx.shadowBlur=6+musicData.intensity*5;ctx.setLineDash([12,6]);ctx.lineDashOffset=-t*40;ctx.strokeStyle=bc;ctx.lineWidth=2;ctx.globalAlpha=.4+musicData.intensity*.25;ctx.strokeRect(gz.x,gz.y,gz.w,gz.h);ctx.restore();ctx.setLineDash([]);ctx.globalAlpha=1;
  ctx.save();ctx.fillStyle=bc;ctx.globalAlpha=.55;ctx.font="bold 11px Orbitron";ctx.textAlign="center";ctx.shadowColor=bc;ctx.shadowBlur=6;ctx.fillText(label,gz.x+gz.w/2,gz.y+18);ctx.restore();ctx.globalAlpha=1;
}
function drawCheckpoint(ctx,ck,t){
  var x=ck.x+TILE/2,by=GROUND_Y,ty=by-TILE*3,col=ck.active?"#39ff14":"rgba(255,255,255,.25)";
  ctx.save();if(ck.active){ctx.shadowColor="#39ff14";ctx.shadowBlur=12;}ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,by);ctx.lineTo(x,ty);ctx.stroke();ctx.restore();
  ctx.save();if(ck.active){ctx.shadowColor="#39ff14";ctx.shadowBlur=10;}ctx.fillStyle=ck.active?"#39ff14":"rgba(255,255,255,.15)";ctx.beginPath();ctx.moveTo(x,ty);ctx.lineTo(x+18+Math.sin(t*5)*3,ty+6);ctx.lineTo(x,ty+12);ctx.closePath();ctx.fill();ctx.restore();
  if(ck.active&&ck.anim>0){ctx.save();ctx.globalAlpha=ck.anim*.4;ctx.beginPath();ctx.arc(x,by-TILE,TILE*(2-ck.anim),0,6.28);ctx.strokeStyle="#39ff14";ctx.lineWidth=2;ctx.stroke();ctx.restore();}
}
function drawPlayer(ctx,pl,dim,t){
  for(var i=0;i<pl.trail.length;i++){var tr=pl.trail[i];ctx.globalAlpha=tr.al*.4;ctx.fillStyle=dim.pc;ctx.beginPath();ctx.arc(tr.x,tr.y,tr.sz/2,0,6.28);ctx.fill();}ctx.globalAlpha=1;
  var cx=pl.x+pl.sz/2,cy=pl.y+pl.sz/2,hs=pl.sz/2,it=musicData.intensity;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(pl.rot);ctx.shadowColor=dim.pc;ctx.shadowBlur=15+it*20;
  var g=ctx.createLinearGradient(-hs,-hs,hs,hs);g.addColorStop(0,"#fff");g.addColorStop(1,dim.pc);ctx.fillStyle=g;
  if(dim.shape==="sphere"){ctx.beginPath();ctx.arc(0,0,hs*(1+it*.08),0,6.28);ctx.fill();ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=2;ctx.stroke();}
  else if(dim.shape==="prism"){ctx.beginPath();ctx.moveTo(0,-hs*1.1);ctx.lineTo(hs,hs*.8);ctx.lineTo(-hs,hs*.8);ctx.closePath();ctx.fill();ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=2;ctx.stroke();}
  else if(dim.shape==="gear"){ctx.beginPath();for(var i=0;i<8;i++){var a=i*Math.PI/4+t*2;ctx.lineTo(Math.cos(a)*hs*1.15,Math.sin(a)*hs*1.15);ctx.lineTo(Math.cos(a+.2)*hs*.75,Math.sin(a+.2)*hs*.75);}ctx.closePath();ctx.fill();}
  else if(dim.shape==="liquid"){var r2=hs*(1+.12*Math.sin(t*5));ctx.beginPath();for(var i=0;i<32;i++){var a=i*Math.PI*2/32,rr=r2+Math.sin(a*3+t*8)*3;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();}
  else if(dim.shape==="glitch"){ctx.fillRect(-hs+(Math.random()-.5)*4,-hs+(Math.random()-.5)*4,pl.sz,pl.sz);if(Math.random()>.7){ctx.fillStyle="rgba(255,0,100,.5)";ctx.fillRect(-hs+Math.random()*hs,-hs+Math.random()*hs*2,hs,3);}}
  else{ctx.beginPath();ctx.roundRect(-hs,-hs,pl.sz,pl.sz,3);ctx.fill();ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-hs,-hs,pl.sz,pl.sz,3);ctx.stroke();}
  ctx.fillStyle="rgba(255,255,255,.15)";ctx.fillRect(-hs+3,-hs+3,hs*.6,hs*.6);ctx.restore();
}
function drawParticles(ctx){for(var i=0;i<particles.length;i++){var p=particles[i];ctx.globalAlpha=Math.max(0,p.al);ctx.fillStyle=p.col;if(p.type==="circle"){ctx.beginPath();ctx.arc(p.x,p.y,p.sz/2,0,6.28);ctx.fill();}else ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);}ctx.globalAlpha=1;}
function drawHUD(ctx,w,prog,att,name,score,bestScore){
  var bw=w*.35,bh=8,bx=w/2-bw/2,by=18;ctx.fillStyle="rgba(255,255,255,.08)";ctx.beginPath();ctx.roundRect(bx,by,bw,bh,4);ctx.fill();
  var fw=bw*Math.min(1,Math.max(0,prog));if(fw>1){var bg=ctx.createLinearGradient(bx,0,bx+bw,0);bg.addColorStop(0,"#00ffff");bg.addColorStop(.5,"#ff00ff");bg.addColorStop(1,"#ffcc00");ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(bx,by,fw,bh,4);ctx.fill();}
  if(fw>4){ctx.save();ctx.shadowColor="#fff";ctx.shadowBlur=8;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(bx+fw,by+bh/2,3,0,6.28);ctx.fill();ctx.restore();}
  ctx.textAlign="center";ctx.textBaseline="top";ctx.font="bold 12px Orbitron";ctx.fillStyle="rgba(255,255,255,.6)";ctx.fillText(Math.floor(prog*100)+"%",w/2,by+bh+5);
  ctx.textAlign="left";ctx.font="11px Orbitron";ctx.fillStyle="rgba(255,255,255,.3)";ctx.fillText(name||"",16,20);
  if(att>0){ctx.textAlign="right";ctx.font="11px Orbitron";ctx.fillStyle="rgba(255,255,255,.2)";ctx.fillText("Attempt "+att,w-16,20);}
  if(score!==undefined){
    ctx.textAlign="left";ctx.font="bold 12px Orbitron";ctx.fillStyle="#39ff14";ctx.fillText("Score: "+score,16,40);
    if(bestScore>0||score>0){ctx.fillStyle="rgba(255,255,255,.4)";ctx.font="10px Orbitron";ctx.fillText("High Score: "+Math.max(score,bestScore||0),16,56);}
  }
}
function drawMenu(ctx,w,h,t){
  _iM(w,h);var g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#050520");g.addColorStop(.4,"#100a30");g.addColorStop(1,"#050520");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(var i=0;i<_mparts.length;i++){var p=_mparts[i];p.x+=p.vx;p.y+=p.vy;if(p.y<-10){p.y=h+10;p.x=Math.random()*w;}ctx.globalAlpha=p.al*(.4+.4*Math.sin(t*1.5+p.x*.01));ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz/2,0,6.28);ctx.fill();}ctx.globalAlpha=1;
  var ty=h*.22,fs=Math.min(w*.09,68);ctx.save();ctx.translate(w/2,ty);var pu=1+.02*Math.sin(t*2.5);ctx.scale(pu,pu);ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 "+fs+"px Orbitron";
  ctx.shadowColor="#00ffff";ctx.shadowBlur=35;ctx.fillStyle="#00ffff";ctx.fillText("NEON",0,-fs*.55);ctx.shadowColor="#ff00ff";ctx.fillStyle="#ff00ff";ctx.fillText("JUMP",0,fs*.55);ctx.restore();
  ctx.textAlign="center";ctx.font=Math.min(w*.02,14)+"px Orbitron";ctx.fillStyle="rgba(255,255,255,.35)";ctx.fillText("D I M E N S I O N S",w/2,ty+fs*1.2);
  var btnW=Math.min(260,w*.38),btnH=52,gap=16,sY=h*.5;window._menuBtns=[];
  var sv=loadSave(),btns=[{l:"\u25b6  PLAY",c:"#00ffcc",id:"play"},{l:"\u2630  LEVELS",c:"#ffcc00",id:"levels"}];
  if(sv.unlocked.length>1)btns.splice(1,0,{l:"\u25b6  CONTINUE",c:"#39ff14",id:"continue"});
  for(var i=0;i<btns.length;i++){var b=btns[i],bx=w/2-btnW/2,by=sY+i*(btnH+gap);
    ctx.save();ctx.shadowColor=b.c;ctx.shadowBlur=10*(.5+.5*Math.sin(t*3+i));ctx.fillStyle="rgba(0,0,0,.3)";ctx.strokeStyle=b.c;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(bx,by,btnW,btnH,10);ctx.fill();ctx.stroke();ctx.restore();
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+Math.min(18,w*.028)+"px Orbitron";ctx.fillStyle=b.c;ctx.fillText(b.l,w/2,by+btnH/2);window._menuBtns.push({x:bx,y:by,w:btnW,h:btnH,id:b.id});}
  ctx.font=Math.min(12,w*.018)+"px Orbitron";ctx.fillStyle="rgba(255,255,255,.2)";ctx.textAlign="center";ctx.fillText("SPACE / CLICK / TAP TO JUMP",w/2,h*.9);
}
function drawLevelSelect(ctx,w,h,t){
  var g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#050520");g.addColorStop(1,"#0a0a2e");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+Math.min(28,w*.04)+"px Orbitron";ctx.shadowColor="#00ffff";ctx.shadowBlur=20;ctx.fillStyle="#00ffff";ctx.fillText("SELECT DIMENSION",w/2,h*.08);ctx.shadowBlur=0;
  var sv=loadSave(),cW=Math.min(200,w*.28),cH=90,gap=14,cols=Math.min(3,Math.floor((w-40)/(cW+gap))),sX=(w-(cols*(cW+gap)-gap))/2,sY=h*.16;window._lvlBtns=[];
  for(var i=0;i<LEVELS.length;i++){var lv=LEVELS[i],c=i%cols,r=Math.floor(i/cols),cx=sX+c*(cW+gap),cy=sY+r*(cH+gap);
    var unl=sv.unlocked.indexOf(lv.id)>=0,dc=DIFF_COLORS[lv.diff],best=sv.best[lv.id]||0;
    ctx.save();if(unl){ctx.shadowColor=dc.border;ctx.shadowBlur=8*(.5+.5*Math.sin(t*2+i));}ctx.fillStyle=unl?dc.bg:"rgba(30,30,30,.6)";ctx.strokeStyle=unl?dc.border:"#333";ctx.lineWidth=unl?2:1;ctx.beginPath();ctx.roundRect(cx,cy,cW,cH,8);ctx.fill();ctx.stroke();ctx.restore();
    ctx.textAlign="center";ctx.font="bold "+Math.min(12,w*.018)+"px Orbitron";ctx.fillStyle=unl?dc.text:"#555";ctx.fillText(lv.name,cx+cW/2,cy+22);
    ctx.font=Math.min(10,w*.014)+"px Orbitron";ctx.fillStyle=unl?"rgba(255,255,255,.4)":"#333";ctx.fillText(lv.diff,cx+cW/2,cy+40);
    if(unl){var pbW=cW*.7,pbX=cx+cW/2-pbW/2,pbY=cy+54;ctx.fillStyle="rgba(255,255,255,.1)";ctx.fillRect(pbX,pbY,pbW,5);if(best>0){ctx.fillStyle=dc.border;ctx.fillRect(pbX,pbY,pbW*Math.min(1,best),5);}ctx.font="9px Orbitron";ctx.fillStyle="rgba(255,255,255,.4)";ctx.fillText(Math.floor(best*100)+"%",cx+cW/2,cy+72);}
    else{ctx.font="22px sans-serif";ctx.fillStyle="#444";ctx.fillText("\uD83D\uDD12",cx+cW/2,cy+cH/2+2);}
    if(unl)window._lvlBtns.push({x:cx,y:cy,w:cW,h:cH,id:lv.id});}
  var bbW=100,bbH=36,bbX=w/2-bbW/2,bbY=h-55;ctx.save();ctx.strokeStyle="#666";ctx.lineWidth=1;ctx.fillStyle="rgba(255,255,255,.05)";ctx.beginPath();ctx.roundRect(bbX,bbY,bbW,bbH,6);ctx.fill();ctx.stroke();ctx.restore();ctx.font="bold 13px Orbitron";ctx.fillStyle="#888";ctx.textAlign="center";ctx.fillText("\u2190 BACK",w/2,bbY+bbH/2);window._backBtn={x:bbX,y:bbY,w:bbW,h:bbH};
}
function drawVictory(ctx,w,h,t,att,name){
  ctx.fillStyle="rgba(0,0,0,.75)";ctx.fillRect(0,0,w,h);
  var pu=1+.03*Math.sin(t*5);ctx.save();ctx.translate(w/2,h*.28);ctx.scale(pu,pu);ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+Math.min(40,w*.06)+"px Orbitron";ctx.shadowColor="#39ff14";ctx.shadowBlur=30;ctx.fillStyle="#39ff14";ctx.fillText("DIMENSION CLEAR!",0,0);ctx.restore();
  ctx.textAlign="center";ctx.font="bold "+Math.min(20,w*.03)+"px Orbitron";ctx.fillStyle="#ffcc00";ctx.fillText(name,w/2,h*.42);ctx.font=Math.min(16,w*.025)+"px Orbitron";ctx.fillStyle="rgba(255,255,255,.6)";ctx.fillText("Attempts: "+att,w/2,h*.52);
  var btnW=Math.min(220,w*.32),btnH=46,gap=14;window._winBtns=[];
  var bts=[{l:"NEXT DIMENSION",c:"#39ff14",id:"next"},{l:"MENU",c:"#888",id:"menu"}];
  for(var i=0;i<bts.length;i++){var b=bts[i],bx=w/2-btnW/2,by=h*.6+i*(btnH+gap);
    ctx.save();ctx.shadowColor=b.c;ctx.shadowBlur=6;ctx.fillStyle="rgba(0,0,0,.4)";ctx.strokeStyle=b.c;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(bx,by,btnW,btnH,8);ctx.fill();ctx.stroke();ctx.restore();
    ctx.font="bold "+Math.min(15,w*.023)+"px Orbitron";ctx.fillStyle=b.c;ctx.fillText(b.l,w/2,by+btnH/2);window._winBtns.push({x:bx,y:by,w:btnW,h:btnH,id:b.id});}
}
function drawTransition(ctx,w,h){if(transition.alpha<=0)return;ctx.globalAlpha=transition.alpha;ctx.fillStyle="#000";ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;}
function drawPause(ctx,w,h,t){
  ctx.fillStyle="rgba(0,0,0,.7)";ctx.fillRect(0,0,w,h);
  var pu=1+.02*Math.sin(t*4);ctx.save();ctx.translate(w/2,h*.25);ctx.scale(pu,pu);
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+Math.min(44,w*.065)+"px Orbitron";ctx.shadowColor="#ffcc00";ctx.shadowBlur=25;ctx.fillStyle="#ffcc00";ctx.fillText("PAUSED",0,0);ctx.restore();
  var btnW=Math.min(240,w*.35),btnH=50,gap=16;window._pauseBtns=[];
  var bts=[{l:"\u25b6  RESUME",c:"#00ffcc",id:"resume"},{l:"\u2190  EXIT",c:"#ff3366",id:"exit"}];
  for(var i=0;i<bts.length;i++){var b=bts[i],bx=w/2-btnW/2,by=h*.42+i*(btnH+gap);
    ctx.save();ctx.shadowColor=b.c;ctx.shadowBlur=8*(.5+.5*Math.sin(t*3+i));ctx.fillStyle="rgba(0,0,0,.4)";ctx.strokeStyle=b.c;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(bx,by,btnW,btnH,10);ctx.fill();ctx.stroke();ctx.restore();
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+Math.min(17,w*.026)+"px Orbitron";ctx.fillStyle=b.c;ctx.fillText(b.l,w/2,by+btnH/2);window._pauseBtns.push({x:bx,y:by,w:btnW,h:btnH,id:b.id});}
  ctx.textAlign="center";ctx.font=Math.min(12,w*.018)+"px Orbitron";ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillText("Press ESC to resume",w/2,h*.75);
}
