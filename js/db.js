(function(){
  const DB_NAME='production-pwa-db';
  const DB_VERSION=2;
  const STORES=['products','documents','current','settings'];
  let db=null;
  function open(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;STORES.forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:'id'});});};req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error);});}
  function store(name,mode='readonly'){if(!db)throw new Error('DB not opened');return db.transaction(name,mode).objectStore(name)}
  function all(name){return new Promise((res,rej)=>{const r=store(name).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});}
  function get(name,id){return new Promise((res,rej)=>{const r=store(name).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);});}
  function put(name,obj){return new Promise((res,rej)=>{const r=store(name,'readwrite').put(obj);r.onsuccess=()=>res(obj);r.onerror=()=>rej(r.error);});}
  function del(name,id){return new Promise((res,rej)=>{const r=store(name,'readwrite').delete(id);r.onsuccess=()=>res(true);r.onerror=()=>rej(r.error);});}
  function clear(name){return new Promise((res,rej)=>{const r=store(name,'readwrite').clear();r.onsuccess=()=>res(true);r.onerror=()=>rej(r.error);});}
  async function replaceStore(name,items){await clear(name); for(const item of items||[]) await put(name,item);}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,9)}
  function clone(v){return JSON.parse(JSON.stringify(v||null));}
  window.AppDB={open,all,get,put,del,clear,replaceStore,uid,clone,stores:STORES};
})();
