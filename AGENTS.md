# PP-RotatedDetection 协作约定

文档、回复、注释及提交使用中文；公开 README 和六组指南有英文对应。
本仓库为独立单帧旋转框 SDK，采用 PP-YOLOE-R-s 单尺度 1024 FP32、DOTA 15 类。
先读相邻门户 standards/v1/README.md 和受影响契约。SDK 修改前后运行门户 sdk:check 并保留结果。
所有 pnpm 命令加 --config.verify-deps-before-run=false --config.manage-package-manager-versions=false。
手动编辑用 apply_patch。保留其他代理与用户修改，按明确文件范围提交，不使用 git add .。
runtime 框架无关；Demo 延续 PP-Detection 的视觉布局，中文默认，可切英文。
正式来源仅 ModelScope/Hugging Face，默认 ModelScope。未实际发布的地址不能标为可用；本地模型只经显式开发配置提供，生产构建与 npm 不含权重。
模型、评估图、原始张量和截图留在忽略目录；不把桌面验证扩大成移动端、NPU 或全量 DOTA 精度承诺。
执行 gh 时复用 APPDATA/GitHub CLI 登录，finally 恢复 GH_CONFIG_DIR。远程发布阶段需以用户授权和实际验收为依据。
