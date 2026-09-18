# Release status

[中文](../zh-CN/release.md)

0.1.0 is in release preparation. Actual receipts in `reports/2026-09-18-release/` establish whether npm, GitHub Release and the HTTPS Demo are live. Workflow files do not establish successful publication.

Before release, pin immutable ModelScope/Hugging Face revisions and verify complete downloads for bytes/SHA/CORS. Keep `models/model.json` and `sdk-manifest.yaml` consistent. ModelScope is the default; explicitly selected sources never silently fall back. Complete actual production-browser checks across both sources × WASM/WebGPU × main/Worker, then run tests, both typechecks, both builds, package checks and `node scripts/check-release-ready.mjs`. CI, Pages and Release all run this gate without generating substitute acceptance receipts.

Changes enter main through a PR and current CI. Its Ruleset blocks deletion and force pushes and requires resolved conversations. The v* Ruleset blocks tag updates and deletion. Record dated remote API evidence for About, Homepage, topics, Rulesets and deployment environments. Pages builds `demo-dist` on main pushes or manual dispatch and deploys serially through the github-pages environment to the [HTTPS Demo](https://chenmohan123.github.io/web-sdk-PP-RotatedDetection/).

The first release uses the existing immutable `v0.1.0` tag. Its version must match `package.json`, and the tag must point to a main ancestor. The Release workflow has three modes:

| Mode | Behavior |
| --- | --- |
| `prepare` (manual default) | Validate, build and upload `package.tgz` in `release-package`; perform no npm or GitHub Release writes |
| `publish` | Publish with OIDC Trusted Publishing through the npm environment; if the version exists, only compare `dist.integrity`, never overwrite |
| `verify-only` | Verify the identical tarball published locally by the maintainer; fail if the version is absent or SHA-512 differs; create/update GitHub Release only after success |

When the npm package does not yet exist, download the `prepare` CI artifact and publish **that same `package.tgz`** through local npm authentication; do not repack. Then manually run `verify-only` for the same tag. Configure the npm Trusted Publisher for `chenmohan123/web-sdk-PP-RotatedDetection`, workflow `release.yml`, environment `npm`, and set the repository variable `NPM_TRUSTED_READY=true` to enable automatic `publish` on subsequent tag pushes. Until then, tag pushes only run `prepare`. The workflow stores no long-lived npm token and does not use setup-node registry-url token placeholders.

The model comes from a fixed PaddleDetection commit. Apache-2.0 provenance and the limits of the weight-license interpretation are documented in the [model card](../../models/README.md). FP32, WASM/WebGPU and single images only; Git/npm/Demo exclude ONNX, evaluation images and raw tensors. Desktop results do not establish mobile, NPU or full DOTA mAP support. No required failures in offline `sdk:check` establishes local compliance only; all remote required rules must be verified before claiming compliant status. See [release checklist](../release-checklist.md).
