/* Shared client; device credentials remain in local browser storage. */
(function(){'use strict';
 const KEY='parrilla-v10-auth';
 const key=role=>KEY+'-'+role;
 const base=String(window.PEDIDOS_CLOUDFLARE?.url||'').replace(/\/$/,'');
 const enabled=()=>/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?::\d+)?$/i.test(base)&&!base.includes('CAMBIA-');
 const credentials=(role='mesero')=>{try{return JSON.parse(localStorage.getItem(key(role))||'null')||{}}catch{return {}}};
 const token=role=>credentials(role).token||null;
 const store=v=>localStorage.setItem(key(v.role),JSON.stringify(v));
 const clear=(role='mesero')=>localStorage.removeItem(key(role));
 async function api(path,{method='GET',data,role,timeout=12000}={}) {
   if(!enabled())throw Error('Revisa la URL de Cloudflare en assets/js/config.js');
   const t=token(role||'mesero');
   if(!t && !['/api/bootstrap','/api/pair','/api/recover','/api/recover-mesero','/api/health'].includes(path))throw Error('Dispositivo sin vincular');
   const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);
   try{
     const res=await fetch(base+path,{method,cache:'no-store',signal:ctrl.signal,
       headers:{...(t?{'Authorization':'Bearer '+t}:{}),...(data!==undefined?{'Content-Type':'application/json'}:{})},
       body:data!==undefined?JSON.stringify(data):undefined});
     let result={};try{result=await res.json()}catch(_){}
     if(!res.ok){if(res.status===401 && t){clear(role||'mesero');window.dispatchEvent(new Event('pedidos-cf-auth-changed'));}throw Error(result.error||('Servidor HTTP '+res.status));}
     return result;
   } catch(e){if(e.name==='AbortError')throw Error('Tiempo de espera agotado');throw e;}finally{clearTimeout(timer);}
 }
 async function bootstrap(code,recover=false){const r=await api(recover?'/api/recover':'/api/bootstrap',{method:'POST',data:{code}});store(r);window.dispatchEvent(new Event('pedidos-cf-auth-changed'));return r;}
 async function pair(code){const r=await api('/api/pair',{method:'POST',data:{code}});store(r);window.dispatchEvent(new Event('pedidos-cf-auth-changed'));return r;}
 async function recoverWaiter(code){const r=await api('/api/recover-mesero',{method:'POST',data:{code},role:'mesero'});store(r);window.dispatchEvent(new Event('pedidos-cf-auth-changed'));return r;}
 function live(role,onChange,onState){let ws=null,closed=false,retry=null,attempt=0;
   async function connect(){
     if(closed||!enabled()||!token(role)||!navigator.onLine)return;
     try{
       const {ticket}=await api('/api/ws-ticket',{method:'POST',data:{},role});
       if(closed)return;
       ws=new WebSocket(base.replace(/^https:/,'wss:')+'/api/live?ticket='+encodeURIComponent(ticket));
       ws.onopen=()=>{attempt=0;onState?.(true)};
       ws.onmessage=e=>{try{if(JSON.parse(e.data).type==='tickets:changed')onChange?.()}catch(_){}};
       ws.onerror=()=>{onState?.(false)};
       ws.onclose=()=>{onState?.(false);if(!closed)schedule();};
     }catch(e){onState?.(false);schedule();}
   }
   function schedule(){if(closed)return;clearTimeout(retry);retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(attempt++,5)));}
   const resume=()=>{if(closed)return;if(ws && (ws.readyState===WebSocket.OPEN||ws.readyState===WebSocket.CONNECTING))return;clearTimeout(retry);connect();};
   window.addEventListener('online',resume);
   document.addEventListener('visibilitychange',resume);
   connect();
   return ()=>{closed=true;clearTimeout(retry);window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume);try{ws?.close()}catch(_){}};
 }
 window.PedidosCloudflare=Object.freeze({enabled,credentials,token,store,clear,api,bootstrap,pair,recoverWaiter,live,base});
})();

