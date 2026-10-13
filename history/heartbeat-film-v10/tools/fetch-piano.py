"""Fetch only attributed CC-BY-3.0 audio/data; never execute upstream code."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen, Request
from urllib.parse import quote
import hashlib,json,time
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'audio/instruments/salamander'
COMMIT='3382bf9496bba2486f5ab0de55a264d1dfc38404'
BASE=f'https://raw.githubusercontent.com/sfzinstruments/SalamanderGrandPiano/{COMMIT}/'
names=['A1','C2','D#2','F#2','A2','C3','D#3','F#3','A3','C4','D#4','F#4','A4','C5','D#5','F#5']
files=['LICENSE','README.md','Data/region.txt','Data/tune_ret.txt']+[f'Samples/{n}v{v}.flac' for n in names for v in [3,7]]
def fetch(name):
    dest=OUT/name;dest.parent.mkdir(parents=True,exist_ok=True)
    url=BASE+quote(name,safe='/')
    if not dest.exists():
        for attempt in range(3):
            try:
                data=urlopen(Request(url,headers={'User-Agent':'Heartbeat-local-production'}),timeout=60).read()
                if name.endswith('.flac') and not data.startswith(b'fLaC'):raise ValueError('Not FLAC')
                dest.write_bytes(data);break
            except Exception:
                if attempt==2:raise
                time.sleep(1)
    data=dest.read_bytes()
    return {'path':name,'url':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(fetch,files))
    (OUT/'provenance.json').write_text(json.dumps({'author':'Alexander Holm','title':'Salamander Grand Piano v3','license':'CC-BY-3.0','licenseUrl':'https://creativecommons.org/licenses/by/3.0/','repository':'https://github.com/sfzinstruments/SalamanderGrandPiano','commit':COMMIT,'files':results},indent=2),encoding='utf8')
    print(json.dumps({'files':len(results),'bytes':sum(r['bytes'] for r in results),'directory':str(OUT)}))
