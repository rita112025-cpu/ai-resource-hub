#!/usr/bin/env python3
"""
validate-data.py - 驗證兩份 JSON
- JSON syntax
- duplicate id
- required fields
- URL 格式
- YYYY-MM-DD
- tags 是否 array
- boolean type
- null handling
"""

import json
import sys
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
ASTRA_PATH = ROOT / "data" / "astra-resources.json"
CODEX_PATH = ROOT / "data" / "codex-skills.json"

URL_RE = re.compile(r'^https?://')
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')

errors = []
warnings = []

def err(msg):
    errors.append(msg)
    print(f"❌ {msg}")

def warn(msg):
    warnings.append(msg)
    print(f"⚠️ {msg}")

def check_url(field, val, context):
    if val is None or val == "":
        return
    if not isinstance(val, str):
        err(f"{context}: {field} 應為 string，實際 {type(val)}")
        return
    if val and not URL_RE.match(val):
        # 允許空字串，但若有值必須是 http
        if val.startswith("http") is False and val != "":
            # 檢查是否看起來像 URL 但沒 http
            if "." in val and len(val) > 5:
                err(f"{context}: {field} URL 格式錯誤: {val}")

def check_date(field, val, context):
    if not val:
        return
    if not DATE_RE.match(val):
        err(f"{context}: {field} 日期格式應為 YYYY-MM-DD，實際 {val}")

def validate_astra():
    print(f"\n=== Validating {ASTRA_PATH} ===")
    try:
        with open(ASTRA_PATH, encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        err(f"astra-resources.json JSON syntax error: {e}")
        return
    except FileNotFoundError:
        err(f"{ASTRA_PATH} 不存在")
        return

    if not isinstance(data, list):
        err("astra-resources.json 應為 array")
        return

    ids = set()
    for idx, item in enumerate(data):
        ctx = f"astra[{idx}] id={item.get('id','?')}"
        # duplicate
        _id = item.get('id')
        if not _id:
            err(f"{ctx}: 缺少 id")
        else:
            if _id in ids:
                err(f"{ctx}: duplicate id {_id}")
            ids.add(_id)
        # required
        for field in ['id','title','category','description']:
            if not item.get(field):
                err(f"{ctx}: 缺少必填 {field}")
        # tags array
        if 'tags' in item and item['tags'] is not None:
            if not isinstance(item['tags'], list):
                err(f"{ctx}: tags 應為 array")
        # boolean
        if 'featured' in item and item['featured'] is not None:
            if not isinstance(item['featured'], bool):
                err(f"{ctx}: featured 應為 boolean")
        # URL
        for url_field in ['github','demo','sourceCode','reference','prompt']:
            if url_field in item:
                val = item[url_field]
                # prompt 可能是文字，不一定是URL，若以http開頭才檢查
                if val and isinstance(val, str) and val.startswith('http'):
                    check_url(url_field, val, ctx)
                elif url_field != 'prompt':
                    check_url(url_field, val, ctx)
        # date
        check_date('added', item.get('added'), ctx)

    print(f"Astra: {len(data)} 筆，ids {len(ids)}")

def validate_codex():
    print(f"\n=== Validating {CODEX_PATH} ===")
    try:
        with open(CODEX_PATH, encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        err(f"codex-skills.json JSON syntax error: {e}")
        return
    except FileNotFoundError:
        err(f"{CODEX_PATH} 不存在")
        return

    if not isinstance(data, list):
        err("codex-skills.json 應為 array")
        return

    ids = set()
    for idx, item in enumerate(data):
        ctx = f"codex[{idx}] id={item.get('id','?')}"
        _id = item.get('id')
        if not _id:
            err(f"{ctx}: 缺少 id")
        else:
            if _id in ids:
                err(f"{ctx}: duplicate id {_id}")
            ids.add(_id)
        for field in ['id','name','title','category','description','sourceRepo','skillUrl']:
            if field not in item or item[field] is None or (isinstance(item[field], str) and not item[field].strip() and field not in ['description']):
                # description 可空? 但應有
                if field in ['id','name','title','category']:
                    if not item.get(field):
                        err(f"{ctx}: 缺少必填 {field}")
        # tags array
        if 'tags' in item and item['tags'] is not None and not isinstance(item['tags'], list):
            err(f"{ctx}: tags 應為 array")
        if 'useCase' in item and item['useCase'] is not None and not isinstance(item['useCase'], list):
            err(f"{ctx}: useCase 應為 array")
        if 'requires' in item and item['requires'] is not None and not isinstance(item['requires'], list):
            err(f"{ctx}: requires 應為 array")
        # risk
        if 'risk' in item and item['risk'] not in ['low','medium','high', None]:
            err(f"{ctx}: risk 應為 low/medium/high，實際 {item['risk']}")
        # boolean
        for bfield in ['featured','installed']:
            if bfield in item and item[bfield] is not None and not isinstance(item[bfield], bool):
                err(f"{ctx}: {bfield} 應為 boolean")
        # capabilities
        if 'capabilities' in item and item['capabilities'] is not None:
            if not isinstance(item['capabilities'], dict):
                err(f"{ctx}: capabilities 應為 object")
            else:
                for k,v in item['capabilities'].items():
                    if v is not None and not isinstance(v, bool):
                        err(f"{ctx}: capabilities.{k} 應為 boolean|null")
        # URLs
        for url_field in ['sourceRepo','skillUrl']:
            check_url(url_field, item.get(url_field), ctx)
        check_date('added', item.get('added'), ctx)
        # null handling check - 不應把 unknown 寫成 false
        # 若有寫 false 但註解說未確認，提醒
        if 'safety' in item and isinstance(item['safety'], dict):
            for k,v in item['safety'].items():
                if v is False:
                    # false 是合法值，但需確認不是把 unknown 當 false
                    pass

    print(f"Codex: {len(data)} 筆，ids {len(ids)}")

def main():
    validate_astra()
    validate_codex()
    print("\n=== Summary ===")
    if errors:
        print(f"FAILED with {len(errors)} errors, {len(warnings)} warnings")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print(f"PASS with {len(warnings)} warnings")
        if warnings:
            for w in warnings:
                print(f"  - {w}")
        sys.exit(0)

if __name__ == "__main__":
    main()
