import type { RotatedDetectionErrorCode } from "./types";
export class RotatedDetectionError extends Error {
  constructor(
    public readonly code: RotatedDetectionErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "RotatedDetectionError";
  }
}
export function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new RotatedDetectionError("ABORTED", "操作已取消");
}
export function wrapError(
  error: unknown,
  code: RotatedDetectionErrorCode,
  message: string,
): RotatedDetectionError {
  if (error instanceof RotatedDetectionError) return error;
  if (error instanceof Error && error.name === "AbortError")
    return new RotatedDetectionError("ABORTED", "操作已取消", { cause: error });
  if (
    error instanceof Error &&
    /out of memory|allocation failed|memory access out of bounds/i.test(
      error.message,
    )
  )
    return new RotatedDetectionError("OUT_OF_MEMORY", "运行时内存不足", {
      cause: error,
    });
  return new RotatedDetectionError(code, message, { cause: error });
}
