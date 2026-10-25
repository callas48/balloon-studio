"""Regression for browser OTS rejection; run with OTS_SANITIZE=/path/to/ots-sanitize."""
import hashlib
import importlib.util
import os
from pathlib import Path
import shutil
import struct
import subprocess
import sys
sys.dont_write_bytecode = True
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('repair', ROOT / 'scripts/repair-yisunshin-web-fonts.py')
repair = importlib.util.module_from_spec(spec)
spec.loader.exec_module(repair)
ots = os.environ.get('OTS_SANITIZE') or shutil.which('ots-sanitize')
assert ots, 'Install opentype-sanitizer and set OTS_SANITIZE to its ots-sanitize executable'
with tempfile.TemporaryDirectory() as tmp:
    for weight, expected in repair.ORIGINALS.items():
        path = ROOT / 'public/fonts/yisunshin' / f'YiSunShin-{weight}.ttf'
        original = path.read_bytes()
        fixed_path = path.with_name(f'YiSunShin-{weight}-web.ttf')
        fixed = fixed_path.read_bytes()
        assert hashlib.sha256(original).hexdigest() == expected
        assert fixed == repair.repair(original)
        assert len(original) == len(fixed)
        allowed = set()
        for i in range(struct.unpack_from('>H', original, 4)[0]):
            record = 12 + i * 16
            tag, _, offset, length = struct.unpack_from('>4sIII', original, record)
            if tag == b'kern':
                allowed.update(range(record + 4, record + 8))
                allowed.update(range(offset + 6, offset + 8))
                assert original[offset + 8:offset + length] == fixed[offset + 8:offset + length]
            elif tag == b'head':
                allowed.update(range(offset + 8, offset + 12))
            else:
                assert original[offset:offset + length] == fixed[offset:offset + length]
        assert all(a == b or i in allowed for i, (a, b) in enumerate(zip(original, fixed)))
        assert repair.checksum(fixed) == 0xb1b0afba
        bad = subprocess.run([ots, str(path), tmp + '/bad.ttf'], capture_output=True, text=True)
        assert bad.returncode != 0 and 'kern' in bad.stdout + bad.stderr
        good = subprocess.run([ots, str(fixed_path), tmp + '/good.ttf'], capture_output=True, text=True)
        assert good.returncode == 0, good.stdout + good.stderr
        assert f'yisunshin/YiSunShin-{weight}-web.ttf' in (ROOT / 'public/comic-fonts.js').read_text()
print('PASS YiSunShin: original browser-OTS failure reproduced, both web fonts pass OTS; exact outlines/metrics/maps/kerning pairs preserved')
