"""Extract nonempty embedded PNG previews; never claims to decode CSP layer tips."""
import base64, io, json, sqlite3, sys
from pathlib import Path
from PIL import Image
presets=[]
for slug,stem,spacing,size,rotation in [('smeared','묻은',.65,120,25),('drops','방울진',.7,100,20),('flowing','흐르는',.55,180,0)]:
    path=Path(sys.argv[1])/f'{stem}_체액브러시.sut'
    tips=[]; dimensions=[]
    with sqlite3.connect(f'file:{path}?mode=ro',uri=True) as db:
        for (blob,) in db.execute('SELECT FileData FROM MaterialFile ORDER BY _PW_ID'):
            start=0
            while (offset:=blob.find(b'\x89PNG\r\n\x1a\n',start))>=0:
                start=offset+8; end=start
                try:
                    while end+12<=len(blob):
                        length=int.from_bytes(blob[end:end+4],'big'); kind=blob[end+4:end+8];end+=length+12
                        if kind==b'IEND': break
                    png=blob[offset:end];im=Image.open(io.BytesIO(png));im.load()
                    if not im.convert('RGBA').getchannel('A').getbbox():continue
                    tips.append('data:image/png;base64,'+base64.b64encode(png).decode());dimensions.append(list(im.size))
                except (ValueError,OSError):continue
    assert tips
    presets.append(dict(format='balloon-studio-brush',version=1,id='builtin-liquid-'+slug,name=stem+' 체액 · 저해상도',type='stampBrush',tips=tips,tipSelection='random',spacing=spacing,size=dict(base=size,random=.15,pressure=False),rotation=dict(base=0,followStroke=False,random=rotation),opacity=dict(base=1,random=0,pressure=False),scatter=dict(enabled=False,amount=0),source=dict(kind='sut-embedded-preview',file=path.name,dimensions=dimensions,note='SUT 내 미리보기로 만든 저해상도 브러시야. 원본 팁·CSP 효과와 다를 수 있고 확대하면 흐려져. 간격과 회전 등은 공방용으로 설정했어.')))
Path(sys.argv[2]).write_text('/* Embedded SUT previews, converted once to independent BrushData. */\nconst BUILTIN_BRUSHES='+json.dumps(presets,ensure_ascii=False,separators=(',',':'))+';\n')
print([(b['name'],len(b['tips'])) for b in presets])
