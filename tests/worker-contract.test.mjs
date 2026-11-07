import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTicket, validPairCode, validBearer} from '../cloudflare/src/validation.mjs';

test('A food-only ticket passes the Cloudflare ticket contract',()=>{
 const input={id:'ticket-9',orderId:'mesa-9',tableLabel:'M3',createdAt:new Date().toISOString(),
   items:[{id:'line-9',name:'Taco de sirloin',qty:3,detail:'Harina · Con queso'}],changes:[]};
 const result=normalizeTicket(input);
 assert.equal(result.items[0].qty,3);
 assert.equal(result.tableLabel,'M3');
});

test('A change-only kitchen ticket is accepted, an empty ticket is rejected',()=>{
 const change={id:'ticket-10',orderId:'mesa-9',tableLabel:'M3',createdAt:new Date().toISOString(),items:[],changes:['CANCELAR 1 × Taco de sirloin']};
 assert.equal(normalizeTicket(change).changes.length,1);
 assert.throws(()=>normalizeTicket({...change,changes:[]}),/vacía/);
});

test('Temporary pair codes and bearer tokens require the expected formats',()=>{
 assert.ok(validPairCode('123456'));
 assert.equal(validPairCode('12345'),false);
 assert.ok(validBearer('Bearer '+'a'.repeat(43)));
 assert.equal(validBearer('Bearer invalid'),false);
});
