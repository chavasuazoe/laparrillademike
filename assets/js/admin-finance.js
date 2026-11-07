/* Shared, deterministic finance calculations. Amounts are integer MXN cents. */
(function(root){'use strict';
const format=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});
function parts(value){return Object.fromEntries(format.formatToParts(new Date(value)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));}
function businessDay(value=Date.now()){const p=parts(value);return new Date(Date.UTC(+p.year,+p.month-1,+p.day-(+p.hour<6?1:0))).toISOString().slice(0,10);}
function dayList(length=1,from=businessDay()){const t=Date.parse(from+'T12:00:00Z');return Array.from({length},(_,i)=>new Date(t-i*86400000).toISOString().slice(0,10));}
function add(list,fn){return list.reduce((n,v)=>n+fn(v),0);}
function cashSale(r){return Math.max(0,(r.cashCents||0)-(r.changeCents||0));}
function transferSale(r){return Math.max(0,r.transferCents||0);}
function isCost(x){return ['expense','cash_out'].includes(x.kind);}
function dayTotals(data,day){
 const receipts=(data.receipts||[]).filter(r=>businessDay(r.createdAt)===day),entries=(data.expenses||[]).filter(e=>businessDay(e.createdAt)===day);
 const opening=(data.openings||[]).find(o=>o.shiftKey===day)||null,closure=(data.closures||[]).find(c=>c.shiftKey===day)||null;
 const sales=add(receipts,r=>r.totalCents||0),cash=add(receipts,cashSale),transfer=add(receipts,transferSale),tips=add(receipts,r=>r.tipCents||0);
 const expenseCash=add(entries,e=>e.kind==='cash_out'?e.amount:0),expenseExternal=add(entries,e=>e.kind==='expense'?e.amount:0),cashIn=add(entries,e=>e.kind==='cash_in'?e.amount:0),cashDrops=add(entries,e=>e.kind==='cash_drop'?e.amount:0);
 const costs=expenseCash+expenseExternal,openingAmount=opening?.openingCents??null;
 const expected=openingAmount===null?null:openingAmount+cash+cashIn-expenseCash-cashDrops;
 const splitWaiter=Math.round(tips*.7);
 return {day,receipts,entries,opening,closure,sales,cash,transfer,tips,waiterTips:splitWaiter,kitchenTips:tips-splitWaiter,expenseCash,expenseExternal,cashIn,cashDrops,costs,openingAmount,expected,transactions:receipts.length,average:receipts.length?Math.round(sales/receipts.length):0,recordedBalance:sales-costs,guests:add(receipts,r=>Number(r.order?.guestCount||0))};
}
function overview(data,days){const keys=new Set(days),items=(data.receipts||[]).filter(r=>keys.has(businessDay(r.createdAt))),entries=(data.expenses||[]).filter(e=>keys.has(businessDay(e.createdAt)));const sales=add(items,r=>r.totalCents||0),cash=add(items,cashSale),transfer=add(items,transferSale),tips=add(items,r=>r.tipCents||0),costs=add(entries,e=>isCost(e)?e.amount:0);return {items,entries,sales,cash,transfer,tips,costs,transactions:items.length,average:items.length?Math.round(sales/items.length):0,recordedBalance:sales-costs,guests:add(items,r=>Number(r.order?.guestCount||0))};}
function topProducts(receipts,limit=8){const map=new Map();for(const r of receipts)for(const i of r.order?.items||[]){const k=String(i.name||'Producto');let item=map.get(k)||{name:k,quantity:0,sales:0};item.quantity+=Number(i.qty||0);item.sales+=Number(i.qty||0)*Number(i.priceCents||0);map.set(k,item);}return [...map.values()].sort((a,b)=>b.quantity-a.quantity||b.sales-a.sales).slice(0,limit);}
function peakHours(receipts){const counts=new Map();for(const r of receipts){const dt=r.order?.createdAt||r.createdAt;const h=+parts(dt).hour;if(Number.isFinite(h))counts.set(h,(counts.get(h)||0)+1);}return [18,19,20,21,22,23,0].map(hour=>({hour,count:counts.get(hour)||0}));}
function costCategories(entries){const m=new Map();for(const e of entries.filter(isCost)){const category=e.category||'other';m.set(category,(m.get(category)||0)+(e.amount||0));}return [...m].map(([category,total])=>({category,total})).sort((a,b)=>b.total-a.total);}
const CATEGORY_LABELS={ingredients:'Ingredientes',payroll:'Nómina',utilities:'Gas y servicios',supplies:'Insumos',rent:'Renta',maintenance:'Mantenimiento',transport:'Transporte',other:'Otros'};
root.AdminFinance=Object.freeze({businessDay,dayList,dayTotals,overview,topProducts,peakHours,costCategories,CATEGORY_LABELS,cashSale,transferSale});
})(typeof window!=='undefined'?window:globalThis);
