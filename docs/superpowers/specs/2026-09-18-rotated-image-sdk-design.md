# PP-RotatedDetection 图片首版设计

日期：2026-09-18。用户已确认继续上一轮提出的独立 SDK 首版：PP-YOLOE-R-s FP32、DOTA 15 类、图片、CPU/GPU、Worker、统一 Demo、ModelScope 默认。属于单 SDK 架构任务。门户只登记最终发布版本；本阶段先完成可验收的本地产品与发布准备。

## 方案与边界

采用独立 `web-sdk-PP-RotatedDetection` 仓库和 `web-sdk-pp-rotated-detection` npm 名，0.1.0 候选。沿用现有 Segmentation SDK 的通用生命周期及资源协议，独立实现旋转框数学；保留来源归因。把能力加入轴对齐 Detection 会混淆输出契约，直接发布实验脚本则缺少公共 API 与生命周期，故不采用这两条路线。

固定上游 `b25522a0f4bde8c80603f3ba5e3472059972e3b5` 的 `ppyoloe_r_crn_s_3x_dota`。ONNX opset 17，33,161,415 字节，SHA-256 `de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089`，训练参数 8,243,749；输入 `image[1,3,1024,1024]`，输出 `scores[1,15,21504]` 和 `rboxes[1,21504,5]`。沿用原转换，不重导出或改变网络。

首版仅单帧整图；大图缩放，未实现切片/拼接。模型是遥感 DOTA 15 类，非 COCO。FP16/量化、FCOSR、视频、摄像头、NPU、Workflow 留后续。手机不阻塞桌面迭代。

## 公共 API 与数学契约

`createRotatedDetection({model,backend?:'wasm'|'webgpu',executionMode?:'main'|'worker',runtimeBaseUrl?})` 返回具有 `manifest`、`capabilities`、`loadTimings`、`load`、`run`、`dispose` 的对象。默认 wasm、worker；不静默切后端或换源。model 为 `{id,version,url,bytes,sha256}`，URL 必须绝对 HTTP(S)，实际类型与错误码遵循公共标准。

`run({image:Blob|PixelImage}, {signal?,scoreThreshold?,nmsThreshold?})` 返回 `{image:{width,height},detections,runtime,model,timings}`。`PixelImage={width,height,data:Uint8Array|Uint8ClampedArray}` 为 RGBA；最大 16,777,216 像素。每个检测为 `{classId,label,score,polygon:[[x,y],[x,y],[x,y],[x,y]]}`。四点在原图坐标系，不裁剪，不强制左上起点；顺序沿用官方局部 `(+w/2,+h/2),(-w/2,+h/2),(-w/2,-h/2),(+w/2,-h/2)`。内部角度为弧度，图像 y 轴向下。公共输出优先四点，避免非方形缩放与宽高角度归一化的歧义。

预处理沿官方 keep_ratio/cubic RGB：最长边目标 1024，使用统一 scale=1024/max(width,height)，输出尺寸取最近偶数舍入且至少 1 像素，上下限校验；三次插值参数 A=-0.75，采样坐标按统一 scale 计算，不能按舍入后的尺寸重新定义比例。Alpha 先合成白底。RGB uint8 插值量化后按 ImageNet mean=[.485,.456,.406]、std=[.229,.224,.225]，FP32 运算次序对照 OpenCV/Paddle。右/下补归一化后的零。返回 `scaleFactor:[sy,sx]`（FP32 原比例）、`resizedWidth`、`resizedHeight`、CHW `data`。

旋转 NMS 使用固定 polygon-clipping 0.15.7，预先做 AABB 不相交快速排除但实际抑制必须依据多边形 IoU。每类 score 严格 `> Math.fround(scoreThreshold)`（默认 .1）、降序前 2000、同分按原始索引稳定排序；IoU 严格 > nmsThreshold（默认 .1）抑制。类别隔离，总输出不人为截断；按类别递增、类别内分数降序。阈值接受有限 0..1，其余输入拒绝。全张量非有限值、负宽高及输出形状错误需稳定 INFERENCE 错误，不忽略损坏的输出。

## 生命周期与运行资源

参考 Segmentation 已验收的通用代码，单实例不并发，忙时 BUSY，未 load 时 NOT_LOADED。下载支持 AbortSignal、流式进度、精确字节和 SHA-256。IndexedDB 以 id/version/sha 版本化，损坏缓存删除后从所选源重下；缓存不可用仍可运行。

模型在 main 或模块 Worker 执行；Worker 消息用自有 RGBA 副本，调用者数据不 detach；结果仅为小型四点列表。dispose 幂等，Worker 立即终止，主线程等待已提交推理返回再释放；abort 不返回陈旧结果。单独 run 的 abort 在 main 为协作取消，Worker 可通过终止取消，但需明确是否要求重新 load。严禁过期结果覆盖新图片。

标准错误：INVALID_INPUT、INVALID_MANIFEST、DOWNLOAD、INTEGRITY、UNSUPPORTED、OUT_OF_MEMORY、SESSION、INFERENCE、BUSY、ABORTED、DISPOSED、NOT_LOADED。加载与推理耗时分别保持标准字段。actualBackend 只代表实际选中的执行提供者，不承诺每算子 GPU。

## Demo、文档与分发

以 Segmentation 当前 Detection 风格 Demo 为参考：紧凑顶栏、左主结果画布、右控制/摘要，390px 无溢出，选中详情保持固定区域不推动图片；无长操作说明。上传/拖放、检测/取消/重置、后端/执行模式、来源二选一、阈值、四点框/选中高亮、结果列表、JSON 与叠加图导出、折叠模型/运行/耗时、缓存管理、双语。示例素材须明确可再分发许可；上游 DOTA 图只用于忽略目录中的本地验收，不随产品发布。可以无内置示例而保持上传流程完整。

运行只调用公共 API，runtime 不引入 React。ModelScope 默认，Hugging Face 次选；本地预览经显式开发 manifest 走测试 URL，生产构建不得携带 ONNX 或开发地址。尚无双源资产时准确记录待分发，不编造 revision 或可用状态。公开双语 README、quick-start、api、compatibility、troubleshooting、privacy-deployment、performance；Vanilla 示例和 React Demo 均可运行。CI/Pages/Release 工作流先准备，不用未验证的发布状态填充证据。

## 验收

先以失败单测定义旋转几何、缩放/补零、阈值边界与生命周期，然后实现。独立参考来自固定上游 Paddle 原网络、官方角点和 Shapely NMS；SDK 不使用自己后处理产生的参考。

公共 API 至少 CPU/GPU × main/worker × 五基准图全通过；另加入非 1024 缩放、奇数尺寸和极端比例合成图验证预处理、原图还原与空输入边界。读取浏览器解码 RGBA 对照 Python 输入，区分解码与缩放误差。对同输入张量，沿用旋转 IoU>=.995、score误差<=.001、角点<=.1px，无额外/遗漏检测；端到端图片对照单独报告，不用放松同张量标准掩盖插值差异。

完成 load取消、run取消、dispose、重建、重复load、BUSY、错误URL、错误SHA、缓存命中与损坏恢复，实际 GPU 适配器/命令记录、页面无错误、截图目视和1280/390布局。运行 sdk:check、包测试、类型检查、构建、打包检查与真实浏览器。模型和图像不进入 Git/npm/Demo 产物；缺少全量 mAP 与手机证据明示。最终保留有日期的报告、失败诊断与下一步发布事项。
