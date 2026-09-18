# React 参考示例

完整 React 参考实现在 [demo/src/App.tsx](../../demo/src/App.tsx)，直接调用当前 0.1.0 SDK 公共 API。

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev
```

打开 http://127.0.0.1:4192，默认从ModelScope加载模型。可选本地模式见[快速开始](../../docs/zh-CN/quick-start.md)。正式构建运行`build:demo`，不含模型权重。

The complete React reference lives in [App.tsx](../../demo/src/App.tsx). Run the commands above and open http://127.0.0.1:4192; ModelScope is the default source. Optional local mode is documented in [Quick start](../../docs/en/quick-start.md). `build:demo` includes no model weights.
