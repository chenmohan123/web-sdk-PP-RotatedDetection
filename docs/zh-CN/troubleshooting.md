# 排错

[English](../en/troubleshooting.md)

| 现象/代码 | 处理 |
| --- | --- |
| 模型来源尚未发布 | 当前生产预览预期状态；等待双Hub真实资产，维护者使用dev:local |
| DOWNLOAD / INTEGRITY | 核对所选来源、CORS、固定bytes/SHA；不要改校验值绕过错误 |
| UNSUPPORTED | 检查HTTPS/localhost、WebGPU适配器和浏览器；可手动选择CPU |
| SESSION / INFERENCE | 保留错误码、浏览器、模型SHA和运行方式；确认ORT同版本同级资源 |
| INVALID_INPUT | 图片须可解码、最多16,777,216像素；阈值须在0..1 |
| BUSY / NOT_LOADED | await load，再串行run；每实例单次任务 |
| ABORTED / DISPOSED | 取消/销毁后重建实例；不要复用已释放对象 |
| 缓存清理后仍有内存 | 缓存清理针对IndexedDB；先dispose释放会话 |

Worker立即终止可停止其任务，主线程已提交ORT运算需等待返回。重复点击不会产生可见陈旧结果。只提供通用稳定错误码，不把内部堆栈当作用户提示。
