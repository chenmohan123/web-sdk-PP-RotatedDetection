import { expect, it } from "vitest";
import { preprocess, validatePixels } from "../src/preprocess";
it("独立OpenCV 4.11优化cubic夹具验证量化边界", () => {
  const data = new Uint8Array(7 * 5 * 4);
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 7; x++)
      data.set(
        [
          (x * 37 + y * 19) % 256,
          (x * 11 + y * 53) % 256,
          (x * 71 + y * 7) % 256,
          255,
        ],
        (y * 7 + x) * 4,
      );
  const p = preprocess({ width: 7, height: 5, data });
  const samples = [
    [0, 120, 0, -1.9809058904647827],
    [86, 81, 2, -1.7347276210784912],
    [158, 1019, 2, 1.332810640335083],
    [229, 1004, 2, 1.4373857975006104],
    [290, 537, 0, 0.39943498373031616],
    [350, 250, 2, -0.009237314574420452],
    [406, 909, 0, -1.227416753768921],
    [463, 229, 1, 0.6253502368927002],
    [514, 193, 0, -0.6622998118400574],
    [563, 1015, 2, 1.6988239288330078],
    [617, 16, 1, 1.4481796026229858],
    [670, 431, 2, 2.117124557495117],
  ];
  for (const [y, x, c, value] of samples)
    expect(p.data[c * 1024 * 1024 + y * 1024 + x]).toBe(value);
});
it("固定独立数值证据：FP32乘法后按原mean/std分别写回FP32", () => {
  const rgba = new Uint8Array(1024 * 4);
  rgba.set([0, 128, 255, 255]);
  const p = preprocess({ width: 1024, height: 1, data: rgba });
  // Python NumPy 1.26.4 独立运算，见任务报告中的复现命令。
  expect(
    Array.from([p.data[0], p.data[1024 * 1024], p.data[2 * 1024 * 1024]]),
  ).toEqual([-2.1179039478302, 0.20518220961093903, 2.6399998664855957]);
});
it("RGBA白底合成、ImageNet RGB归一化和右下补零", () => {
  const p = preprocess({
    width: 1024,
    height: 1,
    data: new Uint8Array(1024 * 4),
  });
  expect(p.resizedWidth).toBe(1024);
  expect(p.resizedHeight).toBe(1);
  expect(p.scaleFactor).toEqual([1, 1]);
  expect(p.data.length).toBe(3 * 1024 * 1024);
  expect(p.data[0]).toBeCloseTo((1 - 0.485) / 0.229, 5);
  expect(p.data[1024]).toBe(0);
});
it("保持统一浮点缩放并使用最近偶数舍入，极窄图至少一像素", () => {
  const p = preprocess({
    width: 2048,
    height: 3,
    data: new Uint8Array(2048 * 3 * 4),
  });
  expect(p.resizedHeight).toBe(2);
  expect(p.scaleFactor).toEqual([0.5, 0.5]);
  expect(
    preprocess({ width: 2048, height: 1, data: new Uint8Array(2048 * 4) })
      .resizedHeight,
  ).toBe(1);
});
it("非法尺寸和非RGBA数据拒绝", () => {
  for (const image of [
    { width: 0, height: 1, data: new Uint8Array(0) },
    { width: 1, height: 1, data: new Uint8Array(3) },
    { width: 16777217, height: 1, data: new Uint8Array(0) },
  ])
    expect(() => validatePixels(image)).toThrow(
      expect.objectContaining({ code: "INVALID_INPUT" }),
    );
});
