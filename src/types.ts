export type Backend = "wasm" | "webgpu";
export type ExecutionMode = "main" | "worker";
export type Point = [number, number];
export type Polygon = [Point, Point, Point, Point];
export interface PixelImage {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}
export interface RotatedDetectionModel {
  id: string;
  version: string;
  url: string;
  bytes: number;
  sha256: string;
}
export interface Detection {
  classId: number;
  label: string;
  score: number;
  polygon: Polygon;
}
export interface LoadProgress {
  phase: "downloading" | "integrity" | "loading" | "ready";
  loadedBytes?: number;
  totalBytes?: number;
}
export interface LoadOptions {
  signal?: AbortSignal;
  onProgress?: (event: LoadProgress) => void;
}
export interface RunOptions {
  signal?: AbortSignal;
  scoreThreshold?: number;
  nmsThreshold?: number;
}
export interface RotatedDetectionInput {
  image: PixelImage | Blob;
}
export interface RotatedDetectionOptions {
  model: RotatedDetectionModel;
  backend?: Backend;
  executionMode?: ExecutionMode;
  runtimeBaseUrl?: string;
}
export interface LoadTimings {
  modelDownloadMs: number;
  modelCacheReadMs: number;
  integrityMs: number;
  sessionMs: number;
}
export interface RotatedDetectionResult {
  image: { width: number; height: number };
  detections: Detection[];
  runtime: {
    requestedBackend: Backend;
    actualBackend: Backend;
    executionMode: ExecutionMode;
    runtimeVersion: string;
  };
  model: Pick<RotatedDetectionModel, "id" | "version" | "sha256">;
  timings: {
    decodeMs: number;
    preprocessMs: number;
    inferenceMs: number;
    postprocessMs: number;
    totalMs: number;
  };
}
export interface Capabilities {
  wasm: boolean;
  webgpu: boolean;
  worker: boolean;
  secureContext: boolean;
}
export interface RotatedDetection {
  readonly manifest: Readonly<RotatedDetectionModel>;
  readonly capabilities: Readonly<Capabilities>;
  readonly loadTimings: Readonly<LoadTimings>;
  load(options?: LoadOptions): Promise<void>;
  run(
    input: RotatedDetectionInput,
    options?: RunOptions,
  ): Promise<RotatedDetectionResult>;
  dispose(): Promise<void>;
}
export type RotatedDetectionErrorCode =
  | "INVALID_INPUT"
  | "INVALID_MANIFEST"
  | "DOWNLOAD"
  | "INTEGRITY"
  | "UNSUPPORTED"
  | "OUT_OF_MEMORY"
  | "SESSION"
  | "INFERENCE"
  | "BUSY"
  | "ABORTED"
  | "DISPOSED"
  | "NOT_LOADED";
