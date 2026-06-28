import{getOne,putOne,uid}from'./db.js';
export let currentDoc={id:'current',items:[],updatedAt:new Date().toISOString()};
export const n=v=>{const x=parseFloat(String(v).replace(',','.'));return Number.isFinite(x)?x:0};
export const fmt=v=>Number.isInteger(+v)?String(+v):(+v).toFixed(2).replace(/\.00$/,'').replace(/0$/,'');
export function calcLine(pallets,boxesPerPallet,unitsPerBox,unit){const p=n(pallets),b=n(boxesPerPallet),u=n(unitsPerBox);const boxes=p*b,total=boxes*u;return{pallets:p,boxesPerPallet:b,unitsPerBox:u,boxes,total,unit,calc:`${fmt(p)}×${fmt(b)}×${fmt(u)}`}}
export async function loadCurrent(){currentDoc=(await getOne('current','current'))||currentDoc;return currentDoc}
export async function saveCurrent(){currentDoc.updatedAt=new Date().toISOString();await putOne('current',currentDoc)}
export async function clearCurrent(){currentDoc={id:'current',items:[],updatedAt:new Date().toISOString()};await saveCurrent()}
export async function addToCurrent(product,line){const idx=currentDoc.items.findIndex(i=>i.productName.trim().toLowerCase()===product.name.trim().toLowerCase());if(idx>=0){const it=currentDoc.items[idx];it.pallets+=line.pallets;it.boxes+=line.boxes;it.total+=line.total;it.calc=`${fmt(it.pallets)}×${fmt(it.boxesPerPallet)}×${fmt(it.unitsPerBox)}`;it.updatedAt=new Date().toISOString()}else{currentDoc.items.push({id:uid(),productId:product.id,productName:product.name,pallets:line.pallets,boxesPerPallet:line.boxesPerPallet,unitsPerBox:line.unitsPerBox,boxes:line.boxes,total:line.total,unit:line.unit,calc:line.calc,createdAt:new Date().toISOString()})}await saveCurrent()}
export async function updateCurrentItem(id,patch){const it=currentDoc.items.find(i=>i.id===id);if(!it)return;Object.assign(it,patch);it.boxes=n(it.pallets)*n(it.boxesPerPallet);it.total=it.boxes*n(it.unitsPerBox);it.calc=`${fmt(it.pallets)}×${fmt(it.boxesPerPallet)}×${fmt(it.unitsPerBox)}`;await saveCurrent()}
export async function removeCurrentItem(id){currentDoc.items=currentDoc.items.filter(i=>i.id!==id);await saveCurrent()}
export function totals(items=currentDoc.items){const byUnit={};let pallets=0,boxes=0;items.forEach(i=>{pallets+=n(i.pallets);boxes+=n(i.boxes);byUnit[i.unit]=(byUnit[i.unit]||0)+n(i.total)});return{pallets,boxes,byUnit}}
