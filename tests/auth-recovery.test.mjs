import test from 'node:test';
import assert from 'node:assert/strict';
const {DatabaseSync}=await import('node:sqlite').catch(()=>({DatabaseSync:null}));
import {KitchenRoom} from '../cloudflare/src/worker.mjs';

function makeRoom(){
 const db=new DatabaseSync(':memory:');
 const sql={exec(query,...params){
  if(/^\s*SELECT\b/i.test(query)) return {toArray:()=>db.prepare(query).all(...params)};
  if(params.length) db.prepare(query).run(...params);
  else db.exec(query);
  return {toArray:()=>[]};
 }};
 const sockets=[
  {role:'mesero',closed:false,deserializeAttachment(){return {role:this.role}},close(){this.closed=true}},
  {role:'cocina',closed:false,deserializeAttachment(){return {role:this.role}},close(){this.closed=true}},
  {role:'admin',closed:false,deserializeAttachment(){return {role:this.role}},close(){this.closed=true}},
 ];
 return {room:new KitchenRoom({storage:{sql},getWebSockets:()=>sockets},{SETUP_CODE:'test-private-code-at-least-12'}),db,sockets};
}
const request=(path,code)=>new Request('https://unit.test'+path,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'127.0.0.1'},body:JSON.stringify({code})});
const me=async(room,token)=>room.fetch(new Request('https://unit.test/api/me',{headers:{Authorization:'Bearer '+token}}));

test('Waiter recovery rejects incorrect code without revoking existing devices',{skip:!DatabaseSync},async()=>{
 const {room}=makeRoom();
 const waiter=await room.issue('mesero'), kitchen=await room.issue('cocina');
 const response=await room.fetch(request('/api/recover-mesero','incorrect-secret-123'));
 assert.equal(response.status,403);
 assert.equal((await me(room,waiter.token)).status,200);
 assert.equal((await me(room,kitchen.token)).status,200);
});

test('Waiter recovery only rotates waiter credentials; leaves kitchen, administrator and stored orders',{skip:!DatabaseSync},async()=>{
 const {room,db,sockets}=makeRoom();
 const oldWaiter=await room.issue('mesero'), kitchen=await room.issue('cocina'), administrator=await room.issue('admin');
 db.prepare("INSERT INTO pos_orders(id,payload,client_updated_at,status) VALUES (?,?,?,?)").run('order1',JSON.stringify({id:'order1',tableLabel:'M1'}),Date.now(),'open');
 const response=await room.fetch(request('/api/recover-mesero','test-private-code-at-least-12'));
 assert.equal(response.status,200);
 const nextWaiter=await response.json();
 assert.equal(nextWaiter.role,'mesero');
 assert.equal((await me(room,oldWaiter.token)).status,401);
 assert.equal((await me(room,nextWaiter.token)).status,200);
 assert.equal((await me(room,kitchen.token)).status,200);
 assert.equal((await me(room,administrator.token)).status,200);
 assert.equal(db.prepare('SELECT COUNT(*) AS count FROM pos_orders').get().count,1);
 assert.equal(sockets[0].closed,true);
 assert.equal(sockets[1].closed,false);
 assert.equal(sockets[2].closed,false);
});
