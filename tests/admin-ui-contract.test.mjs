import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function makeNode(){return {innerHTML:'',textContent:'',disabled:false,classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return []},setAttribute(){},addEventListener(){}};}
test('Administration renders the five financial sections with a shared online data source',async()=>{
 const nodes=Object.fromEntries(['#admin-content','#admin-nav','#status-dot','#refresh','#pair-panel','#admin-modal','#modal-body'].map(k=>[k,makeNode()]));
 const nav=['dashboard','cash','movements','analysis','data'].map(page=>({dataset:{page},classList:{toggle(){}},setAttribute(){}}));
 nodes['#admin-nav'].querySelectorAll=()=>nav;
 const clickHandlers=[];
 const today=new Date().toISOString();
 const response={receipts:[{id:'one',createdAt:today,totalCents:4000,cashCents:4000,transferCents:0,changeCents:0,tipCents:0,order:{tableLabel:'M1',createdAt:today,items:[{name:'Sirloin',qty:1,priceCents:4000}]}}],expenses:[],openings:[],closures:[],openOrders:[],purges:[],hasMore:false,nextOffset:1};
 const window={addEventListener(){},PedidosCloudflare:{enabled:()=>true,token:()=> 'valid',live:()=>()=>{},api:async()=>response},AppCore:{escapeHtml:s=>String(s),createId:()=>String(Date.now())}};
 const document={activeElement:{tagName:'BODY'},querySelector:x=>nodes[x]||makeNode(),addEventListener:(event,fn)=>{if(event==='click')clickHandlers.push(fn)}};
 const context={window,document,Intl,Date,Number,Object,Array,Map,Set,URL,Blob,console,location:{protocol:'about:'},navigator:{},setInterval:()=>0,setTimeout:()=>0,clearTimeout:()=>{},alert:()=>{},confirm:()=>true,AppCore:window.AppCore};
 vm.runInNewContext(read('assets/js/admin-finance.js'),context);
 vm.runInNewContext(read('assets/js/admin.js'),context);
 await new Promise(resolve=>setTimeout(resolve,20));
 assert.match(nodes['#admin-content'].innerHTML,/Resumen de hoy/);
 for(const [page,expected] of [['cash','Caja y corte'],['movements','Gastos y movimientos'],['analysis','Análisis'],['data','Registros y respaldo']]){
  clickHandlers[0]({target:{closest:()=>({dataset:{page}})}});
  assert.match(nodes['#admin-content'].innerHTML,new RegExp(expected));
 }
});
