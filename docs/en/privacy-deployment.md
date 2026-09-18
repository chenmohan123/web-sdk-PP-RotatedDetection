# Privacy and deployment

[中文](../zh-CN/privacy-deployment.md)

Images are decoded, preprocessed and inferred locally, without image uploads or telemetry. Initial model downloads contact the explicitly selected Hub; runtime files are served by the Demo origin. Hubs and hosts can observe request metadata. Only versioned model bytes are cached, never user images or detection output.

IndexedDB keys include model id, version and SHA. Cache hits recheck byte length and SHA; unavailable storage allows memory-only use. Usage shows current-model bytes. Clear-all affects only this SDK database.

```powershell
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false build:demo
pnpm --config.verify-deps-before-run=false --config.manage-package-manager-versions=false preview
```

Preview: http://127.0.0.1:4194. Deploy demo-dist with its sdk directory and correct module/WASM MIME. Prefer HTTPS and same-origin Worker/ORT; cross-origin model assets need CORS.

Production contains no weights, evaluation images or local model URL, and disables inference while sources remain unpublished. Only explicit dev-local/vanilla-local development servers read .tmp/model.onnx. The Pages workflow is prepared but not deployed; protection, Pages and HTTPS require later remote API verification.
