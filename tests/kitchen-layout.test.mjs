import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(root+'/assets/js/kitchen.js','utf8');
const css=readFileSync(root+'/assets/css/kitchen.css','utf8');
function fixture(){
 const ticket={id:'t1',tableLabel:'M1',status:'queued',createdAt:'2026-11-06T23:00:00.000Z',items:[
  {id:'a',name:'Taco Sirloin',qty:1,detail:'Maíz',group:1,checked:false},
  {id:'b',name:'Taco Chuleta',qty:2,detail:'Maíz con queso',group:1,checked:false},
  {id:'c',name:'Gringa',qty:1,detail:'Arrachera',group:2,checked:false},
  {id:'d',name:'Volcán',qty:1,detail:'Carne',group:2,checked:false}
 ],changes:['SIN CEBOLLA','CAMBIAR SALSA']};
 const store=new Map([['parrilla-v10-kitchen-tickets',JSON.stringify([ticket])]]),els=new Map(),listeners=new Map();
 const el=s=>{if(!els.has(s))els.set(s,{textContent:'',innerHTML:'',dataset:{},disabled:false,className:'',value:'',scrollTop:0,classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(){}});return els.get(s)};
 const doc={hidden:false,activeElement:{tagName:'BODY'},querySelector:el,addEventListener:(name,fn)=>listeners.set(name,fn)};
 const context={document:doc,navigator:{onLine:false},location:{protocol:'file:'},window:{addEventListener(){},innerHeight:700},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},AppCore:{escapeHtml:x=>String(x)},PedidosCloudflare:{enabled:()=>false,token:()=>null},setInterval(){},Date,Math,Number,String,Array,Object,JSON,Intl,console};
 vm.runInNewContext(source,context,{timeout:1000});
 return {el,listeners,store};
}
test('complete order shows every product with both plates and all notices',()=>{
 const {el}=fixture();const html=el('#ticket').innerHTML;
 assert.equal((html.match(/class="k-row /g)||[]).length,4);
 assert.match(html,/PLATO 1/);assert.match(html,/PLATO 2/);
 assert.ok(html.indexOf('Taco Sirloin')<html.indexOf('Taco Chuleta'));
 assert.ok(html.indexOf('Taco Chuleta')<html.indexOf('Gringa'));
 assert.ok(html.indexOf('Gringa')<html.indexOf('Volcán'));
 assert.match(html,/SIN CEBOLLA/);assert.match(html,/CAMBIAR SALSA/);
 assert.doesNotMatch(html,/producto(s)? más después/);
});
test('checked items remain at the same location, turn green, and can be unchecked',()=>{
 const {el,listeners,store}=fixture();
 const action=()=>({dataset:{checkTicket:'t1',checkItem:'b'}});
 const click=listeners.get('click');click({target:{closest:sel=>sel==='[data-check-item]'?action():null}});
 let html=el('#ticket').innerHTML;
 assert.equal((html.match(/class="k-row /g)||[]).length,4);
 assert.ok(html.indexOf('Taco Sirloin')<html.indexOf('Taco Chuleta'));
 assert.match(html,/k-row is-checked/);
 assert.match(html,/aria-pressed="true" aria-label="Desmarcar Taco Chuleta/);
 let pending=JSON.parse(store.get('parrilla-v10-kitchen-pending'));
 assert.equal(pending['t1|b'].checked,true);
 click({target:{closest:sel=>sel==='[data-check-item]'?action():null}});
 html=el('#ticket').innerHTML;
 assert.match(html,/aria-pressed="false" aria-label="Marcar Taco Chuleta/);
 pending=JSON.parse(store.get('parrilla-v10-kitchen-pending'));
 assert.equal(pending['t1|b'].checked,false);
});
test('finish button marks one item at a time, keeping the full order visible',()=>{
 const {el}=fixture();const count=()=> (el('#ticket').innerHTML.match(/class="k-row /g)||[]).length;
 assert.match(el('#finish').textContent,/MARCAR SIGUIENTE/);
 el('#finish').onclick();
 assert.equal(count(),4);
 assert.match(el('#ticket').innerHTML,/k-row is-checked/);
});
test('small device uses scrolling only inside ticket while header and controls remain fixed',()=>{
 assert.match(css,/\.k-scroll\{[^}]*overflow-y:auto/);
 assert.match(css,/\.ux-kitchen-footer\{[^}]*position:fixed/);
 assert.match(css,/\.k-plate-header/);
 assert.doesNotMatch(source,/maxRows|open\.slice\(/);
});
