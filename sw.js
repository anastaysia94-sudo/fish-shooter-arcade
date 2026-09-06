const CACHE='fsa-arcade-v7-hd-generated-art-20260906a';
const CORE=[
  './',
  './index.html',
  './styles.css',
  './premium-ui-v4.css',
  './complex-shell-v5.css',
  './generated-art-v6.css',
  './hd-art-v7.css',
  './app.js',
  './premium-engine-v4.js',
  './complex-shell-v5.js',
  './generated-art-v6.js',
  './advanced-engine-v6.js',
  './hd-art-v7.js',
  './manifest.webmanifest',
  './assets/fsa-mark.svg',
  './assets/fsa-boss-event.svg',
  './assets/fsa-gameplay.svg',
  './assets/fsa-lobby.svg'
];

/*
  Intentionally NOT precached:
  assets/fsa-fish-hd-atlas.webp
  assets/fsa-slots-hd-atlas.webp
  assets/reef-run-hd-battle.webp
  The v7 runtime requests these only when Data Saver / 2G is not active.
*/
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }))
  );
});
