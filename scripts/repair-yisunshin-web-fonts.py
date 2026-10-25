"""Repair only the official YiSunShin kern subtable length and SFNT checksums.

Original fonts remain untouched. No glyphs, metrics or kerning pairs change.
"""
import hashlib
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = {
    'Regular': '32742de1743b154957e1c851b800ca1270083046e8c322d09cbe8b197146f5f3',
    'Bold': '0d39e0ed7e8e68e039d053851c35a7158aeac48296673382eee01123ebd0a42e',
}


def checksum(data):
    data = bytes(data)
    data += b'\0' * (-len(data) % 4)
    return sum(struct.unpack('>' + str(len(data) // 4) + 'I', data)) & 0xffffffff


def repair(original):
    data = bytearray(original)
    tables = {}
    for i in range(struct.unpack_from('>H', data, 4)[0]):
        record = 12 + i * 16
        tag, _, offset, length = struct.unpack_from('>4sIII', data, record)
        tables[tag] = (record, offset, length)
    record, offset, length = tables[b'kern']
    assert struct.unpack_from('>HH', data, offset) == (0, 1)
    assert struct.unpack_from('>HHH', data, offset + 4) == (0, 65392, 1)
    pairs = struct.unpack_from('>H', data, offset + 10)[0]
    assert length - 4 == 14 + pairs * 6 == 54902
    struct.pack_into('>H', data, offset + 6, length - 4)
    struct.pack_into('>I', data, record + 4, checksum(data[offset:offset + length]))
    _, head, _ = tables[b'head']
    struct.pack_into('>I', data, head + 8, 0)
    struct.pack_into('>I', data, head + 8, (0xb1b0afba - checksum(data)) & 0xffffffff)
    return bytes(data)


if __name__ == '__main__':
    for weight, expected in ORIGINALS.items():
        path = ROOT / 'public/fonts/yisunshin' / f'YiSunShin-{weight}.ttf'
        original = path.read_bytes()
        assert hashlib.sha256(original).hexdigest() == expected
        path.with_name(f'YiSunShin-{weight}-web.ttf').write_bytes(repair(original))
        print(f'Repaired {weight}: kern header/checksums only')
