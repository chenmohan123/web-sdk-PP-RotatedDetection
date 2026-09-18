# Quick start

[中文](../zh-CN/quick-start.md)

The package and Hub assets are not published. Use the local 0.1.0 candidate.

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false install --frozen-lockfile
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev:local
```

Obtain the fixed converted artifact from the maintainer and place it at `.tmp/model.onnx`. An arbitrary similarly named ONNX model is not interchangeable. Required size: 33,161,415 bytes; SHA-256: `de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089`. Verify with PowerShell `Get-FileHash .tmp/model.onnx -Algorithm SHA256`.

Open http://127.0.0.1:4192. Choose/drop JPG, PNG or WebP, select CPU/GPU, Worker/main and thresholds, then detect. Select objects from the list or canvas; export JSON or a PNG with all polygons. DOTA sample images are not bundled.

`dev:local` explicitly selects dev-local mode. Only its development server exposes the fixed local path. Plain `dev` and production `build:demo` show unpublished sources and disable inference.

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

The host supplies `file` and trusted `verifiedModel`. Do not invent Hub URLs. Copy all SDK dist files to `/sdk/`, keeping Worker and ORT files together.

[Vanilla](../../examples/vanilla/README.md) uses `dev:vanilla` on port4193; [React](../../examples/react/README.md) is the full Demo.
