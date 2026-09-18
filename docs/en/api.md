# API

[中文](../zh-CN/api.md)

`createRotatedDetection({model,backend?,executionMode?,runtimeBaseUrl?})` creates an isolated session. Defaults: wasm and worker, with no silent backend fallback. Model fields are id/version/absolute HTTP(S) url/positive integer bytes/64-digit sha256. The runtime resource directory URL must end in /.

| API | Behavior |
| --- | --- |
| manifest / capabilities / loadTimings | Read-only model identity, capability detection and initialization timings |
| load({signal?,onProgress?}) | Validate cached bytes or download, then create session |
| run({image}, {signal?,scoreThreshold?,nmsThreshold?}) | Single-image inference; thresholds default to0.1, finite0..1 |
| dispose() | Idempotent; terminates Worker immediately, waits for submitted main-thread work |
| getModelCacheInfo(model) | Current-model entries and bytes |
| clearCurrentModelCache(model) | Clear current identity |
| clearAllModelCache() | Clear this SDK database only |

Input is a Blob or RGBA `{width,height,data:Uint8Array|Uint8ClampedArray}`, up to16,777,216 pixels. Caller bytes are neither transferred nor mutated. Alpha is composited onto white; official keep-ratio cubic preprocessing targets1024 with bottom/right zero padding.

Output is `{image:{width,height},detections,runtime,model,timings}`. A detection is `{classId,label,score,polygon:[[x,y],[x,y],[x,y],[x,y]]}`, in original-image coordinates, unclipped and without a forced top-left start. The y axis points down. Corner order follows official local `(+w/2,+h/2),(-w/2,+h/2),(-w/2,-h/2),(+w/2,-h/2)`. Results are ordered by class then descending score; within-class NMS uses rotated polygon IoU.

Progress phases: cache/downloading/integrity/loading/ready. Cache status: reading/hit/miss/invalid. A hit passed size and SHA checks; unavailable storage also reports miss. Explicit source failures do not trigger a source switch.

Instances reject concurrent operations. Repeated load on a ready instance does not recreate it. Run cancellation is cooperative: aborted results are withheld, but submitted ORT work may continue. Demo cancel also calls dispose and the next detection reloads.

Error codes: INVALID_INPUT, INVALID_MANIFEST, DOWNLOAD, INTEGRITY, UNSUPPORTED, OUT_OF_MEMORY, SESSION, INFERENCE, BUSY, ABORTED, DISPOSED, NOT_LOADED. Runtime reports requestedBackend, actualBackend, executionMode and runtimeVersion; actualBackend does not promise every operator ran on GPU.
