const CACHE='fsa-arcade-v9-closure-20260908';
const CORE=[
  './',
  './index.html',
  './fsa-v8.css',
  './gameplay-layout-v9.css',
  './fsa-v9.js',
  './manifest.webmanifest',
  './assets/fsa-mark.svg',
  './assets/fsa-boss-event.svg',
  './assets/fsa-gameplay.svg',
  './assets/fsa-lobby.svg',
  './admin/',
  './admin/index.html',
  './admin/styles.css',
  './admin/app.js'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    const isAdmin=/\/admin(?:\/|$)/.test(url.pathname);
    const fallback=isAdmin?'./admin/index.html':'./index.html';
    event.respondWith(
      fetch(event.request).then(response=>{
        if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(fallback,copy));}
        return response;
      }).catch(()=>caches.match(fallback))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});