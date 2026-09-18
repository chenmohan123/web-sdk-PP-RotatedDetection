import { RotatedDetectionError } from "./errors";
import type { PixelImage } from "./types";
const SIDE = 1024,
  PLANE = SIDE * SIDE,
  f = Math.fround;
export function validatePixels(image: PixelImage): void {
  if (
    !image ||
    !Number.isSafeInteger(image.width) ||
    !Number.isSafeInteger(image.height) ||
    image.width < 1 ||
    image.height < 1 ||
    image.width * image.height > 16777216 ||
    !(
      image.data instanceof Uint8Array ||
      image.data instanceof Uint8ClampedArray
    ) ||
    image.data.length !== image.width * image.height * 4
  )
    throw new RotatedDetectionError(
      "INVALID_INPUT",
      "图片必须为有效 RGBA 数据，且不超过 16777216 像素",
    );
}
function roundEven(x: number): number {
  const lo = Math.floor(x),
    d = x - lo;
  return d < 0.5 ? lo : d > 0.5 ? lo + 1 : lo + (lo % 2);
}
function cubic(x: number): number[] {
  // A=-0.75；系数保持 FP32，最终像素再量化为 uint8。
  const a = f(-0.75),
    xp = f(x + 1);
  const c0 = f(f(f(f(a * xp) - f(5 * a)) * xp + f(8 * a)) * xp - f(4 * a));
  const c1 = f(f(f(f(a + 2) * x) - f(a + 3)) * f(x * x) + 1);
  const z = f(1 - x),
    c2 = f(f(f(f(a + 2) * z) - f(a + 3)) * f(z * z) + 1);
  const c3 = f(f(f(1 - c0) - c1) - c2);
  return [c0, c1, c2, c3];
}
function axis(length: number, resized: number, scale: number) {
  // 统一 scale 定义采样位置，不能以舍入后的输出尺寸反算。
  return Array.from({ length: resized }, (_, i) => {
    const position = f((i + 0.5) / scale - 0.5),
      base = Math.floor(position);
    return {
      indices: [-1, 0, 1, 2].map((d) =>
        Math.max(0, Math.min(length - 1, base + d)),
      ),
      weights: cubic(f(position - base)),
    };
  });
}
export function preprocess(image: PixelImage): {
  data: Float32Array;
  scaleFactor: [number, number];
  resizedWidth: number;
  resizedHeight: number;
} {
  validatePixels(image);
  const scale = SIDE / Math.max(image.width, image.height),
    resizedWidth = Math.max(1, roundEven(image.width * scale)),
    resizedHeight = Math.max(1, roundEven(image.height * scale));
  const rgb = new Uint8Array(image.width * image.height * 3);
  for (let i = 0; i < image.width * image.height; i++) {
    const alpha = image.data[i * 4 + 3];
    for (let c = 0; c < 3; c++)
      rgb[i * 3 + c] = Math.round(
        (image.data[i * 4 + c] * alpha + 255 * (255 - alpha)) / 255,
      );
  }
  const xs = axis(image.width, resizedWidth, scale),
    ys = axis(image.height, resizedHeight, scale),
    data = new Float32Array(PLANE * 3),
    mean = [0.485, 0.456, 0.406],
    std = [0.229, 0.224, 0.225],
    factor = f(1 / 255);
  for (let y = 0; y < resizedHeight; y++)
    for (let x = 0; x < resizedWidth; x++)
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let j = 0; j < 4; j++) {
          let row = 0;
          for (let i = 0; i < 4; i++)
            row +=
              rgb[(ys[y].indices[j] * image.width + xs[x].indices[i]) * 3 + c] *
              xs[x].weights[i];
          sum += row * ys[y].weights[j];
        }
        const value = Math.max(0, Math.min(255, roundEven(sum)));
        // 对照 Paddle NormalizeImage：FP32 乘法，double mean/std 各写回 FP32。
        data[c * PLANE + y * SIDE + x] = f(
          f(f(value * factor) - mean[c]) / std[c],
        );
      }
  return {
    data,
    scaleFactor: [f(scale), f(scale)],
    resizedWidth,
    resizedHeight,
  };
}
