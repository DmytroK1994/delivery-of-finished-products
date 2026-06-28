import{getAll,putOne,deleteOne,uid}from'./db.js';
export let products=[];
export async function loadProducts(){products=(await getAll('products')).sort((a,b)=>a.name.localeCompare(b.name,'uk'));return products}
export const isConfigured=p=>!!p&&Number(p.boxesPerPallet)>0&&Number(p.unitsPerBox)>0&&['пачки','кг','шт'].includes(p.unit);
export async function addManyProducts(text){const names=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);let added=0,skipped=0;const existing=new Set(products.map(p=>p.name.trim().toLowerCase()));for(const name of names){const key=name.toLowerCase();if(existing.has(key)){skipped++;continue}const p={id:uid(),name,boxesPerPallet:0,unitsPerBox:0,unit:'пачки',createdAt:new Date().toISOString()};await putOne('products',p);products.push(p);existing.add(key);added++}await loadProducts();return{added,skipped}}
export async function saveProduct(p){const clean={...p,name:p.name.trim(),boxesPerPallet:Number(p.boxesPerPallet)||0,unitsPerBox:Number(p.unitsPerBox)||0,unit:p.unit||'пачки',updatedAt:new Date().toISOString()};await putOne('products',clean);await loadProducts();return clean}
export async function removeProduct(id){await deleteOne('products',id);await loadProducts()}
export function findProduct(id){return products.find(p=>p.id===id)}
export function searchProducts(q=''){const s=q.trim().toLowerCase();return products.filter(p=>!s||p.name.toLowerCase().includes(s)).slice(0,80)}
