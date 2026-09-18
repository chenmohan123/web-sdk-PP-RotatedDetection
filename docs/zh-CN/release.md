# 发布状态

[English](../en/release.md)

0.1.0为本地候选。GitHub仓库、npm、双Hub资产和在线Demo未发布。本次仅准备本地实现与工作流，不执行远程写入。

发布顺序：固定SHA模型上传ModelScope/Hugging Face → 验证不可变revision/bytes/SHA/CORS → 填model.json sources与sdk-manifest assets → 标准检查清零required → 远程Rulesets/About/Pages核验 → 不可变v0.1.0标签、GitHub Release和npm发布。CI和发布workflow不能替代远程设置证据。

当前sdk:check预期CONFIG-001（assets为空）；sources为空不编造“已发布”证据。Release和Pages工作流有显式门禁，待发布准备完成再启用。

模型来自PaddleDetection固定提交，Apache-2.0依据见模型卡；仅FP32、WASM/WebGPU、单帧图片。Git/npm/Demo不包含ONNX、评估图或原始张量。检查 [发布清单](../release-checklist.md)。
