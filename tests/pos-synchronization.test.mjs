import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {KitchenRoom,businessShiftKey} from '../cloudflare/src/worker.mjs';
function fixture(){
 const db=new DatabaseSync(':memory:');
 const sql={exec(q,...a){if(/^\s*SELECT\b/i.test(q))return {toArray:()=>db.prepare(q).all(...a)};if(a.length)db.prepare(q).run(...a);else db.exec(q);return {toArray:()=>[]}}};
 const room=new KitchenRoom({storage:{sql},getWebSockets:()=>[]},{SETUP_CODE:'private-code-unit-test'});
 const req=(path,token,data,method='POST')=>room.fetch(new Request('https://unit.local'+path,{method,headers:{...(token?{'Authorization':'Bearer '+token}:{}),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})}));
 return {room,db,req};
}
const order=(id,total=4000)=>({id,tableLabel:'M1',status:'open',clientUpdatedAt:Date.now(),createdAt:new Date().toISOString(),guestCount:3,items:[{id:'i-'+id,name:'Taco Sirloin',qty:1,priceCents:total,state:'sent',category:'Tacos',cheese:false,group:1,description:'Maíz'}]});
test('Kitchen saves per-item checks, keeps group separators and does not allow waiter to mark food',async()=>{
 const {room,req}=fixture(),waiter=(await room.issue('mesero')).token,kitchen=(await room.issue('cocina')).token;
 const ticket={id:'t1',orderId:'o1',tableLabel:'M1',createdAt:new Date().toISOString(),priority:true,items:[{id:'i1',name:'Taco Sirloin',qty:2,detail:'Maíz',group:1},{id:'i2',name:'Taco Chuleta',qty:1,detail:'Harina con queso',group:2}],changes:[]};
 assert.equal((await req('/api/tickets',waiter,ticket)).status,201);
 assert.equal((await req('/api/tickets/t1/items/i1/check',waiter,{checked:true})).status,403);
 assert.equal((await req('/api/tickets/t1/items/i1/check',kitchen,{checked:true})).status,200);
 let found=(await (await req('/api/tickets',kitchen,null,'GET')).json()).tickets[0];
 assert.equal(found.priority,true);assert.equal(found.items[0].checked,true);assert.equal(found.items[1].group,2);
 assert.equal((await req('/api/tickets/t1/finish',kitchen,{})).status,409);
 assert.equal((await req('/api/tickets/t1/items/i2/check',kitchen,{checked:true})).status,200);
 assert.equal((await req('/api/tickets/t1/finish',kitchen,{})).status,200);
});
test('Only waiter can charge; duplicated receipts and tips are idempotent',async()=>{
 const {room,req,db}=fixture(),waiter=(await room.issue('mesero')).token,admin=(await room.issue('admin')).token;
 assert.equal((await req('/api/pos/orders',waiter,order('o1',12000))).status,200);
 assert.equal((await req('/api/pos/orders/o1/paid',admin,{receiptId:'r1',totalCents:12000,tipCents:0,method:'cash'})).status,403);
 const charge={receiptId:'r1',totalCents:12000,tipCents:1000,method:'cash',cashCents:20000,transferCents:0,changeCents:8000};
 assert.equal((await req('/api/pos/orders/o1/paid',waiter,charge)).status,200);
 const dupe=await (await req('/api/pos/orders/o1/paid',waiter,{...charge,receiptId:'r2'})).json();assert.equal(dupe.duplicate,true);
 assert.equal(db.prepare('SELECT COUNT(*) c FROM pos_receipts').get().c,1);
 const tip={id:'tip1',amountCents:500};await req('/api/pos/receipts/r1/tips',waiter,tip);await req('/api/pos/receipts/r1/tips',waiter,tip);
 const result=await (await req('/api/admin/data',admin,null,'GET')).json();
 assert.equal(result.receipts.length,1);assert.equal(result.receipts[0].tipCents,1500);
 assert.equal(result.receipts[0].order.guestCount,3);
 assert.equal((await req('/api/admin/data',waiter,null,'GET')).status,403);
});
test('Server rejects paying after a late taco changed the total',async()=>{
 const {room,req}=fixture(),waiter=(await room.issue('mesero')).token;
 await req('/api/pos/orders',waiter,order('o1',8000));
 assert.equal((await req('/api/pos/orders/o1/paid',waiter,{receiptId:'r1',totalCents:4000,tipCents:0,method:'cash'})).status,409);
});
test('Admin-only cash movements and unique shift closure survive reload',async()=>{
 const {room,req,db}=fixture(),admin=(await room.issue('admin')).token,waiter=(await room.issue('mesero')).token;
 const expense={id:'e1',kind:'cash_out',label:'Gas',amountCents:25000};
 assert.equal((await req('/api/admin/expenses',waiter,expense)).status,403);
 assert.equal((await req('/api/admin/expenses',admin,expense)).status,200);
 await req('/api/admin/expenses',admin,expense);
 assert.equal(db.prepare('SELECT COUNT(*) c FROM admin_expenses').get().c,1);
 const day=businessShiftKey();
 assert.equal((await req('/api/admin/openings',admin,{shiftKey:day,openingCents:10000})).status,201);
 const close={shiftKey:day,countedCents:50000,note:''};
 assert.equal((await req('/api/admin/closures',admin,close)).status,201);
 assert.equal((await (await req('/api/admin/closures',admin,close)).json()).duplicate,true);
 const data=await (await req('/api/admin/data',admin,null,'GET')).json();
 assert.equal(data.expenses[0].amount,25000);assert.equal(data.closures.length,1);
});
test('Cashier role is not authorized to view receipts or change POS data',async()=>{
 const {room,req}=fixture(),old=(await room.issue('contadora')).token;
 assert.equal((await req('/api/pos/receipts',old,null,'GET')).status,403);
 assert.equal((await req('/api/admin/data',old,null,'GET')).status,403);
});
test('Waiter can invite Admin with a temporary code; Kitchen cannot invite an owner',async()=>{
 const {room,req}=fixture(),waiter=(await room.issue('mesero')).token,kitchen=(await room.issue('cocina')).token;
 assert.equal((await req('/api/pairings',kitchen,{role:'admin'})).status,403);
 const response=await (await req('/api/pairings',waiter,{role:'admin'})).json();
 assert.equal(response.role,'admin');assert.match(response.code,/^\d{6}$/);
 const linked=await (await req('/api/pair',null,{code:response.code})).json();
 assert.equal(linked.role,'admin');
 assert.equal((await req('/api/admin/data',linked.token,null,'GET')).status,200);
 assert.equal((await req('/api/pair',null,{code:response.code})).status,403);
});
