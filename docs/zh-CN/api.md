# API

[English](../en/api.md)

`createRotatedDetection({model,backend?,executionMode?,runtimeBaseUrl?})` 返回独立会话。默认 wasm、worker；不静默切后端。`model` 需 id/version/绝对HTTP(S) url/正整数字节bytes/64位sha256。`runtimeBaseUrl` 必须为以 / 结尾的资源目录。

| 接口 | 行为 |
| --- | --- |
| manifest / capabilities / loadTimings | 只读模型身份、能力探测、初始化耗时 |
| load({signal?,onProgress?}) | 缓存校验或下载模型并创建会话 |
| run({image}, {signal?,scoreThreshold?,nmsThreshold?}) | 单帧推理，阈值默认0.1，接受有限0..1 |
| dispose() | 幂等释放；Worker立即终止，主线程等待已提交推理 |
| getModelCacheInfo(model) | 当前模型 entries、bytes |
| clearCurrentModelCache(model) | 清理当前身份的缓存 |
| clearAllModelCache() | 只清理本SDK数据库 |

`image` 接受 Blob 或 `{width,height,data:Uint8Array|Uint8ClampedArray}` RGBA，最多16,777,216像素。调用者字节不被转移或修改。Alpha先合成白底，官方keep-ratio cubic预处理到1024、右下补零。

结果为 `{image:{width,height},detections,runtime,model,timings}`。每项 `{classId,label,score,polygon:[[x,y],[x,y],[x,y],[x,y]]}`，四点在原图坐标，不裁剪、不强制左上起点。坐标 y 向下，顺序沿官方局部 `(+w/2,+h/2),(-w/2,+h/2),(-w/2,-h/2),(+w/2,-h/2)`。按类别递增、类别内分数降序；旋转多边形IoU进行类内NMS。

进度phase为 cache/downloading/integrity/loading/ready。cacheStatus为reading/hit/miss/invalid；hit已通过字节和SHA检查，缓存不可用也报告miss。显式来源失败不换源。

单实例禁止并发，重复load在ready时不重建。run的signal是协作取消；不返回取消后的结果，但ORT在途工作可能继续。Demo取消同时dispose，下一次检测重新load。

错误码：INVALID_INPUT、INVALID_MANIFEST、DOWNLOAD、INTEGRITY、UNSUPPORTED、OUT_OF_MEMORY、SESSION、INFERENCE、BUSY、ABORTED、DISPOSED、NOT_LOADED。runtime返回requestedBackend、actualBackend、executionMode、runtimeVersion；actualBackend不是每算子GPU承诺。
