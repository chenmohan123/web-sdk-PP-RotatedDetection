# 发布状态

[English](../en/release.md)

0.1.0 处于发布准备阶段。npm、GitHub Release 与 HTTPS Demo 是否已经上线，以 `reports/2026-09-18-release/` 的真实回执为准；工作流存在不代表发布成功。

发布前固定 ModelScope/Hugging Face 的不可变 revision，并对完整下载校验 bytes/SHA/CORS；`models/model.json` 与 `sdk-manifest.yaml` 保持一致。默认 ModelScope，显式选择失败不自动换源。完成两来源 × WASM/WebGPU × main/Worker 的真实生产浏览器验收，再运行测试、双类型检查、双构建、包检查与 `node scripts/check-release-ready.mjs`。CI、Pages 与 Release 都执行此门禁，不生成替代验收回执。

默认分支 main 经 PR 和最新 CI 合并；Ruleset 阻止删除、强推，要求会话解决。v* 标签 Ruleset 阻止更新与删除。About、Homepage、topics、规则集和部署环境均保留有日期的远程 API 证据。Pages 从 main 的 push 或手动触发构建 `demo-dist`，通过 github-pages 环境串行部署到 [HTTPS Demo](https://chenmohan123.github.io/web-sdk-PP-RotatedDetection/)。

首版使用已存在的不可变 `v0.1.0` 标签；标签必须与 `package.json` 版本相同，且指向 main 的祖先。Release 工作流的三种模式如下：

| 模式 | 行为 |
| --- | --- |
| `prepare`（手动默认） | 校验、构建并上传 `release-package` 中的 `package.tgz`；不执行 npm 或 GitHub Release 写入 |
| `publish` | 通过 npm 环境的 OIDC Trusted Publishing 发布；版本已存在时只比对 `dist.integrity`，不覆盖 |
| `verify-only` | 验证维护者在本机发布的同一 tarball；版本不存在或 SHA-512 不同即失败；成功后创建/更新 GitHub Release |

首次 npm 包尚不存在时，先使用 `prepare` 下载 CI 产物，经本机 npm 身份验证发布**同一个 `package.tgz`**，不要重新打包；随后手动运行同标签的 `verify-only`。配置 npm Trusted Publisher 为 `chenmohan123/web-sdk-PP-RotatedDetection`、工作流 `release.yml`、环境 `npm` 后，设置仓库变量 `NPM_TRUSTED_READY=true`，后续 tag push 才自动执行 `publish`；未设置时 tag push 仅执行 `prepare`。工作流不保存 npm 长期令牌，也不使用 setup-node 的 registry-url token 占位配置。

模型来自 PaddleDetection 固定提交，Apache-2.0 采用依据与权重解释边界见 [模型卡](../../models/README.md)。仅 FP32、WASM/WebGPU、单帧图片；Git/npm/Demo 不含 ONNX、评估图或原始张量。桌面结果不能扩大成手机、NPU 或全量 DOTA mAP 承诺。离线 `sdk:check` 无 required 失败仅代表本地标准通过；远程 required 全部验证后才可声明 compliant。检查 [发布清单](../release-checklist.md)。
