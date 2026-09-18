import { expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ bad: false, disposed: 0, reverse: false }));
vi.mock("../src/ort", () => ({
  loadOrt: async () => ({
    env: { wasm: {} },
    Tensor: class {
      dispose() {
        state.disposed++;
      }
    },
    InferenceSession: {
      create: async () => ({
        inputNames: ["image"],
        get outputNames() {
          return state.reverse
            ? [
                "save_infer_model/scale_1.tmp_0",
                "save_infer_model/scale_0.tmp_0",
              ]
            : [
                "save_infer_model/scale_0.tmp_0",
                "save_infer_model/scale_1.tmp_0",
              ];
        },
        run: async () => ({
          "save_infer_model/scale_0.tmp_0": {
            data: new Float32Array(15 * 21504),
            dims: state.bad ? [1, 15, 1] : [1, 15, 21504],
            dispose() {
              state.disposed++;
            },
          },
          "save_infer_model/scale_1.tmp_0": {
            data: new Float32Array(21504 * 5),
            dims: [1, 21504, 5],
            dispose() {
              state.disposed++;
            },
          },
        }),
        release: async () => {},
      }),
    },
  }),
}));
import { createRunner } from "../src/engine";
it("真实ONNX导出名按固定双输出形状解读，拒绝坏形状并释放所有张量", async () => {
  const runner = createRunner({
    backend: "wasm",
    executionMode: "main",
    runtimeBaseUrl: "https://example.com/",
  });
  await runner.load(new Uint8Array(1));
  const image = { width: 1024, height: 1, data: new Uint8Array(4096) };
  expect((await runner.run(image)).detections).toEqual([]);
  expect(state.disposed).toBe(3);
  state.bad = true;
  await expect(runner.run(image)).rejects.toMatchObject({ code: "INFERENCE" });
  expect(state.disposed).toBe(6);
  state.bad = false;
  state.reverse = true;
  expect((await runner.run(image)).detections).toEqual([]);
  expect(state.disposed).toBe(9);
  await runner.dispose();
});
