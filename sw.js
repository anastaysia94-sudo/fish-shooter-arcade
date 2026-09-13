// Cloud-account completion cache. The playable shell remains usable without account/network availability.
const CACHE='fsa-arcade-v14-cloud-accounts-20260913';
const CORE=[
  './','./index.html','./activate.html','./activate.js','./fsa-v8.css','./gameplay-layout-v9.css','./visual-fidelity-v10.css','./cloud-sync-v11.css','./fsa-v9.js','./cloud-sync-v11.js','./manifest.webmanifest',
  './assets/fsa-mark.svg','./assets/fsa-boss-event.svg','./assets/fsa-gameplay.svg','./assets/fsa-lobby.svg','./assets/fsa-title-atlas-v10.svg','./assets/fsa-slot-atlas-v10.svg',
  './admin/','./admin/index.html','./admin/styles.css','./admin/app.js','./admin/security-completion.js','./admin/cloud-player-admin.js'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    const isAdmin=/\/admin(?:\/|$)/.test(url.pathname);
    const isActivation=/\/activate\.html$/.test(url.pathname);
    const fallback=isAdmin?'./admin/index.html':'./index.html';
    if(isActivation){
      event.respondWith(fetch(event.request).then(response=>{
        if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./activate.html',copy));}
        return response;
      }).catch(()=>caches.match('./activate.html')));
      return;
    }
    event.respondWith(fetch(event.request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(fallback,copy));}
      return response;
    }).catch(()=>caches.match(fallback)));
    return;
  }
  // Security-sensitive Founder Console assets always prefer the network.
  const founderCore=/\/admin\/(?:app\.js|styles\.css|index\.html)$/.test(url.pathname);
  const founderSecurity=/\/admin\/(?:security-completion\.js|cloud-player-admin\.js)$/.test(url.pathname);
  const accountActivation=/\/activate\.js$/.test(url.pathname);
  if(founderCore||founderSecurity||accountActivation){
    event.respondWith(fetch(event.request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});