import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import vm from 'node:vm';
import {KitchenRoom,businessShiftKey} from '../cloudflare/src/worker.mjs';

const financeCode=readFileSync(new URL('../assets/js/admin-finance.js',import.meta.url),'utf8');
const context={window:{},Intl,Date,Number,Object,Array,Set,Map};vm.runInNewContext(financeCode,context);
const F=context.window.AdminFinance;
function fixture(){
 const db=new DatabaseSync(':memory:');
 const sql={exec(q,...args){if(/^\s*SELECT\b/i.test(q))return {toArray:()=>db.prepare(q).all(...args)};if(args.length)db.prepare(q).run(...args);else db.exec(q);return {toArray:()=>[]};}};
 const room=new KitchenRoom({storage:{sql},getWebSockets:()=>[]},{SETUP_CODE:'private-test-code-for-owner'});
 const request=(path,token,body,method='POST')=>room.fetch(new Request('https://test.local'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}));
 return {db,room,request};
}
test('Cash reconciliation excludes tips and separates transfers, cash drops and expenses',()=>{
 const day='2026-11-06';const stamp=day+'T21:00:00-06:00';
 const result=F.dayTotals({
  receipts:[{createdAt:stamp,totalCents:11000,cashCents:12000,changeCents:2000,transferCents:1000,tipCents:1300}],
  expenses:[{createdAt:stamp,kind:'cash_out',amount:2100,category:'ingredients'},{createdAt:stamp,kind:'expense',amount:3000,category:'rent'},{createdAt:stamp,kind:'cash_in',amount:2500},{createdAt:stamp,kind:'cash_drop',amount:1200}],
  openings:[{shiftKey:day,openingCents:5000}]
 },day);
 assert.equal(result.sales,11000);assert.equal(result.cash,10000);assert.equal(result.transfer,1000);
 assert.equal(result.expected,5000+10000+2500-2100-1200);
 assert.equal(result.costs,5100);assert.equal(result.recordedBalance,5900);
 assert.equal(result.tips,1300);assert.equal(result.waiterTips,910);assert.equal(result.kitchenTips,390);
});
test('Receipts after midnight belong to the preceding operating day',()=>{
 assert.equal(F.businessDay('2026-11-07T04:20:00-06:00'),'2026-11-06');
 assert.equal(F.businessDay('2026-11-07T19:00:00-06:00'),'2026-11-07');
});
test('Opening float and server-owned close snapshot are immutable',async()=>{
 const {room,request,db}=fixture();const admin=(await room.issue('admin')).token,waiter=(await room.issue('mesero')).token,day=businessShiftKey();
 assert.equal((await request('/api/admin/openings',waiter,{shiftKey:day,openingCents:4000})).status,403);
 assert.equal((await request('/api/admin/closures',admin,{shiftKey:day,countedCents:12000,note:''})).status,409);
 assert.equal((await request('/api/admin/openings',admin,{shiftKey:day,openingCents:4000})).status,201);
 assert.equal((await request('/api/admin/openings',admin,{shiftKey:day,openingCents:9999})).status,200);
 const events=[['cash_in',2000],['cash_out',1000],['cash_drop',500],['expense',3000]];
 for(let i=0;i<events.length;i++){const [kind,amountCents]=events[i];assert.equal((await request('/api/admin/expenses',admin,{id:'e'+i,kind,amountCents,category:'ingredients',label:'movimiento'})).status,200);}
 const close=await request('/api/admin/closures',admin,{shiftKey:day,countedCents:4500,note:'Contado'});assert.equal(close.status,201);
 const {closure}=await close.json();assert.equal(closure.openingCents,4000);assert.equal(closure.expectedCents,4500);assert.equal(closure.varianceCents,0);
 assert.equal((await request('/api/admin/closures',admin,{shiftKey:day,countedCents:1,note:'otra'})).status,200);
 assert.equal((await request('/api/admin/openings',admin,{shiftKey:day,openingCents:100})).status,409);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM admin_closures').get().n,1);
});
test('Reports paginate all receipts rather than silently limiting to the first 500',async()=>{
 const {db,room,request}=fixture(),admin=(await room.issue('admin')).token;
 const insert=db.prepare('INSERT INTO pos_receipts(id,order_id,payload,created_at) VALUES (?,?,?,?)');
 for(let i=0;i<412;i++)insert.run('receipt-'+i,'order-'+i,JSON.stringify({totalCents:4000,cashCents:4000,changeCents:0,tipCents:0,transferCents:0}),Date.now()-i);
 const pages=[];let offset=0;do{const response=await (await request('/api/admin/data?offset='+offset,admin,null,'GET')).json();pages.push(response);offset=response.nextOffset;if(!response.hasMore)break;}while(pages.length<5);
 assert.deepEqual(pages.map(p=>p.receipts.length),[200,200,12]);
 assert.equal(pages[0].totalReceipts,412);assert.equal(pages[2].hasMore,false);
});
test('Expenses cannot be created by Kitchen and categories are persisted',async()=>{
 const {room,request,db}=fixture(),admin=(await room.issue('admin')).token,kitchen=(await room.issue('cocina')).token;
 const movement={id:'exp1',kind:'cash_out',category:'payroll',label:'Sueldo',amountCents:25000};
 assert.equal((await request('/api/admin/expenses',kitchen,movement)).status,403);
 assert.equal((await request('/api/admin/expenses',admin,movement)).status,200);
 assert.equal(db.prepare('SELECT category FROM admin_expenses WHERE id=?').get('exp1').category,'payroll');
});
