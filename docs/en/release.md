# Release status

[中文](../zh-CN/release.md)

0.1.0 is a local candidate. GitHub, npm, both Hub assets and the live Demo are not published. This task prepares local implementation and workflows only.

Sequence: upload fixed-SHA assets to ModelScope/Hugging Face; verify immutable revision/bytes/SHA/CORS; populate model.json sources and sdk-manifest assets; clear required standard failures; verify remote Rulesets/About/Pages; publish immutable v0.1.0, GitHub Release and npm. Workflow files do not prove remote settings.

CONFIG-001 is expected while assets remain empty. Empty sources are honest unpublished state. Release/Pages workflows have explicit gates until readiness is complete.

The model comes from a fixed PaddleDetection commit with Apache-2.0 provenance documented in the model card. FP32, WASM/WebGPU and single images only. Git/npm/Demo exclude ONNX, evaluation images and raw tensors. See [release checklist](../release-checklist.md).
