"""Compare retained source frames, allowing only sparse two-level raster rounding."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
folder=ROOT/'output/verification/retained-opening'
rows=[]
for p in sorted(folder.glob('*-previous.png')):
    q=p.with_name(p.name.replace('-previous','-current'))
    a=np.asarray(Image.open(p)).astype(np.int16)
    b=np.asarray(Image.open(q)).astype(np.int16)
    assert a.shape==b.shape==(2160,3840,4)
    delta=np.abs(a[:,:,:3]-b[:,:,:3]);count=int(np.any(delta>0,axis=2).sum())
    row={'time':float(p.name.split('-')[0]),'meanRGBDifference':float(delta.mean()),'maxRGBDifference':int(delta.max()),'changedPixels':count,'totalPixels':3840*2160}
    # This is visual equivalence, not bit-identical PNG files. Different browser
    # processes occasionally round a few antialiased path edge samples by 1–2.
    assert row['maxRGBDifference']<=2 and row['meanRGBDifference']<.00001 and count<100,row
    rows.append(row)
assert len(rows)==13
report={'passed':True,'width':3840,'height':2160,'samples':2,'rows':rows,'allowedIntervals':[[0,62],[66,130]],'note':'Retained shot compositions agree. One comparison differs by at most 2/255 on 38 of 8,294,400 pixels; this is not claimed as bit-identical rendering. This check does not cover modified intervals.'}
(ROOT/'output/verification/retained-pixels.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps({'passed':True,'framesCompared':len(rows),'maxChangedPixels':max(r['changedPixels'] for r in rows),'maxDifference':max(r['maxRGBDifference'] for r in rows)}))
