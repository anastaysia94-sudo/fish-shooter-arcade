// Cloud-account completion + cinematic gameplay cache. The playable shell remains usable without account/network availability.
const CACHE='fsa-arcade-v23-egm-telemetry-20260916';
const CORE=[
  './','./index.html','./activate.html','./activate.js','./fsa-v8.css','./gameplay-layout-v9.css','./visual-fidelity-v10.css','./cloud-sync-v11.css','./lobby-fidelity-v13.css','./arcade-intensity-v12.css','./boss-spectacle-v13.css','./dense-mode-v14.css','./dense-mode-v14-overlay.css','./fsa-v9.js','./arcade-intensity-v12.js','./boss-spectacle-v13.js','./dense-mode-v14.js','./telemetry-v1.js','./cloud-sync-v11.js','./arcade-intensity-v12-bridge.js','./manifest.webmanifest',
  './assets/fsa-mark.svg','./assets/fsa-boss-event.svg','./assets/fsa-gameplay.svg','./assets/fsa-lobby.svg','./assets/fsa-title-atlas-v10.svg','./assets/fsa-slot-atlas-v10.svg',
  './admin/','./admin/index.html','./admin/styles.css','./admin/app.js','./admin/security-completion.js','./admin/cloud-player-admin.js'
];
const FRESH_RUNTIME=/\/(?:fsa-v8\.css|gameplay-layout-v9\.css|visual-fidelity-v10\.css|cloud-sync-v11\.css|lobby-fidelity-v13\.css|arcade-intensity-v12\.css|boss-spectacle-v13\.css|dense-mode-v14\.css|dense-mode-v14-overlay\.css|fsa-v9\.js|arcade-intensity-v12\.js|boss-spectacle-v13\.js|dense-mode-v14\.js|telemetry-v1\.js|cloud-sync-v11\.js|arcade-intensity-v12-bridge\.js)$/;
const cacheResponse=(request,response)=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
);});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    const isAdmin=/\/admin(?:\/|$)/.test(url.pathname);
    const isActivation=/\/activate\.html$/.test(url.pathname);
    const fallback=isAdmin?'./admin/index.html':'./index.html';
    if(isActivation){
      event.respondWith(fetch(event.request).then(response=>cacheResponse('./activate.html',response)).catch(()=>caches.match('./activate.html')));
      return;
    }
    event.respondWith(fetch(event.request).then(response=>cacheResponse(fallback,response)).catch(()=>caches.match(fallback)));
    return;
  }
  // Gameplay/UI runtime files are network-first so deployed visual/gameplay upgrades replace older installed-PWA assets on the next normal load.
  if(FRESH_RUNTIME.test(url.pathname)){
    event.respondWith(fetch(event.request).then(response=>cacheResponse(event.request,response)).catch(()=>caches.match(event.request)));
    return;
  }
  // Security-sensitive Founder Console assets always prefer the network.
  const founderCore=/\/admin\/(?:app\.js|styles\.css|index\.html)$/.test(url.pathname);
  const founderSecurity=/\/admin\/(?:security-completion\.js|cloud-player-admin\.js)$/.test(url.pathname);
  const accountActivation=/\/activate\.js$/.test(url.pathname);
  if(founderCore||founderSecurity||accountActivation){
    event.respondWith(fetch(event.request).then(response=>cacheResponse(event.request,response)).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>cacheResponse(event.request,response))));
});