"""对公共 SDK 输出直接匹配独立 Paddle/Shapely 参考，分别报告图片端到端与同张量。"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'reports/2026-09-18-image-sdk'
WORK = ROOT / '.tmp/evaluation'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--captured-reference', action='store_true')
args = parser.parse_args()


def read(file):
    return json.loads(file.read_text(encoding='utf-8'))


def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def iou(a, b):
    first, second = Polygon(a.reshape(4, 2)), Polygon(b.reshape(4, 2))
    if not first.is_valid or not second.is_valid:
        return 0.
    intersection = first.intersection(second).area
    union = first.area + second.area - intersection
    return intersection / union if union > 0 else 0.


def compare(expected, detections):
    remaining = set(range(len(detections)))
    minimum, max_score, max_corner = 1., 0., 0.
    missing = []
    for row in expected:
        choices = [(iou(row[2:], np.asarray(detections[i]['polygon'])), i) for i in remaining if row[0] == detections[i]['classId']]
        if not choices:
            missing.append(int(row[0]))
            continue
        overlap, index = max(choices)
        remaining.remove(index)
        actual = detections[index]
        minimum = min(minimum, overlap)
        max_score = max(max_score, abs(float(row[1]) - actual['score']))
        max_corner = max(max_corner, float(np.max(np.abs(row[2:] - np.asarray(actual['polygon']).flatten()))))
    return {'referenceCount': len(expected), 'actualCount': len(detections), 'missingClasses': missing,
        'extraIndices': sorted(remaining), 'minimumPolygonIoU': minimum, 'maximumScoreError': max_score,
        'maximumCornerErrorPx': max_corner,
        'passed': not missing and not remaining and minimum >= .995 and max_score <= .001 and max_corner <= .1}


execution, dataset = read(REPORT / 'browser-execution.json'), read(REPORT / 'dataset.lock.json')
cases = {row['id']: row for row in dataset['cases']}
captured = read(REPORT / 'captured-reference.json') if args.captured_reference else None
captured_by_id = {row['id']: row for row in captured['rows']} if captured else {}
rows = []
for mode in execution['modes']:
    for item in mode['results']:
        case = cases[item['id']]
        for artifact in item['artifacts'].values():
            assert sha(WORK / artifact['file']) == artifact['sha256']
        reference_path = WORK / case['referenceFile']
        assert sha(reference_path) == case['referenceSha256']
        with np.load(reference_path) as arrays:
            expected = arrays['official']
        actual_input = np.fromfile(WORK / item['artifacts']['input']['file'], dtype='<f4')
        expected_input = np.fromfile(WORK / case['inputFile'], dtype='<f4')
        assert actual_input.shape == expected_input.shape and np.isfinite(actual_input).all()
        difference = np.abs(actual_input - expected_input)
        row = {'backend': mode['backend'], 'executionMode': mode['executionMode'], 'id': item['id'], 'inputKind': item['inputKind'],
               'input': {'maxAbsoluteError': float(difference.max()), 'meanAbsoluteError': float(difference.mean()),
                         'differentElements': int(np.count_nonzero(difference)), 'totalElements': len(difference)},
               'endToEnd': compare(expected, item['output']['detections'])}
        if captured:
            key = item['key'].replace('/', '--')
            own = captured_by_id[key]
            reference_path = WORK / 'captured' / own['file']
            assert sha(reference_path) == own['sha256']
            assert own['inputSha256'] == item['artifacts']['input']['sha256']
            with np.load(reference_path) as arrays:
                row['sameTensor'] = compare(arrays['official'], item['output']['detections'])
                row['raw'] = []
                for name in ['scores', 'rboxes']:
                    actual = np.fromfile(WORK / item['artifacts'][name]['file'], dtype='<f4').reshape(arrays[name].shape)
                    assert np.isfinite(actual).all()
                    row['raw'].append({'name': name, 'maximumAbsoluteError': float(np.max(np.abs(actual - arrays[name]))),
                                       'meanAbsoluteError': float(np.mean(np.abs(actual - arrays[name])))})
        rows.append(row)
        print(row['backend'], row['executionMode'], row['id'], row['inputKind'], row['endToEnd'], flush=True)
passed = len(rows) == 40 and execution['status'] == 'executed' and all(r['endToEnd']['passed'] and (not captured or r['sameTensor']['passed']) for r in rows)
output = {'status': 'passed' if passed else 'failed', 'verifiedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'evidence': {'browserExecutionSha256': sha(REPORT / 'browser-execution.json'),
                 'datasetSha256': sha(REPORT / 'dataset.lock.json'),
                 'capturedReferenceSha256': sha(REPORT / 'captured-reference.json') if captured else None},
    'thresholds': {'minimumPolygonIoU': .995, 'maximumScoreError': .001, 'maximumCornerErrorPx': .1, 'sameCountAndClasses': True},
    'scope': '图片端到端严格对照；同张量参考另行报告。不是全量DOTA mAP。', 'rows': rows}
(REPORT / 'comparison.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
if not passed:
    raise SystemExit(1)
