# Compatibility

[中文](../zh-CN/compatibility.md)

Evidence dated2026-09-18, ORT Web1.27.0. Capability detection is not validation.

| Environment | Backend/mode | Result |
| --- | --- | --- |
| Windows11 10.0.26200 / Chromium153.0.8010.12 / i5-10400F | WASM, main and Worker | Passed |
| Same OS/browser / RTX5060 Ti, driver32.0.16.1692 | WebGPU, main and Worker | Passed |

40 public API checks cover four combinations × nine images plus one Blob path per combination, including non1024, odd dimensions, extreme ratios and blank images. Strict same-tensor and end-to-end numerical comparisons passed; minimum IoU0.9993547 and maximum corner error0.01901px. References use the fixed Paddle network, official corners and independent Shapely NMS.

Evidence: [matrix](../../reports/2026-09-18-image-sdk/browser-execution.json), [comparison](../../reports/2026-09-18-image-sdk/comparison.json). A390px desktop viewport checks layout only. Mobile, Safari, Firefox, WeChat web-view and NPU are unverified. FP16, quantization, video, camera and tiled large-image inference are not implemented. No full DOTA mAP claim.
