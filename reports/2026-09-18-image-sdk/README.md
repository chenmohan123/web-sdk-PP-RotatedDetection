# 旋转框图片 SDK 本地验收

日期：2026-09-18。单 SDK 图片首版，采用 PP-YOLOE-R-s 单尺度 1024 FP32，DOTA 遥感 15 类。本报告记录本地实现和桌面验证，不是模型 Hub、npm、GitHub Release 或正式 Demo 上线回执。

## 核心验收结果

公共构建 API 的 CPU/WASM、GPU/WebGPU × main/Worker 四模式全部通过。每模式九个 RGBA 输入加一张真实 PNG Blob，共四十项；端到端图片参考和实际输入张量的独立 Paddle 参考都满足类别/数量一致、无额外或遗漏检测、旋转 IoU≥0.995、分数误差≤0.001、角点误差≤0.1像素。最差旋转 IoU 为 **0.9993547166**，最大角点误差 **0.0190074像素**，最大分数误差 **0.0001156032**。两种空白负例均无框。

参考采用固定 PaddleDetection `b25522a0f4bde8c80603f3ba5e3472059972e3b5` 的原始 Paddle 网络、官方角点转换和 Shapely 旋转 NMS，与 SDK 的 TypeScript/polygon-clipping 后处理独立。不是 DOTA GT/mAP 评测。

- [输入来源与变换](dataset.lock.json)：两张官方 DOTA 图、旋转/裁剪/奇数尺寸/非整数缩放/细长图和空白。图片仅保留本地，不再分发。
- [公共 API 执行](browser-execution.json)：实际请求/执行后端、main/Worker、进度、输入输出摘要、GPU 指令及生命周期。
- [独立捕获张量参考](captured-reference.json)：四十个实际 session.run 输入的独立 Paddle 参考；相同张量摘要与比例去重后九组实际网络参考。
- [完整数值对照](comparison.json)：四十项图片端到端和四十项同张量结果分别保存。
- [摘要复核](verification.json)：236个本地产物摘要、模型身份、构建和复现脚本摘要一致。

## 生命周期与数值边界

四模式共72项生命周期检查通过，包括错误输入/阈值、BUSY、立即取消、Worker已提交run取消及恢复、缓存写入/再次完整性验证、未load调用、load预取消、dispose取消与重复释放、错误SHA/URL、部分字节下载取消、当前和全缓存清理。run取消为协作取消，等待已提交计算后丢弃结果；Worker的dispose立即终止。主线程不能保证定时取消打断同步WASM内核。

审查后加强了在途验证：测试包装器调用真实session.run后发出提交信号并暂缓返回，确认该信号后才dispose；main需等待结果释放，Worker在结果返回前结束，四模式释放后均可新建会话继续推理。下载实际收到65,536或196,608字节后才取消。该门控证明已提交操作的生命周期语义，不证明同步WASM仍在计算或被中断。图片质量捕获保持原批次，补跑时间单独记录在lifecycleVerifiedAt。

对照报告绑定当前浏览器执行、数据清单和同张量参考清单的SHA-256；复核拒绝旧比较结果与新执行报告混用。[篡改回归](evidence-binding-regression.json)在隔离副本分别修改三份来源之一，全部被拒绝。

缓存进度由公共回调报告 reading、miss、hit、invalid；hit仅在字节数和SHA通过后发出，miss包含缓存API不可用。三项事件顺序回归先红后绿，覆盖缺失/不可用、有效命中和损坏恢复；未通过验收前不会把损坏缓存标为命中。

ONNX物理输出名与语义名不同，SDK按固定张量形状映射scores/rboxes；[第一次失败诊断](initial-load-diagnostic.json)保留原始错误。新增逆序输出测试防止依赖导出顺序，坏张量会释放输入和输出资源。

预处理使用统一keep_ratio比例、FP32 cubic、uint8量化、ImageNet归一化及右下补零。OpenCV默认IPP路径存在少量舍入边界差异：P0072有23个归一化元素、旋转图32、641×513为23、1537×769为6、细长图4个元素不同，每项相当于一个RGB灰度级；其余四输入逐字节一致。原参考未被替换或放宽，最终图片检测仍达到原定门槛。

4096×1纯白图是明确的产品输入扩展：缩放尺寸至少一像素；上游OpenCV默认会拒绝零高输出。该扩展单独记录，不能宣称与上游零高路径等价。

## 环境与耗时

Windows 11 10.0.26200、Chromium 153.0.8010.12、ORT Web 1.27.0、Intel i5-10400F。[宿主设备回读](host-environment.json)确认NVIDIA GeForce RTX 5060 Ti、驱动32.0.16.1692。浏览器GPU记录为NVIDIA blackwell、非软件fallback；main和Worker每次真实推理均记录296次原生compute dispatch和GPUQueue提交。该证据证明实际GPU执行，不承诺全部节点在GPU。

[未插桩性能记录](performance.json)使用同一密集P0861 RGBA图片，已加载会话、三次热运行中位数：

| 后端/模式 | 预处理 | 网络推理 | 旋转NMS | 完整run |
| --- | ---: | ---: | ---: | ---: |
| WASM/main | 241.9 ms | 2182.5 ms | 121.3 ms | 2551.0 ms |
| WASM/Worker | 251.7 ms | 2391.6 ms | 133.9 ms | 2781.4 ms |
| WebGPU/main | 234.0 ms | 34.5 ms | 124.8 ms | 392.3 ms |
| WebGPU/Worker | 225.9 ms | 34.3 ms | 132.7 ms | 393.5 ms |

各列独立取中位数，不要求相加等于完整run。完整run含RGBA复制/预处理/推理/后处理与Worker通信，不含下载、会话加载或PNG解码。它们是单机同图观测，不是摄像头FPS或普遍性能。质量矩阵为捕获真实张量而插桩ORT边界，其timings含额外传输开销，不用于性能声明。

## 产品收尾与发布边界

核心代码、Demo/文档和全项目验收分阶段完成，最终UI/标准检查回执在收尾时补充。模型来源、公开仓库、npm与正式HTTPS Demo本轮尚未发布；不能用本地URL代替双源固定提交证据。

首版不包含视频、摄像头、切片拼接、FCOSR、FP16/量化或NPU。未验证移动端，也不阻塞本轮桌面开发。模型固定身份及许可采用依据延续[门户可行性评估](https://github.com/chenmohan123/chenmohan123.github.io/tree/674a0705ff56c7b9ce32f0bfd6733f536dfe9029/reports/rotated-detection/2026-09-18-feasibility)。完整复现见[验收脚本说明](../../scripts/evaluation/README.md)。
