# 性能与耗时

[English](../en/performance.md)

loadTimings包括modelDownloadMs、modelCacheReadMs、integrityMs、sessionMs。run timings包括decodeMs、preprocessMs、inferenceMs、postprocessMs、totalMs；totalMs是本次run，不含load。Worker通信与调度可能让端到端墙钟超过分项和。

冷启动指清理模型缓存、新建实例、load后首次run；热运行指同一ready会话再次run。Demo每次检测创建并最终释放会话，缓存命中不等于热会话。

2026-09-18，Chromium153 / Windows11 / RTX5060 Ti，固定P0861图、WebGPU Worker、未插桩SDK、3次热运行中位数：推理34.3ms，完整run393.5ms（预处理225.9ms、后处理132.7ms）。这是特定桌面同图观测，不是普适FPS；密集旋转NMS与图片预处理同样占时。

完整条件与原始分项见 [performance.json](../../reports/2026-09-18-image-sdk/performance.json)。没有移动端性能或全数据集速度结论。
