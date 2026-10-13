from pathlib import Path
import json, hashlib
root=Path(__file__).resolve().parents[1]
asset=root/'assets/ecg'
data=(asset/'100.dat').read_bytes()
# WFDB 212 packs two 12-bit channel samples into each three-byte group.
mlii=[]
for i in range(0,1800,3):
 v=data[i]+((data[i+1]&15)<<8)
 if v>=2048:v-=4096
 mlii.append((v-1024)/200)
# Record 100's second annotated normal beat is sample 370. Find the local R
# maximum so the audio cue lands on the measured peak, not an invented shape.
r=max(range(360,380),key=lambda i:mlii[i])
start=r-108
raw=mlii[start:start+325]
values=[round(v-(raw[0]+(raw[-1]-raw[0])*i/(len(raw)-1)),6) for i,v in enumerate(raw)]
(root/'src/measured-ecg.mjs').write_text('// MIT-BIH record 100, MLII; PhysioNet; ODC-By 1.0. See docs/credits.md.\n'
 +'// A single measured beat, linear baseline removed; original sample timing retained.\n'
 +'export const ECG_SAMPLE_RATE=360;\nexport const ECG_SAMPLES='+json.dumps(values,separators=(',',':'))+';\n',encoding='utf-8')
provenance={
 'title':'MIT-BIH Arrhythmia Database, version 1.0.0, record 100, MLII',
 'authors':['George Moody','Roger Mark'],
 'source':'https://physionet.org/files/mitdb/1.0.0/100.dat',
 'dataset':'https://physionet.org/content/mitdb/1.0.0/',
 'doi':'https://doi.org/10.13026/C2F305',
 'license':'Open Data Commons Attribution License v1.0',
 'licenseUrl':'https://opendatacommons.org/licenses/by/1-0/',
 'sha256':hashlib.sha256(data).hexdigest(),
 'channel':'MLII','sourceSampleRate':360,'samples':[start,start+len(raw)-1],
 'rSample':r,'processing':'Single beat excerpt, linear endpoint baseline removed. No smoothing, synthesized peak or sample-time stretching. Linear interpolation only for display.',
 'visual':'Red trace, 234 logical pixels per mV; silence baseline extended around excerpt.',
 'heartbeatCue':94.25,
}
(asset/'provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'asset':'src/measured-ecg.mjs','samples':len(values),'startSample':start,'rSample':r}))
