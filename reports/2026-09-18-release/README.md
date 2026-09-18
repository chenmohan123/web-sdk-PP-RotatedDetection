# PP-RotatedDetection 0.1.0 首发记录

本阶段获用户“可以继续推进”授权，继续已验收本地候选，执行双源分发、GitHub、npm与正式HTTPS Demo发布。当前已完成项按下列回执记录，后续上线结果继续追加。历史`2026-09-18-image-sdk`报告反映上一阶段时点，不改写其未发布结论。

## 固定模型与许可

PP-YOLOE-R-s单尺度1024 FP32，33,161,415字节，SHA-256 `de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089`。未训练或量化，runtime和数值预后处理保持上一轮已验收构建。

[许可来源锁](license/sources.lock.json)记录固定上游`b25522a0f4bde8c80603f3ba5e3472059972e3b5`的LICENSE、官方PP-YOLOE-R模型表和权重身份。Apache-2.0采用依据与“未发现独立权重许可文本”边界写入双语模型卡；原始LICENSE/NOTICE与转换记录随模型分发。DOTA图片与原始张量不分发。

## 双源分发

仓库均为`chenmohan/web-sdk-pp-rotated-detection`。模型路径`ppyoloe-r-s-1024/0.1.0/ppyoloe-r-s-1024-fp32.onnx`。

| 来源 | 固定模型提交 |
| --- | --- |
| ModelScope（默认） | 20632e3f350c664c2f88ea56b68bca0fe8a03349 |
| Hugging Face | 5ee386be20104afcc334e83ace6a5db048a00593 |

[准备记录](distribution-prepared.json)、两份`distribution-weights-*.json`上传回执及[逐文件完整回读](distribution-weights-verified.json)固定模型、卡片和许可的bytes/SHA。后续metadata提交仅提供固定来源model.json，不移动已有模型提交；对应回读见[metadata验证](distribution-metadata-verified.json)。所有身份检查使用实际文件，不接受LFS pointer替代模型。

## 本地生产验收

[八组合验收](release-acceptance.json)直接操作生产构建Demo，从两Hub真实下载，覆盖两来源×WASM/WebGPU×main/Worker；每组P0861图片均136框，原图四点、类别、分数与已验收同模式输出一致。模型下载经runtime字节/SHA校验，浏览器实际跨源访问证明CORS可用；显式Hugging Face网络失败展示DOWNLOAD错误且无ModelScope请求。pageerror为空。

`scripts/check-release-ready.mjs`核验双源、模型/包版本、固定清单、原始质量报告来源绑定、已验收SDK构建、当前dist/demo-dist所有文件摘要与八组合回执。它不伪造或补写通过状态。33项单测、双类型检查、双构建及包检查通过；后续CI和线上验收另留真实回执。

[Vanilla公开来源验收](vanilla-published.json)使用默认ModelScope实际推理得到136框，执行中禁用图片输入、换图清空结果均通过，生产构建不含本地模型地址，浏览器错误为空。

[标准检查](standard-ready.json)无required失败，远程项目在本地检查中仍skip。[远程配置回读](governance-configured.json)确认默认分支PR/最新verify检查/禁止删除强推/会话解决、不可变v*标签、无bypass、Pages与npm环境。最终远程通过还需实际部署和发布记录。

## 发布顺序与复现

1. `scripts/publish-models.py prepare --feasibility <固定可行性报告目录>`准备模型卡和许可；显式`upload --source modelscope|huggingface --phase weights|metadata`后执行`verify --phase weights|metadata`，复用宿主Hub登录但不写入令牌。
2. 完成清单后构建，执行`node scripts/release-browser.mjs`和`node scripts/check-release-ready.mjs`；本地真实模型图片仅在`.tmp`，截图不入Git。
3. 受保护main经PR/CI合并，Pages workflow发布；不可变tag首次只prepare，下载CI唯一tar进行npm首次安全验证发布，再执行verify-only核对同一tar完整性。
4. npm Trusted Publishing仅绑定本仓库`release.yml`与`npm`环境，配置回读通过后再启用后续tag自动publish。

所有pnpm命令附`--config.verify-deps-before-run=false --config.manage-package-manager-versions=false`。实际远程上线日期/URL、安装测试和安全验证结果只在完成后记录。

## 正式 Demo 上线

[PR #1](https://github.com/chenmohan123/web-sdk-PP-RotatedDetection/pull/1)经[独立审查及复审](review.md)、最新CI通过后合并到`09a0670c64b3c0681aced34057d3572d7973dc30`。[Pages运行35352034205](https://github.com/chenmohan123/web-sdk-PP-RotatedDetection/actions/runs/35352034205)成功部署到[正式HTTPS Demo](https://chenmohan123.github.io/web-sdk-PP-RotatedDetection/)。

[线上八组合](demo-online.json)均实际从明确来源下载模型，得到136框并与基线数值一致，显式Hugging Face失败不切ModelScope，无页面错误。[22项线上资产](demo-assets-online.json)逐文件完整GET的bytes/SHA与本地已验收构建一致；不只是检查HTTP首页可达。

## npm 与 GitHub Release

`web-sdk-pp-rotated-detection@0.1.0`已经发布。[npm完整回读](npm-published.json)验证公开metadata与完整tarball：6,163,715字节、SHA-256 `9146ac6d1c830fa98cdc730ef78e49bf5e33d3aaf69a7196b6771ab0a9a69cb6`，SHA-512与[CI首发包](npm-prepared-package.json)一致。包共24文件，不包含模型和评估图。

[隔离npm安装](npm-install.json)从registry安装固定版本、复制实际安装包的dist资源，执行公共API和ModelScope真实下载。WASM/Worker与WebGPU/Worker均136框，模型身份与所有SDK静态资源摘要一致，无页面错误。验证脚本保存在本机`.tmp/npm-install-smoke.mjs`；本地评估图片不分发。

[verify-only工作流](release-published.json)在不可变`v0.1.0` ref执行，再次比对registry与CI重建tarball完整性，所有job成功后创建[GitHub Release](https://github.com/chenmohan123/web-sdk-PP-RotatedDetection/releases/tag/v0.1.0)。没有覆盖npm版本或移动标签。[远程治理回读](governance-published.json)记录已生效的Rulesets、HTTPS Pages、环境和成功部署/Release证据。

## Trusted Publishing 配置完成

[配置回执](npm-trusted-publishing.json)记录 npm 返回 HTTP 201、固定仓库/工作流/环境字段断言通过的事实。npm 12.0.2 显式请求 `createPackage`，服务端返回 `createPackage` 与 `createStagedPackage`；本地脚本的权限完全相等断言因此退出1。该本地错误发生在远程保存之后，不代表创建失败；未重复提交。实际响应日志经过认证信息过滤，见[npm-trust-response.log](npm-trust-response.log)，字段核验逻辑快照见[npm-trust-response-verifier.cjs](npm-trust-response-verifier.cjs)。没有保存完整响应或配置ID，也没有另作GET，报告明确保留此证据边界。

[GitHub开关回读](npm-trusted-ready.json)确认 `NPM_TRUSTED_READY=true`。绑定仅对应 `chenmohan123/web-sdk-PP-RotatedDetection` / `release.yml` / `npm`，配合既有环境 `v*` 标签策略，后续标签自动进入发布模式。首次0.1.0仍是本机账号发布，无 provenance；实际 OIDC 新版本发布及 provenance 生成留待下一正式版本，不通过额外版本测试。
