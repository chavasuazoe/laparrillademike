/* Offline smoke tests. Run with: node --test tests/*.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const source=path=>readFileSync(join(root,path),'utf8');

function mockBrowser(seed = new Map()) {
  const saved = new Map(seed), elements = new Map(), listeners = new Map();
  const storage = {
    getItem:key=>saved.get(key)||null,
    setItem:(key,value)=>saved.set(key,String(value)),
    removeItem:key=>saved.delete(key)
  };
  function element(name) {
    if(elements.has(name))return elements.get(name);
    const node={id:name,dataset:{},innerHTML:'',textContent:'',value:'',disabled:false,
      style:{},scrollTop:0,hidden:false,
      classList:{toggle(){},add(){},remove(){},contains(){return false}},
      setAttribute(){},removeAttribute(){},append(){},appendChild(){},remove(){},click(){},focus(){},
      addEventListener(type,fn){(listeners.get('element:'+name+':'+type)||listeners.set('element:'+name+':'+type,[]).get('element:'+name+':'+type)).push(fn)}
    };
    elements.set(name,node);return node;
  }
  const document={title:'',hidden:false,activeElement:{tagName:'BODY'},body:element('body'),
    querySelector:selector=>element(selector),getElementById:id=>element('#'+id),
    querySelectorAll:()=>[],createElement:name=>element('new:'+name+':'+Math.random()),
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)}
  };
  const window={localStorage:storage,document,navigator:{onLine:false},
    location:{protocol:'file:',origin:'null'},
    addEventListener(){},dispatchEvent(){},crypto:{randomUUID:()=>('id'+Math.random().toString(16).slice(2))}
  };
  Object.assign(window,{window,globalThis:window,document,localStorage:storage,
    navigator:window.navigator,location:window.location,
    setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},
    confirm:()=>true,alert(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}},
    Blob:class{},Event:class{},console,
    Intl,Date,Math,JSON,Number,String,Array,Object,RegExp,Map,Set,Promise,Error,AbortController});
  const context=vm.createContext(window);
  function run(relativePath){vm.runInContext(source(relativePath),context,{filename:relativePath,timeout:3000})}
  function click(data,id=''){const node={dataset:data,id,disabled:false,closest:selector=>selector==='button'?node:null,hasAttribute:name=>name.startsWith('data-')&&Object.hasOwn(data,name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()))};for(const fn of listeners.get('click')||[])fn({target:node,preventDefault(){}})}
  return {run,click,saved,elements,context};
}
function setup(role,seed){const browser=mockBrowser(seed);
 for(const file of ['config','common','menu','cloudflare','icons',role])browser.run('assets/js/'+file+'.js');
 return browser;
}

test('One shared price catalog includes all operational products',()=>{
 const b=mockBrowser();b.run('assets/js/menu.js');
 const m=b.context.window.MenuCatalog;
 assert.equal(m.waiterProducts.find(p=>p.id==='sirloin').price,40);
 assert.equal(m.waiterProducts.find(p=>p.id==='coca').price,35);
 assert.equal(m.waiterProducts.find(p=>p.id==='burger_esp').price,120);
 assert.equal(m.prices.cheese,10);
});

test('Waiter loads and adds three tacos without a blocking modal',()=>{
 const b=setup('waiter');
 assert.match(b.elements.get('#main').innerHTML,/table-tile available/);assert.doesNotMatch(b.elements.get('#main').innerHTML,/SELECCIONA UNA MESA/);
 b.click({table:'M1'});b.click({add:'sirloin'});b.click({add:'sirloin'});b.click({add:'sirloin'});
 const db=JSON.parse(b.saved.get('parrilla-v10-orders'));
 const order=db.orders.find(o=>o.status==='open');
 assert.equal(order.items.find(i=>i.name==='Taco de Sirloin').qty,3);
 assert.equal(order.items.find(i=>i.name==='Taco de Sirloin').price,40);
 assert.doesNotMatch(b.elements.get('#main').innerHTML,/\$120/);assert.match(b.elements.get('#main').innerHTML,/stepper-number/);
});

test('Waiter changes tortilla and cheese, then persists a kitchen ticket',()=>{
 const b=setup('waiter');b.click({table:'M2'});b.click({tortilla:'harina'});b.click({cheese:''});
 b.click({add:'arrachera'});b.click({send:''});
 const db=JSON.parse(b.saved.get('parrilla-v10-orders'));
 const item=db.orders.find(o=>o.status==='open').items[0];
 assert.equal(item.price,50);
 assert.equal(item.options.tortilla,'Harina');
 assert.equal(item.options.extraQueso,true);
 assert.equal(db.kitchenTickets.length,1);
 assert.equal(db.kitchenTickets[0].items[0].qty,1);
 assert.equal(db.kitchenTickets[0].tableLabel,'M2');
});

test('Administration replaces the old cashier page',()=>{assert.match(source('admin.html'),/admin\.css/);assert.match(source('admin.html'),/admin\.js/);assert.throws(()=>source('contadora.html'));});

test('Kitchen opens without authentication and keeps a safe empty queue',()=>{
 const b=setup('kitchen');
 assert.match(b.elements.get('#ticket').innerHTML,/VINCULA COCINA|SIN CONEXIÓN|TODO LISTO/);
 assert.equal(b.elements.get('#finish').disabled,true);
});

test('Public Worker URL exists, without embedded authorization tokens',()=>{
 const config=source('assets/js/config.js');
 assert.match(config,/workers\.dev/);
 assert.doesNotMatch(config,/Bearer\s+\w+|SETUP_CODE\s*=/);
});

test('The three pages load role-specific assets; no old duplicate CSS files',()=>{
 for (const [html,role] of [['index.html','waiter'],['cocina.html','kitchen'],['admin.html','admin']]){
  const page=source(html);
  assert.match(page,new RegExp('assets/css/'+role+'\\.css'));
  assert.match(page,new RegExp('assets/js/'+role+'\\.js'));
  assert.doesNotMatch(page,/<style[\s>]/i);
  assert.doesNotMatch(page,/ui-unificado\.css|tema-expres\.css/);
 }
});

test('Waiter can separate plate groups from the top plus button',()=>{const b=setup('waiter');b.click({table:'M1'});b.click({add:'sirloin'});b.click({nextGroup:''});b.click({add:'chuleta'});const o=JSON.parse(b.saved.get('parrilla-v10-orders')).orders.find(o=>o.status==='open');assert.deepEqual(o.items.map(x=>x.options.group),[1,2]);});

test('V10 order data persists on the new isolated storage key',()=>{
 const old=setup('waiter');old.click({table:'M4'});old.click({add:'sirloin'});
 const updated=setup('waiter',old.saved);
 assert.match(updated.elements.get('#main').innerHTML,/M4/);
 updated.click({table:'M4'});
 assert.match(updated.elements.get('#main').innerHTML,/Sirloin/);
 assert.ok(updated.saved.get('parrilla-v10-orders'));
});

test('Shift date rolls over at five in the morning',()=>{
 const b=mockBrowser();b.run('assets/js/common.js');
 const shift=b.context.window.AppCore.shiftDay;
 assert.equal(shift(new Date(2026,10,5,0,30)),'2026-11-04');
 assert.equal(shift(new Date(2026,10,5,17,30)),'2026-11-05');
});

test('Waiter authorization errors are visible inside settings instead of hidden toast',async()=>{
 const b=setup('waiter');
 b.context.document.querySelector('#setup-code').value='valid-private-setup-code';
 b.context.fetch=async()=>({ok:false,status:409,json:async()=>({error:'El mesero ya fue autorizado; usa recuperación'})});
 b.click({cloudBootstrap:''});
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(b.elements.get('#auth-feedback').textContent,/Ya existe un Mesero autorizado/);
 assert.equal(b.saved.has('parrilla-v10-auth-mesero'),false);
});

test('Waiter recovery stores only the mesero credential after the safe recovery endpoint succeeds',async()=>{
 const b=setup('waiter');
 const kitchen=JSON.stringify({role:'cocina',token:'k'.repeat(43)});
 b.saved.set('parrilla-v10-auth-cocina',kitchen);
 b.context.document.querySelector('#setup-code').value='valid-private-setup-code';
 let requestedPath='';
 b.context.fetch=async(url)=>{requestedPath=String(url);return {ok:true,status:200,json:async()=>({role:'mesero',token:'m'.repeat(43)})}};
 b.click({cloudRecover:''});
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(requestedPath,/\/api\/recover-mesero$/);
 assert.equal(JSON.parse(b.saved.get('parrilla-v10-auth-mesero')).role,'mesero');
 assert.equal(b.saved.get('parrilla-v10-auth-cocina'),kitchen);
});

test('Waiter subtracts a sent taco and queues a correction to kitchen',()=>{
 const b=setup('waiter');b.click({table:'M1'});b.click({add:'chuleta'});b.click({add:'chuleta'});b.click({send:''});
 b.click({minusProduct:'chuleta'});
 const db=JSON.parse(b.saved.get('parrilla-v10-orders'));
 const o=db.orders.find(o=>o.status==='open');
 assert.equal(o.items.find(i=>i.name==='Taco de Chuleta').qty,1);
 assert.match(o.changes.find(c=>!c.acknowledgedAt).message,/CANCELAR 1/);
});
test('Waiter can mark a burger to go while keeping its original price',()=>{
 const b=setup('waiter');b.click({table:'M1'});b.click({cat:'hamburguesas'});b.click({add:'burger_mike'});
 const db=JSON.parse(b.saved.get('parrilla-v10-orders'));
 assert.equal(db.orders.find(o=>o.status==='open').items[0].price,100);
 assert.match(b.elements.get('#main').innerHTML,/CLÁSICA/);
 assert.match(b.elements.get('#main').innerHTML,/stepper/);
});
