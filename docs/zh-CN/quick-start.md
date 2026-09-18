# 快速开始

[English](../en/quick-start.md)

## 安装与静态资源

在已有的 Vite/TypeScript 浏览器项目中安装固定版本。当前是 0.1.0 发布准备，npm 是否可安装以 [发布状态](release.md) 的实际回执为准；首发完成前可使用下方源码方式。

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false add web-sdk-pp-rotated-detection@0.1.0
node --input-type=module -e 'import {cpSync} from "node:fs"; import {dirname} from "node:path"; import {fileURLToPath} from "node:url"; cpSync(dirname(fileURLToPath(import.meta.resolve("web-sdk-pp-rotated-detection"))), "public/sdk", {recursive:true});'
```

复制的是已安装包的整个 `dist` 目录，不含模型。保持 `inference.worker.js`、`ort.webgpu.bundle.min.mjs`、`ort-wasm-simd-threaded.asyncify.mjs` 和对应 `.wasm` 同级。升级 SDK 后重新复制；不要混用不同 ORT 版本。Vite 将 `public/sdk/` 原样提供给页面，部署时须保留该目录，并正确返回 JS 模块与 WASM MIME。使用 HTTPS 或 localhost。

## 最小浏览器集成

页面中加入以下元素，并由该页面加载 TypeScript 入口：

```html
<input id="image" type="file" accept="image/png,image/jpeg,image/webp" />
<pre id="result"></pre>
```

入口代码使用 [模型清单](../../models/model.json) 中已完整回读校验的 ModelScope 固定 revision：

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

该示例在页面相对目录 `sdk/` 加载运行资源，适用于根路径及 `/web-sdk-PP-RotatedDetection/` 这样的子路径；如页面路由更深，请把 `runtimeBaseUrl` 改为实际静态目录的绝对 URL。CPU 使用 `wasm`，GPU 使用 `webgpu`；执行方式可选 `worker` 或 `main`。后端不支持时会报错，不会静默回退。

若显式选择 Hugging Face，只将 `model.url` 换成 [清单](../../models/model.json) 对应 source 的 `downloadUrl`，保留相同 id/version/bytes/SHA；不要使用浮动 main URL。所选来源失败即报错。两源模型字节相同，因此按身份与 SHA 校验后的缓存可复用；要验证某来源的真实下载，应先清理当前模型缓存。

## 从源码运行 Demo

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false install --frozen-lockfile
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev
```

打开 http://127.0.0.1:4192。普通 `dev` 与 `build:demo` 使用真实 Hub 来源，默认 ModelScope。选择/拖放 JPG、PNG、WebP，选择 CPU/GPU、Worker/主线程及阈值后检测；可选中目标并导出 JSON 或全部框的叠加 PNG。不内置 DOTA 评估图片。

可选离线开发：把同一固定模型放在 `.tmp/model.onnx`，运行 `Get-FileHash .tmp/model.onnx -Algorithm SHA256` 确认与上述 SHA 相同且长度为 33,161,415 字节，再运行 `pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev:local`。只有显式 local 开发模式提供本地权重，正式构建不复制权重或本地 URL。

[Vanilla](../../examples/vanilla/README.md) 使用 `dev:vanilla` 从默认 ModelScope 固定来源加载模型，端口 4193；可选 `dev:vanilla:local` 使用已校验的 `.tmp/model.onnx`。[React](../../examples/react/README.md) 复用完整 Demo。
