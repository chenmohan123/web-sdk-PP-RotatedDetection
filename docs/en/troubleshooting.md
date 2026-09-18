# Troubleshooting

[中文](../zh-CN/troubleshooting.md)

| Symptom/code | Action |
| --- | --- |
| Model sources unpublished | Check for an outdated or incomplete model.json; use the release manifest with fixed revisions rather than inventing Hub URLs |
| DOWNLOAD / INTEGRITY | Check the selected source, CORS, bytes and SHA; do not bypass integrity checks |
| UNSUPPORTED | Check HTTPS/localhost and WebGPU adapter/browser; manually select CPU if needed |
| SESSION / INFERENCE | Retain error code, browser, model SHA and mode; use matching colocated ORT files |
| INVALID_INPUT | Decodable image, at most16,777,216 pixels, thresholds0..1 |
| BUSY / NOT_LOADED | Await load then run serially; one operation per instance |
| ABORTED / DISPOSED | Recreate after disposal; do not reuse disposed objects |
| Memory after clearing cache | Cache controls target IndexedDB; dispose the session to release runtime resources |

Worker disposal terminates work immediately; already submitted main-thread ORT work finishes before release. Stale results are withheld. UI presents stable codes rather than internal stacks.
