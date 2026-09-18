// 只读核验真实分发/生产浏览器/原质量证据与当前构建，不补写成功标记。
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
const read=async f=>JSON.parse(await readFile(f,'utf8'));
const hash=d=>createHash('sha256').update(d).digest('hex');
const dir='reports/2026-09-18-release',quality='reports/2026-09-18-image-sdk';
const pkg=await read('package.json'),model=await read('models/model.json'),manifest=parse(await readFile('sdk-manifest.yaml','utf8'));
assert.equal(pkg.name,'web-sdk-pp-rotated-detection');assert.equal(pkg.version,'0.1.0');
if(process.env.RELEASE_TAG)assert.equal(process.env.RELEASE_TAG,`v${pkg.version}`);
assert.equal(model.status,'published');assert.equal(model.defaultSource,'modelscope');
assert.equal(manifest.package.version,pkg.version);assert.equal(manifest.model.version,model.version);
assert.deepEqual(model.sources.map(s=>s.kind).sort(),['huggingface','modelscope']);
assert.deepEqual(manifest.model.variants[0].sources,model.sources);
const distribution=await read(`${dir}/distribution-weights-verified.json`);assert.equal(distribution.status,'passed');
for(const source of model.sources){
  assert.match(source.revision,/^[a-f0-9]{40,64}$/);assert.equal(source.repository,'chenmohan/web-sdk-pp-rotated-detection');assert.equal(source.bytes,model.bytes);assert.equal(source.sha256,model.sha256);
  assert.equal(source.path,'ppyoloe-r-s-1024/0.1.0/ppyoloe-r-s-1024-fp32.onnx');
  const prefix=source.kind==='modelscope'?'https://www.modelscope.cn/models':'https://huggingface.co';
  assert.equal(source.downloadUrl,`${prefix}/${source.repository}/resolve/${source.revision}/${source.path}`);
  assert(distribution.results.some(x=>x.source===source.kind&&x.url===source.downloadUrl&&x.revision===source.revision&&x.bytes===model.bytes&&x.sha256===model.sha256&&x.passed));
}
assert.deepEqual(manifest.model.assets,[{id:model.id,bytes:model.bytes,precision:'fp32',url:model.sources[0].downloadUrl,sha256:model.sha256}]);
const execution=await read(`${quality}/browser-execution.json`),comparison=await read(`${quality}/comparison.json`);
assert.equal(execution.status,'executed');assert.equal(comparison.status,'passed');assert.equal(comparison.rows.length,40);
assert(comparison.rows.every(x=>x.endToEnd.passed&&x.sameTensor.passed));assert(execution.lifecycle.every(x=>x.tests.every(t=>t.passed)));
for(const [key,file] of [['browserExecutionSha256','browser-execution.json'],['datasetSha256','dataset.lock.json'],['capturedReferenceSha256','captured-reference.json']])assert.equal(comparison.evidence[key],hash(await readFile(`${quality}/${file}`)));
assert.equal(hash(await readFile('dist/index.js')),execution.sdkSha256);assert.equal(hash(await readFile('dist/inference.worker.js')),execution.workerSha256);
const acceptance=await read(`${dir}/release-acceptance.json`);assert.equal(acceptance.status,'passed');assert.equal(acceptance.version,pkg.version);assert.deepEqual(acceptance.model,model);
const expected=new Set(model.sources.flatMap(s=>['wasm','webgpu'].flatMap(b=>['main','worker'].map(m=>`${s.kind}/${b}/${m}`))));
for(const row of acceptance.results){assert(expected.delete(`${row.source}/${row.backend}/${row.mode}`));assert.equal(row.status,'passed');assert.equal(row.detections,136);assert.equal(row.model.sha256,model.sha256);assert.equal(row.runtime.actualBackend,row.backend);assert.equal(row.runtime.executionMode,row.mode);const source=model.sources.find(s=>s.kind===row.source);assert.equal(row.revision,source.revision);assert.deepEqual(row.downloads,[source.downloadUrl]);}
assert.equal(expected.size,0);assert.equal(acceptance.explicitSourceFailure,'passed');assert.deepEqual(acceptance.pageErrors,[]);
const assets={};const walk=async dir=>{for(const entry of await readdir(dir,{withFileTypes:true})){const file=`${dir}/${entry.name}`;if(entry.isDirectory())await walk(file);else{const data=await readFile(file);assets[file]={bytes:data.length,sha256:hash(data)};}}};await walk('dist');await walk('demo-dist');assert.deepEqual(assets,acceptance.assets,'当前构建与八组合生产浏览器验收不一致');
console.log('发布检查通过：版本、双源固定资产、原质量证据、八组合浏览器与当前构建一致。');
