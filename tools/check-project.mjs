import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname, extname } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..');
const must=(file)=>{const path=join(root,file);assert.ok(existsSync(path),`Missing: ${file}`);return readFileSync(path,'utf8')};
for(const page of ['index.html','cocina.html','admin.html']){
 const src=must(page);
 for(const match of src.matchAll(/(?:href|src)=["'](\.\/[^"']+)["']/g)){
  const loc=decodeURIComponent(match[1].split('?')[0]);
  assert.ok(existsSync(join(root,loc)),`${page} -> missing ${loc}`);
 }
 assert.doesNotMatch(src,/contadora\.html|cloudflare-config\.js|kitchen-layout\.css|font-awesome/i);
}
const sw=must('sw.js');
for(const [_,ref] of sw.matchAll(/"(\.\/[^"\s]+)"/g)){
 if(ref==='./')continue;
 assert.ok(existsSync(join(root,ref)),`Service worker cache missing: ${ref}`);
}
const cfg=must('assets/js/config.js');
assert.match(cfg,/workers\.dev/);
assert.doesNotMatch(cfg,/SETUP_CODE\s*[:=]|Authorization\s*[:=]|Bearer\s+\S+/);
for(const f of ['assets/js/waiter.js','assets/js/kitchen.js','assets/js/admin.js','cloudflare/src/worker.mjs']) must(f);
console.log('PASS: Three pages, assets, PWA cache and public configuration.');
