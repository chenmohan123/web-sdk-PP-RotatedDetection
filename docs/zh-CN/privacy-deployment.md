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

生产构建不含权重、测试图、本地URL，未发布来源时禁用推理。仅显式dev-local/vanilla-local开发服务器读取.tmp/model.onnx。GitHub Pages工作流是准备骨架，尚未部署，远程保护/Pages/HTTPS需后续API核验。
