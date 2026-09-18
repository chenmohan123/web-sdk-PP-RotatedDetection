// 未插桩公共SDK的同图热运行观测，区别于质量验收中的张量捕获开销。
import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { chromium } from 'playwright';
const root=fileURLToPath(new URL('../../',import.meta.url)),report=path.join(root,'reports/2026-09-18-image-sdk');
const dataset=JSON.parse(await readFile(path.join(report,'dataset.lock.json'),'utf8'));
const item=dataset.cases.find(x=>x.id==='P0861');
const model={id:'ppyoloe-r-s-1024-fp32',version:'0.1.0',bytes:33161415,sha256:'de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089'};
const sha=data=>createHash('sha256').update(data).digest('hex');
assert.equal(sha(await readFile(path.join(root,'.tmp/model.onnx'))),model.sha256);
const files=new Map([['/model.onnx',path.join(root,'.tmp/model.onnx')],['/pixels',path.join(root,'.tmp/evaluation',item.rgbaFile)]]);
for(const name of await readdir(path.join(root,'dist')))if(/\.(js|mjs|wasm)$/.test(name))files.set('/sdk/'+name,path.join(root,'dist',name));
const server=createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname;
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 if(name==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end('<!doctype html><meta charset="utf-8"><title>旋转框SDK耗时观测</title>');return;}
 const file=files.get(name);if(!file){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':/\.(mjs|js)$/.test(name)?'text/javascript':name.endsWith('.wasm')?'application/wasm':'application/octet-stream','Content-Length':(await stat(file)).size,'Cache-Control':'no-store'});createReadStream(file).pipe(res);
}catch(e){res.writeHead(500).end(String(e));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chromium',headless:true}),context=await browser.newContext();
const output={status:'failed',verifiedAt:new Date().toISOString(),environment:{browser:browser.version(),os:os.release(),cpu:os.cpus()[0].model},imageId:item.id,sdkSha256:sha(await readFile(path.join(root,'dist/index.js'))),modes:[],scope:'单台桌面，已加载会话，同一RGBA图片三次热运行中位数；不含模型加载，非摄像头FPS或普遍性能。所有SDK阶段保持原始实现，无张量捕获插桩。'};
try{
 for(const backend of ['wasm','webgpu'])for(const executionMode of ['main','worker']){
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(origin);
   const row=await page.evaluate(async({backend,executionMode,model,item})=>{
     const api=await import('/sdk/index.js');const sdk=api.createRotatedDetection({model:{...model,url:location.origin+'/model.onnx'},backend,executionMode,runtimeBaseUrl:location.origin+'/sdk/'});
     const image={width:item.width,height:item.height,data:new Uint8Array(await(await fetch('/pixels')).arrayBuffer())};
     try{await sdk.load();const first=await sdk.run({image}),warm=[];for(let i=0;i<3;i++){const r=await sdk.run({image});warm.push({count:r.detections.length,timings:r.timings,runtime:r.runtime});}
       const median={};for(const key of Object.keys(first.timings))median[key]=warm.map(r=>r.timings[key]).sort((a,b)=>a-b)[1];
       return {backend,executionMode,load:sdk.loadTimings,first:{count:first.detections.length,timings:first.timings},warm,median};
     }finally{await sdk.dispose();}
   },{backend,executionMode,model,item});assert(row.warm.every(r=>r.count===item.referenceCount&&r.runtime.actualBackend===backend));assert.deepEqual(errors,[]);output.modes.push({...row,errors});console.log(JSON.stringify({backend,executionMode,median:row.median}));await page.close();
 }
 output.status='passed';
}catch(error){output.error=String(error.stack??error);console.error(error);}
finally{await writeFile(path.join(report,'performance.json'),JSON.stringify(output,null,2)+'\n');await browser.close();await new Promise(resolve=>server.close(resolve));}
if(output.status!=='passed')process.exitCode=1;
