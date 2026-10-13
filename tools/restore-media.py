"""Restore SHA-256 verified media from this project's public GitHub release."""
import argparse,hashlib,json,pathlib,shutil,urllib.request,zipfile,time
ROOT=pathlib.Path(__file__).resolve().parents[1]

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
    return h.hexdigest()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--history',action='store_true',help='Restore historical source and the media included in this release into archive/workspace')
    p.add_argument('--edition',default='heartbeat-film-v16',help='History folder name, e.g. heartbeat-film-v15')
    p.add_argument('--all',action='store_true',help='Restore all media INCLUDED in this release (not all historical versions)')
    p.add_argument('--film',action='store_true',help='Also restore the final 1080p MP4 into output/')
    p.add_argument('--local-dir',type=pathlib.Path,help='Use locally downloaded release assets')
    p.add_argument('--only',help='Restore one original path, must be listed in media-manifest.json')
    args=p.parse_args()
    manifest=json.loads((ROOT/'media-manifest.json').read_text(encoding='utf8'))
    assets={a['name']:a for a in json.loads((ROOT/'release-assets.json').read_text(encoding='utf8'))}
    selected=[]
    for item in manifest['files']:
        pp=pathlib.PurePosixPath(item['path']);edition=pp.parts[0];tail=pathlib.PurePosixPath(*pp.parts[1:])
        if args.only:keep=item['path']==args.only
        elif args.all:keep=True
        elif args.history:keep=edition==args.edition
        else:keep=edition=='heartbeat-film-v16' and (tail.parts[0] in ('assets','audio') or (args.film and str(tail)=='output/heartbeat-v16-1080p.mp4'))
        if keep:selected.append(item)
    if not selected:raise SystemExit('No matching media; check the manifest path or edition.')
    if args.history or args.all or args.only:
        editions={pathlib.PurePosixPath(x['path']).parts[0] for x in selected}
        for edition in editions:
            source=ROOT/'history'/edition;dest=ROOT/'archive/workspace'/edition
            if source.exists():shutil.copytree(source,dest,dirs_exist_ok=True)
    cache=ROOT/'.cache/release';cache.mkdir(parents=True,exist_ok=True)
    verified={};handles={}
    try:
        for item in selected:
            relative=pathlib.PurePosixPath(item['path'])
            if args.history or args.all or args.only:dest=ROOT/'archive/workspace'/relative
            else:dest=ROOT.joinpath(*relative.parts[1:])
            if not dest.resolve().is_relative_to(ROOT.resolve()):raise ValueError('Unsafe destination')
            if dest.exists() and sha(dest)==item['sha256']:continue
            name=item['asset']
            if pathlib.Path(name).name!=name:raise ValueError('Unsafe asset name')
            if name not in verified:
                file=(args.local_dir/name) if args.local_dir else (cache/name)
                if not file.exists():
                    if args.local_dir:raise FileNotFoundError(file)
                    url=f"https://github.com/{manifest['repository']}/releases/download/{manifest['tag']}/{name}"
                    partial=file.with_suffix(file.suffix+'.part')
                    for attempt in range(3):
                        try:
                            print('Downloading',name,flush=True)
                            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'heartbeat-media-restorer'}),timeout=180) as r,partial.open('wb') as w:shutil.copyfileobj(r,w,1024*1024)
                            partial.replace(file);break
                        except Exception:
                            if attempt==2:raise
                            time.sleep(2*(attempt+1))
                if file.stat().st_size!=assets[name]['bytes'] or sha(file)!=assets[name]['sha256']:raise ValueError('Release checksum mismatch: '+name)
                verified[name]=file
            dest.parent.mkdir(parents=True,exist_ok=True);temp=dest.with_name(dest.name+'.restoring')
            if item['member']:
                if name not in handles:handles[name]=zipfile.ZipFile(verified[name])
                with handles[name].open(item['member']) as source,temp.open('wb') as target:shutil.copyfileobj(source,target,1024*1024)
            else:shutil.copyfile(verified[name],temp)
            if sha(temp)!=item['sha256']:raise ValueError('Media checksum mismatch: '+item['path'])
            temp.replace(dest)
        print('Restored',len(selected),'media paths. Original production files were not changed.')
    finally:
        for z in handles.values():z.close()

if __name__=='__main__':main()
