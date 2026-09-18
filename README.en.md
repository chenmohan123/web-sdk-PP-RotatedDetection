# PP-RotatedDetection

[中文](README.md)

A framework-neutral browser SDK for single-image rotated object detection with PP-YOLOE-R-s FP32 and 15 DOTA aerial classes. Results contain four polygon corners in original-image coordinates. CPU/WASM, GPU/WebGPU, main thread and Worker use the same public API.

**0.1.0 is a local candidate, not a published release.** ModelScope (default) and Hugging Face assets have not been uploaded. Production inference is disabled until sources exist; explicit local development uses the verified fixed model.

## Local setup

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false install --frozen-lockfile
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false dev:local
```

Prepare `.tmp/model.onnx` as described in [Quick start](docs/en/quick-start.md), then open http://127.0.0.1:4192. Plain `dev` and `build:demo` do not enable the local model. After publication, installation will be `pnpm add web-sdk-pp-rotated-detection@0.1.0`; this is not currently a live installation route.

## Planned destinations (not published)

[GitHub](https://github.com/chenmohan123/web-sdk-PP-RotatedDetection) · [npm](https://www.npmjs.com/package/web-sdk-pp-rotated-detection) · [Demo](https://chenmohan123.github.io/web-sdk-PP-RotatedDetection/)

The Chinese-default Demo offers English, upload/drop, thresholds, stable polygon selection, JSON/overlay PNG export, cache controls and collapsible timings.

## Guides

[Quick start](docs/en/quick-start.md) · [API](docs/en/api.md) · [Compatibility](docs/en/compatibility.md) · [Troubleshooting](docs/en/troubleshooting.md) · [Privacy/deployment](docs/en/privacy-deployment.md) · [Performance](docs/en/performance.md) · [Release](docs/en/release.md) · [Model card](models/README.md)

## Verification

On 2026-09-18, Windows 11 10.0.26200 / Chromium 153.0.8010.12 / i5-10400F / RTX 5060 Ti passed 40 public API numerical checks across CPU/GPU × main/Worker. Minimum rotated IoU: 0.9993547; maximum corner error: 0.01901px. This is not full DOTA mAP or mobile/NPU validation.

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false test
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false typecheck
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false typecheck:demo
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build:demo
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false check:package
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false test:browser
```

Browser checks need the local model and `.tmp/evaluation/images/P0861.png`, which is not redistributed. Install Chromium first with `pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false exec playwright install chromium`, or reuse an existing installation via `PLAYWRIGHT_BROWSERS_PATH`. See [manifest](sdk-manifest.yaml) for identity, license, size and SHA-256. Empty assets intentionally retain CONFIG-001 and resulting invalid-manifest cascade failures until model distribution exists; release readiness and compliance are not claimed.
