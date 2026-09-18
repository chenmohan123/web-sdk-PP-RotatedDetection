# React 参考示例

完整 React 参考实现在 [demo/src/App.tsx](../../demo/src/App.tsx)，直接调用当前 0.1.0 SDK 公共 API。

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev:local
```

按 [快速开始](../../docs/zh-CN/quick-start.md) 准备本地模型，然后打开 http://127.0.0.1:4192。正式构建运行 `build:demo`，不含模型权重。

The complete React reference lives in [App.tsx](../../demo/src/App.tsx). Prepare the local model using [Quick start](../../docs/en/quick-start.md), run the commands above, and open http://127.0.0.1:4192. `build:demo` builds the production app without model weights.
