# PP-YOLOE-R-s FP32 model card

[中文](README.md)

An ONNX mirror of PaddleDetection maintained by chenmohan, not the official Paddle account. It detects 15 DOTA classes in individual aerial images, returning four corners in original-image coordinates. ModelScope is the default; Hugging Face is an explicit alternative without silent switching. Actual distribution status and immutable source revisions are in the SDK's models/model.json.

ID/version: ppyoloe-r-s-1024-fp32 / 0.1.0. Configuration: ppyoloe_r_crn_s_3x_dota, single scale, pinned PaddleDetection revision b25522a0f4bde8c80603f3ba5e3472059972e3b5. ONNX opset17, FP32, 33,161,415 bytes, SHA-256 de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089. The 8,243,749 trainable parameter elements describe the original network export, distinct from upstream's reparameterized 8.09M count.

Input image [1,3,1024,1024] RGB; outputs scores [1,15,21504] and rboxes [1,21504,5]. Classes: plane, baseball-diamond, bridge, ground-track-field, small-vehicle, large-vehicle, ship, tennis-court, basketball-court, storage-tank, soccer-ball-field, roundabout, harbor, swimming-pool, helicopter.

## Provenance, license and changes

The [official model table](https://github.com/PaddlePaddle/PaddleDetection/blob/b25522a0f4bde8c80603f3ba5e3472059972e3b5/configs/rotate/ppyoloe_r/README.md) links [official weights](https://paddledet.bj.bcebos.com/models/ppyoloe_r_crn_s_3x_dota.pdparams): 33,111,074 bytes, SHA-256 d9c4483c53a79bc8e8265f01beb044e060bb4bb017830befb046d2d504ec99a5. Apache-2.0 is adopted from the pinned project's license declaration and official weight table. No separate license text naming these weights was found in the reviewed material. The original [LICENSE](LICENSE) is included and the SDK retains NOTICE attribution. This grants no additional rights to the DOTA dataset or evaluation images.

No retraining or quantization. Paddle2ONNX exports the fixed raw head; the SDK implements corner restoration and true rotated-IoU NMS. The official constructor initializes angle_proj_conv from 0 to 90 degrees; it is a fixed projection buffer, not a missing trained weight. See [conversion.json](conversion.json) for physical output names, tool versions and hashes.

## Verification scope

On 2026-09-18, Windows11/Chromium153/ORT Web1.27.0 passed 40 image and same-tensor comparisons against independent Paddle references across WASM/WebGPU × main/Worker. Minimum rotated IoU was 0.9993547; maximum corner error was 0.01901px. This verifies implementation agreement, **not full DOTA mAP**. Images are resized to a longest side of1024; tiling/stitching is not implemented. Mobile, NPU, Safari and Firefox are unverified; video, FP16 and quantization are not implemented.

SDK, documentation and dated evidence: [web-sdk-PP-RotatedDetection](https://github.com/chenmohan123/web-sdk-PP-RotatedDetection). Immutable revisions, bytes and SHA values are in its model and SDK manifests. DOTA samples remain local evaluation data and are excluded from Hub, Git, npm and Demo distribution.
