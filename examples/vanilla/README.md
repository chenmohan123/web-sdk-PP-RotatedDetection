# Vanilla TypeScript 示例

从仓库根目录执行：

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false install --frozen-lockfile
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev:vanilla
```

打开 http://127.0.0.1:4193，选择图片并运行。使用当前0.1.0公共API、WASM+Worker和默认ModelScope固定来源。可选`dev:vanilla:local`使用已核验的`.tmp/model.onnx`，准备方式见[快速开始](../../docs/zh-CN/quick-start.md)；普通模式不提供本地权重。

Run the commands above from the repository root, then open http://127.0.0.1:4193. This uses the0.1.0 public API with WASM, Worker and the pinned ModelScope source. Optional `dev:vanilla:local` uses the verified `.tmp/model.onnx` from [Quick start](../../docs/en/quick-start.md); ordinary mode exposes no local weights.
