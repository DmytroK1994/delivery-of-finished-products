const DB_NAME='production-pwa-db';
const DB_VERSION=1;
const STORES=['products','documents','current','settings'];
let db;
export function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{db=req.result;STORES.forEach(s=>{if(!db.objectStoreNames.contains(s))db.createObjectStore(s,{keyPath:'id'});});};req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error);});}
function tx(store,mode='readonly'){return db.transaction(store,mode).objectStore(store)}
export function getAll(store){return new Promise((res,rej)=>{const r=tx(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
export function getOne(store,id){return new Promise((res,rej)=>{const r=tx(store).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
export function putOne(store,obj){return new Promise((res,rej)=>{const r=tx(store,'readwrite').put(obj);r.onsuccess=()=>res(obj);r.onerror=()=>rej(r.error)})}
export function deleteOne(store,id){return new Promise((res,rej)=>{const r=tx(store,'readwrite').delete(id);r.onsuccess=()=>res(true);r.onerror=()=>rej(r.error)})}
export function clearStore(store){return new Promise((res,rej)=>{const r=tx(store,'readwrite').clear();r.onsuccess=()=>res(true);r.onerror=()=>rej(r.error)})}
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,9);
