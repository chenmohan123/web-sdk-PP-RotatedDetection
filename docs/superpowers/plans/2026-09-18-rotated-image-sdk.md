# 旋转框图片 SDK 实施计划

> 执行者使用 superpowers:subagent-driven-development 或 superpowers:executing-plans，逐项验收。

**目标：** 交付 PP-YOLOE-R-s FP32 的独立图片 SDK、本地统一 Demo 和可信桌面验收证据。
**架构：** TypeScript 框架无关 runtime，ORT Web main/Worker，独立旋转几何，React Demo 与 Vanilla 示例调用同一公共 API。
**技术栈：** ORT Web 1.27.0、polygon-clipping 0.15.7、TypeScript 5.9.3、Vitest、Playwright 1.63.0、Python/Paddle/Shapely。
**设计：** [设计文档](../specs/2026-09-18-rotated-image-sdk-design.md)。

## 全局约束

- 文档、回复、注释及提交使用中文；公开 README 和六组指南有英文对应。
- runtime 框架无关；Demo 延续 PP-Detection 的视觉布局，中文默认，可切英文。
- 正式来源仅 ModelScope/Hugging Face，默认 ModelScope。未实际发布的地址不能标为可用。
- 固定模型 SHA-256 de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089、33161415字节、输入1×3×1024×1024、DOTA15类。
- 模型、评估图、原始张量和截图留在忽略目录；不把桌面验证扩大成移动端、NPU 或全量 DOTA 精度承诺。
- pnpm 命令带 --config.verify-deps-before-run=false --config.manage-package-manager-versions=false。手动修改用 apply_patch。

### Task 1: 独立 runtime 与可打包公共 API

**文件：** package.json、tsconfig.json、vitest.config.ts、src/{types,errors,labels,preprocess,postprocess,image,ort,engine,runtime,cache,inference.worker,index}.ts、scripts/{build,check-package}.mjs、tests/*.test.ts、tests/fixtures/*、LICENSE、NOTICE。
**接口：** 精确遵循设计中的 createRotatedDetection、RotatedDetectionResult.detections、polygon 四点、loadTimings 和缓存接口；preprocess 返回 `{data,scaleFactor,resizedWidth,resizedHeight}`；postprocess 接受 Float32 scores/rboxes、scaleFactor 与 RunOptions。不做 Demo、公开文档或远程写入。

- [ ] 先创建项目工具和测试。参考相邻 Segmentation 通用缓存/生命周期测试，用旋转任务断言替换任务特定数据；新几何必须先红后绿。
```ts
expect(corners([10,20,4,2,0],[1,1])).toEqual([[12,21],[8,21],[8,19],[12,19]]);
expect(polygonIoU([[0,0],[4,0],[4,2],[0,2]],[[2,0],[6,0],[6,2],[2,2]])).toBeCloseTo(1/3);
expect(select(new Float32Array([.1]),new Float32Array([10,20,4,2,0]),[1,1],{classCount:1})).toHaveLength(0);
```
- [ ] 运行对应 Vitest，记录预期失败，再实现有边界检查的几何与预处理。固定上游几何样例可复制为测试证据，不能把测试期望用待测函数生成。
- [ ] 生命周期基础可从已发布 Segmentation 的通用模块有归因地适配；改变 factory、错误类、缓存命名、Worker 名、tensor 形状和输出处理，删除所有 mask/COCO 语义。默认 wasm/worker，不静默回退。
- [ ] 运行单测、typecheck、build、check:package。包内含可加载 ORT 资源及独立 Worker、不含图片或权重；用真实模型公共 API smoke 后再写 Task1报告。提交中文变更，报告实际红绿输出、复用来源和边界。

### Task 2: 统一 Demo、文档与发布骨架

**文件：** demo/**、examples/**、models/**（不含二进制）、sdk-manifest.yaml、README*、docs/{zh-CN,en,demo-checklist.md,release-checklist.md}、.github/workflows/**、CHANGELOG.md、tests/demo*.test.ts、tests/browser.mjs、package.json的Demo脚本。
**接口：** 消费 Task1 公共 API；开发 manifest 以明确 dev-only 方式注入本地URL；生产来源只列真实存在的两Hub。继承独立模型固定身份，不能复制分割掩码绘制。

- [ ] 参考 Segmentation App.tsx/style.css 与共享 ui-tokens，先为来源选择、四点绘制或关键交互写行为测试并确认失败。
```ts
expect(chooseSource(manifest,'modelscope').kind).toBe('modelscope');
expect(()=>chooseSource({sources:[]},'modelscope')).toThrow();
```
- [ ] 实现上传、预览、取消/重置、设置、检测列表与稳定选中、导出、缓存和双语；默认来源 ModelScope。使用清晰本地开发状态，不标示尚不存在的远程版本为已发布。
- [ ] 依据标准模板填写双语文档、清单、检查清单、CI与后续发布工作流。每个命令实际可执行，记录当前发布状态。
- [ ] 运行类型检查、Demo构建、相关测试；浏览器1280/390、切换语言、上传与选中、JSON导出、缓存控制验证。提交并报告可复现命令。

### Task 3: 公共 API 桌面质量与生命周期验收

**文件：** scripts/evaluation/**、tests/acceptance.mjs、reports/2026-09-18-image-sdk/**；必要修复通过原实现者处理。
**接口：** 使用构建产物 dist/index.js，模型和输入在 .tmp 下以本地白名单HTTP服务提供；reference使用固定上游/Paddle/Shapely，与SDK实现独立。

- [ ] 复制上轮本地模型和5输入的摘要证据；扩展缩放、奇数、极端比例预处理输入。先记录数据、参考和质量门槛，再跑 SDK。
- [ ] 对 wasm/webgpu × main/worker 四组合用公共 load/run/dispose 跑5图及扩展图片；保存原始输入/输出摘要、参考匹配、实际GPU命令与环境。
- [ ] 断言类别与数量一致、无额外或遗漏项、空图零框；同张量旋转IoU>=.995、score误差<=.001、角点<=.1px。把浏览器解码和插值误差单独分析，不用SDK结果反生成期望。
- [ ] 跑生命周期与失败恢复、npm包内容、sdk:check、全套verify和Demo浏览器检查；用截图目视确认旋转框、布局、无横向溢出。
- [ ] 写真实报告，更新双语兼容记录与检查清单；审查固定提交，修复问题后再完成。远程发布准备与未完成的双源/账户事项如实记录，禁止假成功。

## 计划自审

任务1提供任务2/3需要的接口；任务2只改Demo脚本，不改runtime契约；任务3使用公共API并独立产生参考。固定评估值只用于模型同一性与对照，不当作产品验收。具体外部发布需以用户授权和验收结果执行，当前不预填不可变revision或发布日期。
