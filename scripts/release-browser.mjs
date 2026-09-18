// 生产Demo的真实双源桌面验收；不注入本地模型、不拦截成功下载、不替换推理。
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright';
const root=process.cwd(),report='reports/2026-09-18-release',scratch='.tmp/release-browser';
const model=JSON.parse(await readFile('models/model.json','utf8'));
const pkg=JSON.parse(await readFile('package.json','utf8'));
assert.equal(model.sources.length,2);assert.equal(model.status,'published');
await mkdir(scratch,{recursive:true});await mkdir(report,{recursive:true});
const hosted=process.env.ROTATED_DEMO_URL;
const server=hosted?undefined:await preview({configFile:path.join(root,'demo/vite.config.ts')});
const url=hosted??'http://127.0.0.1:4194/';
const browser=await chromium.launch({channel:'chromium',headless:true});
const evidence={status:'failed',verifiedAt:new Date().toISOString(),version:pkg.version,model,url,browser:browser.version(),results:[],pageErrors:[],explicitSourceFailure:'pending',assets:{}};
const baseline=JSON.parse(await readFile('reports/2026-09-18-image-sdk/browser-execution.json','utf8'));
try {
  for(const source of model.sources)for(const backend of ['wasm','webgpu'])for(const mode of ['main','worker']) {
    const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
    try {
      const page=await context.newPage(),downloads=[];
      page.on('pageerror',e=>evidence.pageErrors.push(e.message));
      page.on('request',r=>{if(model.sources.some(s=>r.url()===s.downloadUrl))downloads.push(r.url());});
      await page.goto(url);assert.equal(await page.locator('select').inputValue(),'modelscope');
      await page.locator('select').selectOption(source.kind);
      await page.getByRole('button',{name:backend==='wasm'?'CPU':'GPU',exact:true}).click();
      await page.getByRole('button',{name:mode==='main'?'主线程':'Worker',exact:true}).click();
      await page.locator('input[type=file]').setInputFiles(path.join(root,'.tmp/evaluation/images/P0861.png'));
      await page.waitForFunction(()=>document.querySelector('canvas')?.width>0);
      await page.getByRole('button',{name:'开始检测',exact:true}).click();
      await page.locator('[role=status][data-state=success]').waitFor({timeout:240000});
      const pending=page.waitForEvent('download');await page.getByRole('button',{name:'导出 JSON',exact:true}).click();
      const file=path.join(scratch,`${source.kind}-${backend}-${mode}.json`);await(await pending).saveAs(file);
      const result=JSON.parse(await readFile(file,'utf8'));
      assert.equal(result.detections.length,136);assert.equal(result.runtime.actualBackend,backend);assert.equal(result.runtime.requestedBackend,backend);assert.equal(result.runtime.executionMode,mode);
      assert.equal(result.model.sha256,model.sha256);assert.equal(result.image.width,1024);assert.equal(result.image.height,1024);
      assert.deepEqual(downloads,[source.downloadUrl],'必须从明确选择来源完成真实下载');
      const expected=baseline.modes.find(m=>m.backend===backend&&m.executionMode===mode).results.find(r=>r.id==='P0861'&&r.inputKind==='rgba').output;
      let scoreError=0,cornerError=0;
      result.detections.forEach((row,i)=>{const ref=expected.detections[i];assert.equal(row.classId,ref.classId);scoreError=Math.max(scoreError,Math.abs(row.score-ref.score));row.polygon.flat().forEach((x,j)=>{cornerError=Math.max(cornerError,Math.abs(x-ref.polygon.flat()[j]));});});
      assert(scoreError<=.001&&cornerError<=.1);
      evidence.results.push({source:source.kind,revision:source.revision,backend,mode,status:'passed',detections:result.detections.length,runtime:result.runtime,model:result.model,downloads,scoreError,cornerErrorPx:cornerError,timings:result.timings});
      if(source.kind==='modelscope'&&backend==='webgpu'&&mode==='worker')await page.screenshot({path:path.join(scratch,hosted?'online-1280.png':'production-1280.png'),fullPage:true});
      console.log(`${source.kind}/${backend}/${mode}：136框，真实下载、SHA与结果一致性通过`);
    } finally { await context.close(); }
  }
  const context=await browser.newContext();
  try {
    const page=await context.newPage(),requests=[];
    page.on('pageerror',e=>evidence.pageErrors.push(e.message));
    page.on('request',r=>{if(model.sources.some(s=>r.url()===s.downloadUrl))requests.push(r.url());});
    const selected=model.sources.find(s=>s.kind==='huggingface');
    await page.route(selected.downloadUrl,route=>route.abort('failed'));
    await page.goto(url);await page.locator('select').selectOption('huggingface');
    await page.locator('input[type=file]').setInputFiles(path.join(root,'.tmp/evaluation/images/P0861.png'));
    await page.waitForFunction(()=>document.querySelector('canvas')?.width>0);
    await page.getByRole('button',{name:'开始检测',exact:true}).click();
    await page.getByRole('alert').waitFor({timeout:30000});
    assert.match(await page.getByRole('alert').textContent(),/DOWNLOAD/);
    assert.deepEqual(requests,[selected.downloadUrl]);assert.equal(await page.locator('.result-row').count(),0);
    evidence.explicitSourceFailure='passed';
  } finally { await context.close(); }
  assert.deepEqual(evidence.pageErrors,[]);
  for(const folder of ['dist','demo-dist']) {
    const walk=async dir=>{for(const entry of await readdir(dir,{withFileTypes:true})){const file=`${dir}/${entry.name}`;if(entry.isDirectory())await walk(file);else{assert(!/\.(onnx|pdparams|png|jpe?g)$/i.test(file),'产物不得包含模型或验收图片');const data=await readFile(file);evidence.assets[file]={bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};if(file.startsWith('demo-dist/assets/')&&file.endsWith('.js'))assert(!data.includes(Buffer.from('local-model/model.onnx')));}}};await walk(folder);
  }
  evidence.status='passed';
} catch(error) { evidence.error=String(error.stack??error);throw error; }
finally {
  await writeFile(`${report}/${hosted?'demo-online':'release-acceptance'}.json`,JSON.stringify(evidence,null,2)+'\n');
  await browser.close();server?.httpServer.close();
}
