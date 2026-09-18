// 保留 npm 官方安全验证流程，保存服务端确认创建的非敏感配置。
const fs=require('node:fs');
const assert=require('node:assert/strict');
const npmRoot=require('node:path').resolve('.tmp/npm-trust-cli/node_modules/npm');
const TrustCommand=require(`${npmRoot}/lib/trust-cmd.js`);
const {otplease}=require(`${npmRoot}/lib/utils/auth.js`);
const fetch=require(`${npmRoot}/node_modules/npm-registry-fetch`);
TrustCommand.prototype.createConfig=function(pkg,body){
 assert.equal(pkg,'web-sdk-pp-rotated-detection');
 assert.deepEqual(body,[{type:'github',claims:{repository:'chenmohan123/web-sdk-PP-RotatedDetection',workflow_ref:{file:'release.yml'},environment:'npm'},permissions:['createPackage']}]);
 const endpoint=`/-/package/${encodeURIComponent(pkg)}/trust`;
 return otplease(this.npm,this.npm.flatOptions,async opts=>{
  try{
   // 已在上次独立读取中确认配置为空；读与写的验证授权由 npm 分别签发。
   const response=await fetch(endpoint,{...opts,method:'POST',body});
   const saved=await response.clone().json();
   const readback=Array.isArray(saved)?saved:[saved];
   assert.equal(readback.length,1);assert.equal(readback[0].type,'github');
   assert.equal(readback[0].claims.repository,body[0].claims.repository);
   assert.equal(readback[0].claims.workflow_ref.file,'release.yml');
   assert.equal(readback[0].claims.environment,'npm');
   assert.deepEqual(readback[0].permissions,['createPackage']);
   fs.writeFileSync('reports/2026-09-18-release/npm-trusted-publishing.json',JSON.stringify({verifiedAt:new Date().toISOString(),status:'configured',evidence:'npm registry POST success response',package:pkg,configurations:readback,cliSchemaVersion:'12.0.2',oidcPublicationVerified:false,initialVersion:'0.1.0',initialVersionHasProvenance:false,boundary:'仅确认服务端保存的发布绑定；实际OIDC新版本发布与provenance留待下一正式版本验证。'},null,2)+'\n');
   return response;
  }catch(error){
   if(error.code==='E400')console.error('npm配置错误详情：'+JSON.stringify(error.body,(key,value)=>/token|otp|secret|auth/i.test(key)?'[省略]':value));
   throw error;
  }
 });
};
