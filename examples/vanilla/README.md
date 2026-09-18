# Vanilla TypeScript 示例

从仓库根目录执行：

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false install --frozen-lockfile
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev:vanilla
```

打开 http://127.0.0.1:4193，选择图片并运行。使用当前 0.1.0 公共 API、WASM + Worker。先按 [快速开始](../../docs/zh-CN/quick-start.md) 准备忽略目录中的固定模型。此命令明确开启本地模式，生产无本地模型后门。

Run the commands above from the repository root, prepare the verified local model as described in [Quick start](../../docs/en/quick-start.md), then open http://127.0.0.1:4193. This example uses the 0.1.0 public API with WASM and Worker.
