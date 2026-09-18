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
