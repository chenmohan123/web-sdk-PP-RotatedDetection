# Quick start

[中文](../zh-CN/quick-start.md)

## Installation and static assets

Install published version 0.1.0 in an existing Vite/TypeScript browser project. See [Release status](release.md) for npm integrity, CPU/GPU inference from the installed package, and production Demo verification. The source setup below is also available.

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false add web-sdk-pp-rotated-detection@0.1.0
node --input-type=module -e 'import {cpSync} from "node:fs"; import {dirname} from "node:path"; import {fileURLToPath} from "node:url"; cpSync(dirname(fileURLToPath(import.meta.resolve("web-sdk-pp-rotated-detection"))), "public/sdk", {recursive:true});'
```

This copies the installed package's entire `dist` directory, without model weights. Keep `inference.worker.js`, `ort.webgpu.bundle.min.mjs`, `ort-wasm-simd-threaded.asyncify.mjs` and its `.wasm` together. Copy again after SDK upgrades; do not mix ORT versions. Vite serves `public/sdk/` unchanged. Preserve this directory when deploying and serve correct module/WASM MIME types. Use HTTPS or localhost.

## Minimal browser integration

Add these elements to the page that loads your TypeScript entry:

```html
<input id="image" type="file" accept="image/png,image/jpeg,image/webp" />
<pre id="result"></pre>
```

The entry uses the ModelScope revision from the [model manifest](../../models/model.json), whose complete download has been verified:

```ts
import { createRotatedDetection } from "web-sdk-pp-rotated-detection";
const model = {
  id: "ppyoloe-r-s-1024-fp32",
  version: "0.1.0",
  url: "https://www.modelscope.cn/models/chenmohan/web-sdk-pp-rotated-detection/resolve/20632e3f350c664c2f88ea56b68bca0fe8a03349/ppyoloe-r-s-1024/0.1.0/ppyoloe-r-s-1024-fp32.onnx",
  bytes: 33161415,
  sha256: "de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089",
};
const input = document.querySelector<HTMLInputElement>("#image")!;
const output = document.querySelector<HTMLElement>("#result")!;
input.addEventListener("change", async () => {
  const image = input.files?.[0];
  if (!image) return;
  input.disabled = true;
  const sdk = createRotatedDetection({
    model,
    backend: "wasm",
    executionMode: "worker",
    runtimeBaseUrl: new URL("sdk/", document.baseURI).href,
  });
  try {
    await sdk.load({ onProgress: event => console.log(event) });
    const result = await sdk.run({ image }, { scoreThreshold: 0.1, nmsThreshold: 0.1 });
    output.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    output.textContent = String(error);
  } finally {
    await sdk.dispose();
    input.disabled = false;
  }
});
```

The example loads runtime assets from the page-relative `sdk/` directory, supporting both root hosting and subpaths such as `/web-sdk-PP-RotatedDetection/`. For deeper page routes, set `runtimeBaseUrl` to the actual static directory's absolute URL. Use `wasm` for CPU or `webgpu` for GPU, and `worker` or `main` for execution. Unsupported backends fail explicitly without silent fallback.

To explicitly select Hugging Face, replace only `model.url` with that source's `downloadUrl` from the [manifest](../../models/model.json), preserving id/version/bytes/SHA. Do not use a floating main URL. A selected source failure is reported. Both sources have identical bytes, so identity/SHA-verified caches can be reused; clear the current-model cache before verifying an actual download from a particular source.

## Run the Demo from source

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false install --frozen-lockfile
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev
```

Open http://127.0.0.1:4192. Plain `dev` and `build:demo` use actual Hub sources, with ModelScope selected by default. Choose/drop JPG, PNG or WebP, select CPU/GPU, Worker/main and thresholds, then detect. Select objects and export JSON or a PNG with all polygons. DOTA evaluation images are not bundled.

Optional offline development: place the same fixed model at `.tmp/model.onnx`, run `Get-FileHash .tmp/model.onnx -Algorithm SHA256` to match the SHA above and confirm 33,161,415 bytes, then run `pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev:local`. Only explicit local development modes expose local weights; production builds copy neither weights nor local URLs.

[Vanilla](../../examples/vanilla/README.md) uses `dev:vanilla` to load the pinned default ModelScope source on port 4193; optional `dev:vanilla:local` uses the verified `.tmp/model.onnx`. [React](../../examples/react/README.md) uses the full Demo.
