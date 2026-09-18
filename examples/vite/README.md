# Vite 示例

Vite入口复用独立React Demo及当前0.1.0公共SDK，不复制推理实现。从仓库根目录执行：

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false install --frozen-lockfile
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev
```

打开 http://127.0.0.1:4192，默认ModelScope、可选Hugging Face。正式构建为`build:demo`，产物`demo-dist`包含SDK/Worker/ORT资源，不含权重。固定来源与自定义集成见[快速开始](../../docs/zh-CN/quick-start.md)。

The Vite entry reuses the React Demo and version0.1.0 public SDK. Run the commands above from the repository root and open http://127.0.0.1:4192. ModelScope is the default, with explicit Hugging Face selection. `build:demo` generates `demo-dist` containing SDK/Worker/ORT resources but no weights. See [Quick start](../../docs/en/quick-start.md) for pinned sources and integration.
