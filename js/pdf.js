(function(){
  function escapeHtml(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
  function fmt(n){const x=Number(n)||0; return Number.isInteger(x)?String(x):String(Math.round(x*100)/100).replace('.',',');}
  function totals(items){const out={pallets:0,boxes:0,units:{}}; (items||[]).forEach(i=>{out.pallets+=Number(i.pallets)||0;out.boxes+=Number(i.boxes)||0;out.units[i.unit]=(out.units[i.unit]||0)+(Number(i.total)||0);}); return out;}
  function buildDocumentHTML(doc, showCalc){
    const items=doc.items||[]; const t=totals(items); const date=doc.date||new Date().toLocaleDateString('uk-UA'); const time=doc.time||new Date().toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});
    const colCount=showCalc?6:5;
    const rows=items.map((i,idx)=>`<tr><td>${idx+1}</td><td>${escapeHtml(i.name)}</td><td>${fmt(i.pallets)}</td><td>${fmt(i.boxes)}</td>${showCalc?`<td>${escapeHtml(i.calc)}</td>`:''}<td>${fmt(i.total)} ${escapeHtml(i.unit)}</td></tr>`).join('');
    const empty = rows || `<tr><td colspan="${colCount}">Позицій немає</td></tr>`;
    const unitTotals=Object.keys(t.units).map(u=>`<div>${escapeHtml(u)}: <b>${fmt(t.units[u])}</b></div>`).join('');
    return `<div class="doc" id="docRender"><h2>Облік готової продукції</h2><div class="doc-meta"><span>Дата: ${escapeHtml(date)}</span><span>Час: ${escapeHtml(time)}</span></div><table><thead><tr><th>№</th><th>Продукція</th><th>Підд.</th><th>Ящ.</th>${showCalc?'<th>Розрахунок</th>':''}<th>Разом</th></tr></thead><tbody>${empty}</tbody></table><div class="totals"><div>Усього піддонів: <b>${fmt(t.pallets)}</b></div><div>Усього ящиків: <b>${fmt(t.boxes)}</b></div>${unitTotals}</div></div>`;
  }
  function createCanvasFromDoc(doc, showCalc){
    const wrapper=document.createElement('div'); wrapper.style.position='fixed'; wrapper.style.left='-99999px'; wrapper.style.top='0'; wrapper.style.width='1123px'; wrapper.style.background='white'; wrapper.innerHTML=buildDocumentHTML(doc,showCalc); document.body.appendChild(wrapper);
    const node=wrapper.querySelector('.doc');
    node.style.width='1123px'; node.style.minWidth='1123px'; node.style.padding='42px'; node.style.fontFamily='Arial, sans-serif'; node.style.color='#111'; node.style.background='white'; node.style.fontSize='18px';
    node.querySelector('h2').style.fontSize='28px'; node.querySelector('h2').style.textAlign='center';
    node.querySelectorAll('th,td').forEach(td=>{td.style.border='1px solid #111';td.style.padding='6px';td.style.fontSize='15px';td.style.lineHeight='1.15';});
    node.querySelector('table').style.borderCollapse='collapse'; node.querySelector('table').style.width='100%';
    const rect=node.getBoundingClientRect(); const scale=2; const canvas=document.createElement('canvas'); canvas.width=Math.ceil(rect.width*scale); canvas.height=Math.ceil(rect.height*scale); const ctx=canvas.getContext('2d'); ctx.scale(scale,scale); ctx.fillStyle='white'; ctx.fillRect(0,0,rect.width,rect.height);
    const data='<svg xmlns="http://www.w3.org/2000/svg" width="'+rect.width+'" height="'+rect.height+'"><foreignObject width="100%" height="100%">'+new XMLSerializer().serializeToString(node)+'</foreignObject></svg>';
    return new Promise((resolve,reject)=>{const img=new Image(); const blob=new Blob([data],{type:'image/svg+xml;charset=utf-8'}); const url=URL.createObjectURL(blob); img.onload=()=>{ctx.drawImage(img,0,0); URL.revokeObjectURL(url); document.body.removeChild(wrapper); resolve(canvas);}; img.onerror=e=>{URL.revokeObjectURL(url); document.body.removeChild(wrapper); reject(e);}; img.src=url;});
  }
  async function savePdf(doc, showCalc){
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); const canvas=await createCanvasFromDoc(doc,showCalc); const img=canvas.toDataURL('image/jpeg',0.95); const pageW=297,pageH=210,margin=8; const w=pageW-margin*2; const h=canvas.height*w/canvas.width; let y=margin; if(h<=pageH-margin*2){pdf.addImage(img,'JPEG',margin,y,w,h);}else{let remaining=canvas.height; let sy=0; const pageCanvas=document.createElement('canvas'); const ctx=pageCanvas.getContext('2d'); const sliceH=Math.floor(canvas.width*((pageH-margin*2)/w)); pageCanvas.width=canvas.width; pageCanvas.height=sliceH; while(remaining>0){ctx.clearRect(0,0,pageCanvas.width,pageCanvas.height); ctx.fillStyle='white'; ctx.fillRect(0,0,pageCanvas.width,pageCanvas.height); ctx.drawImage(canvas,0,sy,canvas.width,Math.min(sliceH,remaining),0,0,canvas.width,Math.min(sliceH,remaining)); const part=pageCanvas.toDataURL('image/jpeg',0.95); pdf.addImage(part,'JPEG',margin,margin,w,pageH-margin*2); remaining-=sliceH; sy+=sliceH; if(remaining>0)pdf.addPage('a4','landscape');}}
    const safe=(doc.date||'document').replaceAll('.','-')+'_'+(doc.time||'').replace(':','-'); pdf.save(`oblik-gotovoi-produktsii_${safe}.pdf`);
  }
  window.PDFGen={buildDocumentHTML,savePdf,totals,fmt};
})();
