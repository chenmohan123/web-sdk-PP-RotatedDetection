# 旋转框 SDK 首次正式发布计划

> 执行：本任务继续已验收的本地候选，按步骤推进，并使用独立代理审查发布差异。用户本轮“可以继续推进”已确认上一轮明确提出的双源、npm与正式Demo发布。

**目标：** 发布 web-sdk-pp-rotated-detection@0.1.0、公开仓库与HTTPS Demo，默认ModelScope，Hugging Face可选。
**架构：** 保持已验收runtime；把固定模型分发、不可变来源、发布门禁及远程治理接入现有独立SDK。
**依据：** `docs/superpowers/specs/2026-09-18-rotated-image-sdk-design.md` 的技术契约，门户`standards/v1`，及本轮发布授权。原设计的“本轮仅本地”是上一轮边界，本轮扩展为正式发布。

## 约束

- 所有操作限定本SDK、新建同名双Hub模型仓库与npm包；原门户用户文件和其他SDK不改。
- 复用宿主登录，不输出令牌，不保存凭据到源码/日志。gh临时使用APPDATA/GitHub CLI并finally恢复。
- 固定33,161,415字节、SHA-256 de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089；不改网络或预后处理。
- DOTA图仅本地验证。保留Apache-2.0采用依据、权重许可解释边界与转换归因。
- 桌面CPU/GPU、main/Worker；不扩大手机/NPU/全量mAP承诺。发布标签不可移动。
- 使用现有隔离SDK目录和干净codex分支；无需再创建门户worktree。手工编辑apply_patch，pnpm附既定两个config选项。

### 1. 模型分发及许可记录

- [x] 核对固定上游来源锁、LICENSE、模型表/权重SHA与现有质量回执，准备`models/LICENSE`、转换记录和双语模型卡。
- [x] 在`.tmp/release-models`准备精确发布目录，复用脚本形态显式创建`chenmohan/web-sdk-pp-rotated-detection`两Hub仓库并上传；逐项保存真实commit回执。
- [x] 对两源固定revision完整GET并校验所有文件bytes/SHA，写`models/model.json` sources及sdk-manifest assets/variants，默认ModelScope。

### 2. 发布配置、文档和本地生产验收

- [x] 更新README/双语指南、清单、CHANGELOG与版本安装入口；历史本地报告保留其时点含义。
- [x] CI/Pages/Release采用固定版本、最小权限、不可变tag/main祖先校验，准备npm Trusted Publishing与首次本机发布后的verify-only模式。
- [x] 验证生产Demo从双Hub真实下载，覆盖两来源×CPU/GPU×main/Worker，SHA/CORS、显式失败不换源、JSON结果、浏览器无错误；同一构建记录摘要。
- [ ] 单测、双类型、双构建、打包与sdk:check；质量证据保持已验收构建，独立审查发布差异并解决必要问题。

### 3. GitHub、npm与正式HTTPS上线

- [x] 建立公开`chenmohan123/web-sdk-PP-RotatedDetection`，以已有设计基线初始化main；配置无bypass的默认分支与tag Rulesets、About/topics/Pages环境。
- [ ] 通过PR引入已审查产品与发布配置，等待最新CI通过后合并，记录PR与提交。Pages从受保护main部署。
- [ ] 首次npm发布使用当前登录，若npm强制用户安全验证则提供当前链接并继续其他独立工作；配置限定本仓库release.yml/npm环境的Trusted Publishing。
- [ ] 发布不可变v0.1.0、运行发布工作流并核对npm包完整性/安装/浏览器、GitHub Release、线上Demo双源及远程治理回执。
- [ ] 更新最终双语发布状态/清单与回执，经PR合并；保持本地工作树干净，保留运行预览与必要验证资料。

## 计划核查

模型身份贯穿Hub回读、manifest、生产浏览器与npm；工作流发布前验证版本与构建。npm首次安全验证不能由会话等待代替用户操作。公开仓库初始main只放已存在设计基线，后续产品经PR及最新CI，标签只在验收后的main祖先上创建。
