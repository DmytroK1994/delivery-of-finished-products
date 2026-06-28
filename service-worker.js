<<<<<<< HEAD
const CACHE_NAME='production-pwa-v9';
const ASSETS=['./','./index.html','./manifest.json','./css/style.css','./js/db.js','./js/pdf.js','./js/app.js','./libs/jspdf.umd.min.js','./fonts/NotoSans-Regular.ttf','./fonts/NotoSans-Bold.ttf','./icons/icon-192.png','./icons/icon-512.png'];
=======
const CACHE_NAME='production-pwa-v3';
const ASSETS=['./','./index.html','./manifest.json','./css/style.css','./js/db.js','./js/pdf.js','./js/app.js','./libs/jspdf.umd.min.js','./icons/icon-192.png','./icons/icon-512.png'];
>>>>>>> 7f82b804c58402fdcf34e858fee683ec12050ee9
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(resp=>{const copy=resp.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return resp;}).catch(()=>caches.match('./index.html'))));});
