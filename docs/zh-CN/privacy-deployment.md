# 隐私与部署

[English](../en/privacy-deployment.md)

图片在本地解码、预处理与推理，不上传服务器，无遥测。首次模型下载会向明确选择的Hub请求权重，运行资源由Demo同源托管；Hub与宿主可看到网络请求元数据。缓存只保存版本化模型，不保存用户图片或检测结果。

IndexedDB键由模型id、version和SHA组成，每次缓存命中重新校验长度与SHA；不可用时内存运行。缓存大小按钮显示当前模型bytes，清理全部仅清理本SDK数据库。

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build:demo
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false preview
```

预览地址http://127.0.0.1:4194。部署demo-dist，保留sdk目录、ES模块MIME和WASM MIME。推荐HTTPS及同源Worker/ORT；跨域模型必须允许CORS。

生产构建不含权重、测试图或本地模型 URL；模型按清单从显式选择的 Hub 下载。仅显式 dev-local/vanilla-local 开发服务器读取 `.tmp/model.onnx`。Pages 工作流从受保护 main 构建，经 `node scripts/check-release-ready.mjs` 验证双源与生产回执后上传产物；部署使用 github-pages 环境、最小权限和串行并发组。远程保护、Pages Source、HTTPS 与成功部署均需 API 回执验证，当前发布状态见 [发布指南](release.md)。
