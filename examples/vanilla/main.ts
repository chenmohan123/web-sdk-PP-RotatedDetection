import type { RotatedDetection } from "../../src/types";
import metadata from "../../models/model.json";
import { resolveDemoModel } from "../../demo/src/model-sources";
declare const __LOCAL_MODEL__: boolean;
const input = document.querySelector<HTMLInputElement>("#image")!;
const output = document.querySelector<HTMLElement>("#result")!;
const run = document.querySelector<HTMLButtonElement>("#run")!;
let sdk: RotatedDetection | undefined, controller: AbortController | undefined;
document.querySelector("#cancel")!.addEventListener("click", () => {
  controller?.abort();
  void sdk?.dispose();
});
run.addEventListener("click", async () => {
  const image = input.files?.[0];
  if (!image || controller) return;
  const source = resolveDemoModel(
    metadata,
    "modelscope",
    __LOCAL_MODEL__,
    document.baseURI,
  );
  if (!source.ok) {
    output.textContent = "模型来源尚未发布 / Model source not published";
    return;
  }
  const c = new AbortController();
  controller = c;
  run.disabled = true;
  try {
    const api: typeof import("../../src/index") = await import(
      /* @vite-ignore */ new URL("sdk/index.js", document.baseURI).href
    );
    sdk = api.createRotatedDetection({
      model: source.model,
      backend: "wasm",
      executionMode: "worker",
      runtimeBaseUrl: new URL("sdk/", document.baseURI).href,
    });
    output.textContent = "正在加载…";
    await sdk.load({ signal: c.signal });
    output.textContent = "正在检测…";
    output.textContent = JSON.stringify(
      await sdk.run({ image }, { signal: c.signal }),
      null,
      2,
    );
  } catch (error) {
    output.textContent = String(error);
  } finally {
    await sdk?.dispose();
    sdk = undefined;
    controller = undefined;
    run.disabled = false;
  }
});
window.addEventListener("pagehide", () => {
  controller?.abort();
  void sdk?.dispose();
});
