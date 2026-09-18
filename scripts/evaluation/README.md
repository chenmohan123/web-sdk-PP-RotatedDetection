# 桌面图片 SDK 验收复现

从 SDK 根目录执行。真实权重、图片、RGBA、输入/输出张量和截图仅放 `.tmp`，不随 SDK 分发。
固定上游：PaddleDetection `b25522a0f4bde8c80603f3ba5e3472059972e3b5`。

```powershell
$rotPython = 'F:/git/00_chenmohan/github/web-sdk-PP-Detection/.tmp/phase2/venv/Scripts/python.exe'
$rotUpstream = 'F:/git/00_chenmohan/github/web-sdk-PP-Detection/.tmp/phase2/upstream/PaddleDetection-b25522a0f4bde8c80603f3ba5e3472059972e3b5'
$rotFeasibility = 'F:/git/00_chenmohan/github/chenmohan123.github.io/.tmp/rotated-feasibility'
$env:PYTHONIOENCODING = 'utf-8'
$env:PLAYWRIGHT_BROWSERS_PATH = 'F:/git/00_chenmohan/github/web-sdk-PP-Detection/.tmp/dependencies-compatible-browsers'
Copy-Item "$rotFeasibility/ppyoloe_r_crn_s_3x_dota/model.onnx" '.tmp/model.onnx'
& $rotPython scripts/evaluation/prepare_reference.py --upstream $rotUpstream --feasibility-work $rotFeasibility
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
node scripts/evaluation/browser.mjs
& $rotPython scripts/evaluation/prepare_reference.py --upstream $rotUpstream --feasibility-work $rotFeasibility --captured .tmp/evaluation/captured
& $rotPython scripts/evaluation/compare.py --captured-reference
node scripts/evaluation/performance.mjs
node scripts/evaluation/verify.mjs
```

每步退出码必须为 0，失败记录先保留再修复。Python 环境包含 Paddle 2.6.2、OpenCV 4.11.0、NumPy 1.26.4、Shapely 2.1.1 及 PaddleDetection 依赖。浏览器使用锁定依赖与实际 Chromium，环境记录以报告为准。

准备脚本从官方两张 DOTA 示例生成九个输入。参考使用原始 Paddle 网络、官方角点转换和 Shapely NMS，不调用 SDK 后处理。4096×1 纯白图验证产品“缩放后至少一像素”扩展，官方 OpenCV 默认会拒绝缩放为零高的输入，该扩展单独标注。

浏览器脚本通过构建后的公共 API 执行 CPU/GPU × main/Worker；九图 RGBA 加一张真实 PNG Blob，共四十项。测试服务器只绑定 localhost 和白名单资源；在 ORT loader 边界包装原始 session.run，捕获真实张量和原生 GPU 指令数。包装不改变输入输出，但引入额外网络传输耗时，因此该批次 timings 不用作产品性能宣称。实际 Demo 未插桩的观测另行报告。

比较脚本分别匹配原始图片参考与实际 SDK 张量的 Paddle 参考：同类、同数量、无额外/遗漏、旋转 IoU≥.995、score误差≤.001、角点误差≤.1px。任何失败保留原值，不通过修改门槛自动变成成功。摘要复核核对本地原始文件、构建文件和参考摘要，不代替重新推理。

仅补跑生命周期可使用 `node scripts/evaluation/browser.mjs --lifecycle-only`，前提是已有成功质量报告且模型与两份SDK构建摘要一致。它保留图片捕获与原始验证时间，单独更新生命周期时间；随后必须重跑compare.py和verify.mjs，因为比较结果绑定三份来源报告摘要。

在途释放通过测试专用BroadcastChannel门控确认真实session.run已调用后触发，main等待结果、Worker立即终止。门控不改变质量矩阵和数值计算，只在生命周期用例延迟结果返回，不声称中断同步WASM。下载取消必须在0<loadedBytes<模型大小时触发。
