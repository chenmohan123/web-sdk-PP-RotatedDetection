"""生成纯合成小图的独立 OpenCV/NumPy 数值证据，不依赖 SDK 实现。"""
import json
import cv2
import numpy as np

width, height = 7, 5
rgba = np.zeros((height, width, 4), np.uint8)
for y in range(height):
    for x in range(width):
        rgba[y, x] = [(x * 37 + y * 19) % 256,
                      (x * 11 + y * 53) % 256,
                      (x * 71 + y * 7) % 256, 255]
scale = 1024 / max(width, height)
rgb = cv2.resize(rgba[:, :, :3], None, fx=scale, fy=scale,
                 interpolation=cv2.INTER_CUBIC)
values = rgb.astype(np.float32)
values *= 1 / 255.
values -= np.array([.485, .456, .406])
values /= np.array([.229, .224, .225])
positions = [(0, 120, 0), (86, 81, 2), (158, 1019, 2), (229, 1004, 2),
             (290, 537, 0), (350, 250, 2), (406, 909, 0), (463, 229, 1),
             (514, 193, 0), (563, 1015, 2), (617, 16, 1), (670, 431, 2)]
print(json.dumps({"opencv": cv2.__version__, "numpy": np.__version__,
                  "samples": [[*p, float(values[p])] for p in positions]}))
