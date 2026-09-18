// 复核已执行验收的本地产物和发布包身份，不代替推理。
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url)),report=path.join(root,'reports/2026-09-18-image-sdk'),work=path.join(root,'.tmp/evaluation');
const read=async f=>JSON.parse(await readFile(f,'utf8'));
const sha=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
const execution=await read(path.join(report,'browser-execution.json')),comparison=await read(path.join(report,'comparison.json')),dataset=await read(path.join(report,'dataset.lock.json'));
assert.equal(execution.status,'executed');assert.equal(comparison.status,'passed');assert.equal(execution.modes.length,4);assert.equal(comparison.rows.length,40);
assert.equal(await sha(path.join(root,'dist/index.js')),execution.sdkSha256);assert.equal(await sha(path.join(root,'dist/inference.worker.js')),execution.workerSha256);
assert.equal(await sha(path.join(root,'.tmp/model.onnx')),execution.model.sha256);
let artifacts=0;
for(const row of dataset.cases)for(const kind of ['image','rgba','input','reference']){assert.equal(await sha(path.join(work,row[kind+'File'])),row[kind+'Sha256']);artifacts++;}
for(const mode of execution.modes){assert.deepEqual(mode.errors,[]);assert.equal(mode.results.length,10);for(const row of mode.results)for(const artifact of Object.values(row.artifacts)){assert.equal(await sha(path.join(work,artifact.file)),artifact.sha256);artifacts++;}}
for(const row of comparison.rows){assert(row.endToEnd.passed);assert(row.sameTensor?.passed,'必须有实际SDK张量的独立Paddle参考');}
assert(execution.lifecycle.every(mode=>mode.tests.every(t=>t.passed)));
const captured=await read(path.join(report,'captured-reference.json'));assert.equal(captured.status,'passed');assert.equal(captured.rows.length,40);
for(const row of captured.rows){assert.equal(await sha(path.join(work,'captured',row.file)),row.sha256);artifacts++;}
const performance=await read(path.join(report,'performance.json'));
assert.equal(performance.status,'passed');assert.equal(performance.sdkSha256,execution.sdkSha256);assert.equal(performance.modes.length,4);
for(const mode of performance.modes){assert.deepEqual(mode.errors,[]);assert.equal(mode.warm.length,3);assert(mode.warm.every(row=>row.count===136&&row.runtime.actualBackend===mode.backend));}
const scripts=[];for(const name of await readdir(path.join(root,'scripts/evaluation')))if(/\.(mjs|py)$/.test(name))scripts.push({file:'scripts/evaluation/'+name,sha256:await sha(path.join(root,'scripts/evaluation',name))});
const summary={status:'passed',verifiedAt:new Date().toISOString(),modes:4,comparisons:40,rawArtifactsVerified:artifacts,scripts,
  sdkSha256:execution.sdkSha256,workerSha256:execution.workerSha256,
  worstEndToEndIoU:Math.min(...comparison.rows.map(r=>r.endToEnd.minimumPolygonIoU)),
  worstSameTensorIoU:Math.min(...comparison.rows.map(r=>r.sameTensor.minimumPolygonIoU)),
  maximumCornerErrorPx:Math.max(...comparison.rows.map(r=>r.endToEnd.maximumCornerErrorPx)),
  scope:'公共SDK桌面图片验证，仅本次浏览器设备；不声明全量DOTA mAP、手机或NPU兼容。'};
await writeFile(path.join(report,'verification.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
