import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(join(root,f),'utf8');

test('V10 uses an isolated browser namespace without changing legacy keys',()=>{
 assert.match(read('assets/js/waiter.js'),/KEY='parrilla-v10-orders'/);
 assert.match(read('assets/js/cloudflare.js'),/KEY='parrilla-v10-auth'/);
 assert.match(read('assets/js/kitchen.js'),/parrilla-v10-kitchen-tickets/);
 assert.doesNotMatch(read('assets/js/cloudflare.js'),/KEY='pedidos-cf-v5-auth'/);
});
test('V10 is a fresh Worker namespace with origin restriction and SQLite',()=>{
 const config=read('cloudflare/wrangler.toml');
 assert.match(config,/name = "parrilla-mike-v10"/);
 assert.match(config,/FRONTEND_ORIGIN = "https:\/\/chavasuazoe\.github\.io"/);
 assert.match(config,/\[exports\.KitchenRoom\][\s\S]*storage = "sqlite"/);
 assert.match(read('cloudflare/src/worker.mjs'),/service:'parrilla-v10'/);
});
test('Menus use local SVG icons, no icon font or CDNs required',()=>{
 const source=read('assets/js/icons.js');
 const window={};vm.runInNewContext(source,{window});
 const svg=window.AppIcons.draw('taco','cat-icon');
 assert.match(svg,/<svg/);assert.match(svg,/<path/);
 assert.match(svg,/cat-icon/);
 assert.doesNotMatch(svg,/<script/);
 assert.doesNotMatch(read('index.html'),/cloudflare\.com\/ajax\/libs\/font-awesome/);
 assert.match(read('index.html'),/assets\/js\/icons\.js/);
});
test('New frontend has three roles and excludes abandoned cashier files',()=>{
 for(const [page,script] of [['index.html','waiter.js'],['cocina.html','kitchen.js'],['admin.html','admin.js']]){
  assert.match(read(page),new RegExp(script.replace('.','\\.')));
 }
 assert.doesNotMatch(read('sw.js'),/contadora|kitchen-layout|mesero-rapido/);
});
