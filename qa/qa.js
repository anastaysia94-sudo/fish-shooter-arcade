(()=>{
  'use strict';
  const acceptance=[
    ['01','Desktop main lobby','Premium v13 Atlantis hierarchy'],
    ['02','Android portrait lobby','Narrow premium layout'],
    ['03','Android landscape Reef Run','Battle HUD + controls'],
    ['04','Reef Run boss phase','Visible boss entity'],
    ['05','Dragon Depths boss','Distinct boss identity'],
    ['06','Crowded Coral Chaos','Density gate held'],
    ['07','Pulse / Spread / Rail','3 weapon states'],
    ['08','Bronze / Silver / Gold','Room selection'],
    ['09','Slot lobby','20 unique clipped cabinets'],
    ['10','Five-reel feature','Real engine jackpot'],
    ['11','Lite / 2G mode','Constrained mode usable'],
    ['12','Founder Console mobile','Secure sign-in readable']
  ];
  const matrix=document.querySelector('#acceptanceMatrix');
  if(matrix) matrix.innerHTML=acceptance.map(([n,title,detail])=>`<div class="matrix-item"><i>✓</i><span>#${n} ${title}<small>${detail}</small></span></div>`).join('');

  const field=document.querySelector('.bubble-field');
  if(field && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    for(let i=0;i<18;i++){
      const b=document.createElement('span');
      const s=3+Math.random()*18;
      b.style.width=b.style.height=`${s}px`;
      b.style.left=`${Math.random()*100}%`;
      b.style.opacity=(.12+Math.random()*.35).toFixed(2);
      b.style.animationDuration=`${12+Math.random()*22}s`;
      b.style.animationDelay=`-${Math.random()*25}s`;
      b.style.setProperty('--drift',`${-40+Math.random()*80}px`);
      field.appendChild(b);
    }
  }

  const links=[...document.querySelectorAll('.topbar nav a[href^="#"]')];
  const sections=links.map(a=>[a,document.querySelector(a.getAttribute('href'))]).filter(x=>x[1]);
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${visible.target.id}`));
    },{rootMargin:'-25% 0px -60%',threshold:[.05,.25,.5]});
    sections.forEach(([,s])=>io.observe(s));
  }
})();
