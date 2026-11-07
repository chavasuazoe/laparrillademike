/* Owner console: sales, cash custody, expenses, close, and historical reporting. */
(() => {
  'use strict';
  const api = window.PedidosCloudflare;
  const F = window.AdminFinance;
  const escape = AppCore.escapeHtml;
  const uid = AppCore.createId;
  const $ = selector => document.querySelector(selector);
  const peso = cents => new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN',maximumFractionDigits:2}).format((Number(cents)||0)/100);
  const shortDate = day => new Date(`${day}T12:00:00Z`).toLocaleDateString('es-MX',{day:'numeric',month:'short',timeZone:'UTC'});
  const money = input => /^\d{1,7}(?:[.,]\d{1,2})?$/.test(String(input).trim()) ? Math.round(Number(String(input).replace(',','.'))*100) : null;
  const state = {
    page:'dashboard', range:'today', day:F.businessDay(), data:null, busy:false,
    error:'', updated:'', counted:'', note:'', purgeDay:F.businessDay(),
    movementKind:'cash_out', movementCategory:'ingredients', chartMetric:'sales'
  };
  const connected = () => api.enabled() && !!api.token('admin');
  const empty = '<div class="empty-admin">Aún no hay movimientos en este periodo.</div>';
  const categoryLabel = category => F.CATEGORY_LABELS[category] || 'Otros';
  const currencyLine = (label,value,{strong=false}={}) => `<div class="detail-line ${strong?'emphasis':''}"><span>${escape(label)}</span><b>${peso(value)}</b></div>`;
  const tile = (name,value,{theme='',detail=''}={}) => `<div class="money-tile ${theme}"><span>${escape(name)}</span><strong>${escape(value)}</strong>${detail?`<small>${escape(detail)}</small>`:''}</div>`;
  const section = (heading,body,extra='') => `<section class="surface-panel"><header class="surface-head"><h2>${heading}</h2>${extra}</header>${body}</section>`;
  const rangeButtons = () => `<div class="period-tabs" role="group" aria-label="Periodo">${[['today','HOY'],['week','7 DÍAS'],['month','30 DÍAS'],['year','12 MESES']].map(([key,text])=>`<button data-range="${key}" class="${state.range===key?'selected':''}" aria-pressed="${state.range===key}">${text}</button>`).join('')}</div>`;
  const currentData = () => state.data || {receipts:[],expenses:[],openings:[],closures:[],openOrders:[],purges:[]};
  const turn = () => F.dayTotals(currentData(),state.day);
  const period = () => F.overview(currentData(),F.dayList(state.range==='today'?1:state.range==='week'?7:state.range==='month'?30:365));
  const countLiveTables = () => currentData().openOrders.filter(x=>F.businessDay(x.createdAt||Date.now())===F.businessDay()).length;
  function staleMessage(d) {
    if(!d.closure)return '';
    const changed = d.sales !== d.closure.salesCents || d.transactions !== d.closure.receiptCount ||
      (d.expected !== null && d.expected !== d.closure.expectedCents);
    return changed?'<div class="warning-inline">Hay movimientos posteriores al corte. El corte guardado no cambia; revisa la diferencia y conserva un reporte actualizado.</div>':'';
  }
  function connectionBar() {
    return state.error?`<div class="banner alert" role="alert">Sin datos actualizados: ${escape(state.error)} <button class="chip-btn" data-refresh>Reintentar</button></div>`:
      `<div class="updated-line"><span class="status-circle"></span> ${state.busy?'Actualizando…':`Datos compartidos ${escape(state.updated||'')}`}</div>`;
  }
  function recentSales(receipts,limit=5) {
    return !receipts.length?empty:`<div class="record-list">${receipts.slice().sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,limit).map(r=>`<div class="record"><div><strong>${escape(r.order?.tableLabel||'Mesa')}</strong><small>${new Date(r.createdAt).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',timeZone:'America/Mexico_City'})} · ${escape(r.method==='transfer'?'Transferencia':r.method==='mixed'?'Mixto':'Efectivo')}</small></div><b>${peso(r.totalCents)}</b></div>`).join('')}</div>`;
  }
  function dashboard() {
    const d=F.dayTotals(currentData(),F.businessDay());
    const open=d.opening,closed=d.closure;
    const float = closed?'Corte guardado':open?'Caja abierta':'Caja sin abrir';
    const color=closed?'closed':open?'open':'attention';
    const cashBody = `<div class="drawer-status ${color}"><div><span class="eyebrow">ESTADO DE CAJA</span><h2>${float}</h2><p>${open?`Fondo inicial ${peso(open.openingCents)}`:'Registra el fondo inicial para calcular el efectivo esperado.'}</p></div><button class="action ${open?'secondary':'primary'}" data-page="cash">${open?'VER CAJA':'ABRIR CAJA'}</button></div>
     <div class="quick-metrics">${tile('Efectivo por ventas',peso(d.cash))}${tile('Transferencias',peso(d.transfer))}${tile('Gastos registrados',peso(d.costs))}${tile('Propinas aparte',peso(d.tips))}</div>`;
    const notes = `<div class="quick-actions"><button data-page="cash" class="shortcut"><span class="shortcut-icon">▤</span> Hacer corte</button><button data-new-movement data-default-kind="cash_out" class="shortcut"><span class="shortcut-icon">−</span> Anotar gasto</button><button data-page="analysis" class="shortcut"><span class="shortcut-icon">▥</span> Ver reportes</button></div>`;
    return `<div class="admin-screen">${connectionBar()}<div class="page-title"><div><span class="eyebrow">TURNO · ${shortDate(F.businessDay())}</span><h1>Resumen de hoy</h1></div><span class="shift-hours">18:30 – 00:00</span></div>
    <div class="headline-metrics">${tile('VENTAS COBRADAS',peso(d.sales),{theme:'blue',detail:'No incluye propinas'})}${tile('CUENTAS',String(d.transactions),{detail:`Promedio ${peso(d.average)}`})}${tile('MESAS ABIERTAS',String(countLiveTables()))}</div>
    ${cashBody}${notes}<div class="adaptive-panels">${section('Últimos cobros',recentSales(d.receipts,6))}${section('Propinas del turno',`${currencyLine('Reunidas',d.tips,{strong:true})}${currencyLine('Mesero · 70%',d.waiterTips)}${currencyLine('Ayudante · 30%',d.kitchenTips)}<p class="hint">Se contabilizan aparte de las ventas y del efectivo esperado en caja.</p>`)}</div>${staleMessage(d)}</div>`;
  }
  function dayPicker(){return `<label class="calendar-selector"><span>Turno</span><input id="shift-day" type="date" max="${F.businessDay()}" value="${escape(state.day)}" aria-label="Fecha de corte"></label>`;}
  function cashScreen() {
    const d=turn(),opening=d.openingAmount,closed=d.closure;
    const cashCalculation = `<div class="calc-list">${currencyLine('Fondo inicial',opening||0)}${currencyLine('+ Ventas en efectivo',d.cash)}${currencyLine('+ Entradas de efectivo',d.cashIn)}${currencyLine('− Gastos pagados de caja',-d.expenseCash)}${currencyLine('− Retiros de caja',-d.cashDrops)}${currencyLine('EFECTIVO ESPERADO',d.expected||0,{strong:true})}</div>`;
    const countValue=closed?.countedCents??money(state.counted),difference=countValue===null||d.expected===null?null:countValue-d.expected;
    const openingForm = `<div class="opening-card"><div><strong>Abrir caja</strong><p>¿Cuánto efectivo tienes al iniciar el turno?</p></div><div class="input-row"><label class="field"><span>Fondo inicial · MXN</span><input id="opening-input" inputmode="decimal" type="text" placeholder="0.00" autocomplete="off"></label><button class="action positive" data-open-cash>GUARDAR FONDO</button></div></div>`;
    const closing = closed?`<div class="closure-result"><span class="eyebrow">CORTE GUARDADO</span><div class="variance ${closed.varianceCents===0?'balanced':'different'}">${peso(closed.varianceCents)} <small>${closed.varianceCents===0?'Caja cuadrada':closed.varianceCents<0?'Faltante':'Sobrante'}</small></div><div class="hint">Efectivo contado: ${peso(closed.countedCents)} · Esperado al cerrar: ${peso(closed.expectedCents)}</div>${staleMessage(d)}<button class="action secondary" data-export-day>EXPORTAR TURNO CSV</button></div>`:
      `<label class="field"><span>Efectivo contado · MXN</span><input id="counted" inputmode="decimal" type="text" placeholder="0.00" autocomplete="off" value="${escape(state.counted)}"></label>${difference!==null?`<div class="variance ${difference===0?'balanced':'different'}">${peso(difference)} <small>${difference===0?'Cuadra':difference<0?'Falta efectivo':'Sobra efectivo'}</small></div>`:''}<label class="field"><span>Observaciones (opcional)</span><textarea id="close-note" maxlength="250" rows="2" placeholder="Ej. diferencia por cambio pendiente">${escape(state.note)}</textarea></label><button data-close-shift class="action positive full-width" ${opening===null?'disabled':''}>GUARDAR CORTE DEL TURNO</button><p class="hint">El corte es permanente. Cuenta el dinero antes de confirmarlo y registra primero los gastos y retiros.</p>`;
    return `<div class="admin-screen">${connectionBar()}<div class="page-title"><h1>Caja y corte</h1>${dayPicker()}</div>
    <div class="headline-metrics">${tile('VENTAS',peso(d.sales),{theme:'blue'})}${tile('EFECTIVO',peso(d.cash))}${tile('TRANSFERENCIAS',peso(d.transfer))}</div>
    <div class="adaptive-panels"><div class="panel-stack">${!d.opening?openingForm:''}${section('Dinero en caja',d.opening?cashCalculation:'<div class="empty-admin">Abre la caja para conocer el efectivo esperado.</div>')}${section('Movimientos del turno',`<div class="cash-movement-actions"><button class="shortcut" data-new-movement data-default-kind="cash_in">+ Entrada</button><button class="shortcut" data-new-movement data-default-kind="cash_out">− Gasto</button><button class="shortcut" data-new-movement data-default-kind="cash_drop">− Retiro</button></div>${d.entries.length?renderRecords(d.entries.slice().reverse().slice(0,5)):empty}`)}</div><div class="panel-stack">${section('Cerrar turno',d.opening?closing:'<div class="empty-admin">Primero registra el fondo inicial.</div>')}${section('Resumen del turno',`${currencyLine('Propinas · 70% mesero',d.waiterTips)}${currencyLine('Propinas · 30% ayudante',d.kitchenTips)}${currencyLine('Gastos registrados',d.costs)}${currencyLine('Saldo tras gastos registrados',d.recordedBalance)}<p class="hint">No es utilidad neta: pueden faltar costos de ingredientes, sueldos, impuestos y otros pagos.</p>`)}</div></div></div>`;
  }
  const kindLabel={cash_out:'Gasto de caja',expense:'Gasto externo',cash_in:'Entrada de efectivo',cash_drop:'Retiro de caja'};
  function renderRecords(rows){return `<div class="record-list">${rows.map(r=>`<div class="record"><div><strong>${escape(r.label)}</strong><small>${escape(kindLabel[r.kind]||'Movimiento')} ${['cash_out','expense'].includes(r.kind)?'· '+escape(categoryLabel(r.category)):''}</small><small>${escape(new Date(r.createdAt).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short',timeZone:'America/Mexico_City'}))}</small></div><b class="${r.kind==='cash_in'?'positive-text':''}">${r.kind==='cash_in'?'+':'−'}${peso(r.amount)}</b></div>`).join('')}</div>`;}
  function movementScreen(){const d=turn(),spent=F.costCategories(d.entries);
    return `<div class="admin-screen">${connectionBar()}<div class="page-title"><h1>Gastos y movimientos</h1>${dayPicker()}</div><div class="headline-metrics">${tile('GASTOS',peso(d.costs),{theme:'blue'})}${tile('DESDE CAJA',peso(d.expenseCash))}${tile('POR FUERA',peso(d.expenseExternal))}</div>
    ${section('Registrar',`<div class="quick-categories">${[['ingredients','Ingredientes'],['payroll','Nómina'],['utilities','Gas / servicios'],['supplies','Insumos'],['rent','Renta'],['other','Otro gasto']].map(([key,name])=>`<button data-category="${key}" class="category-tile">${name}</button>`).join('')}</div><div class="cash-movement-actions"><button class="shortcut" data-new-movement data-default-kind="cash_in">+ Fondo</button><button class="shortcut" data-new-movement data-default-kind="cash_drop">− Retiro</button><button class="shortcut" data-new-movement data-default-kind="expense">Gasto externo</button></div>`)}
    <div class="adaptive-panels">${section('Movimientos del turno',d.entries.length?renderRecords([...d.entries].reverse()):empty)}${section('¿En qué se gastó?',spent.length?spent.map(v=>currencyLine(categoryLabel(v.category),v.total)).join(''):empty)} </div></div>`;}
  function graph(receipts){const keys=F.dayList(state.range==='today'?1:state.range==='week'?7:state.range==='month'?30:365).reverse(),chart=[];
    if(state.range==='today'){for(const hour of [18,19,20,21,22,23,0])chart.push({label:String(hour).padStart(2,'0'),total:0});for(const r of receipts){const hour=new Intl.DateTimeFormat('en-US',{timeZone:'America/Mexico_City',hour:'2-digit',hourCycle:'h23'}).format(new Date(r.createdAt));const entry=chart.find(x=>x.label===hour);if(entry)entry.total+=r.totalCents||0;}}
    else if(state.range==='year'){for(let i=11;i>=0;i--){const date=new Date(keys.at(-1)+'T12:00:00Z');date.setUTCMonth(date.getUTCMonth()-i);const key=date.toISOString().slice(0,7);chart.push({key,label:date.toLocaleDateString('es-MX',{month:'short',timeZone:'UTC'}),total:0});}for(const r of receipts){const key=F.businessDay(r.createdAt).slice(0,7),entry=chart.find(x=>x.key===key);if(entry)entry.total+=r.totalCents||0;}}
    else {for(const k of keys)chart.push({key:k,label:k.slice(8),total:0});for(const r of receipts){const key=F.businessDay(r.createdAt),entry=chart.find(x=>x.key===key);if(entry)entry.total+=r.totalCents||0;}}
    const max=Math.max(1,...chart.map(x=>x.total));return `<div class="bar-chart ${chart.length>15?'dense':''}" role="img" aria-label="Ventas registradas por periodo">${chart.map(x=>`<div class="bar-entry" title="${escape(x.label)}: ${peso(x.total)}"><div class="bar-track"><span style="height:${x.total?Math.max(3,x.total/max*100):1}%"></span></div><small>${escape(x.label)}</small></div>`).join('')}</div>`;}
  function rankRows(items,type='products'){if(!items.length)return empty;const max=type==='products'?items[0].quantity:Math.max(1,...items.map(x=>x.count));return `<div class="ranking-list">${items.map(x=>`<div class="rank-item"><div class="rank-heading"><b>${escape(type==='products'?x.name:String(x.hour).padStart(2,'0')+':00')}</b><span>${type==='products'?x.quantity+' uds · '+peso(x.sales):x.count+' cuentas'}</span></div><div class="rank-track"><i style="width:${Math.round((type==='products'?x.quantity:x.count)/max*100)}%"></i></div></div>`).join('')}</div>`;}
  function analysis(){const d=period();const guestNote=d.guests?String(d.guests):'Sin registrar';return `<div class="admin-screen">${connectionBar()}<div class="page-title"><h1>Análisis</h1></div>${rangeButtons()}<div class="headline-metrics">${tile('VENTAS',peso(d.sales),{theme:'blue'})}${tile('CUENTAS',String(d.transactions))}${tile('TICKET PROMEDIO',peso(d.average))}</div>
  <div class="adaptive-panels">${section('Ventas por periodo',graph(d.items))}${section('Más vendidos',rankRows(F.topProducts(d.items)))}</div>
  <div class="adaptive-panels">${section('Horas con más pedidos',rankRows(F.peakHours(d.items),'hours')+'<p class="hint">Agrupadas por inicio de pedido cuando se registró la hora, no por personas.</p>')}${section('Ventas y gastos',`${currencyLine('Ventas cobradas',d.sales)}${currencyLine('Efectivo de ventas',d.cash)}${currencyLine('Transferencias',d.transfer)}${currencyLine('Gastos registrados',d.costs)}${currencyLine('Saldo después de gastos',d.recordedBalance,{strong:true})}<div class="inline-kpis"><span>${d.guests?d.guests:'—'} comensales registrados</span><span>${peso(d.tips)} propinas</span></div><p class="hint">Este saldo es parcial. No equivale a ganancia neta hasta registrar todos los costos.</p>`)}</div></div>`;}
  function dataScreen(){const d=turn(),closed=(currentData().closures||[]).slice().sort((a,b)=>b.shiftKey.localeCompare(a.shiftKey)).slice(0,20),purges=(currentData().purges||[]).slice(0,5);return `<div class="admin-screen">${connectionBar()}<div class="page-title"><h1>Registros y respaldo</h1>${dayPicker()}</div><div class="headline-metrics">${tile('CUENTAS',String(d.transactions))}${tile('VENTAS',peso(d.sales),{theme:'blue'})}${tile('CORTE',d.closure?'CERRADO':'ABIERTO')}</div>
  ${section('Respaldo del día',`<div class="stacked-actions"><button class="action primary" data-export-day>DESCARGAR CSV DEL TURNO</button><button class="action secondary" data-export-all>EXPORTAR VENTAS DEL AÑO</button></div>`)}
  <div class="adaptive-panels">${section('Cortes guardados',closed.length?`<div class="record-list">${closed.map(c=>`<div class="record"><div><strong>${escape(c.shiftKey)}</strong><small>Contado ${peso(c.countedCents)} · Esperado ${peso(c.expectedCents||0)}</small></div><b class="${c.varianceCents?'negative-text':'positive-text'}">${peso(c.varianceCents||0)}</b></div>`).join('')}</div>`:empty)}${section('Ventas del turno',recentSales(d.receipts,80))}</div>
  ${section('Eliminar datos de prueba',`<p class="hint">Solo durante las pruebas. Eliminar registros financieros es irreversible y no borra las comandas ni los pedidos pagados.</p><button class="action danger" data-open-purge>ELIMINAR DATOS DE ${escape(state.day)}</button>${purges.length?`<p class="hint">Última eliminación: ${escape(purges[0].shiftKey)}</p>`:''}`)}</div>`;}
  function pairing(){return `<section class="link-screen"><h1>Vincular Administración</h1><p>Genera el código de Administración desde Ajustes de Mesero.</p><label class="field"><span>Código de 6 dígitos</span><input id="pair-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"></label><button class="action primary full-width" data-pair>VINCULAR</button>${state.error?`<div class="banner alert">${escape(state.error)}</div>`:''}</section>`;}
  function render(){const active=connected();$('#status-dot').classList.toggle('live',active&&!state.error);$('#admin-nav').classList.toggle('hidden',!active);$('#admin-nav').querySelectorAll('button').forEach(b=>{b.classList.toggle('current',b.dataset.page===state.page);b.setAttribute('aria-current',b.dataset.page===state.page?'page':'false');});$('#admin-content').innerHTML=!active?pairing():state.page==='dashboard'?dashboard():state.page==='cash'?cashScreen():state.page==='movements'?movementScreen():state.page==='analysis'?analysis():dataScreen();}
  async function load(){if(!connected()||state.busy)return;state.busy=true;try{
    let offset=0,pages=0;const merged={receipts:[],expenses:[],openings:[],closures:[],openOrders:[],purges:[]};
    while(pages<150){const page=await api.api('/api/admin/data?offset='+offset,{role:'admin',timeout:25000});merged.receipts.push(...(page.receipts||[]));if(offset===0)for(const k of ['expenses','openings','closures','openOrders','purges'])merged[k]=page[k]||[];
      if(!page.hasMore)break;const next=page.nextOffset;if(!Number.isInteger(next)||next<=offset)throw Error('El reporte se interrumpió: paginación inválida');offset=next;pages++;
    }
    if(pages>=150)throw Error('Hay demasiadas ventas para esta consulta. Se necesita un reporte paginado por fecha.');
    state.data=merged;state.updated=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});state.error='';
    if(!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))render();
  }catch(e){state.error=e.message;render();}finally{state.busy=false;}}
  function modal(content){$('#modal-body').innerHTML=content;$('#admin-modal').classList.remove('hidden');}
  function closeModal(){$('#admin-modal').classList.add('hidden');}
  function modalError(message){const el=$('#modal-error');if(el)el.textContent=message;else alert(message);}
  async function pair(){const code=$('#pair-code')?.value.trim();if(!/^\d{6}$/.test(code)){state.error='Escribe los 6 dígitos';render();return;}try{await api.pair(code);state.error='';render();startLive();}catch(e){state.error=e.message;render();}}
  function movementModal(kind='cash_out',category='ingredients'){
    modal(`<h2>Registrar movimiento</h2><label class="field"><span>Tipo</span><select id="movement-kind"><option value="cash_out" ${kind==='cash_out'?'selected':''}>Gasto pagado desde caja</option><option value="expense" ${kind==='expense'?'selected':''}>Gasto externo (transferencia / otro)</option><option value="cash_in" ${kind==='cash_in'?'selected':''}>Entrada de efectivo (no venta)</option><option value="cash_drop" ${kind==='cash_drop'?'selected':''}>Retiro de caja (no gasto)</option></select></label>
      <label class="field"><span>Categoría</span><select id="movement-category">${Object.entries(F.CATEGORY_LABELS).map(([key,value])=>`<option value="${key}" ${category===key?'selected':''}>${escape(value)}</option>`).join('')}</select></label>
      <label class="field"><span>Importe · MXN</span><input id="movement-amount" inputmode="decimal" type="text" placeholder="0.00"></label><label class="field"><span>Descripción</span><input id="movement-label" maxlength="100" placeholder="Qué se pagó o movió" value="${category==='payroll'?'Sueldo mesero':''}"></label>
      <div class="quick-chips"><button data-prefill-pay class="chip-btn">Sueldo mesero $250</button></div>
      <div class="modal-actions"><button class="action secondary" data-modal-close>CANCELAR</button><button class="action positive" data-save-movement>GUARDAR</button></div><p id="modal-error" class="modal-error" role="alert"></p>`);
  }
  async function saveMovement(){const kind=$('#movement-kind')?.value,category=$('#movement-category')?.value,label=$('#movement-label')?.value.trim(),amountCents=money($('#movement-amount')?.value||'');if(!label||!amountCents||amountCents<=0){modalError('Escribe una descripción y un importe positivo.');return;}
    const b=$('[data-save-movement]');b.disabled=true;try{await api.api('/api/admin/expenses',{method:'POST',role:'admin',data:{id:uid(),kind,category,label,amountCents}});closeModal();await load();render();}catch(e){modalError(e.message);b.disabled=false;}}
  async function openCash(){const amount=money($('#opening-input')?.value||'');if(amount===null){alert('Escribe un fondo inicial válido.');return;}
    if(!confirm('¿Registrar fondo inicial de '+peso(amount)+' para el turno '+state.day+'?'))return;
    try{await api.api('/api/admin/openings',{method:'POST',role:'admin',data:{shiftKey:state.day,openingCents:amount}});await load();render();}catch(e){alert('No se pudo abrir caja: '+e.message);}}
  async function closeCash(){const countedCents=money(state.counted);if(countedCents===null){alert('Escribe cuánto efectivo contaste.');return;}
    const d=turn();if(!d.opening){alert('Primero abre la caja.');return;}
    if(!confirm(`¿Guardar el corte del ${state.day}?\nEsperado: ${peso(d.expected)}\nContado: ${peso(countedCents)}\nDiferencia: ${peso(countedCents-d.expected)}\n\nEl cierre no se podrá modificar.`))return;
    try{await api.api('/api/admin/closures',{method:'POST',role:'admin',data:{shiftKey:state.day,countedCents,note:state.note||''}});state.counted='';state.note='';await load();render();}catch(e){alert('No se pudo cerrar: '+e.message);}}
  function csvDownload(filename,rows){const safeCell=value=>{let s=String(value??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const content='\ufeff'+rows.map(row=>row.map(safeCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),2500);}
  function exportSales(all=false){const data=all?F.overview(currentData(),F.dayList(365)):turn(),receipts=all?data.items:data.receipts,entries=all?data.entries:data.entries;
    const rows=[['Fecha y hora','Tipo','Mesa / descripción','Venta MXN','Propina MXN','Efectivo venta MXN','Transferencia MXN','Categoría']];
    for(const r of receipts)rows.push([r.createdAt,'Cobro',r.order?.tableLabel||'',(r.totalCents/100).toFixed(2),(r.tipCents/100).toFixed(2),(F.cashSale(r)/100).toFixed(2),(F.transferSale(r)/100).toFixed(2),'']);
    for(const e of entries)rows.push([e.createdAt,e.kind,e.label,(e.amount/100).toFixed(2),'','','',categoryLabel(e.category)]);
    csvDownload(`parrilla-${all?'ultimos-365-dias':state.day}.csv`,rows);
  }
  function purgeModal(){modal(`<h2>Eliminar datos del ${escape(state.day)}</h2><div class="banner alert">Solo para pruebas. Se borrarán ventas, propinas, movimientos y corte del día de los reportes. Los pedidos pagados permanecerán cerrados. Acción irreversible.</div><p>Antes descarga el respaldo CSV.</p><label class="field"><span>Escribe exactamente ELIMINAR ${escape(state.day)}</span><input id="purge-code" autocomplete="off" placeholder="ELIMINAR ${escape(state.day)}"></label><div class="modal-actions"><button class="action secondary" data-modal-close>CANCELAR</button><button class="action danger" data-confirm-purge>ELIMINAR</button></div><p id="modal-error" class="modal-error" role="alert"></p>`);}
  async function purge(){const typed=$('#purge-code')?.value.trim();if(typed!=='ELIMINAR '+state.day){modalError('La confirmación no coincide.');return;}const button=$('[data-confirm-purge]');button.disabled=true;try{await api.api('/api/admin/purge-day',{method:'POST',role:'admin',data:{day:state.day,confirm:typed}});closeModal();await load();render();}catch(e){modalError(e.message);button.disabled=false;}}
  let liveStop=null;function startLive(){liveStop?.();if(!connected()){state.data=null;render();return;}liveStop=api.live('admin',()=>{void load()},()=>{});void load();}
  document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;const d=button.dataset;
    if(d.page){state.page=d.page;render();$('#admin-content').scrollTop=0;return;}
    if(d.range){state.range=d.range;render();return;}
    if('pair' in d){void pair();return;}
    if('refresh' in d){void load();return;}
    if('newMovement' in d){movementModal(d.defaultKind||'cash_out','ingredients');return;}
    if(d.category){movementModal('cash_out',d.category);return;}
    if('prefillPay' in d){$('#movement-kind').value='cash_out';$('#movement-category').value='payroll';$('#movement-amount').value='250';$('#movement-label').value='Sueldo mesero';return;}
    if('saveMovement' in d){void saveMovement();return;}
    if('openCash' in d){void openCash();return;}
    if('closeShift' in d){void closeCash();return;}
    if('exportDay' in d){exportSales(false);return;}
    if('exportAll' in d){exportSales(true);return;}
    if('openPurge' in d){purgeModal();return;}
    if('confirmPurge' in d){void purge();return;}
    if('modalClose' in d){closeModal();return;}
  });
  document.addEventListener('change',e=>{if(e.target.id==='shift-day'){state.day=e.target.value;state.counted='';state.note='';render();}});
  document.addEventListener('input',e=>{if(e.target.id==='counted')state.counted=e.target.value;if(e.target.id==='close-note')state.note=e.target.value;});
  $('#refresh').onclick=()=>{void load()};
  $('#pair-panel').onclick=()=>connected()?modal('<h2>Dispositivo vinculado</h2><p>Administración está autorizada para consultar reportes y registrar cortes.</p><button class="action secondary" data-modal-close>CERRAR</button>'):render();
  $('#admin-modal').addEventListener('click',e=>{if(e.target.id==='admin-modal')closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  window.addEventListener('online',()=>void load());
  window.addEventListener('pedidos-cf-auth-changed',startLive);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load()});
  if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
  startLive();setInterval(()=>{if(connected()&&!document.hidden)void load()},60000);
})();
