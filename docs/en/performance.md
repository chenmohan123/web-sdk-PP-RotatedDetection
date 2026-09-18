# Performance and timings

[中文](../zh-CN/performance.md)

loadTimings includes modelDownloadMs, modelCacheReadMs, integrityMs and sessionMs. Run timings include decodeMs, preprocessMs, inferenceMs, postprocessMs and totalMs. totalMs covers run only, excluding load. Worker messaging/scheduling may make wall time exceed the sum of phases.

Cold start means cleared model cache, a new instance, load and first run. Warm means another run on the same ready session. The Demo creates and disposes a session per detection; cache hits do not imply a warm session.

On2026-09-18, Chromium153 / Windows11 / RTX5060 Ti, fixed P0861 image, WebGPU Worker and uninstrumented SDK: median of three warm runs was34.3ms inference and393.5ms total (225.9ms preprocessing,132.7ms postprocessing). This specific desktop observation is not universal FPS. Dense rotated NMS and image preprocessing also cost time.

See [performance.json](../../reports/2026-09-18-image-sdk/performance.json) for full conditions/raw phases. No mobile or full-dataset performance conclusion.
