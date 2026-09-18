import { describe, expect, it } from "vitest";
import {
  resolveDemoModel,
  resolvePublishedModel,
} from "../demo/src/model-sources";
import { polygonAtPoint, polygonPath } from "../demo/src/draw-polygon";
import metadata from "../models/model.json";
const identity = {
  id: "model",
  version: "0.1.0",
  bytes: 12,
  sha256: "a".repeat(64),
};
describe("Demo 来源与旋转框交互", () => {
  it("公开模型身份与固定转换产物一致", () => {
    expect(metadata).toMatchObject({
      id: "ppyoloe-r-s-1024-fp32",
      version: "0.1.0",
      bytes: 33161415,
      sha256:
        "de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089",
      parameterCount: 8243749,
      precision: "fp32",
      opset: 17,
      input: [1, 3, 1024, 1024],
      defaultSource: "modelscope",
    });
  });
  it("未发布来源不会回退到本地模型", () => {
    expect(
      resolveDemoModel(
        { ...identity, sources: [] },
        "modelscope",
        false,
        "https://example.org/",
      ),
    ).toEqual({ ok: false, code: "SOURCE_UNAVAILABLE" });
  });
  it("本地开发须明确启用且保留固定模型身份", () => {
    expect(
      resolveDemoModel(
        { ...identity, sources: [] },
        "modelscope",
        true,
        "http://localhost/",
      ),
    ).toMatchObject({
      ok: true,
      mode: "local",
      model: { ...identity, url: "http://localhost/local-model/model.onnx" },
    });
  });
  it("固定来源默认 ModelScope，显式 Hugging Face 不静默换源", () => {
    const revision = "b".repeat(40),
      repository = "owner/model",
      path = "model.onnx";
    const source = {
      kind: "modelscope",
      repository,
      revision,
      path,
      downloadUrl: `https://www.modelscope.cn/models/${repository}/resolve/${revision}/${path}`,
      bytes: identity.bytes,
      sha256: identity.sha256,
    };
    expect(
      resolvePublishedModel({ ...identity, sources: [source] }),
    ).toMatchObject({ ok: true, source: { kind: "modelscope" } });
    expect(
      resolvePublishedModel({ ...identity, sources: [source] }, "huggingface"),
    ).toEqual({ ok: false, code: "SOURCE_UNAVAILABLE" });
  });
  it("四点路径闭合且点击按结果原始索引稳定选中", () => {
    const polygon: [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ] = [
      [5, 0],
      [10, 5],
      [5, 10],
      [0, 5],
    ];
    expect(polygonPath(polygon)).toEqual([
      [5, 0],
      [10, 5],
      [5, 10],
      [0, 5],
      [5, 0],
    ]);
    const rows = [{ classId: 0, label: "plane", score: 0.8, polygon }];
    expect(polygonAtPoint(rows, 5, 5)).toBe(0);
    expect(polygonAtPoint(rows, 0, 0)).toBe(-1);
    expect(polygonAtPoint([...rows, ...rows], 5, 5)).toBe(1);
  });
});
