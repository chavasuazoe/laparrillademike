/* Complete kitchen tickets: stable plate groups, immediate checks, retry queue. */
(()=>{'use strict';
const cf=window.PedidosCloudflare,$=s=>document.querySelector(s),esc=AppCore.escapeHtml;
const CACHE='parrilla-v10-kitchen-tickets',PENDING='parrilla-v10-kitchen-pending',LAST='parrilla-v10-kitchen-last-check';
const time=t=>new Date(t||Date.now()).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
const read=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}};
let tickets=read(CACHE,[]),pending=read(PENDING,{}),fetchOK=false,socketOK=false,working=false,loading=false,flushing=false,configOpen=false,liveStop=null,pinnedId=null,lastFinishedId=null,lastChecked=read(LAST,null),displayedTicketId=null;
if(!Array.isArray(tickets))tickets=[];if(!pending||typeof pending!=='object'||Array.isArray(pending))pending={};
const msg=t=>$('#status-message').textContent=t;
const linked=()=>cf?.enabled()&&!!cf.token('cocina');
const key=(tid,iid)=>`${tid}|${iid}`;
const persist=()=>{try{localStorage.setItem(CACHE,JSON.stringify(tickets));localStorage.setItem(PENDING,JSON.stringify(pending));}catch(e){msg('Almacenamiento lleno: no se pudo conservar el check.')}};
function active(){let list=tickets.filter(t=>t.status!=='done').sort((a,b)=>Number(!!b.priority)-Number(!!a.priority)||new Date(a.receivedAt||a.createdAt)-new Date(b.receivedAt||b.createdAt));let pin=list.find(t=>t.id===pinnedId);if(pin){list.splice(list.indexOf(pin),1);list.unshift(pin)}else pinnedId=list[0]?.id||null;return list;}
function totals(list){const result={maizQ:0,harinaQ:0,maiz:0,harina:0,gringas:0,volcanes:0};for(const t of list)for(const i of t.items||[]){if(i.checked)continue;const name=String(i.name||'').toLowerCase(),detail=String(i.detail||'').toLowerCase(),n=Number(i.qty)||0;if(name.includes('taco')){const h=detail.includes('harina'),q=detail.includes('con queso');result[h?(q?'harinaQ':'harina'):(q?'maizQ':'maiz')]+=n;}else if(name.includes('gringa'))result.gringas+=n;else if(name.includes('volcán')||name.includes('volcan'))result.volcanes+=n;}return result;}
function summary(list){const t=totals(list);return `<section class="k-stats" aria-label="Pendiente para tortillera">${[['MAÍZ + QUESO',t.maizQ],['HARINA + QUESO',t.harinaQ],['MAÍZ',t.maiz],['HARINA',t.harina],['GRINGAS',t.gringas],['VOLCANES',t.volcanes]].map(([name,n])=>`<div class="k-stat ${n?'active':''}"><strong>${n}</strong><span>${name}</span></div>`).join('')}</section>`;}
function plateBlocks(items){
 const blocks=[];
 for(const item of items){
  const group=Math.max(1,Math.min(99,Number(item.group)||1));
  if(!blocks.length||blocks[blocks.length-1].group!==group)blocks.push({group,items:[]});
  blocks[blocks.length-1].items.push(item);
 }
 return blocks;
}
function render(){
 const queue=active(),current=queue[0],waiting=Object.keys(pending).length;
 const label=!linked()?'SIN VINCULAR':waiting?`GUARDANDO ${waiting}`:socketOK?'EN VIVO':fetchOK?'CONECTADA':'SIN CONEXIÓN';
 $('#connection').textContent=label;
 $('#connection').className='badge '+(waiting?'warn':socketOK?'good':!linked()||!fetchOK?'bad':'warn');
 $('#count-quick').textContent=queue.length+' '+(queue.length===1?'comanda':'comandas');
 $('#config-toggle').textContent=linked()?'Dispositivo':'Vincular';
 const last=tickets.find(t=>t.id===lastFinishedId)||tickets.filter(t=>t.status==='done').sort((a,b)=>String(b.finishedAt||'').localeCompare(String(a.finishedAt||'')))[0];
 $('#undo-done').disabled=!linked()||!fetchOK||!last||working;
 $('#undo-done').dataset.id=last?.id||'';
 if(!current){
  displayedTicketId=null;
  $('#ticket').innerHTML=`<section class="k-empty"><strong>${!linked()?'VINCULA COCINA':!navigator.onLine?'SIN INTERNET':'TODO LISTO'}</strong><span>${!linked()?'Usa el código del mesero':!navigator.onLine?'La pantalla volverá a sincronizarse':'Las comandas aparecerán aquí'}</span></section>`;
  $('#finish').disabled=true;$('#finish').textContent='SIN COMANDAS';$('#undo-check').disabled=true;return;
 }
 const oldScroll=$('#ticket .k-scroll');
 const sameTicket=displayedTicketId===current.id,scrollTop=sameTicket?(oldScroll?.scrollTop||0):0;
 displayedTicketId=current.id;
 const rows=current.items||[],open=rows.filter(i=>!i.checked),checked=rows.length-open.length;
 const firstPending=open[0]?.id;
 const blocks=plateBlocks(rows);
 const notices=(current.changes||[]).map((change,index)=>`<div class="k-change"><strong>AVISO ${index+1}</strong><span>${esc(change)}</span></div>`).join('');
 const body=blocks.map(block=>`<section class="k-plate" aria-label="Plato ${block.group}">
  <header class="k-plate-header"><strong>PLATO ${block.group}</strong><span>${block.items.filter(i=>i.checked).length}/${block.items.length} LISTOS</span></header>
  <div class="k-plate-items">${block.items.map(i=>{
   const done=!!i.checked,unsaved=!!pending[key(current.id,i.id)],isNext=i.id===firstPending;
   return `<button class="k-row ${done?'is-checked':''} ${unsaved?'is-unsaved':''} ${isNext?'is-next':''}" type="button" data-check-item="${esc(i.id)}" data-check-ticket="${esc(current.id)}" aria-pressed="${done}" aria-label="${done?'Desmarcar':'Marcar'} ${esc(i.name)}, plato ${block.group}">
    <span class="k-check" aria-hidden="true">${done?'✓':''}</span><strong class="k-qty">${Number(i.qty)||1}×</strong>
    <span class="k-row-text"><strong>${esc(i.name)}</strong>${i.detail?`<small>${esc(i.detail)}</small>`:''}</span>
    ${unsaved?'<span class="k-unsaved" title="Pendiente de sincronizar">•</span>':''}
   </button>`}).join('')}</div>
 </section>`).join('');
 const clean=rows.length===checked&&rows.length>0;
 const noticesSection=notices?`<section class="k-notices" aria-label="Avisos de cocina">${notices}</section>`:'';
 $('#ticket').innerHTML=`${summary(queue)}
  <div class="k-ticket-head"><div class="k-table-name"><span>${current.priority?'AGREGADO · PRIORIDAD':'MESA'}</span><strong>${esc(current.tableLabel)}</strong></div>
   <div class="k-progress"><strong>${checked}/${rows.length}</strong><small>LISTOS</small><span>${time(current.receivedAt||current.createdAt)}</span></div></div>
  <div class="k-scroll" aria-label="Comanda completa" tabindex="0">
   ${noticesSection}
   <div class="k-plates ${blocks.length>1?'k-multi-plate':''}">${body||`<div class="k-complete"><strong>SOLO AVISOS</strong><span>Revisa las modificaciones antes de terminar</span></div>`}</div>
  </div>`;
 const content=$('#ticket .k-scroll');
 if(content)content.scrollTop=scrollTop;
 $('#ticket').classList.toggle('k-dense',rows.length>7);
 $('#undo-check').disabled=!lastChecked||lastChecked.ticketId!==current.id||working;
 const finishButton=$('#finish');
 if(open.length){finishButton.textContent=`MARCAR SIGUIENTE · ${open.length} PENDIENTE${open.length===1?'':'S'}`;finishButton.disabled=working;}
 else if(waiting){finishButton.textContent='SINCRONIZANDO…';finishButton.disabled=true;}
 else{finishButton.textContent='TERMINAR COMANDA →';finishButton.disabled=working||!fetchOK;}
}
function updateLocal(tid,iid,checked){const t=tickets.find(t=>t.id===tid),i=t?.items?.find(x=>x.id===iid);if(!i)return false;i.checked=checked;persist();render();return true;}
function markItem(ticketId,itemId,checked){if(working)return;const item=tickets.find(t=>t.id===ticketId)?.items?.find(i=>i.id===itemId);if(!item||item.checked===checked)return;
if(!updateLocal(ticketId,itemId,checked))return;pending[key(ticketId,itemId)]={ticketId,itemId,checked};lastChecked=checked?{ticketId,itemId}:null;try{localStorage.setItem(LAST,JSON.stringify(lastChecked))}catch(_){}persist();render();void flush();}
async function flush(){if(flushing||!linked()||!navigator.onLine)return;flushing=true;
try{for(const [k,p] of Object.entries({...pending})){if(!pending[k])continue;try{await cf.api('/api/tickets/'+encodeURIComponent(p.ticketId)+'/items/'+encodeURIComponent(p.itemId)+'/check',{method:'POST',role:'cocina',data:{checked:p.checked},timeout:12000});if(pending[k]?.checked===p.checked)delete pending[k];persist();}catch(e){if(/Producto no encontrado|Comanda no disponible/.test(e.message||'')){delete pending[k];persist();msg('El servidor rechazó un check antiguo. Se actualizó la cola.');void refresh();continue;}msg('Check pendiente; reintentaremos al recuperar señal: '+e.message);break;}}}finally{flushing=false;render();}}
async function refresh(){if(!linked()||!navigator.onLine){fetchOK=false;socketOK=false;render();return;}if(loading)return;loading=true;
try{const response=await cf.api('/api/tickets',{role:'cocina'});const fresh=response.tickets||[];for(const p of Object.values(pending)){const item=fresh.find(t=>t.id===p.ticketId)?.items?.find(i=>i.id===p.itemId);if(item)item.checked=p.checked;}tickets=fresh;fetchOK=true;persist();msg('Sincronizado · '+time(Date.now()));}catch(e){fetchOK=false;msg('Sin conexión; conserva la comanda en pantalla');}finally{loading=false;render();}void flush();}
async function finish(id){if(working||!linked()||!fetchOK||Object.keys(pending).length)return;working=true;render();try{await cf.api('/api/tickets/'+encodeURIComponent(id)+'/finish',{method:'POST',role:'cocina',data:{}});lastFinishedId=id;pinnedId=null;lastChecked=null;try{localStorage.removeItem(LAST)}catch(_){}tickets.find(t=>t.id===id).status='done';persist();render();void refresh();}catch(e){msg('No se pudo finalizar: '+e.message);void refresh()}finally{working=false;render();}}
async function undoDone(){const id=$('#undo-done').dataset.id;if(working||!id||!fetchOK)return;working=true;try{await cf.api('/api/tickets/'+encodeURIComponent(id)+'/reopen',{method:'POST',role:'cocina',data:{}});lastFinishedId=null;pinnedId=id;await refresh();}catch(e){msg('No se pudo reabrir: '+e.message)}finally{working=false;render()}}
function setup(show){configOpen=show;$('#setup').classList.toggle('active',show);$('#config-toggle').setAttribute('aria-expanded',String(show));}
function startLive(){liveStop?.();liveStop=null;socketOK=false;if(linked()){liveStop=cf.live('cocina',()=>{void refresh()},value=>{socketOK=value;render()});void refresh();}else{fetchOK=false;render();}}
$('#config-toggle').onclick=()=>setup(!configOpen);
$('#refresh').onclick=()=>{void refresh()};$('#undo-done').onclick=()=>void undoDone();
$('#undo-check').onclick=()=>{if(lastChecked)markItem(lastChecked.ticketId,lastChecked.itemId,false)};
$('#finish').onclick=()=>{const current=active()[0];if(!current)return;const first=(current.items||[]).find(i=>!i.checked);if(first)markItem(current.id,first.id,true);else void finish(current.id);};
document.addEventListener('click',e=>{const row=e.target.closest('[data-check-item]');if(!row)return;const item=tickets.find(t=>t.id===row.dataset.checkTicket)?.items?.find(i=>i.id===row.dataset.checkItem);if(item)markItem(row.dataset.checkTicket,row.dataset.checkItem,!item.checked);});
$('#save-config').onclick=async()=>{const code=$('#pair-code').value.trim();if(!/^\d{6}$/.test(code)){msg('Escribe 6 dígitos');return;}$('#save-config').disabled=true;try{await cf.pair(code);$('#pair-code').value='';setup(false);msg('Cocina vinculada');startLive();}catch(e){msg('No se pudo vincular: '+e.message)}finally{$('#save-config').disabled=false}};
$('#disconnect').onclick=()=>{if(!linked()){setup(false);return;}if(!confirm('¿Desvincular cocina? Necesitarás otro código.'))return;cf.clear('cocina');startLive();setup(true);};
document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();$('#finish').click()}else if(e.key.toLowerCase()==='r'){e.preventDefault();$('#refresh').click()}});
window.addEventListener('online',()=>{void flush();startLive()});window.addEventListener('resize',render);window.addEventListener('pedidos-cf-auth-changed',startLive);document.addEventListener('visibilitychange',()=>{if(!document.hidden){void refresh();void flush()}});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
if(!linked())setup(true);startLive();setInterval(()=>{if(!document.hidden){void flush();void refresh()}},8000);
})();
