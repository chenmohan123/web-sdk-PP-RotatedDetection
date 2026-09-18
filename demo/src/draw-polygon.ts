import type {
  Detection,
  Polygon,
  RotatedDetectionResult,
} from "../../src/types";
export const colors = ["#2563eb", "#0ea582", "#ea580c", "#9333ea", "#e11d48"];
export function polygonPath(polygon: Polygon): [number, number][] {
  return [...polygon, polygon[0]];
}
export function polygonAtPoint(
  rows: Detection[],
  x: number,
  y: number,
): number {
  // 后绘制的目标优先命中；返回原数组索引，不按语言或选中状态重新排序。
  for (let index = rows.length - 1; index >= 0; index--) {
    const polygon = rows[index].polygon;
    let inside = false;
    for (let i = 0, j = 3; i < 4; j = i++) {
      const [xi, yi] = polygon[i],
        [xj, yj] = polygon[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        inside = !inside;
    }
    if (inside) return index;
  }
  return -1;
}
export function drawPolygons(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  result?: RotatedDetectionResult,
  selected = -1,
  overlay = true,
) {
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(image, 0, 0);
  if (!overlay || !result) return;
  const unit = Math.max(1, Math.max(canvas.width, canvas.height) / 700);
  const draw = (item: Detection, index: number) => {
    const active = selected === index,
      color = colors[index % colors.length];
    ctx.save();
    ctx.globalAlpha = selected < 0 || active ? 1 : 0.25;
    ctx.beginPath();
    polygonPath(item.polygon).forEach(([x, y], i) =>
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
    );
    ctx.closePath();
    ctx.strokeStyle = active ? "#ffffff" : color;
    ctx.lineWidth = unit * (active ? 5 : 2);
    ctx.stroke();
    if (active) {
      ctx.lineWidth = unit * 2;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.fillStyle = color + "33";
      ctx.fill();
    }
    const [x, y] = item.polygon[0];
    const label = `#${index + 1} ${item.label} ${(item.score * 100).toFixed(0)}%`;
    ctx.font = `${unit * 10}px sans-serif`;
    ctx.fillStyle = color;
    ctx.fillRect(
      x,
      y - unit * 13,
      ctx.measureText(label).width + unit * 6,
      unit * 14,
    );
    ctx.fillStyle = "#fff";
    ctx.fillText(label, x + unit * 3, y - unit * 3);
    ctx.restore();
  };
  result.detections.forEach((item, index) => {
    if (index !== selected) draw(item, index);
  });
  if (selected >= 0 && result.detections[selected])
    draw(result.detections[selected], selected);
}
