// ── CURSOR ──
const cursor=document.getElementById('cursor');
const ring=document.getElementById('cursor-ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cursor.style.left=mx+'px';cursor.style.top=my+'px';});
(function animRing(){rx+=(mx-rx)*0.12;ry+=(my-ry)*0.12;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(animRing);})();
document.querySelectorAll('a,button,.card,.auto-item,.price-card,.test-card').forEach(el=>{
  el.addEventListener('mouseenter',()=>{cursor.style.width='20px';cursor.style.height='20px';ring.style.width='60px';ring.style.height='60px';});
  el.addEventListener('mouseleave',()=>{cursor.style.width='12px';cursor.style.height='12px';ring.style.width='36px';ring.style.height='36px';});
});
// ── PARTICLES ──
const canvas=document.getElementById('bg');
if(canvas){
  const ctx=canvas.getContext('2d');
  let W,H,particles=[];
  const resize=()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;};
  resize();window.addEventListener('resize',resize);
  class P{constructor(){this.reset();}reset(){this.x=Math.random()*W;this.y=Math.random()*H;this.vx=(Math.random()-.5)*.3;this.vy=(Math.random()-.5)*.3;this.r=Math.random()*1.5+.5;this.a=Math.random()*.4+.1;this.col=Math.random()>.7?'0,255,224':'0,200,255';}update(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>W||this.y<0||this.y>H)this.reset();}draw(){ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fillStyle=`rgba(${this.col},${this.a})`;ctx.fill();}}
  for(let i=0;i<100;i++)particles.push(new P());
  (function loop(){ctx.clearRect(0,0,W,H);particles.forEach(p=>{p.update();p.draw();});for(let i=0;i<particles.length;i++)for(let j=i+1;j<particles.length;j++){const dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(0,200,255,${.06*(1-d/120)})`;ctx.lineWidth=.5;ctx.stroke();}}requestAnimationFrame(loop);})();
}
// ── SCROLL REVEAL ──
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.1});
document.querySelectorAll('.reveal').forEach(r=>obs.observe(r));
// ── MOBILE MENU ──
function openMenu(){document.getElementById('mob').classList.add('open');}
function closeMenu(){document.getElementById('mob').classList.remove('open');}
