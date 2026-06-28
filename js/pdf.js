(function(){
<<<<<<< HEAD
  const FONT_REGULAR='fonts/NotoSans-Regular.ttf';
  const FONT_BOLD='fonts/NotoSans-Bold.ttf';
  let fontDataPromise=null;

  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function fmt(n){const x=Number(n)||0;return Number.isInteger(x)?String(x):String(Math.round(x*100)/100).replace('.',',');}
  function itemName(item){return item.name||item.productName||'';}
  function itemCalc(item){return item.calc||`${fmt(item.pallets)}×${fmt(item.boxesPerPallet)}×${fmt(item.unitsPerBox)}`;}
  function totals(items){const out={pallets:0,boxes:0,units:{}};(items||[]).forEach(i=>{out.pallets+=Number(i.pallets)||0;out.boxes+=Number(i.boxes)||0;const unit=i.unit||'шт';out.units[unit]=(out.units[unit]||0)+(Number(i.total)||0);});return out;}

  function buildDocumentHTML(doc,showCalc){
    const items=doc.items||[];
    const t=totals(items);
    const date=doc.date||new Date().toLocaleDateString('uk-UA');
    const time=doc.time||new Date().toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});
    const colCount=showCalc?6:5;
    const rows=items.map((i,idx)=>`<tr><td>${idx+1}</td><td>${escapeHtml(itemName(i))}</td><td class="num">${fmt(i.pallets)}</td><td class="num">${fmt(i.boxes)}</td>${showCalc?`<td>${escapeHtml(itemCalc(i))}</td>`:''}<td class="num">${fmt(i.total)} ${escapeHtml(i.unit||'')}</td></tr>`).join('');
    const empty=rows||`<tr><td colspan="${colCount}">Позицій немає</td></tr>`;
    return `<div class="doc" id="docRender"><h2>Облік готової продукції</h2><div class="doc-meta"><span>Дата: ${escapeHtml(date)}</span><span>Час: ${escapeHtml(time)}</span></div><table><thead><tr><th>№</th><th>Продукція</th><th>Піддони</th><th>Ящики</th>${showCalc?'<th>Розрахунок</th>':''}<th>Разом</th></tr></thead><tbody>${empty}</tbody></table><div class="totals">Усього піддонів: <b>${fmt(t.pallets)}</b></div></div>`;
  }

  function toBase64(buffer){
    const bytes=new Uint8Array(buffer);
    let binary='';
    for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length)));
    return btoa(binary);
  }

  async function loadFontData(){
    if(!fontDataPromise){
      fontDataPromise=Promise.all([FONT_REGULAR,FONT_BOLD].map(async path=>{
        const response=await fetch(path);
        if(!response.ok)throw new Error(`Не вдалося завантажити шрифт: ${path}`);
        return toBase64(await response.arrayBuffer());
      })).catch(error=>{fontDataPromise=null;throw error;});
    }
    return fontDataPromise;
  }

  async function addUkrainianFonts(pdf){
    const [regular,bold]=await loadFontData();
    pdf.addFileToVFS('NotoSans-Regular.ttf',regular);
    pdf.addFont('NotoSans-Regular.ttf','NotoSans','normal');
    pdf.addFileToVFS('NotoSans-Bold.ttf',bold);
    pdf.addFont('NotoSans-Bold.ttf','NotoSans','bold');
    pdf.setFont('NotoSans','normal');
  }

  function pdfFilename(doc){
    const date=String(doc.date||'document').replace(/[./\\]/g,'-').replace(/\s+/g,'_');
    const time=String(doc.time||'').replace(/:/g,'-').replace(/\s+/g,'_');
    return `oblik-gotovoi-produktsii_${date}${time?'_'+time:''}.pdf`;
  }

  async function createPdf(doc,showCalc){
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
    await addUkrainianFonts(pdf);
    pdf.setProperties({title:'Облік готової продукції',subject:`Документ від ${doc.date||''} ${doc.time||''}`,author:'Облік готової продукції',creator:'Облік готової продукції'});

    const pageW=297,pageH=210,margin=12,contentW=pageW-margin*2,bottom=190;
    const items=doc.items||[];
    const columns=showCalc
      ? [{key:'index',title:'№',w:10,align:'center'},{key:'name',title:'Продукція',w:101},{key:'pallets',title:'Піддони',w:27,align:'right'},{key:'boxes',title:'Ящики',w:27,align:'right'},{key:'calc',title:'Розрахунок',w:53},{key:'total',title:'Разом',w:55,align:'right'}]
      : [{key:'index',title:'№',w:10,align:'center'},{key:'name',title:'Продукція',w:146},{key:'pallets',title:'Піддони',w:30,align:'right'},{key:'boxes',title:'Ящики',w:30,align:'right'},{key:'total',title:'Разом',w:57,align:'right'}];
    let y=0;

    function drawPageHeading(continued=false){
      pdf.setTextColor(20,20,20);
      pdf.setFont('NotoSans','bold');
      pdf.setFontSize(15);
      pdf.text(`Облік готової продукції${continued?' (продовження)':''}`,pageW/2,15,{align:'center'});
      pdf.setFont('NotoSans','normal');
      pdf.setFontSize(9);
      pdf.text(`Дата: ${doc.date||''}`,margin,24);
      pdf.text(`Час: ${doc.time||''}`,pageW-margin,24,{align:'right'});
      y=29;
      drawHeader();
    }

    function drawHeader(){
      let x=margin;
      pdf.setFont('NotoSans','bold');
      pdf.setFontSize(8.5);
      for(const col of columns){
        pdf.setFillColor(238,242,246);
        pdf.setDrawColor(35,35,35);
        pdf.rect(x,y,col.w,9,'FD');
        const tx=col.align==='right'?x+col.w-2:col.align==='center'?x+col.w/2:x+2;
        pdf.text(col.title,tx,y+5.8,{align:col.align||'left'});
        x+=col.w;
      }
      pdf.setFont('NotoSans','normal');
      y+=9;
    }

    function addPage(){
      pdf.addPage('a4','landscape');
      drawPageHeading(true);
    }

    function rowValues(item,index){
      return {index:String(index+1),name:itemName(item),pallets:fmt(item.pallets),boxes:fmt(item.boxes),calc:itemCalc(item),total:`${fmt(item.total)} ${item.unit||''}`};
    }

    function drawRow(values,reserveAfter=0){
      pdf.setFontSize(8.5);
      const lineHeight=4;
      const cellLines=columns.map(col=>pdf.splitTextToSize(String(values[col.key]??''),Math.max(2,col.w-4)));
      const rowH=Math.max(9,...cellLines.map(lines=>lines.length*lineHeight+4));
      if(y+rowH+reserveAfter>bottom)addPage();
      let x=margin;
      columns.forEach((col,columnIndex)=>{
        pdf.setDrawColor(35,35,35);
        pdf.rect(x,y,col.w,rowH);
        const lines=cellLines[columnIndex];
        const tx=col.align==='right'?x+col.w-2:col.align==='center'?x+col.w/2:x+2;
        const firstY=y+(rowH-lines.length*lineHeight)/2+3.1;
        lines.forEach((line,lineIndex)=>pdf.text(line,tx,firstY+lineIndex*lineHeight,{align:col.align||'left'}));
        x+=col.w;
      });
      y+=rowH;
    }

    drawPageHeading(false);
    if(items.length)items.forEach((item,index)=>drawRow(rowValues(item,index),index===items.length-1?14:0));
    else drawRow({index:'',name:'Позицій немає',pallets:'',boxes:'',calc:'',total:''},14);

    if(y+14>bottom)addPage();
    pdf.setFont('NotoSans','bold');
    pdf.setFontSize(10);
    pdf.text(`Усього піддонів: ${fmt(totals(items).pallets)}`,margin,y+9);

    const pages=pdf.getNumberOfPages();
    for(let page=1;page<=pages;page++){
      pdf.setPage(page);
      pdf.setFont('NotoSans','normal');
      pdf.setFontSize(8);
      pdf.setTextColor(90,90,90);
      pdf.text(`Сторінка ${page} з ${pages}`,pageW-margin,pageH-6,{align:'right'});
    }
    return {blob:pdf.output('blob'),filename:pdfFilename(doc),pdf};
  }

  function canSharePdfFiles(){
    if(!navigator.share||!navigator.canShare||typeof File==='undefined')return false;
    try{return navigator.canShare({files:[new File([''], 'document.pdf',{type:'application/pdf'})]});}catch(_){return false;}
  }

  function prepareDelivery(){
    if(canSharePdfFiles())return {popup:null};
    const popup=window.open('about:blank','_blank');
    if(popup){
      popup.document.title='Створення PDF';
      popup.document.body.innerHTML='<p style="font:16px system-ui;padding:24px">Створюємо PDF…</p>';
    }
    return {popup};
  }

  async function deliverPdf(blob,filename,prepared={}){
    const file=typeof File!=='undefined'?new File([blob],filename,{type:'application/pdf'}):null;
    if(file&&canSharePdfFiles()){
      if(prepared.popup&&!prepared.popup.closed)prepared.popup.close();
      try{await navigator.share({files:[file],title:'Облік готової продукції'});return {shared:true};}
      catch(error){if(error&&error.name==='AbortError')return {cancelled:true};}
    }
    const url=URL.createObjectURL(blob);
    if(prepared.popup&&!prepared.popup.closed)prepared.popup.location.replace(url);
    else{
      const link=document.createElement('a');
      link.href=url;
      link.target='_blank';
      link.rel='noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    return {opened:true};
  }

  async function savePdf(doc,showCalc){
    const prepared=prepareDelivery();
    try{const result=await createPdf(doc,showCalc);await deliverPdf(result.blob,result.filename,prepared);return result;}
    catch(error){if(prepared.popup&&!prepared.popup.closed)prepared.popup.close();throw error;}
  }

  window.PDFGen={buildDocumentHTML,createPdf,deliverPdf,prepareDelivery,savePdf,pdfFilename,totals,fmt};
=======
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
>>>>>>> 7f82b804c58402fdcf34e858fee683ec12050ee9
})();
