# PP-YOLOE-R-s FP32 模型卡

[English](README.en.md)

由chenmohan维护的PaddleDetection ONNX镜像，非Paddle官方账号。固定来源与实际分发状态见SDK仓库model.json。默认选择ModelScope；明确选源失败不静默换源。

| 字段 / Field | 值 / Value |
| --- | --- |
| ID | ppyoloe-r-s-1024-fp32 |
| 版本 / Version | 0.1.0 |
| 上游 / Upstream | PaddleDetection `b25522a0f4bde8c80603f3ba5e3472059972e3b5`，`ppyoloe_r_crn_s_3x_dota` |
| 格式 / Format | ONNX opset 17 · FP32 |
| 字节 / Bytes | 33,161,415 |
| 训练参数 / Training parameters | 8,243,749 |
| SHA-256 | de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089 |
| 输入 / Input | image [1,3,1024,1024] |
| 输出 / Outputs | scores [1,15,21504]；rboxes [1,21504,5] |
| 许可依据 / License basis | 固定上游项目的Apache-2.0声明与官方权重表；保留原始LICENSE与NOTICE，不另行声明DOTA数据许可 |

[上游配置 / Upstream](https://github.com/PaddlePaddle/PaddleDetection/tree/b25522a0f4bde8c80603f3ba5e3472059972e3b5/configs/rotate/ppyoloe_r)

15 类为 plane, baseball-diamond, bridge, ground-track-field, small-vehicle, large-vehicle, ship, tennis-court, basketball-court, storage-tank, soccer-ball-field, roundabout, harbor, swimming-pool, helicopter。适用于遥感单帧整图，未实现大图切片/拼接。DOTA 评估图片仅在忽略目录中使用，不随 Git/npm/Demo 分发。

The model targets single aerial images with the classes above. Tiling/stitching is not implemented. Evaluation images stay in ignored local directories and are not included in Git, npm or Demo output.

## 来源、许可与转换

[官方权重](https://paddledet.bj.bcebos.com/models/ppyoloe_r_crn_s_3x_dota.pdparams)由上述固定官方模型表链接：33,111,074字节，SHA-256 d9c4483c53a79bc8e8265f01beb044e060bb4bb017830befb046d2d504ec99a5。Apache-2.0采用依据为固定项目声明与官方模型表，审阅材料未发现独立点名该权重的许可文本；这是证据解释边界，不是额外许可声明。随附[原始LICENSE](LICENSE)，SDK保留NOTICE归因。

未重新训练或量化。Paddle2ONNX导出固定单图1024原始头，四点恢复与真实旋转IoU NMS移至SDK。构造器按0..90度固定初始化angle_proj_conv投影缓冲，它不是遗漏的训练权重。物理输出名、工具版本与来源摘要见[转换记录](conversion.json)。训练参数8,243,749为保留原网络口径，不能与上游重参数化后的8.09M混用。

2026-09-18，Windows11/Chromium153/ORT Web1.27.0，WASM/WebGPU×main/Worker共40项端到端和同张量独立Paddle对照通过，最差旋转IoU0.9993547、最大角点误差0.01901px。这是实现一致性验证，不是全量DOTA mAP。手机、Safari、Firefox、NPU未验证，视频/FP16/量化/大图切片未实现。不可变来源、字节/SHA和日期化证据见[SDK仓库](https://github.com/chenmohan123/web-sdk-PP-RotatedDetection)。
