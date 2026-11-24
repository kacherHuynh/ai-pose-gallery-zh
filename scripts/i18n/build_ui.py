"""Build src/i18n/ui-dict.json from ui/*.tsv (zh<TAB>vi<TAB>en, `{}` = placeholder)
and list extracted UI strings that still lack a translation. Strings that are
only prompts sent to image models are intentionally left in Chinese."""
import json,re,glob,os
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(HERE,'..','..'))
CJK=re.compile(r'[\u3040-\u30ff\u4e00-\u9fff]')
ui={}
for f in sorted(glob.glob(os.path.join(HERE,'ui','*.tsv'))):
    for n,line in enumerate(open(f),1):
        if not line.strip(): continue
        p=line.rstrip('\n').split('\t')
        assert len(p)==3,(f,n,line)
        if p[0].endswith('：'):
            p[1]=p[1].rstrip()+' '; p[2]=p[2].rstrip()+' '
        ui[p[0]]=[p[1],p[2]]
keys=[l.rstrip('\n') for l in open(os.path.join(HERE,'ui-keys.txt')) if not l.startswith('###')]
keys=[k for k in keys if CJK.search(k) and not k.startswith(('/*','//')) and '.test(' not in k]
data=json.load(open(os.path.join(ROOT,'src','i18n','data-dict.json')))
missing=[k for k in keys if k not in ui and k not in data]
unknown=[k for k in ui if k not in keys]
print('ui',len(ui),'keys',len(keys),'missing',len(missing),'unknown(not in extracted keys)',len(unknown))
print('\n'.join('  untranslated: '+m for m in missing))
# placeholder count check
for k,(vi,en) in ui.items():
    n=k.count('{}')
    for t in (vi,en):
        m=len(re.findall(r'\{\d?\}',t))
        if m!=n: print('PLACEHOLDER MISMATCH',k,'|',t)
json.dump(ui,open(os.path.join(ROOT,'src','i18n','ui-dict.json'),'w'),ensure_ascii=False,indent=0,sort_keys=True)
