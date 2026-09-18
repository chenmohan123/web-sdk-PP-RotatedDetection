// 公共构建包桌面验收：仅测试服务器插桩 ORT 边界，保存真实输入/输出与原生 GPU 指令数。
import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { chromium } from 'playwright';

const root=fileURLToPath(new URL('../../',import.meta.url));
const work=path.join(root,'.tmp/evaluation'),report=path.join(root,'reports/2026-09-18-image-sdk');
const lifecycleOnly=process.argv.includes('--lifecycle-only');
const previous=lifecycleOnly?JSON.parse(await readFile(path.join(report,'browser-execution.json'),'utf8')):null;
const lock=JSON.parse(await readFile(path.join(report,'dataset.lock.json'),'utf8'));
const sha=data=>createHash('sha256').update(data).digest('hex');
const model={id:'ppyoloe-r-s-1024-fp32',version:'0.1.0',bytes:33161415,sha256:'de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089'};
const modelFile=path.join(root,'.tmp/model.onnx');assert.equal(sha(await readFile(modelFile)),model.sha256);
const assets=new Map([['/model.onnx',modelFile]]);
for(const file of await readdir(path.join(root,'dist')))if(/\.(js|mjs|wasm)$/.test(file))assets.set('/sdk/'+file,path.join(root,'dist',file));
for(const item of lock.cases){assets.set('/images/'+item.id,path.join(work,item.imageFile));assets.set('/rgba/'+item.id,path.join(work,item.rgbaFile));}
assets.set('/sdk/ort-real.mjs',path.join(root,'dist/ort.webgpu.bundle.min.mjs'));
let current=null,modelRequests=0;
const captures=[];
const probe=`
import * as ort from './ort-real.mjs';
export * from './ort-real.mjs';
const nativeCreate=ort.InferenceSession.create.bind(ort.InferenceSession);
// 门控仅用于证明公共API已提交真实session.run，不能证明同步WASM内核仍在计算。
const lifecycleChannel=new BroadcastChannel('rotated-evaluation-lifecycle'),gates=new Map();let armed=null;
lifecycleChannel.onmessage=({data})=>{if(data.kind==='arm'){armed=data.token;lifecycleChannel.postMessage({kind:'armed',token:data.token});}else if(data.kind==='release'){gates.get(data.token)?.();gates.delete(data.token);}};
const counters={dispatches:0,submits:0};let adapterInfo=null;
if(globalThis.GPUComputePassEncoder){const f=GPUComputePassEncoder.prototype.dispatchWorkgroups;GPUComputePassEncoder.prototype.dispatchWorkgroups=function(...a){counters.dispatches++;return f.apply(this,a);};}
if(globalThis.GPUQueue){const f=GPUQueue.prototype.submit;GPUQueue.prototype.submit=function(...a){counters.submits++;return f.apply(this,a);};}
if(globalThis.navigator?.gpu){const native=navigator.gpu.requestAdapter.bind(navigator.gpu);navigator.gpu.requestAdapter=async(...a)=>{const adapter=await native(...a);if(adapter){const i=adapter.info;adapterInfo={vendor:i.vendor,architecture:i.architecture,device:i.device,description:i.description,fallback:adapter.isFallbackAdapter??i.isFallbackAdapter};}return adapter;};}
ort.InferenceSession.create=async(...args)=>{const session=await nativeCreate(...args),nativeRun=session.run.bind(session);
 session.run=async(feeds,...rest)=>{const before={...counters},pending=nativeRun(feeds,...rest);pending.catch(()=>{});if(armed){const token=armed;armed=null;const gate=new Promise(resolve=>gates.set(token,resolve));lifecycleChannel.postMessage({kind:'submitted',token});await gate;}const output=await pending;const trace={dispatches:counters.dispatches-before.dispatches,submits:counters.submits-before.submits,adapter:adapterInfo};
 const send=async(kind,data)=>{const r=await fetch('/capture/'+kind,{method:'POST',body:data});if(!r.ok)throw new Error('验收捕获失败 '+r.status);};
 await send('input',feeds.image.data);for(let i=0;i<session.outputNames.length;i++)await send(i===0?'scores':'rboxes',output[session.outputNames[i]].data);await send('trace',JSON.stringify(trace));return output;};return session;};
`;
const server=createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname;
 if(req.method==='POST'&&/^\/capture\/(input|scores|rboxes|trace)$/.test(name)){
   const kind=name.split('/').at(-1),chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>14_000_000)throw new Error('捕获大小超限');chunks.push(chunk);}const data=Buffer.concat(chunks);
   if(current){const folder=path.join(work,'captured',current.key);await mkdir(folder,{recursive:true});const file=path.join(folder,kind==='trace'?'trace.json':kind+'.f32');await writeFile(file,data);current.artifacts[kind]={file:path.relative(work,file).replaceAll('\\','/'),bytes:data.length,sha256:sha(data)};}
   res.writeHead(200).end('ok');return;
 }
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 if(name==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>旋转框公共 API 验收</title><body></body></html>');return;}
 if(name==='/sdk/ort.webgpu.bundle.min.mjs'){res.writeHead(200,{'Content-Type':'text/javascript'}).end(probe);return;}
 const file=assets.get(name);if(!file){res.writeHead(404).end();return;}
 if(name==='/model.onnx')modelRequests++;
 res.writeHead(200,{'Content-Type':/\.(js|mjs)$/.test(name)?'text/javascript':name.endsWith('.wasm')?'application/wasm':name.startsWith('/images/')?'image/png':'application/octet-stream','Content-Length':(await stat(file)).size,'Cache-Control':'no-store'});createReadStream(file).pipe(res);
}catch(error){res.writeHead(500).end(String(error));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chromium',headless:true});
const context=await browser.newContext();
const result={status:'failed',verifiedAt:new Date().toISOString(),environment:{browser:browser.version(),os:os.release(),cpu:os.cpus()[0].model,ort:'1.27.0',headless:true},model,sdkSha256:sha(await readFile(path.join(root,'dist/index.js'))),workerSha256:sha(await readFile(path.join(root,'dist/inference.worker.js'))),modes:[],lifecycle:[],instrumentation:'测试服务器替换 ORT loader，调用原始 session.run 后捕获张量并记录实际原生GPU dispatch/submit。插桩包含传输开销，timings不作为产品性能。'};
if(previous){assert.equal(previous.status,'executed');assert.equal(previous.sdkSha256,result.sdkSha256);assert.equal(previous.workerSha256,result.workerSha256);assert.deepEqual(previous.model,model);result.verifiedAt=previous.verifiedAt;result.modes=previous.modes;}
result.lifecycleVerifiedAt=new Date().toISOString();
result.lifecycleInstrumentation='真实session.run调用后暂缓向SDK返回结果；确认提交后才取消/释放。验证main等待结果、Worker立即终止，不宣称中断同步WASM内核。';
try{
 for(const backend of ['wasm','webgpu'])for(const executionMode of ['main','worker']){
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(origin);
   const setup=await page.evaluate(async({model,backend,executionMode})=>{
     window.api=await import('/sdk/index.js');window.model={...model,url:location.origin+'/model.onnx'};
     window.options={model:window.model,backend,executionMode,runtimeBaseUrl:location.origin+'/sdk/'};
     window.sdk=window.api.createRotatedDetection(window.options);const progress=[];await window.sdk.load({onProgress:x=>progress.push(x)});return {progress,loadTimings:window.sdk.loadTimings,capabilities:window.sdk.capabilities};
   },{model,backend,executionMode});
   const mode={backend,executionMode,...setup,results:[],errors};if(!lifecycleOnly)result.modes.push(mode);
   for(const item of lifecycleOnly?[]:lock.cases){
     const inputKinds=item.id==='P0072'?['rgba','blob']:['rgba'];
     for(const inputKind of inputKinds){
       current={key:`${backend}-${executionMode}/${item.id}-${inputKind}`,id:item.id,inputKind,backend,executionMode,scaleFactor:item.scaleFactor,artifacts:{}};
       const output=await page.evaluate(async({item,inputKind})=>{
         const pixels={width:item.width,height:item.height,data:new Uint8Array(await(await fetch('/rgba/'+item.id)).arrayBuffer())};
         const image=inputKind==='blob'?await(await fetch('/images/'+item.id)).blob():pixels;
         const before=pixels.data.byteLength;const value=await window.sdk.run({image});
         if(pixels.data.byteLength!==before)throw new Error('RGBA 被 detach');return value;
       },{item,inputKind});
       assert.equal(output.runtime.actualBackend,backend);assert.equal(output.runtime.executionMode,executionMode);
       assert.equal(output.image.width,item.width);assert.equal(output.image.height,item.height);
       assert(output.detections.every(x=>x.polygon.length===4&&x.polygon.flat().every(Number.isFinite)));
       if(item.id==='blank'||item.id==='white-wide')assert.equal(output.detections.length,0);
       const trace=JSON.parse(await readFile(path.join(work,current.artifacts.trace.file),'utf8'));
       if(backend==='webgpu'){assert(trace.dispatches>0&&trace.submits>0);assert.equal(trace.adapter.fallback,false);assert(!/swiftshader|software|warp|llvmpipe/i.test(JSON.stringify(trace.adapter)));}
       const record={...current,output,trace};captures.push(record);mode.results.push(record);
       console.log(JSON.stringify({backend,executionMode,id:item.id,inputKind,count:output.detections.length}));current=null;
     }
   }
   const lifecycle=await page.evaluate(async item=>{
     const tests=[];const code=async fn=>{try{await fn();return 'NO_ERROR';}catch(e){return e.code??String(e);}};
     const check=(name,passed,detail)=>tests.push({name,passed,detail});
     const channel=new BroadcastChannel('rotated-evaluation-lifecycle');
     const message=(kind,token)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{channel.removeEventListener('message',onMessage);reject(new Error('生命周期阶段超时 '+kind));},15000);const onMessage=({data})=>{if(data.kind===kind&&data.token===token){clearTimeout(timer);channel.removeEventListener('message',onMessage);resolve(data);}};channel.addEventListener('message',onMessage);});
     const arm=async()=>{const token=crypto.randomUUID(),ready=message('armed',token);channel.postMessage({kind:'arm',token});await ready;return token;};
     const image={width:item.width,height:item.height,data:new Uint8Array(await(await fetch('/rgba/'+item.id)).arrayBuffer())};
     check('无效输入',await code(()=>window.sdk.run({image:{width:0,height:1,data:new Uint8Array(4)}}))==='INVALID_INPUT');
     check('无效阈值',await code(()=>window.sdk.run({image},{scoreThreshold:NaN}))==='INVALID_INPUT');
     const first=window.sdk.run({image});check('并发拒绝',await code(()=>window.sdk.run({image}))==='BUSY');await first;
     const cancel=new AbortController(),pending=window.sdk.run({image},{signal:cancel.signal});cancel.abort();check('run立即取消',await code(()=>pending)==='ABORTED');
     await window.sdk.load();check('取消后恢复',(await window.sdk.run({image})).detections.length>0);
     if(window.options.executionMode==='worker'){
       const token=await arm(),submitted=message('submitted',token),c=new AbortController();const active=window.sdk.run({image},{signal:c.signal});await submitted;c.abort();channel.postMessage({kind:'release',token});const status=await code(()=>active);check('Worker已提交run取消',status==='ABORTED',{code:status,sessionRunSubmitted:true});await window.sdk.load();check('Worker取消后恢复',(await window.sdk.run({image})).detections.length>0);
     }
     const info=await window.api.getModelCacheInfo(window.model);check('缓存写入',info.entries===1&&info.bytes===window.model.bytes,info);
     await window.sdk.dispose();await window.sdk.dispose();check('释放后拒绝',await code(()=>window.sdk.run({image}))==='DISPOSED');
     const cached=window.api.createRotatedDetection(window.options);await cached.load();check('缓存命中再校验',cached.loadTimings.modelDownloadMs===0&&cached.loadTimings.integrityMs>0,cached.loadTimings);await cached.dispose();
     const unloaded=window.api.createRotatedDetection(window.options);check('未load拒绝',await code(()=>unloaded.run({image}))==='NOT_LOADED');
     const c=new AbortController();c.abort();check('load预取消',await code(()=>unloaded.load({signal:c.signal}))==='ABORTED');await unloaded.load();
     const token=await arm(),submitted=message('submitted',token),running=unloaded.run({image});const runningCode=code(()=>running);await submitted;const disposing=unloaded.dispose();const settledBeforeReturn=await Promise.race([disposing.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),50))]);channel.postMessage({kind:'release',token});const runCode=await runningCode;await disposing;check('dispose已提交run',runCode==='ABORTED'&&settledBeforeReturn===(window.options.executionMode==='worker'),{code:runCode,sessionRunSubmitted:true,settledBeforeReturn});
     const recreated=window.api.createRotatedDetection(window.options);await recreated.load();check('释放后新实例恢复',(await recreated.run({image})).detections.length>0);await recreated.dispose();
     await window.api.clearCurrentModelCache(window.model);check('当前缓存清理',(await window.api.getModelCacheInfo(window.model)).entries===0);
     const bad=window.api.createRotatedDetection({...window.options,model:{...window.model,sha256:'0'.repeat(64)}});check('错误SHA',await code(()=>bad.load())==='INTEGRITY');await bad.dispose();
     const missing=window.api.createRotatedDetection({...window.options,model:{...window.model,url:location.origin+'/missing.onnx'}});check('错误URL',await code(()=>missing.load())==='DOWNLOAD');await missing.dispose();
     const download=window.api.createRotatedDetection(window.options),abortDownload=new AbortController();let loadedBytes=0;const status=await code(()=>download.load({signal:abortDownload.signal,onProgress:e=>{if(e.phase==='downloading'&&e.loadedBytes>0&&e.loadedBytes<window.model.bytes){loadedBytes=e.loadedBytes;abortDownload.abort();}}}));check('部分字节下载取消',status==='ABORTED'&&loadedBytes>0&&loadedBytes<window.model.bytes,{code:status,loadedBytes});await download.load();await download.dispose();
     await window.api.clearAllModelCache();check('全缓存清理',(await window.api.getModelCacheInfo(window.model)).entries===0);
     channel.close();return tests;
   },lock.cases[0]);result.lifecycle.push({backend,executionMode,tests:lifecycle});
   assert(lifecycle.every(x=>x.passed),JSON.stringify(lifecycle.filter(x=>!x.passed)));assert.deepEqual(errors,[]);await page.close();
 }
 result.status='executed';
}catch(error){result.error=String(error.stack??error);console.error(error);}
finally{
 result.modelRequests=lifecycleOnly?previous.modelRequests:modelRequests;
 if(lifecycleOnly)result.lifecycleModelRequests=modelRequests;
 await mkdir(report,{recursive:true});await mkdir(path.join(work,'captured'),{recursive:true});
 await writeFile(path.join(report,'browser-execution.json'),JSON.stringify(result,null,2)+'\n');
 if(!lifecycleOnly)await writeFile(path.join(work,'captured/captures.json'),JSON.stringify(captures.map(c=>({id:c.key.replaceAll('/','--'),inputFile:path.relative(path.join(work,'captured'),path.join(work,c.artifacts.input.file)).replaceAll('\\','/'),inputSha256:c.artifacts.input.sha256,scaleFactor:c.scaleFactor})),null,2)+'\n');
 await browser.close();await new Promise(resolve=>server.close(resolve));
}
if(result.status!=='executed')process.exitCode=1;
