"""准备独立图片参考：固定上游原始头、官方角点与 Shapely NMS；不调用 SDK。"""
import argparse
import datetime
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
REVISION = 'b25522a0f4bde8c80603f3ba5e3472059972e3b5'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--upstream', type=Path, required=True)
parser.add_argument('--feasibility-work', type=Path, required=True)
parser.add_argument('--captured', type=Path, help='复核公共 API 实际输入张量的运行目录')
args = parser.parse_args()
upstream = args.upstream.resolve()
work = ROOT / '.tmp/evaluation'
report = ROOT / 'reports/2026-09-18-image-sdk'
os.environ['OMP_NUM_THREADS'] = '4'
sys.path.insert(0, str(upstream))
import cv2
import numpy as np
import paddle
from ppdet.core.workspace import create, load_config


def sha(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def dump(file, value):
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


spec = importlib.util.spec_from_file_location('official_rotated', upstream / 'configs/rotate/tools/onnx_infer.py')
official = importlib.util.module_from_spec(spec)
spec.loader.exec_module(official)
config = load_config(str(upstream / 'configs/rotate/ppyoloe_r/ppyoloe_r_crn_s_3x_dota.yml'))
paddle.set_device('cpu')
model = create(config.architecture)
weight = args.feasibility_work / 'ppyoloe_r_crn_s_3x_dota.pdparams'
assert sha(weight) == 'd9c4483c53a79bc8e8265f01beb044e060bb4bb017830befb046d2d504ec99a5'
missing, unexpected = model.set_state_dict(paddle.load(str(weight)))
assert missing == ['yolo_head.angle_proj_conv.weight'] and not unexpected
model.eval()


def infer(tensor, scale):
    with paddle.no_grad():
        raw = model.yolo_head(model.neck(model.backbone({'image': paddle.to_tensor(tensor)})))
        scores, rboxes = [r.numpy() for r in raw]
        polygons = model.yolo_head._box2corners(raw[1]).numpy()
        polygons /= np.asarray([scale[1], scale[0]] * 4, dtype=np.float32)
    assert np.isfinite(scores).all() and np.isfinite(rboxes).all()
    assert max((s > np.float32(.1)).sum() for s in scores[0]) <= 2000
    expected, _ = official.multiclass_nms_rotated(polygons, scores)
    return expected, scores, rboxes


if args.captured:
    # 捕获由 SDK 的实际 session.run feeds 提供，避免使用另一套浏览器预处理代替被测路径。
    records = json.loads((args.captured / 'captures.json').read_text(encoding='utf-8'))
    rows, checked_inputs = [], {}
    for item in records:
        tensor_file = args.captured / item['inputFile']
        assert sha(tensor_file) == item['inputSha256']
        identity = (item['inputSha256'], tuple(item['scaleFactor']))
        if identity not in checked_inputs:
            tensor = np.fromfile(tensor_file, dtype='<f4').reshape(1, 3, 1024, 1024)
            expected, scores, rboxes = infer(tensor, item['scaleFactor'])
            target = args.captured / 'paddle' / (item['id'] + '.npz')
            target.parent.mkdir(parents=True, exist_ok=True)
            np.savez_compressed(target, official=expected, scores=scores, rboxes=rboxes)
            checked_inputs[identity] = (target, len(expected))
        target, count = checked_inputs[identity]
        rows.append({'id': item['id'], 'inputSha256': item['inputSha256'], 'file': str(target.relative_to(args.captured)),
                     'sha256': sha(target), 'count': count})
        print(item['id'], count, flush=True)
    dump(report / 'captured-reference.json', {'status': 'passed', 'uniqueInputs': len(checked_inputs), 'rows': rows})
    sys.exit(0)

first_path = upstream / 'demo/P0072__1.0__0___0.png'
second_path = upstream / 'demo/P0861__1.0__1154___824.png'
first, second = cv2.imread(str(first_path)), cv2.imread(str(second_path))
images = [
    ('P0072', first, '固定上游原图'),
    ('P0861', second, '固定上游原图'),
    ('P0072-rot90', cv2.rotate(first, cv2.ROTATE_90_CLOCKWISE), '顺时针旋转90度'),
    ('P0861-crop', second[:, :768], '左侧768像素裁剪'),
    ('blank', np.zeros((1024, 1024, 3), np.uint8), '纯黑负例'),
    ('P0072-641x513', cv2.resize(first, (641, 513), interpolation=cv2.INTER_CUBIC), '奇数尺寸缩小641×513'),
    ('P0861-1537x769', cv2.resize(second, (1537, 769), interpolation=cv2.INTER_CUBIC), '非整数比例1537×769'),
    ('P0072-tall', cv2.resize(first, (257, 1537), interpolation=cv2.INTER_CUBIC), '细长257×1537'),
    ('white-wide', np.full((1, 4096, 3), 255, np.uint8), '极宽单行合成负例，最小输出尺寸钳制到1'),
]
transforms = official.Compose([{'type': 'Resize', 'target_size': [1024, 1024], 'keep_ratio': True, 'interp': 2},
    {'type': 'NormalizeImage', 'mean': [.485, .456, .406], 'std': [.229, .224, .225], 'is_scale': True},
    {'type': 'Permute'}])
rows = []
for name, bgr, transform in images:
    for folder in ['images', 'rgba', 'inputs', 'reference']:
        (work / folder).mkdir(parents=True, exist_ok=True)
    image_file = work / 'images' / (name + '.png')
    cv2.imwrite(str(image_file), bgr)
    rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA)
    rgba_file = work / 'rgba' / (name + '.rgba')
    rgba.tofile(rgba_file)
    h, w = bgr.shape[:2]
    if name == 'white-wide':
        # 官方OpenCV会把1×4096缩成0高而拒绝；产品最小1像素是明确的输入扩展。
        rgb = np.full((1, 1024, 3), 255, dtype=np.float32)
        rgb *= 1. / 255.
        rgb -= np.array([.485, .456, .406])[None, None, :]
        rgb /= np.array([.229, .224, .225])[None, None, :]
        feed = {'image': rgb.transpose(2, 0, 1), 'scale_factor': np.array([.25, .25], dtype=np.float32)}
    else:
        feed = transforms(str(image_file))
    tensor = np.zeros((1, 3, 1024, 1024), dtype=np.float32)
    _, rh, rw = feed['image'].shape
    tensor[0, :, :rh, :rw] = feed['image']
    input_file = work / 'inputs' / (name + '.f32')
    tensor.tofile(input_file)
    expected, scores, rboxes = infer(tensor, feed['scale_factor'])
    reference_file = work / 'reference' / (name + '.npz')
    np.savez_compressed(reference_file, official=expected, scores=scores, rboxes=rboxes)
    rows.append({'id': name, 'width': w, 'height': h, 'transform': transform,
        'scaleFactor': feed['scale_factor'].tolist(), 'resizedWidth': rw, 'resizedHeight': rh,
        'imageFile': str(image_file.relative_to(work)).replace('\\', '/'), 'imageSha256': sha(image_file),
        'rgbaFile': str(rgba_file.relative_to(work)).replace('\\', '/'), 'rgbaSha256': sha(rgba_file),
        'inputFile': str(input_file.relative_to(work)).replace('\\', '/'), 'inputSha256': sha(input_file),
        'referenceFile': str(reference_file.relative_to(work)).replace('\\', '/'), 'referenceSha256': sha(reference_file),
        'referenceCount': len(expected)})
    print(name, len(expected), flush=True)
dump(report / 'dataset.lock.json', {'status': 'prepared', 'preparedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'upstreamRevision': REVISION, 'sources': [{'path': str(p.relative_to(upstream)).replace('\\', '/'), 'sha256': sha(p)} for p in [first_path, second_path]],
    'reference': '固定Paddle原网络/官方角点/Shapely旋转NMS，阈值.1/.1；无GT或mAP评估',
    'licenseScope': '上游DOTA示例仅本地评估，不随Git、npm或Demo发布', 'cases': rows})
