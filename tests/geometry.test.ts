import { expect, it } from "vitest";
import { corners, polygonIoU, postprocess } from "../src/postprocess";
it("官方局部角点顺序及独立横纵比例还原", () => {
  expect(corners([10, 20, 4, 2, 0], [1, 1])).toEqual([
    [12, 21],
    [8, 21],
    [8, 19],
    [12, 19],
  ]);
  expect(corners([10, 20, 4, 2, 0], [2, 4])).toEqual([
    [3, 10.5],
    [2, 10.5],
    [2, 9.5],
    [3, 9.5],
  ]);
  const p = corners([0, 0, 4, 2, Math.PI / 2], [1, 1]);
  expect(p[0][0]).toBeCloseTo(-1);
  expect(p[0][1]).toBeCloseTo(2);
});
it("多边形交并比而非外接矩形重叠", () => {
  expect(
    polygonIoU(
      [
        [0, 0],
        [4, 0],
        [4, 2],
        [0, 2],
      ],
      [
        [2, 0],
        [6, 0],
        [6, 2],
        [2, 2],
      ],
    ),
  ).toBeCloseTo(1 / 3);
  expect(
    polygonIoU(
      corners([0, 0, 10, 1, Math.PI / 4], [1, 1]),
      corners([0, 0, 10, 1, -Math.PI / 4], [1, 1]),
    ),
  ).toBeLessThan(0.1);
});
it("FP32严格分数阈值、类别隔离、同分稳定与每类NMS", () => {
  expect(
    postprocess(
      new Float32Array([0.1]),
      new Float32Array([10, 20, 4, 2, 0]),
      [1, 1],
      { classCount: 1 },
    ),
  ).toHaveLength(0);
  const result = postprocess(
    new Float32Array([0.9, 0.9, 0.8, 0.9, 0.9, 0.8]),
    new Float32Array([10, 20, 4, 2, 0, 10, 20, 4, 2, 0, 40, 20, 4, 2, 0]),
    [1, 1],
    { classCount: 2 },
  );
  expect(result.map((x) => x.classId)).toEqual([0, 0, 1, 1]);
  expect(result[0].polygon).toEqual([
    [12, 21],
    [8, 21],
    [8, 19],
    [12, 19],
  ]);
});
it("损坏张量和非法阈值必须稳定拒绝，包括低分候选", () => {
  for (const boxes of [
    new Float32Array([0, 0, -1, 2, 0]),
    new Float32Array([0, 0, 1, 2, NaN]),
    new Float32Array(4),
  ])
    expect(() =>
      postprocess(new Float32Array([0]), boxes, [1, 1], { classCount: 1 }),
    ).toThrow(expect.objectContaining({ code: "INFERENCE" }));
  expect(() =>
    postprocess(
      new Float32Array([NaN]),
      new Float32Array([0, 0, 1, 2, 0]),
      [1, 1],
      { classCount: 1 },
    ),
  ).toThrow(expect.objectContaining({ code: "INFERENCE" }));
  expect(() =>
    postprocess(
      new Float32Array([1]),
      new Float32Array([0, 0, 1, 2, 0]),
      [1, 1],
      { classCount: 1, scoreThreshold: NaN },
    ),
  ).toThrow(expect.objectContaining({ code: "INVALID_INPUT" }));
});
