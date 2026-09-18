# 兼容性

[English](../en/compatibility.md)

以下证据日期为2026-09-18，ORT Web1.27.0。浏览器能力探测不等于验收。

| 环境 | 后端/模式 | 结果 |
| --- | --- | --- |
| Windows11 10.0.26200 / Chromium153.0.8010.12 / i5-10400F | WASM，main与Worker | 通过 |
| 同OS/浏览器 / RTX5060 Ti，驱动32.0.16.1692 | WebGPU，main与Worker | 通过 |

40项公共API矩阵涵盖4组合×9图及每组合1次Blob路径；包含非1024、奇数尺寸、极端比例与空白图。同输入张量严格参考及端到端对照通过，最差IoU0.9993547、最大角点误差0.01901px。参考为固定Paddle原网络、官方角点和独立Shapely NMS。

证据：[矩阵](../../reports/2026-09-18-image-sdk/browser-execution.json)、[比较](../../reports/2026-09-18-image-sdk/comparison.json)。390px仅桌面浏览器视口布局测试，不代表真机支持。手机、Safari、Firefox、微信web-view、NPU未验证；FP16、量化、视频、摄像头、大图切片未实现。没有全量DOTA mAP承诺。
