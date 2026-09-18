# PP-RotatedDetection

[English](README.en.md)

浏览器端单帧旋转框检测 SDK，基于 PP-YOLOE-R-s FP32，识别 DOTA 15 类遥感目标。返回原图坐标系的四点框；CPU/WASM、GPU/WebGPU 和 main/Worker 均调用同一框架无关公共 API。

**0.1.0 本地候选，尚未发布。** ModelScope（默认）与 Hugging Face 模型源尚未上传；正式 Demo 禁用检测，本地开发可使用校验通过的固定模型。

## 本地安装与运行

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false install --frozen-lockfile
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev:local
```

先按 [快速开始](docs/zh-CN/quick-start.md) 将固定模型放到 `.tmp/model.onnx`，再打开 http://127.0.0.1:4192。普通 `dev` 和 `build:demo` 不启用本地模型。npm 发布后的安装命令为 `pnpm add web-sdk-pp-rotated-detection@0.1.0`，目前不可作为已上线安装入口。

## 项目入口（计划地址，未发布）

- [GitHub](https://github.com/chenmohan123/web-sdk-PP-RotatedDetection)
- [npm](https://www.npmjs.com/package/web-sdk-pp-rotated-detection)
- [在线 Demo](https://chenmohan123.github.io/web-sdk-PP-RotatedDetection/)

Demo 默认中文，可切英文；上传/拖放、阈值、旋转框选中、JSON/叠加 PNG 导出、缓存和折叠耗时信息均在同一页面。

## 文档

[快速开始](docs/zh-CN/quick-start.md) · [API](docs/zh-CN/api.md) · [兼容性](docs/zh-CN/compatibility.md) · [排错](docs/zh-CN/troubleshooting.md) · [隐私与部署](docs/zh-CN/privacy-deployment.md) · [性能](docs/zh-CN/performance.md) · [发布](docs/zh-CN/release.md) · [模型卡](models/README.md)

## 验证

2026-09-18，Windows 11 10.0.26200 / Chromium 153.0.8010.12 / i5-10400F / RTX 5060 Ti：CPU/GPU × main/Worker 的 40 项公共 API 数值对照通过。最差旋转 IoU 0.9993547、最大角点误差 0.01901px；这不是完整 DOTA mAP，也不代表手机或 NPU 验证。

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false test
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false typecheck
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false typecheck:demo
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build:demo
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false check:package
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false test:browser
```

浏览器测试还需本地模型和 `.tmp/evaluation/images/P0861.png`（不分发评估图），并先用 `pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false exec playwright install chromium` 安装 Chromium；已有浏览器可设 `PLAYWRIGHT_BROWSERS_PATH` 复用。模型大小、许可证及 SHA-256 见 [清单](sdk-manifest.yaml)。当前 `assets: []` 有意保留待分发缺项，标准检查仍有 CONFIG-001 及其清单失效级联项，不能声称可发布或已合规。
