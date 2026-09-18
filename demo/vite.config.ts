import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { cp, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
export default defineConfig(({ command, mode }) => {
  const local =
    command === "serve" && (mode === "dev-local" || mode === "vanilla-local");
  const vanilla = mode.startsWith("vanilla");
  return {
    root: path.join(root, vanilla ? "examples/vanilla" : "demo"),
    base: "./",
    publicDir: false,
    define: { __LOCAL_MODEL__: JSON.stringify(local) },
    plugins: [
      {
        name: "rotated-detection-assets",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const pathname = new URL(req.url ?? "/", "http://localhost")
              .pathname;
            // 开发白名单只在显式 local 模式提供模型，生产包不复制权重。
            const file =
              local && pathname === "/local-model/model.onnx"
                ? path.join(root, ".tmp/model.onnx")
                : /^\/sdk\/[a-zA-Z0-9_.-]+$/.test(pathname)
                  ? path.join(root, "dist", path.basename(pathname))
                  : undefined;
            if (!file) return next();
            try {
              res.setHeader(
                "Content-Type",
                pathname.endsWith(".wasm")
                  ? "application/wasm"
                  : /\.(js|mjs)$/.test(pathname)
                    ? "text/javascript"
                    : "application/octet-stream",
              );
              res.end(await readFile(file));
            } catch {
              res.statusCode = 404;
              res.end("本地模型或 SDK 尚未准备");
            }
          });
        },
        async closeBundle() {
          if (command === "build") {
            await mkdir(path.join(root, "demo-dist/sdk"), { recursive: true });
            await cp(
              path.join(root, "dist"),
              path.join(root, "demo-dist/sdk"),
              { recursive: true },
            );
          }
        },
      },
    ],
    build: { outDir: path.join(root, "demo-dist"), emptyOutDir: true },
    server: { host: "127.0.0.1", port: 4192, strictPort: true },
    preview: { host: "127.0.0.1", port: 4194, strictPort: true },
  };
});
