// ── MOTION / POINTER PREFERENCES ──
var ssReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
var ssFinePointer = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
// ── PARTICLES (skipped when the visitor prefers reduced motion) ──
const canvas=document.getElementById('bg');
if(canvas && !ssReduce){
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
function openMenu(){document.getElementById('mob').classList.add('open');document.body.style.overflow='hidden';}
function closeMenu(){document.getElementById('mob').classList.remove('open');document.body.style.overflow='';}
// ── SERVICES DROPDOWN ──
(function(){
  var dd=document.querySelector('.nav-dd');if(!dd)return;
  var btn=dd.querySelector('.nav-dd-btn');if(!btn)return;
  function ddClose(){dd.classList.remove('open');btn.setAttribute('aria-expanded','false');}
  btn.addEventListener('click',function(e){e.stopPropagation();var open=dd.classList.toggle('open');btn.setAttribute('aria-expanded',open?'true':'false');});
  document.addEventListener('click',function(e){if(!dd.contains(e.target))ddClose();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')ddClose();});
})();
// ── CONTACT FORM (provider-agnostic; sends only when an endpoint is configured) ──
function ssInitForms(){
  var cfg = window.SS_CONFIG || {};
  var email = cfg.EMAIL || 'info@secretsystems.io';
  var telDisp = cfg.PHONE_DISPLAY || '';
  var tel = cfg.PHONE_TEL || '';
  var contactLine = 'email <a href="mailto:'+email+'">'+email+'</a>'+(tel?' or call <a href="tel:'+tel+'">'+telDisp+'</a>':'')+'.';
  document.querySelectorAll('form[data-ss-form]').forEach(function(form){
    var status = form.querySelector('[data-ss-status]');
    function setStatus(msg,cls){ if(status){ status.innerHTML=msg; status.className='ss-form-status'+(cls?' '+cls:''); } }
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var ok=true, first=null;
      form.querySelectorAll('[required]').forEach(function(f){
        if(!f.value.trim()){ f.setAttribute('aria-invalid','true'); ok=false; if(!first) first=f; }
        else { f.removeAttribute('aria-invalid'); }
      });
      if(!ok){ setStatus('Please complete the required fields.','err'); if(first) first.focus(); return; }
      if(!cfg.FORM_ENDPOINT){
        setStatus('Online form delivery isn’t active yet. Please '+contactLine,'warn');
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      var payload = {};
      new FormData(form).forEach(function(v,k){ payload[k]=v; });
      payload._page = location.pathname;
      setStatus('Sending…','');
      if(btn) btn.disabled=true;
      fetch(cfg.FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r; })
        .then(function(){
          form.reset();
          var successId = form.getAttribute('data-ss-success');
          var wrap = form.closest('[data-ss-formwrap]');
          var successEl = successId ? document.getElementById(successId) : null;
          if(successEl && wrap){ wrap.style.display='none'; successEl.style.display='block'; }
          else { setStatus('Thanks — your message was sent. We’ll reply within one business day.','ok'); }
        })
        .catch(function(){ setStatus('Something went wrong sending your message. Please '+contactLine,'err'); })
        .finally(function(){ if(btn) btn.disabled=false; });
    });
  });
}
// ── GA4 (loads only when a Measurement ID is configured) ──
(function(){
  var id=(window.SS_CONFIG||{}).GA4_ID;
  if(!id) return;
  var s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+id; document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[]; function gtag(){dataLayer.push(arguments);} window.gtag=gtag;
  gtag('js', new Date()); gtag('config', id);
})();
if(document.readyState!=='loading'){ ssInitForms(); } else { document.addEventListener('DOMContentLoaded', ssInitForms); }
