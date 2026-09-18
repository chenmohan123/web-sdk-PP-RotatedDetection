"""首版模型分发：准备、显式上传与固定提交完整回读，复用宿主 Hub 登录。"""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import gzip
import hashlib
import json
import re
import shutil
import subprocess
import requests

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'reports/2026-09-18-release'
STAGE = ROOT / '.tmp/release-models'
REPO = 'chenmohan/web-sdk-pp-rotated-detection'
PREFIX = 'ppyoloe-r-s-1024/0.1.0'
FILE = 'ppyoloe-r-s-1024-fp32.onnx'
IDENTITY = {'bytes': 33161415, 'sha256': 'de2f4c94061bda4bfaa0773ed5bc3aabdc59cf5b2f72301d15ae500b8f971089'}


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def identity(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def now():
    return datetime.now(timezone.utc).isoformat()


def files(folder):
    return [{'path': f.relative_to(folder).as_posix(), **identity(f.read_bytes())}
            for f in sorted(folder.rglob('*')) if f.is_file()]


def head(source):
    if source == 'huggingface':
        from huggingface_hub import HfApi
        return HfApi().model_info(REPO).sha
    return subprocess.check_output(['git', '-c', 'http.sslBackend=openssl', 'ls-remote',
        f'https://www.modelscope.cn/{REPO}.git', 'refs/heads/master'], text=True).split()[0]


def address(source, revision, path):
    origin = 'https://www.modelscope.cn/models' if source == 'modelscope' else 'https://huggingface.co'
    return f'{origin}/{REPO}/resolve/{revision}/{path}'


def prepare(feasibility):
    require(feasibility is not None, '需要固定可行性报告目录')
    data = (ROOT / '.tmp/model.onnx').read_bytes()
    require(identity(data) == IDENTITY, '本地模型身份不符')
    lock = read(feasibility / 'sources.lock.json')
    require(lock['upstreamRevision'] == 'b25522a0f4bde8c80603f3ba5e3472059972e3b5', '上游提交不符')
    records = [x for x in lock['files'] if x['path'] in ('LICENSE', 'configs/rotate/ppyoloe_r/README.md')]
    require(len(records) == 2, '缺少许可或模型表')
    for record in records:
        raw = gzip.decompress((feasibility / record['snapshot']).read_bytes())
        require(identity(raw) == {k: record[k] for k in IDENTITY}, '上游快照摘要不符')
        if record['path'] == 'LICENSE':
            (ROOT / 'models/LICENSE').write_bytes(raw)
        else:
            require(b'ppyoloe_r_crn_s_3x_dota.pdparams' in raw, '模型表缺少目标权重')
    candidate = next(x for x in lock['candidates'] if x['id'] == 'ppyoloe_r_crn_s_3x_dota')
    conversion = read(feasibility / 'conversion-ppyoloe_r_crn_s_3x_dota.json')
    require({k: conversion['model'][k] for k in IDENTITY} == IDENTITY, '转换模型身份不符')
    require(conversion['weightSha256'] == candidate['sha256'], '转换权重身份不符')
    quality = read(ROOT / 'reports/2026-09-18-image-sdk/verification.json')
    require(quality['status'] == 'passed' and quality['comparisons'] == 40, '公共API质量验收未通过')
    dump(REPORT / 'license/sources.lock.json', {'verifiedAt': now(), 'upstreamRevision': lock['upstreamRevision'],
        'files': records, 'weight': candidate, 'license': lock['license'],
        'decision': 'apache-2.0-supported-by-pinned-project-license-and-official-weight-table'})
    conversion.update({'version': '0.1.0', 'weightUrl': candidate['url'], 'weightBytes': candidate['bytes'],
        'modification': '未训练或量化；固定单图1024原始头导出，四点恢复和旋转NMS移至SDK。',
        'reproduction': 'https://github.com/chenmohan123/chenmohan123.github.io/tree/674a0705ff56c7b9ce32f0bfd6733f536dfe9029/reports/rotated-detection/2026-09-18-feasibility/reproduction'})
    dump(ROOT / 'models/conversion.json', conversion)
    target = STAGE / 'weights' / PREFIX
    target.mkdir(parents=True, exist_ok=True)
    for name in ('LICENSE', 'conversion.json', 'README.md', 'README.en.md'):
        shutil.copyfile(ROOT / 'models' / name, target / name)
    shutil.copyfile(ROOT / 'NOTICE', target / 'NOTICE')
    (target / FILE).write_bytes(data)
    (STAGE / 'weights/README.md').write_text(f'''---
license: apache-2.0
pipeline_tag: object-detection
tags:
- onnx
- webgpu
- wasm
- rotated-object-detection
---

# PP-RotatedDetection Web SDK 模型

[中文模型卡]({PREFIX}/README.md) · [English model card]({PREFIX}/README.en.md)

由chenmohan维护，非Paddle官方账号。PP-YOLOE-R-s 1024 FP32，DOTA15类单帧遥感旋转框检测，33,161,415字节。
Apache-2.0采用依据为固定官方项目声明与模型表，未发现独立权重许可文本；完整来源、转换和边界见模型卡及LICENSE/NOTICE。

Maintained by chenmohan, not the official Paddle account. Single-image DOTA15 rotated detection, PP-YOLOE-R-s 1024 FP32. Apache-2.0 is adopted from the pinned project license and model table; no separate weight-specific license text was found. See the cards for provenance, conversion and desktop verification scope.
''', encoding='utf-8', newline='\n')
    dump(REPORT / 'distribution-prepared.json', {'preparedAt': now(), 'repository': REPO, 'model': IDENTITY, 'files': files(STAGE / 'weights')})
    print('模型、双语卡、固定许可与转换记录已准备。')


def upload(source, phase):
    folder = STAGE / phase
    receipt = REPORT / f'distribution-{phase}-{source}.json'
    expected = files(folder)
    require(bool(expected), '暂存为空')
    if receipt.exists():
        require(read(receipt)['files'] == expected, '已上传文件身份改变')
        print(source, phase, '已有固定回执，跳过重复上传')
        return
    if phase == 'weights':
        require(expected == read(REPORT / 'distribution-prepared.json')['files'], '暂存与已准备文件不符')
    if source == 'huggingface':
        from huggingface_hub import HfApi
        api = HfApi()
        if phase == 'weights':
            api.create_repo(repo_id=REPO, repo_type='model', private=False, exist_ok=False)
        parent = head(source)
        revision = api.upload_folder(repo_id=REPO, repo_type='model', folder_path=str(folder), parent_commit=parent,
            commit_message=f'发布 PP-RotatedDetection 0.1.0：{phase}').oid
    else:
        from modelscope.hub.api import HubApi
        api = HubApi()
        if phase == 'weights':
            api.create_repo(REPO, repo_type='model', visibility=5, license='Apache License 2.0', exist_ok=False)
        parent = head(source)
        api.upload_folder(repo_id=REPO, repo_type='model', folder_path=str(folder),
            commit_message=f'发布 PP-RotatedDetection 0.1.0：{phase}', sync_remote_repo=False,
            max_workers=1, disable_tqdm=True, use_cache=False)
        revision = head(source)
    require(bool(re.fullmatch('[a-f0-9]{40}', revision)), '远程 revision 无效')
    dump(receipt, {'source': source, 'repository': REPO, 'phase': phase, 'parent': parent, 'revision': revision,
        'uploadedAt': now(), 'files': expected})
    print(source, phase, revision)


def verify(phase):
    rows = []
    for source in ('modelscope', 'huggingface'):
        receipt = read(REPORT / f'distribution-{phase}-{source}.json')
        require(receipt['files'] == files(STAGE / phase), '暂存文件集合改变')
        for entry in receipt['files']:
            url = address(source, receipt['revision'], entry['path'])
            with requests.get(url, timeout=(30, 120)) as response:
                response.raise_for_status()
                require(identity(response.content) == {k: entry[k] for k in IDENTITY}, '远程文件身份不符：' + entry['path'])
            rows.append({'source': source, 'revision': receipt['revision'], 'url': url, **entry, 'verifiedAt': now(), 'passed': True})
    dump(REPORT / f'distribution-{phase}-verified.json', {'status': 'passed', 'verifiedAt': now(), 'model': IDENTITY, 'results': rows})
    if phase == 'weights':
        sources = []
        for source in ('modelscope', 'huggingface'):
            revision = read(REPORT / f'distribution-{phase}-{source}.json')['revision']
            path = PREFIX + '/' + FILE
            sources.append({'kind': source, 'repository': REPO, 'revision': revision, 'path': path,
                'downloadUrl': address(source, revision, path), **IDENTITY})
        manifest = read(ROOT / 'models/model.json')
        manifest.update({'version': '0.1.0', 'status': 'published', 'sources': sources})
        dump(ROOT / 'models/model.json', manifest)
        dump(STAGE / 'metadata' / PREFIX / 'model.json', manifest)
    print(phase, '双源固定提交全部文件完整 GET 校验通过。')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--feasibility', type=Path)
    parser.add_argument('action', choices=['prepare', 'upload', 'verify'])
    parser.add_argument('--source', choices=['modelscope', 'huggingface'])
    parser.add_argument('--phase', choices=['weights', 'metadata'], default='weights')
    args = parser.parse_args()
    if args.action == 'prepare':
        prepare(args.feasibility)
    elif args.action == 'verify':
        verify(args.phase)
    else:
        require(args.source is not None, '上传需要显式指定来源')
        upload(args.source, args.phase)
