# 发布检查清单

0.1.0 的 npm、GitHub Release、双源模型与正式 Demo 已上线。根据标准模板逐项记录；远程完成状态以 `reports/2026-09-18-release/` 的真实回执为准，不能凭工作流文件勾选。

- [x] 中文默认README、英文README及双语七组指南。
- [x] 测试、类型检查、SDK与Demo构建、npm产物检查。
- [x] CI 包含测试、双类型检查、双构建、包检查与真实发布门禁。
- [x] 模型身份、SHA、许可依据、桌面验证条件和已知限制。
- [x] CHANGELOG 与带门禁的 Release/Pages 工作流；首版 prepare、publish、verify-only 模式。
- [x] 上传ModelScope与Hugging Face，验证不可变revision、bytes、SHA及CORS。
- [x] 填真实 sources、assets，清零本地 required 失败。
- [x] 两来源 × WASM/WebGPU × main/Worker 的生产浏览器回执，确认下载、校验与显式失败不换源。
- [x] 远程 GitHub/npm/在线 Demo 实际可达并有独立回执。
- [x] 默认分支Ruleset：PR、最新CI、会话解决、禁止删除/强推。
- [x] v*标签Ruleset：禁止更新/删除；最小绕过权限。
- [x] GitHub About、Homepage、topics与绑定不可变标签的GitHub Release。
- [x] 受保护来源HTTPS部署、Actions Pages、github-pages环境、并发与最小权限。
- [x] 通过远程API记录Ruleset、环境、部署标识、观测值和日期，不含凭据。
- [x] 从 prepare 产物首次发布 npm，以 verify-only 校验同一 tarball 的 dist.integrity 和安装；权重/评估图不得进入 Git/npm/Demo。
- [x] 配置限定本仓库 release.yml/npm 环境的 Trusted Publisher，再设置 NPM_TRUSTED_READY=true。
- [x] sdk:check无required失败，远程required全部验证后再宣称compliant。

GitHub Release 必须在 npm 完整性验证通过后创建；既有版本不覆盖，既有标签不移动。

Trusted Publisher 配置以 npm HTTP 201 创建响应和字段核验为依据，开关有独立 GitHub API 回读。首版无 provenance；下一正式版本再验证实际 OIDC 发布，不为验证创建额外版本。
