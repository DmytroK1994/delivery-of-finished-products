(async function(){
  const $=id=>document.getElementById(id);
<<<<<<< HEAD
  const els={
    menu:$('menu'),shade:$('shade'),title:$('title'),dateLine:$('dateLine'),productSearch:$('productSearch'),clearSearch:$('clearSearch'),dropdown:$('dropdown'),warning:$('warning'),
    pallets:$('pallets'),boxesPerPallet:$('boxesPerPallet'),unitsPerBox:$('unitsPerBox'),unit:$('unit'),liveResult:$('liveResult'),liveCalc:$('liveCalc'),addItem:$('addItem'),
    currentItems:$('currentItems'),itemCount:$('itemCount'),previewDoc:$('previewDoc'),finishDoc:$('finishDoc'),newDocument:$('newDocument'),clearDocument:$('clearDocument'),
    productsList:$('productsList'),toggleBulk:$('toggleBulk'),bulkBox:$('bulkBox'),bulkNames:$('bulkNames'),bulkAdd:$('bulkAdd'),catalogSearch:$('catalogSearch'),clearCatalogSearch:$('clearCatalogSearch'),
    previewPaper:$('previewPaper'),previewNotice:$('previewNotice'),showCalc:$('showCalc'),editDoc:$('editDoc'),createPdf:$('createPdf'),backToHistory:$('backToHistory'),historyList:$('historyList'),
    exportBackup:$('exportBackup'),importBackup:$('importBackup'),clearCurrent:$('clearCurrent')
  };

  let products=[];
  let current=null;
  let settings={id:'settings',showCalc:true};
  let selected=null;
  let editingItemId=null;
  let catalogQuery='';
  let previewDocument=null;
  let previewFromHistory=false;
  let previewShowCalc=true;

  const today=()=>new Date().toLocaleDateString('uk-UA');
  const now=()=>new Date().toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});
  const prettyDate=()=>new Date().toLocaleDateString('uk-UA',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})+' · '+now();
  const num=value=>Number(String(value??'').replace(',','.'))||0;
  const configured=product=>!!product&&num(product.boxesPerPallet)>0&&num(product.unitsPerBox)>0&&!!product.unit;
  const clone=value=>AppDB.clone(value);
  const newCurrent=()=>({id:'current',items:[],date:today(),time:now(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  const toast=message=>{const element=document.createElement('div');element.className='toast';element.textContent=message;document.body.appendChild(element);setTimeout(()=>element.remove(),2600);};
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));

  function normalizeItem(item={}){
    const pallets=num(item.pallets);
    const boxesPerPallet=num(item.boxesPerPallet);
    const unitsPerBox=num(item.unitsPerBox);
    const boxes=Object.prototype.hasOwnProperty.call(item,'boxes')?num(item.boxes):pallets*boxesPerPallet;
    const total=Object.prototype.hasOwnProperty.call(item,'total')?num(item.total):boxes*unitsPerBox;
    return {
      id:item.id||AppDB.uid(),productId:item.productId||'',name:item.name||item.productName||'Без назви',pallets,boxesPerPallet,unitsPerBox,boxes,total,
      unit:item.unit||'пачки',calc:item.calc||`${PDFGen.fmt(pallets)}×${PDFGen.fmt(boxesPerPallet)}×${PDFGen.fmt(unitsPerBox)}`
    };
  }

  function normalizeDocument(doc={},id=doc.id||'current'){
    const [day,month,year]=String(doc.date||'').split('.').map(Number);
    const [hour,minute]=String(doc.time||'').split(':').map(Number);
    const legacyTimestamp=day&&month&&year?new Date(year,month-1,day,hour||0,minute||0).toISOString():'';
    return {
      ...doc,id,date:doc.date||today(),time:doc.time||now(),createdAt:doc.createdAt||legacyTimestamp||new Date().toISOString(),updatedAt:doc.updatedAt||doc.createdAt||legacyTimestamp||new Date().toISOString(),
      items:Array.isArray(doc.items)?doc.items.map(normalizeItem):[]
    };
  }

  const saveCurrent=async()=>{current.updatedAt=new Date().toISOString();await AppDB.put('current',current);};
  const saveSettings=()=>AppDB.put('settings',settings);
  function setDateLine(){els.dateLine.textContent=prettyDate();}
  setInterval(setDateLine,30000);

  function setView(view){
    document.querySelectorAll('.view').forEach(element=>element.classList.remove('active'));
    const target=$(view);
    if(!target)return;
    target.classList.add('active');
    els.title.textContent=({home:'Облік продукції',products:'Довідник продукції',history:'Історія документів',settings:'Налаштування',about:'Про програму',preview:'Попередній перегляд документа'})[view]||'Облік продукції';
    closeMenu();
    if(view==='products')renderProducts();
    if(view==='history')renderHistory();
    if(view==='home')setTimeout(()=>els.productSearch.focus(),80);
  }

  function openMenu(){els.menu.classList.add('open');els.shade.classList.add('open');}
  function closeMenu(){els.menu.classList.remove('open');els.shade.classList.remove('open');}
  $('openMenu').onclick=openMenu;
  $('closeMenu').onclick=closeMenu;
  els.shade.onclick=closeMenu;
  document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>setView(button.dataset.view));

  try{
    await AppDB.open();
    products=(await AppDB.all('products')).filter(product=>product&&product.id&&product.name).sort((a,b)=>a.name.localeCompare(b.name,'uk'));
    current=normalizeDocument(await AppDB.get('current','current')||newCurrent(),'current');
    const storedSettings=await AppDB.get('settings','settings')||await AppDB.get('settings','app');
    settings={id:'settings',showCalc:storedSettings?.showCalc!==false};
    await Promise.all([saveCurrent(),saveSettings()]);
  }catch(error){
    console.error(error);
    toast('Не вдалося відкрити локальні дані');
    return;
  }

  setDateLine();
  renderCurrent();
  renderDropdown('');
  calcLive();

  function renderDropdown(query){
    if(!els.dropdown.classList.contains('open'))return;
    const normalized=query.trim().toLocaleLowerCase('uk');
    const list=products.filter(product=>product.name.toLocaleLowerCase('uk').includes(normalized)).slice(0,100);
    els.dropdown.innerHTML=list.length
      ?list.map(product=>`<div class="drop-item" data-id="${escapeHtml(product.id)}"><b>${escapeHtml(product.name)}</b><small>${configured(product)?'налаштовано':'не налаштовано'}</small></div>`).join('')
      :'<div class="drop-item"><small>Нічого не знайдено</small></div>';
    els.dropdown.querySelectorAll('[data-id]').forEach(element=>element.onclick=()=>selectProduct(element.dataset.id));
  }

  function selectProduct(id){
    selected=products.find(product=>product.id===id)||null;
    if(!selected)return;
    els.productSearch.value=selected.name;
    els.dropdown.classList.remove('open');
    els.boxesPerPallet.value=selected.boxesPerPallet||'';
    els.unitsPerBox.value=selected.unitsPerBox||'';
    els.unit.value=selected.unit||'пачки';
    showWarning();
    calcLive();
    setTimeout(()=>els.pallets.focus(),50);
  }

  function showWarning(){
    const draft=selected&&{...selected,boxesPerPallet:els.boxesPerPallet.value,unitsPerBox:els.unitsPerBox.value,unit:els.unit.value};
    if(selected&&!configured(draft)){
      els.warning.classList.remove('hidden');
      els.warning.innerHTML='Продукція не налаштована. Заповніть ящики, одиниці в ящику та одиницю обліку в довіднику. <button class="mini" id="goEditSelected">Редагувати</button>';
      $('goEditSelected').onclick=()=>openEditProduct(selected.id);
    }else els.warning.classList.add('hidden');
  }

  function calcLive(){
    const pallets=num(els.pallets.value),boxesPerPallet=num(els.boxesPerPallet.value),unitsPerBox=num(els.unitsPerBox.value),unit=els.unit.value||'пачки';
    const total=pallets*boxesPerPallet*unitsPerBox;
    els.liveResult.textContent=`${PDFGen.fmt(total)} ${unit}`;
    els.liveCalc.textContent=pallets&&boxesPerPallet&&unitsPerBox?`${PDFGen.fmt(pallets)}×${PDFGen.fmt(boxesPerPallet)}×${PDFGen.fmt(unitsPerBox)} = ${PDFGen.fmt(total)} ${unit}`:'Заповніть піддони та параметри';
    showWarning();
  }

  function resetEntryForm(){
    selected=null;
    editingItemId=null;
    els.productSearch.value='';
    els.pallets.value='';
    els.boxesPerPallet.value='';
    els.unitsPerBox.value='';
    els.unit.value='пачки';
    els.addItem.textContent='Додати';
    els.dropdown.classList.remove('open');
    els.warning.classList.add('hidden');
    calcLive();
  }

  els.productSearch.onfocus=()=>{els.dropdown.classList.add('open');renderDropdown(els.productSearch.value);};
  els.productSearch.oninput=()=>{
    selected=null;
    if(editingItemId){editingItemId=null;els.addItem.textContent='Додати';}
    els.boxesPerPallet.value='';els.unitsPerBox.value='';
    els.dropdown.classList.add('open');renderDropdown(els.productSearch.value);calcLive();
  };
  els.clearSearch.onclick=()=>{resetEntryForm();els.dropdown.classList.add('open');renderDropdown('');els.productSearch.focus();};
  [els.pallets,els.boxesPerPallet,els.unitsPerBox,els.unit].forEach(element=>element.addEventListener('input',calcLive));
  document.addEventListener('click',event=>{if(!event.target.closest('.form-card'))els.dropdown.classList.remove('open');});

  els.addItem.onclick=async()=>{
    if(!selected){toast('Спочатку виберіть продукцію');els.productSearch.focus();return;}
    const pallets=num(els.pallets.value),boxesPerPallet=num(els.boxesPerPallet.value),unitsPerBox=num(els.unitsPerBox.value),unit=els.unit.value;
    if(pallets<=0){toast('Введіть кількість піддонів');els.pallets.focus();return;}
    if(boxesPerPallet<=0||unitsPerBox<=0){toast('Налаштуйте параметри продукції');return;}
    const draft={id:editingItemId||AppDB.uid(),productId:selected.id,name:selected.name,pallets,boxesPerPallet,unitsPerBox,boxes:pallets*boxesPerPallet,total:pallets*boxesPerPallet*unitsPerBox,unit,calc:`${PDFGen.fmt(pallets)}×${PDFGen.fmt(boxesPerPallet)}×${PDFGen.fmt(unitsPerBox)}`};
    const wasEditing=!!editingItemId;
    if(editingItemId){
      const index=current.items.findIndex(item=>item.id===editingItemId);
      if(index>=0)current.items[index]=draft;
    }else{
      const existing=current.items.find(item=>item.productId===draft.productId&&item.boxesPerPallet===draft.boxesPerPallet&&item.unitsPerBox===draft.unitsPerBox&&item.unit===draft.unit);
      if(existing){
        existing.pallets+=draft.pallets;
        existing.boxes=existing.pallets*existing.boxesPerPallet;
        existing.total=existing.boxes*existing.unitsPerBox;
        existing.calc=`${PDFGen.fmt(existing.pallets)}×${PDFGen.fmt(existing.boxesPerPallet)}×${PDFGen.fmt(existing.unitsPerBox)}`;
      }else current.items.push(draft);
    }
    await saveCurrent();
    renderCurrent();
    resetEntryForm();
    els.productSearch.focus();
    toast(wasEditing?'Позицію оновлено':'Позицію додано');
  };

  function positionWord(count){const mod10=count%10,mod100=count%100;return mod10===1&&mod100!==11?'позиція':mod10>=2&&mod10<=4&&(mod100<12||mod100>14)?'позиції':'позицій';}
  function palletWord(count){const value=Math.abs(Number(count)||0);if(!Number.isInteger(value))return 'піддона';const mod10=value%10,mod100=value%100;return mod10===1&&mod100!==11?'піддон':mod10>=2&&mod10<=4&&(mod100<12||mod100>14)?'піддони':'піддонів';}
  function renderCurrent(){
    const items=current?.items||[];
    els.itemCount.textContent=`${items.length} ${positionWord(items.length)}`;
    if(!items.length){els.currentItems.className='list empty';els.currentItems.textContent='Позицій ще немає';return;}
    els.currentItems.className='list';
    els.currentItems.innerHTML=items.map(item=>itemHTML(item,true)).join('');
    els.currentItems.querySelectorAll('[data-del-item]').forEach(button=>button.onclick=async()=>{
      if(!confirm('Видалити цю позицію?'))return;
      current.items=current.items.filter(item=>item.id!==button.dataset.delItem);
      if(editingItemId===button.dataset.delItem)resetEntryForm();
      await saveCurrent();renderCurrent();
    });
    els.currentItems.querySelectorAll('[data-edit-item]').forEach(button=>button.onclick=()=>editDocumentItem(button.dataset.editItem));
  }

  function itemHTML(item,actions){
    return `<div class="item"><h3>${escapeHtml(item.name)}</h3><div class="item-grid"><div><span>Піддони</span><b>${PDFGen.fmt(item.pallets)}</b></div><div><span>Ящики</span><b>${PDFGen.fmt(item.boxes)}</b></div><div><span>Розрахунок</span><b>${escapeHtml(item.calc)}</b></div><div><span>Разом</span><b>${PDFGen.fmt(item.total)} ${escapeHtml(item.unit)}</b></div></div>${actions?`<div class="item-actions"><button class="mini" data-edit-item="${escapeHtml(item.id)}">Редагувати</button><button class="mini danger" data-del-item="${escapeHtml(item.id)}">Видалити</button></div>`:''}</div>`;
  }

  function editDocumentItem(id){
    const item=current.items.find(entry=>entry.id===id);
    if(!item)return;
    editingItemId=id;
    selected=products.find(product=>product.id===item.productId)||{id:item.productId,name:item.name,boxesPerPallet:item.boxesPerPallet,unitsPerBox:item.unitsPerBox,unit:item.unit};
    els.productSearch.value=item.name;
    els.boxesPerPallet.value=item.boxesPerPallet;
    els.unitsPerBox.value=item.unitsPerBox;
    els.unit.value=item.unit;
    els.pallets.value=item.pallets;
    els.addItem.textContent='Зберегти зміни';
    calcLive();
    window.scrollTo({top:0,behavior:'smooth'});
    els.pallets.focus();
  }

  function ensureDocumentNotEmpty(doc=current){
    if(!(doc?.items||[]).length){toast('Документ порожній');return false;}
    return true;
  }

  function openCurrentPreview(){
    if(!ensureDocumentNotEmpty())return;
    previewDocument=normalizeDocument(clone(current),current.id);
    previewFromHistory=false;
    previewShowCalc=!!settings.showCalc;
    renderPreview();
    setView('preview');
  }

  function renderPreview(){
    const doc=previewDocument||current;
    els.showCalc.checked=!!previewShowCalc;
    els.showCalc.disabled=previewFromHistory;
    els.backToHistory.classList.toggle('hidden',!previewFromHistory);
    els.previewNotice.textContent=previewFromHistory?'Документ збережено в історії.':'Документ ще не збережений.';
    els.previewNotice.classList.toggle('saved',previewFromHistory);
    els.previewPaper.innerHTML=PDFGen.buildDocumentHTML(doc,previewShowCalc);
  }

  els.previewDoc.onclick=openCurrentPreview;
  els.backToHistory.onclick=()=>setView('history');
  els.showCalc.onchange=async()=>{
    if(previewFromHistory){els.showCalc.checked=previewShowCalc;return;}
    previewShowCalc=els.showCalc.checked;
    settings.showCalc=previewShowCalc;
    await saveSettings();
    renderPreview();
  };
  els.editDoc.onclick=async()=>{
    if(previewFromHistory){
      if(current.items.length&&!confirm('Поточний документ буде замінено документом з історії. Продовжити?'))return;
      current=normalizeDocument({...clone(previewDocument),id:'current'},'current');
      await saveCurrent();
      renderCurrent();
      resetEntryForm();
    }
    setView('home');
  };

  function setBusy(button,busy,label){
    if(!button)return;
    if(busy){button.dataset.label=button.textContent;button.textContent=label||'Зачекайте…';button.disabled=true;}
    else{button.textContent=button.dataset.label||button.textContent;button.disabled=false;delete button.dataset.label;}
  }

  async function createAndDeliver(doc,{persist=false,prepared=null}={}){
    const snapshot=normalizeDocument(clone(doc),doc.id||'current');
    const showCalc=snapshot.showCalc!==undefined?!!snapshot.showCalc:previewShowCalc;
    const delivery=prepared||PDFGen.prepareDelivery();
    try{
      const generated=await PDFGen.createPdf(snapshot,showCalc);
      let saved=snapshot;
      if(persist){
        saved={...snapshot,id:AppDB.uid(),createdAt:new Date().toISOString(),showCalc,totals:PDFGen.totals(snapshot.items)};
        await AppDB.put('documents',saved);
        current=newCurrent();
        await saveCurrent();
        renderCurrent();
        resetEntryForm();
      }
      const result=await PDFGen.deliverPdf(generated.blob,generated.filename,delivery);
      return {saved,result};
    }catch(error){
      if(delivery.popup&&!delivery.popup.closed)delivery.popup.close();
      throw error;
    }
  }

  els.createPdf.onclick=async()=>{
    if(!ensureDocumentNotEmpty(previewDocument))return;
    const delivery=PDFGen.prepareDelivery();
    setBusy(els.createPdf,true,'Створення…');
    try{
      if(previewFromHistory){
        await createAndDeliver({...previewDocument,showCalc:previewShowCalc},{persist:false,prepared:delivery});
        toast('PDF відкрито');
      }else{
        const {saved,result}=await createAndDeliver({...previewDocument,showCalc:previewShowCalc},{persist:true,prepared:delivery});
        previewDocument=saved;previewFromHistory=true;previewShowCalc=saved.showCalc;renderPreview();
        toast(result.cancelled?'Документ збережено в історії':'PDF створено і документ збережено в історії');
      }
    }catch(error){console.error(error);toast(`Не вдалося створити PDF: ${error?.message||'невідома помилка'}. Дані документа збережено.`);}
    finally{setBusy(els.createPdf,false);}
  };

  els.finishDoc.onclick=async()=>{
    if(!ensureDocumentNotEmpty())return;
    const delivery=PDFGen.prepareDelivery();
    setBusy(els.finishDoc,true,'Створення PDF…');
    try{
      const snapshot={...clone(current),showCalc:!!settings.showCalc};
      const {result}=await createAndDeliver(snapshot,{persist:true,prepared:delivery});
      toast(result.cancelled?'Документ збережено в історії':'PDF створено і документ збережено в історії');
      setView('history');
    }catch(error){console.error(error);toast(`Не вдалося створити PDF: ${error?.message||'невідома помилка'}. Дані документа збережено.`);}
    finally{setBusy(els.finishDoc,false);}
  };

  async function resetCurrentDocument(message){
    current=newCurrent();
    await saveCurrent();
    renderCurrent();
    resetEntryForm();
    toast(message);
  }
  els.newDocument.onclick=async()=>{if(confirm('Створити новий документ? Поточний документ буде очищено.'))await resetCurrentDocument('Новий документ створено');};
  const clearCurrentDocument=async()=>{if(confirm('Очистити лише поточний документ?'))await resetCurrentDocument('Поточний документ очищено');};
  els.clearDocument.onclick=clearCurrentDocument;
  els.clearCurrent.onclick=clearCurrentDocument;

  els.toggleBulk.onclick=()=>els.bulkBox.classList.toggle('hidden');
  els.bulkAdd.onclick=async()=>{
    const names=els.bulkNames.value.split(/\r?\n/).map(name=>name.trim()).filter(Boolean);
    let added=0,skipped=0;
    for(const name of names){
      if(products.some(product=>product.name.toLocaleLowerCase('uk')===name.toLocaleLowerCase('uk'))){skipped++;continue;}
      const product={id:AppDB.uid(),name,boxesPerPallet:'',unitsPerBox:'',unit:'пачки',createdAt:new Date().toISOString()};
      products.push(product);await AppDB.put('products',product);added++;
    }
    products.sort((a,b)=>a.name.localeCompare(b.name,'uk'));
    els.bulkNames.value='';
    renderProducts();renderDropdown('');
    toast(`Додано: ${added}. Пропущено: ${skipped}`);
  };

  els.catalogSearch.oninput=()=>{catalogQuery=els.catalogSearch.value.trim().toLocaleLowerCase('uk');renderProducts();};
  els.clearCatalogSearch.onclick=()=>{catalogQuery='';els.catalogSearch.value='';renderProducts();els.catalogSearch.focus();};

  function renderProducts(){
    const list=products.filter(product=>!catalogQuery||product.name.toLocaleLowerCase('uk').includes(catalogQuery));
    if(!list.length){els.productsList.className='list empty';els.productsList.textContent=products.length?'Нічого не знайдено':'Довідник порожній';return;}
    els.productsList.className='list';
    els.productsList.innerHTML=list.map(product=>`<div class="item"><h3>${escapeHtml(product.name)}</h3><span class="badge ${configured(product)?'ok':'bad'}">${configured(product)?'налаштовано':'не налаштовано'}</span><div class="item-grid" style="margin-top:10px"><div><span>Ящ./підд.</span><b>${product.boxesPerPallet||'—'}</b></div><div><span>Од./ящ.</span><b>${product.unitsPerBox||'—'}</b></div><div><span>Одиниця</span><b>${escapeHtml(product.unit||'—')}</b></div></div><div class="item-actions"><button class="mini" data-edit-product="${escapeHtml(product.id)}">Редагувати</button><button class="mini danger" data-del-product="${escapeHtml(product.id)}">Видалити</button></div></div>`).join('');
    els.productsList.querySelectorAll('[data-edit-product]').forEach(button=>button.onclick=()=>openEditProduct(button.dataset.editProduct));
    els.productsList.querySelectorAll('[data-del-product]').forEach(button=>button.onclick=async()=>{
      if(!confirm('Видалити продукцію?'))return;
      products=products.filter(product=>product.id!==button.dataset.delProduct);
      await AppDB.del('products',button.dataset.delProduct);
      renderProducts();renderDropdown(els.productSearch.value);
    });
  }

  function openEditProduct(id){
    const product=products.find(entry=>entry.id===id);
    if(!product)return;
    const fragment=$('editProductTemplate').content.cloneNode(true);
    document.body.appendChild(fragment);
    const wrap=document.querySelector('.modal-wrap:last-of-type');
    const field=selector=>wrap.querySelector(selector);
    field('#editName').value=product.name;
    field('#editBoxes').value=product.boxesPerPallet||'';
    field('#editUnits').value=product.unitsPerBox||'';
    field('#editUnit').value=product.unit||'пачки';
    field('#cancelEdit').onclick=()=>wrap.remove();
    wrap.onclick=event=>{if(event.target===wrap)wrap.remove();};
    field('#saveEdit').onclick=async()=>{
      const name=field('#editName').value.trim();
      if(!name){toast('Введіть назву');field('#editName').focus();return;}
      if(products.some(entry=>entry.id!==product.id&&entry.name.toLocaleLowerCase('uk')===name.toLocaleLowerCase('uk'))){toast('Така назва вже є');return;}
      product.name=name;product.boxesPerPallet=num(field('#editBoxes').value)||'';product.unitsPerBox=num(field('#editUnits').value)||'';product.unit=field('#editUnit').value;product.updatedAt=new Date().toISOString();
      await AppDB.put('products',product);
      products.sort((a,b)=>a.name.localeCompare(b.name,'uk'));
      wrap.remove();renderProducts();renderDropdown(els.productSearch.value);
      if(selected&&selected.id===product.id)selectProduct(product.id);
      toast('Продукцію збережено');
    };
    field('#editName').focus();
  }

  async function renderHistory(){
    const docs=(await AppDB.all('documents')).map(doc=>normalizeDocument(doc,doc.id)).sort((a,b)=>String(b.createdAt||b.id).localeCompare(String(a.createdAt||a.id)));
    if(!docs.length){els.historyList.className='list empty';els.historyList.textContent='Історія порожня';return;}
    els.historyList.className='list';
    els.historyList.innerHTML=docs.map(doc=>{const pallets=PDFGen.totals(doc.items).pallets;return `<div class="item"><h3>Документ від ${escapeHtml(doc.date)} · ${escapeHtml(doc.time)}</h3><p class="muted">${doc.items.length} ${positionWord(doc.items.length)} · ${PDFGen.fmt(pallets)} ${palletWord(pallets)}</p><div class="item-actions"><button class="mini" data-view-doc="${escapeHtml(doc.id)}">Переглянути</button><button class="mini" data-pdf-doc="${escapeHtml(doc.id)}">PDF</button><button class="mini danger" data-del-doc="${escapeHtml(doc.id)}">Видалити</button></div></div>`;}).join('');
    els.historyList.querySelectorAll('[data-view-doc]').forEach(button=>button.onclick=async()=>{
      const doc=await AppDB.get('documents',button.dataset.viewDoc);
      if(!doc){toast('Документ не знайдено');return;}
      previewDocument=normalizeDocument(doc,doc.id);previewFromHistory=true;previewShowCalc=doc.showCalc!==undefined?!!doc.showCalc:!!settings.showCalc;
      renderPreview();setView('preview');
    });
    els.historyList.querySelectorAll('[data-pdf-doc]').forEach(button=>button.onclick=async()=>{
      const doc=await AppDB.get('documents',button.dataset.pdfDoc);
      if(!doc)return;
      const delivery=PDFGen.prepareDelivery();
      setBusy(button,true,'Створення…');
      try{await createAndDeliver({...normalizeDocument(doc,doc.id),showCalc:doc.showCalc!==undefined?!!doc.showCalc:!!settings.showCalc},{prepared:delivery});toast('PDF відкрито');}
      catch(error){console.error(error);toast(`Не вдалося створити PDF: ${error?.message||'невідома помилка'}`);}
      finally{setBusy(button,false);}
    });
    els.historyList.querySelectorAll('[data-del-doc]').forEach(button=>button.onclick=async()=>{
      if(confirm('Видалити документ з історії?')){await AppDB.del('documents',button.dataset.delDoc);await renderHistory();}
    });
  }

  els.exportBackup.onclick=async()=>{
    try{
      const backup={format:'production-pwa-backup',version:2,createdAt:new Date().toISOString(),products:await AppDB.all('products'),documents:await AppDB.all('documents'),current:await AppDB.all('current'),settings:await AppDB.all('settings')};
      const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`rezervna-kopiia_${today().replaceAll('.','-')}_${now().replace(':','-')}.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast('Резервну копію експортовано');
    }catch(error){console.error(error);toast('Не вдалося створити резервну копію');}
  };

  els.importBackup.onchange=async()=>{
    const file=els.importBackup.files[0];
    if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      if(!data||!Array.isArray(data.products)||!Array.isArray(data.documents)||!Array.isArray(data.current)||!Array.isArray(data.settings))throw new Error('Invalid backup');
      if(!confirm('Імпорт замінить довідник, поточний документ, історію та налаштування. Продовжити?'))return;
      const importedProducts=data.products.filter(product=>product&&product.id&&String(product.name||'').trim()).map(product=>({...product,name:String(product.name).trim()}));
      const importedDocuments=data.documents.filter(doc=>doc&&doc.id).map(doc=>normalizeDocument(doc,doc.id));
      const importedCurrent=normalizeDocument(data.current.find(doc=>doc.id==='current')||data.current[0]||newCurrent(),'current');
      const importedSettings=data.settings.find(item=>item.id==='settings')||data.settings.find(item=>item.id==='app')||data.settings[0]||{};
      await AppDB.replaceStores({products:importedProducts,documents:importedDocuments,current:[importedCurrent],settings:[{...importedSettings,id:'settings',showCalc:importedSettings.showCalc!==false}]});
      products=importedProducts.sort((a,b)=>a.name.localeCompare(b.name,'uk'));current=importedCurrent;settings={...importedSettings,id:'settings',showCalc:importedSettings.showCalc!==false};
      catalogQuery='';els.catalogSearch.value='';previewDocument=null;previewFromHistory=false;resetEntryForm();renderCurrent();renderProducts();renderDropdown('');
      toast('Резервну копію повністю відновлено');setView('home');
    }catch(error){console.error(error);toast('Файл не є коректною резервною копією');}
    finally{els.importBackup.value='';}
  };

  if('serviceWorker' in navigator)navigator.serviceWorker.register('service-worker.js').catch(error=>console.warn('Service worker:',error));
=======
  const els={menu:$('menu'),shade:$('shade'),title:$('title'),dateLine:$('dateLine'),productSearch:$('productSearch'),clearSearch:$('clearSearch'),dropdown:$('dropdown'),warning:$('warning'),pallets:$('pallets'),boxesPerPallet:$('boxesPerPallet'),unitsPerBox:$('unitsPerBox'),unit:$('unit'),liveResult:$('liveResult'),liveCalc:$('liveCalc'),addItem:$('addItem'),currentItems:$('currentItems'),itemCount:$('itemCount'),finishDoc:$('finishDoc'),productsList:$('productsList'),toggleBulk:$('toggleBulk'),bulkBox:$('bulkBox'),bulkNames:$('bulkNames'),bulkAdd:$('bulkAdd'),previewPaper:$('previewPaper'),showCalc:$('showCalc'),editDoc:$('editDoc'),createPdf:$('createPdf'),historyList:$('historyList'),exportBackup:$('exportBackup'),importBackup:$('importBackup'),clearCurrent:$('clearCurrent')};
  let products=[], current={id:'current',items:[],date:'',time:''}, settings={id:'settings',showCalc:true}, selected=null, previewDoc=null, previewFromHistory=false;
  const today=()=>new Date().toLocaleDateString('uk-UA');
  const now=()=>new Date().toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});
  const prettyDate=()=>new Date().toLocaleDateString('uk-UA',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})+' · '+now();
  const num=v=>Number(String(v).replace(',','.'))||0;
  const configured=p=>p&&num(p.boxesPerPallet)>0&&num(p.unitsPerBox)>0&&p.unit;
  const toast=msg=>{const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)};
  const saveCurrent=()=>AppDB.put('current', current);
  const saveSettings=()=>AppDB.put('settings', settings);
  function setDateLine(){els.dateLine.textContent=prettyDate()} setInterval(setDateLine,30000);
  function setView(view){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(view).classList.add('active');els.title.textContent=({home:'Облік продукції',products:'Довідник продукції',history:'Історія документів',settings:'Налаштування',about:'Про програму',preview:'Попередній перегляд документа'})[view]||'Облік';closeMenu(); if(view==='products')renderProducts(); if(view==='history')renderHistory(); if(view==='home')setTimeout(()=>els.productSearch.focus(),80);}
  function openMenu(){els.menu.classList.add('open');els.shade.classList.add('open')} function closeMenu(){els.menu.classList.remove('open');els.shade.classList.remove('open')}
  $('openMenu').onclick=openMenu;$('closeMenu').onclick=closeMenu;els.shade.onclick=closeMenu;document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));

  await AppDB.open();
  products=(await AppDB.all('products')).sort((a,b)=>a.name.localeCompare(b.name,'uk'));
  current=await AppDB.get('current','current')||current;
  settings=await AppDB.get('settings','settings')||settings;
  setDateLine();
  els.showCalc.checked=!!settings.showCalc;
  renderCurrent(); renderDropdown(''); calcLive();

  function renderDropdown(query){const q=query.trim().toLowerCase();const list=products.filter(p=>p.name.toLowerCase().includes(q)); if(!els.dropdown.classList.contains('open')) return; els.dropdown.innerHTML=list.length?list.map(p=>`<div class="drop-item" data-id="${p.id}"><b>${escapeHtml(p.name)}</b><small>${configured(p)?'налаштовано':'не налаштовано'}</small></div>`).join(''):'<div class="drop-item"><small>Нічого не знайдено</small></div>'; els.dropdown.querySelectorAll('[data-id]').forEach(x=>x.onclick=()=>selectProduct(x.dataset.id));}
  function selectProduct(id){selected=products.find(p=>p.id===id)||null;if(!selected)return;els.productSearch.value=selected.name;els.dropdown.classList.remove('open');els.boxesPerPallet.value=selected.boxesPerPallet||'';els.unitsPerBox.value=selected.unitsPerBox||'';els.unit.value=selected.unit||'пачки';showWarning();calcLive();setTimeout(()=>els.pallets.focus(),50)}
  function showWarning(){if(selected&&!configured({...selected,boxesPerPallet:els.boxesPerPallet.value,unitsPerBox:els.unitsPerBox.value,unit:els.unit.value})){els.warning.classList.remove('hidden');els.warning.innerHTML=`Продукція не налаштована. Заповніть ящики, одиниці в ящику та одиницю обліку в довіднику. <button class="mini" id="goEditSelected">Редагувати</button>`;$('goEditSelected').onclick=()=>openEdit(selected.id)}else els.warning.classList.add('hidden')}
  function calcLive(){const p=num(els.pallets.value), b=num(els.boxesPerPallet.value), u=num(els.unitsPerBox.value), unit=els.unit.value||'пачки'; const boxes=p*b,total=boxes*u; els.liveResult.textContent=`${PDFGen.fmt(total)} ${unit}`; els.liveCalc.textContent=p&&b&&u?`${PDFGen.fmt(p)}×${PDFGen.fmt(b)}×${PDFGen.fmt(u)} = ${PDFGen.fmt(total)} ${unit}`:'Заповніть піддони та параметри'; showWarning();}
  els.productSearch.onfocus=()=>{els.dropdown.classList.add('open');renderDropdown(els.productSearch.value)}; els.productSearch.oninput=()=>{selected=null;els.dropdown.classList.add('open');renderDropdown(els.productSearch.value);showWarning();}; els.clearSearch.onclick=()=>{els.productSearch.value='';selected=null;els.dropdown.classList.add('open');renderDropdown('');els.productSearch.focus();}; [els.pallets,els.boxesPerPallet,els.unitsPerBox,els.unit].forEach(e=>e.addEventListener('input',calcLive));
  document.addEventListener('click',e=>{if(!e.target.closest('.form-card'))els.dropdown.classList.remove('open')});

  els.addItem.onclick=async()=>{if(!selected){toast('Спочатку вибери продукцію');return} const pallets=num(els.pallets.value), b=num(els.boxesPerPallet.value), u=num(els.unitsPerBox.value), unit=els.unit.value; if(pallets<=0){toast('Введи кількість піддонів');els.pallets.focus();return} if(b<=0||u<=0){toast('Продукція не налаштована');return} const boxes=pallets*b,total=boxes*u,calc=`${PDFGen.fmt(pallets)}×${PDFGen.fmt(b)}×${PDFGen.fmt(u)}`; const existing=current.items.find(i=>i.productId===selected.id||i.name===selected.name); if(existing){existing.pallets+=pallets;existing.boxes+=boxes;existing.total+=total;existing.calc=`${PDFGen.fmt(existing.pallets)}×${PDFGen.fmt(b)}×${PDFGen.fmt(u)}`;existing.boxesPerPallet=b;existing.unitsPerBox=u;existing.unit=unit;}else current.items.push({id:AppDB.uid(),productId:selected.id,name:selected.name,pallets,boxes,total,calc,boxesPerPallet:b,unitsPerBox:u,unit}); current.date=today(); current.time=now(); await saveCurrent(); renderCurrent(); els.pallets.value=''; calcLive(); els.pallets.focus(); };
  function renderCurrent(){const items=current.items||[];els.itemCount.textContent=`${items.length} позицій`; if(!items.length){els.currentItems.className='list empty';els.currentItems.textContent='Позицій ще немає';return} els.currentItems.className='list'; els.currentItems.innerHTML=items.map(i=>itemHTML(i,true)).join(''); els.currentItems.querySelectorAll('[data-del-item]').forEach(b=>b.onclick=async()=>{current.items=current.items.filter(i=>i.id!==b.dataset.delItem);await saveCurrent();renderCurrent();}); els.currentItems.querySelectorAll('[data-edit-item]').forEach(b=>b.onclick=()=>editDocItem(b.dataset.editItem));}
  function itemHTML(i,actions){return `<div class="item"><h3>${escapeHtml(i.name)}</h3><div class="item-grid"><div><span>Піддони</span><b>${PDFGen.fmt(i.pallets)}</b></div><div><span>Ящики</span><b>${PDFGen.fmt(i.boxes)}</b></div><div><span>Розрахунок</span><b>${escapeHtml(i.calc)}</b></div><div><span>Разом</span><b>${PDFGen.fmt(i.total)} ${escapeHtml(i.unit)}</b></div></div>${actions?`<div class="item-actions"><button class="mini" data-edit-item="${i.id}">Редагувати</button><button class="mini danger" data-del-item="${i.id}">Видалити</button></div>`:''}</div>`}
  function editDocItem(id){const i=current.items.find(x=>x.id===id); if(!i)return; selected=products.find(p=>p.id===i.productId)||{id:i.productId,name:i.name}; els.productSearch.value=i.name; els.boxesPerPallet.value=i.boxesPerPallet; els.unitsPerBox.value=i.unitsPerBox; els.unit.value=i.unit; els.pallets.value=i.pallets; current.items=current.items.filter(x=>x.id!==id); saveCurrent().then(renderCurrent); calcLive(); els.pallets.focus();}
  els.finishDoc.onclick=()=>{if(!(current.items||[]).length){toast('Документ порожній');return} previewDoc=AppDB.clone({...current,date:current.date||today(),time:current.time||now()}); previewFromHistory=false; renderPreview(); setView('preview')};
  els.editDoc.onclick=()=>setView('home'); els.showCalc.onchange=async()=>{settings.showCalc=els.showCalc.checked;await saveSettings();renderPreview()};
  function renderPreview(){els.showCalc.checked=!!settings.showCalc; els.previewPaper.innerHTML=PDFGen.buildDocumentHTML(previewDoc||current,settings.showCalc);}
  els.createPdf.onclick=async()=>{const doc=AppDB.clone(previewDoc||current); doc.date=doc.date||today(); doc.time=doc.time||now(); if(!previewFromHistory){const saved={id:AppDB.uid(),date:doc.date,time:doc.time,items:AppDB.clone(doc.items),showCalc:settings.showCalc,totals:PDFGen.totals(doc.items)}; await AppDB.put('documents',saved); current={id:'current',items:[],date:'',time:''}; await saveCurrent(); renderCurrent(); previewFromHistory=true; previewDoc=saved;} await PDFGen.savePdf(doc,settings.showCalc); toast('PDF створено і збережено в історії');};

  els.toggleBulk.onclick=()=>els.bulkBox.classList.toggle('hidden');
  els.bulkAdd.onclick=async()=>{const names=els.bulkNames.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);let added=0,skipped=0;for(const name of names){if(products.some(p=>p.name.toLowerCase()===name.toLowerCase())){skipped++;continue} const p={id:AppDB.uid(),name,boxesPerPallet:'',unitsPerBox:'',unit:'пачки',createdAt:new Date().toISOString()};products.push(p);await AppDB.put('products',p);added++;}products.sort((a,b)=>a.name.localeCompare(b.name,'uk'));els.bulkNames.value='';renderProducts();renderDropdown('');toast(`Додано: ${added}. Пропущено: ${skipped}`);};
  function renderProducts(){if(!products.length){els.productsList.className='list empty';els.productsList.textContent='Довідник порожній';return} els.productsList.className='list';els.productsList.innerHTML=products.map(p=>`<div class="item"><h3>${escapeHtml(p.name)}</h3><span class="badge ${configured(p)?'ok':'bad'}">${configured(p)?'налаштовано':'не налаштовано'}</span><div class="item-grid" style="margin-top:10px"><div><span>Ящ./підд.</span><b>${p.boxesPerPallet||'—'}</b></div><div><span>Од./ящ.</span><b>${p.unitsPerBox||'—'}</b></div><div><span>Одиниця</span><b>${p.unit||'—'}</b></div></div><div class="item-actions"><button class="mini" data-edit-product="${p.id}">Редагувати</button><button class="mini danger" data-del-product="${p.id}">Видалити</button></div></div>`).join('');els.productsList.querySelectorAll('[data-edit-product]').forEach(b=>b.onclick=()=>openEdit(b.dataset.editProduct));els.productsList.querySelectorAll('[data-del-product]').forEach(b=>b.onclick=async()=>{if(confirm('Видалити продукцію?')){products=products.filter(p=>p.id!==b.dataset.delProduct);await AppDB.del('products',b.dataset.delProduct);renderProducts();}})}
  function openEdit(id){const p=products.find(x=>x.id===id);if(!p)return;const frag=$('editProductTemplate').content.cloneNode(true);document.body.appendChild(frag);const wrap=document.querySelector('.modal-wrap');$('editName').value=p.name;$('editBoxes').value=p.boxesPerPallet||'';$('editUnits').value=p.unitsPerBox||'';$('editUnit').value=p.unit||'пачки';$('cancelEdit').onclick=()=>wrap.remove();$('saveEdit').onclick=async()=>{const name=$('editName').value.trim();if(!name){toast('Назва порожня');return} if(products.some(x=>x.id!==p.id&&x.name.toLowerCase()===name.toLowerCase())){toast('Така назва вже є');return}p.name=name;p.boxesPerPallet=num($('editBoxes').value)||'';p.unitsPerBox=num($('editUnits').value)||'';p.unit=$('editUnit').value;await AppDB.put('products',p);products.sort((a,b)=>a.name.localeCompare(b.name,'uk'));wrap.remove();renderProducts();renderDropdown(''); if(selected&&selected.id===p.id)selectProduct(p.id);toast('Збережено');};}

  async function renderHistory(){const docs=(await AppDB.all('documents')).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)); if(!docs.length){els.historyList.className='list empty';els.historyList.textContent='Історія порожня';return} els.historyList.className='list'; els.historyList.innerHTML=docs.map(d=>`<div class="item"><h3>Документ від ${escapeHtml(d.date)} · ${escapeHtml(d.time)}</h3><p class="muted">${(d.items||[]).length} позицій</p><div class="item-actions"><button class="mini" data-view-doc="${d.id}">Переглянути</button><button class="mini" data-pdf-doc="${d.id}">PDF</button><button class="mini danger" data-del-doc="${d.id}">Видалити</button></div></div>`).join('');els.historyList.querySelectorAll('[data-view-doc]').forEach(b=>b.onclick=async()=>{previewDoc=await AppDB.get('documents',b.dataset.viewDoc);previewFromHistory=true;settings.showCalc=previewDoc.showCalc!==undefined?previewDoc.showCalc:settings.showCalc;await saveSettings();renderPreview();setView('preview')});els.historyList.querySelectorAll('[data-pdf-doc]').forEach(b=>b.onclick=async()=>{const d=await AppDB.get('documents',b.dataset.pdfDoc);await PDFGen.savePdf(d,d.showCalc!==undefined?d.showCalc:settings.showCalc)});els.historyList.querySelectorAll('[data-del-doc]').forEach(b=>b.onclick=async()=>{if(confirm('Видалити документ з історії?')){await AppDB.del('documents',b.dataset.delDoc);renderHistory();}})}

  els.exportBackup.onclick=async()=>{const backup={version:1,createdAt:new Date().toISOString(),products:await AppDB.all('products'),documents:await AppDB.all('documents'),current:await AppDB.all('current'),settings:await AppDB.all('settings')}; const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`backup_${today().replaceAll('.','-')}_${now().replace(':','-')}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
  els.importBackup.onchange=async()=>{const file=els.importBackup.files[0]; if(!file)return; try{const data=JSON.parse(await file.text()); if(!confirm('Імпорт замінить поточні дані. Продовжити?'))return; await AppDB.replaceStore('products',data.products||[]); await AppDB.replaceStore('documents',data.documents||[]); await AppDB.replaceStore('current',data.current||[{id:'current',items:[]}]); await AppDB.replaceStore('settings',data.settings||[{id:'settings',showCalc:true}]); products=(await AppDB.all('products')).sort((a,b)=>a.name.localeCompare(b.name,'uk')); current=await AppDB.get('current','current')||{id:'current',items:[]}; settings=await AppDB.get('settings','settings')||{id:'settings',showCalc:true}; renderCurrent();renderProducts();toast('Резервну копію відновлено');setView('home');}catch(e){toast('Не вдалося імпортувати файл')} finally{els.importBackup.value='';}};
  els.clearCurrent.onclick=async()=>{if(confirm('Очистити поточний документ?')){current={id:'current',items:[],date:'',time:''};await saveCurrent();renderCurrent();toast('Очищено')}};
  function escapeHtml(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
  if('serviceWorker' in navigator){navigator.serviceWorker.register('service-worker.js').catch(()=>{});}
>>>>>>> 7f82b804c58402fdcf34e858fee683ec12050ee9
})();
