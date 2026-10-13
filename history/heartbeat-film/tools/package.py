"""Create and verify the portable viewing/source delivery without runtimes."""
import hashlib
import json
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'output/heartbeat-samples-source-v01.zip'
patterns=[
    'index.html','render.html','README.md','PRODUCTION.md','requirements.txt','package.json','package-lock.json',
    'src/*.mjs','tests/*.mjs','tools/*.mjs','tools/package.py','audio/synthesize.py','audio/score.json',
    'assets/vendor/*','assets/THIRD-PARTY.txt','reference/*',
    'audio/generated/01-*.wav','audio/generated/02-*.wav','audio/generated/*-report.json',
    'output/01-emergence.mp4','output/02-answer.mp4','output/render-report.json',
    'output/contact/t20-0000.png','output/contact/t59-0000.png',
    'output/verification/*.json','output/verification/*.md','output/verification/*.framemd5','output/verification/player-*.png',
    'output/verification/01-emergence-2.500.png','output/verification/02-answer-4.000.png',
]
files=sorted({p for pattern in patterns for p in ROOT.glob(pattern) if p.is_file()})
manifest={'title':'心跳 · HEARTBEAT','stage':'two original scored key samples, not the complete 90-second film','files':[]}
for p in files:
    manifest['files'].append({'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
with zipfile.ZipFile(OUTPUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:
        z.write(p,'heartbeat/'+p.relative_to(ROOT).as_posix())
    z.writestr('heartbeat/delivery-manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(OUTPUT) as z:
    assert z.testzip() is None,'Archive CRC failure'
    archived=json.loads(z.read('heartbeat/delivery-manifest.json'))
    for record in archived['files']:
        assert hashlib.sha256(z.read('heartbeat/'+record['path'])).hexdigest()==record['sha256']
report={'archive':OUTPUT.name,'bytes':OUTPUT.stat().st_size,'files':len(files)+1,'crcVerified':True,'allFileHashesVerified':True,'sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}
(ROOT/'output/package-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
