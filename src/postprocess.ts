import clipping from "polygon-clipping";
import { RotatedDetectionError } from "./errors";
import { LABELS } from "./labels";
import type { Detection, Point, Polygon, RunOptions } from "./types";
export function validateRunOptions(options: RunOptions): void {
  for (const value of [
    options.scoreThreshold ?? 0.1,
    options.nmsThreshold ?? 0.1,
  ])
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new RotatedDetectionError(
        "INVALID_INPUT",
        "阈值必须是 0..1 的有限数",
      );
}
export function corners(
  box: ArrayLike<number>,
  scaleFactor: readonly number[],
): Polygon {
  const [cx, cy, w, h, a] = Array.from(box),
    [sy, sx] = scaleFactor,
    c = Math.cos(a),
    s = Math.sin(a);
  return [
    [w / 2, h / 2],
    [-w / 2, h / 2],
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
  ].map(([x, y]) => [
    (cx + x * c - y * s) / sx,
    (cy + x * s + y * c) / sy,
  ]) as Polygon;
}
function area(p: Point[]): number {
  let sum = 0;
  // 以首点为原点计算，减轻远离原点的框产生相消误差。
  for (let i = 1; i + 1 < p.length; i++)
    sum +=
      (p[i][0] - p[0][0]) * (p[i + 1][1] - p[0][1]) -
      (p[i][1] - p[0][1]) * (p[i + 1][0] - p[0][0]);
  return Math.abs(sum) / 2;
}
function bounds(p: Polygon): number[] {
  return [
    Math.min(...p.map((v) => v[0])),
    Math.min(...p.map((v) => v[1])),
    Math.max(...p.map((v) => v[0])),
    Math.max(...p.map((v) => v[1])),
  ];
}
export function polygonIoU(a: Polygon, b: Polygon): number {
  const x = bounds(a),
    y = bounds(b);
  if (x[2] <= y[0] || y[2] <= x[0] || x[3] <= y[1] || y[3] <= x[1]) return 0;
  const aa = area(a),
    ba = area(b);
  if (aa === 0 || ba === 0) return 0;
  const intersection = clipping
    .intersection([a], [b])
    .reduce(
      (sum, poly) =>
        sum +
        poly.reduce((v, ring, i) => v + (i === 0 ? 1 : -1) * area(ring), 0),
      0,
    );
  return Math.max(0, Math.min(1, intersection / (aa + ba - intersection)));
}
export function postprocess(
  scores: Float32Array,
  rboxes: Float32Array,
  scaleFactor: readonly number[],
  options: RunOptions & { classCount?: number } = {},
): Detection[] {
  validateRunOptions(options);
  const count = rboxes.length / 5,
    classes = options.classCount ?? 15;
  if (
    !(scores instanceof Float32Array) ||
    !(rboxes instanceof Float32Array) ||
    !Number.isInteger(count) ||
    count < 1 ||
    !Number.isInteger(classes) ||
    classes < 1 ||
    classes > 15 ||
    scores.length !== count * classes ||
    scaleFactor.length !== 2 ||
    scaleFactor.some((v) => !Number.isFinite(v) || v <= 0)
  )
    throw new RotatedDetectionError("INFERENCE", "模型输出形状或比例错误");
  for (const v of scores)
    if (!Number.isFinite(v))
      throw new RotatedDetectionError("INFERENCE", "模型分数含非有限值");
  for (let i = 0; i < rboxes.length; i++)
    if (
      !Number.isFinite(rboxes[i]) ||
      ((i % 5 === 2 || i % 5 === 3) && rboxes[i] < 0)
    )
      throw new RotatedDetectionError("INFERENCE", "模型旋转框含非法数值");
  const threshold = Math.fround(options.scoreThreshold ?? 0.1),
    nms = options.nmsThreshold ?? 0.1,
    result: Detection[] = [],
    polygons = new Map<number, Polygon>();
  const polygon = (index: number) => {
    let p = polygons.get(index);
    if (!p) {
      p = corners(rboxes.subarray(index * 5, index * 5 + 5), scaleFactor);
      polygons.set(index, p);
    }
    return p;
  };
  for (let classId = 0; classId < classes; classId++) {
    const candidates: number[] = [];
    for (let i = 0; i < count; i++)
      if (scores[classId * count + i] > threshold) candidates.push(i);
    candidates.sort(
      (a, b) =>
        scores[classId * count + b] - scores[classId * count + a] || a - b,
    );
    const kept: Polygon[] = [];
    for (const i of candidates.slice(0, 2000)) {
      const p = polygon(i);
      if (kept.some((q) => polygonIoU(p, q) > nms)) continue;
      kept.push(p);
      result.push({
        classId,
        label: LABELS[classId],
        score: scores[classId * count + i],
        polygon: p,
      });
    }
  }
  return result;
}
