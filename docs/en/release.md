# Release status

[中文](../zh-CN/release.md)

Version 0.1.0 was released on 2026-09-18: [npm](https://www.npmjs.com/package/web-sdk-pp-rotated-detection/v/0.1.0), [GitHub Release](https://github.com/chenmohan123/web-sdk-PP-RotatedDetection/releases/tag/v0.1.0), and the [HTTPS Demo](https://chenmohan123.github.io/web-sdk-PP-RotatedDetection/) are live. The complete npm tarball matches the CI prepare artifact. An isolated npm installation passed CPU/GPU Worker inference with 136 boxes each, public API checks, and static asset hashes. The production Demo passed both sources × CPU/GPU × main/Worker and verification of all 22 hosted assets. Actual receipts are in `reports/2026-09-18-release/`.

Before release, pin immutable ModelScope/Hugging Face revisions and verify complete downloads for bytes/SHA/CORS. Keep `models/model.json` and `sdk-manifest.yaml` consistent. ModelScope is the default; explicitly selected sources never silently fall back. Complete actual production-browser checks across both sources × WASM/WebGPU × main/Worker, then run tests, both typechecks, both builds, package checks and `node scripts/check-release-ready.mjs`. CI, Pages and Release all run this gate without generating substitute acceptance receipts.

Changes enter main through a PR and current CI. Its Ruleset blocks deletion and force pushes and requires resolved conversations. The v* Ruleset blocks tag updates and deletion. Dated remote API evidence records About, Homepage, topics, Rulesets and deployment environments. Pages builds `demo-dist` on main pushes or manual dispatch, deploys serially through the github-pages environment, and checks the current main SHA before deployment to prevent older runs from replacing a newer Demo.

The first release uses the existing immutable `v0.1.0` tag. Its version must match `package.json`, and the tag must point to a main ancestor. The Release workflow has three modes:

| Mode | Behavior |
| --- | --- |
| `prepare` (manual default) | Validate, build and upload `package.tgz` in `release-package`; perform no npm or GitHub Release writes |
| `publish` | Publish with OIDC Trusted Publishing through the npm environment; if the version exists, only compare `dist.integrity`, never overwrite |
| `verify-only` | Verify the identical tarball published locally by the maintainer; fail if the version is absent or SHA-512 differs; create/update GitHub Release only after success |

The first release downloaded the CI artifact from `prepare` run 35352403353 and published **that same `package.tgz`** through local npm authentication. Run 35353954911 used `verify-only` at ref `v0.1.0` and created the GitHub Release only after integrity verification. Manual release runs must select the tag ref to satisfy the npm environment's `v*` tag policy.

npm has saved the Trusted Publisher for `chenmohan123/web-sdk-PP-RotatedDetection`, workflow `release.yml`, environment `npm`, returning direct and staged publishing permissions. Repository variable `NPM_TRUSTED_READY=true` has been set and read back, enabling automatic `publish` on future tag pushes. Configuration uses npm 12.0.2 with `--allow-publish`; the older CLI omitted a permission field required by the server. See the [configuration receipt](../../reports/2026-09-18-release/npm-trusted-publishing.json) for the creation response and local verification limits. The initial version was published locally without provenance; actual OIDC publication and provenance remain to be verified on the next official version. The workflow stores no long-lived npm token and does not use setup-node registry-url token placeholders.

The model comes from a fixed PaddleDetection commit. Apache-2.0 provenance and the limits of the weight-license interpretation are documented in the [model card](../../models/README.md). FP32, WASM/WebGPU and single images only; Git/npm/Demo exclude ONNX, evaluation images and raw tensors. Desktop results do not establish mobile, NPU or full DOTA mAP support. No required failures in offline `sdk:check` establishes local compliance only; all remote required rules must be verified before claiming compliant status. See [release checklist](../release-checklist.md).
