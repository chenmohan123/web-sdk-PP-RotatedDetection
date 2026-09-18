# PP-YOLOE-R-s 模型卡 / Model card

当前状态：本地候选，ModelScope 与 Hugging Face 均未发布。默认选择 ModelScope；明确选源失败不静默换源。`model.json` 的 `sources: []` 是真实状态，不是可下载配置。

Status: local candidate. Neither ModelScope nor Hugging Face has published assets. ModelScope is the default; explicit selections do not silently fall back. Empty sources are intentional.

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
| 许可依据 / License basis | 上游 PaddleDetection Apache-2.0，保留 LICENSE / NOTICE；不另行声明 DOTA 数据许可 / Upstream Apache-2.0, retaining LICENSE / NOTICE; no claim over DOTA dataset licensing |

[上游配置 / Upstream](https://github.com/PaddlePaddle/PaddleDetection/tree/b25522a0f4bde8c80603f3ba5e3472059972e3b5/configs/rotate/ppyoloe_r)

15 类为 plane, baseball-diamond, bridge, ground-track-field, small-vehicle, large-vehicle, ship, tennis-court, basketball-court, storage-tank, soccer-ball-field, roundabout, harbor, swimming-pool, helicopter。适用于遥感单帧整图，未实现大图切片/拼接。DOTA 评估图片仅在忽略目录中使用，不随 Git/npm/Demo 分发。

The model targets single aerial images with the classes above. Tiling/stitching is not implemented. Evaluation images stay in ignored local directories and are not included in Git, npm or Demo output.

发布前必须上传固定权重、验证 Hub 的不可变 revision/字节/SHA/CORS，再填真实 sources 和 sdk-manifest assets；不得编造修订号或 URL。上传与远程仓库/npm 发布不属于本次本地工作。

Before release, upload the exact weights, verify immutable Hub revisions, bytes, SHA and browser CORS, then populate sources/assets. Remote publication is outside this local task.
