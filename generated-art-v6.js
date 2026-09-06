(()=>{'use strict';
if(document.querySelector('script[data-fsa-v6-engine]')) return;
const s=document.createElement('script');
s.src='advanced-engine-v6.js?v=20260906b';
s.async=false;
s.dataset.fsaV6Engine='1';
document.body.appendChild(s);
})();
