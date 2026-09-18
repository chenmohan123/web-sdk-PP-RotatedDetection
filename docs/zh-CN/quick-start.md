# 快速开始

[English](../en/quick-start.md)

当前包与 Hub 权重未发布，请在本地仓库使用 0.1.0 候选。

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false install --frozen-lockfile
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev:local
```

开发模型由维护者提供固定转换产物，放在 `.tmp/model.onnx`，不要把任意同名 ONNX 当作此模型。需恰好 33,161,415 字节，SHA-256 为 `de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089`。PowerShell 可运行 `Get-FileHash .tmp/model.onnx -Algorithm SHA256` 校验。

打开 http://127.0.0.1:4192。选择/拖放 JPG、PNG、WebP，选择 CPU/GPU、Worker/主线程、阈值，然后开始检测。列表与画布可选中目标，导出 JSON 或全部框的叠加 PNG。无内置 DOTA 示例图片。

`dev:local` 使用显式 dev-local 模式，仅开发服务器提供固定白名单本地路径。普通 `dev` 和正式 `build:demo` 显示来源未发布并禁用检测。

```ts
import { createRotatedDetection } from "web-sdk-pp-rotated-detection";
const sdk = createRotatedDetection({
  model: verifiedModel, // { id, version, url, bytes, sha256 }
  backend: "wasm",
  executionMode: "worker",
  runtimeBaseUrl: new URL("/sdk/", location.href).href,
});
try {
  await sdk.load({ onProgress: event => console.log(event) });
  const result = await sdk.run({ image: file }, { scoreThreshold: 0.1, nmsThreshold: 0.1 });
  console.log(result.detections);
} finally {
  await sdk.dispose();
}
```

上述集成代码需要宿主提供 `file` 与可信 `verifiedModel`；当前不可复制不存在的 Hub URL。部署时把 SDK dist 全部复制到 `/sdk/` 并保留 Worker/ORT 同级资源。

[Vanilla](../../examples/vanilla/README.md) 用 `dev:vanilla` 打开4193；[React](../../examples/react/README.md) 复用完整 Demo。
