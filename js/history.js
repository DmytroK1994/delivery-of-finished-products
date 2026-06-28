import{getAll,putOne,deleteOne,uid}from'./db.js';
import{totals}from'./document.js';
export let history=[];
export async function loadHistory(){history=(await getAll('documents')).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));return history}
export async function saveDocument(items,showCalc){const now=new Date();const doc={id:uid(),createdAt:now.toISOString(),date:now.toLocaleDateString('uk-UA'),time:now.toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'}),items:structuredClone(items),totals:totals(items),showCalc};await putOne('documents',doc);await loadHistory();return doc}
export async function deleteDocument(id){await deleteOne('documents',id);await loadHistory()}
