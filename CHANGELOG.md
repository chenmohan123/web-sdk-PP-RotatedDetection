# 更新记录

## 0.1.0 — 2026-09-18

- 新增框架无关PP-YOLOE-R-s FP32单帧旋转框SDK、DOTA15类原图四点输出。
- WASM/WebGPU、main/Worker、校验缓存、协作取消及幂等释放。
- Detection风格双语Demo：上传/拖放、阈值、稳定选中、JSON/叠加PNG导出和缓存控制。
- 双语安装与集成文档、Vanilla/React 示例、带真实回执门禁的 CI/Pages/Release。
- 已完成有日期桌面数值验证；无全量DOTA mAP、手机或NPU承诺。
- 默认模型为 PP-YOLOE-R-s 单尺度 1024 FP32、opset 17、33,161,415 字节；SHA-256：`de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089`。
- 默认 ModelScope，Hugging Face 可选；固定 revision 与下载地址以 `models/model.json` 为准，显式来源失败不静默换源。
- SDK 采用 Apache-2.0；PaddleDetection 上游与权重许可解释、转换归因见 `models/README.md`、`models/LICENSE` 和 `NOTICE`。
- 首版支持仅准备 tarball、npm Trusted Publishing 或验证本机首发；npm 完整性匹配后才创建 GitHub Release，不移动版本标签。
- npm、GitHub Release 与 HTTPS Demo 的实际发布状态以 `reports/2026-09-18-release/` 回执为准。
