"""Build src/i18n/data-dict.json (zh -> [vi, en]) for every dataset label.
Manual tables win; everything else is composed from the glossary."""
import json,re,sys,os
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE)
import seg
ROOT=os.path.abspath(os.path.join(HERE,'..','..'))
D=os.path.join(ROOT,'data')+'/'
M={}
for f in sorted(os.listdir(os.path.join(HERE,'manual'))):
    for line in open(os.path.join(HERE,'manual',f)):
        if not line.strip(): continue
        zh,en,vi=line.rstrip('\n').split('\t')
        M[zh]=(vi,en)
CJK=re.compile(r'[\u3040-\u30ff\u3400-\u9fff]')
def atom(s):
    if s in M: return M[s]
    if not CJK.search(s): return (s,s)
    c=seg.compose(s)
    if c is None: return None
    en,vi=c
    return (vi,en)
def top_split(s):
    parts=[];buf='';depth=0
    for ch in s:
        if ch in '（(': depth+=1
        if ch in '）)': depth-=1
        if depth==0 and ch in '・·、':
            parts.append(buf.strip()); parts.append(ch); buf=''
        else: buf+=ch
    parts.append(buf.strip()); return parts
def inner(s):
    if s in M: return M[s]
    m=re.fullmatch(r'(.+?)[（(](.+)[）)]',s)
    if m:
        a=inner(m.group(1)); b=phrase(m.group(2),', ',cap=False)
        if a and b: return (a[0]+' ('+b[0]+')', a[1]+' ('+b[1]+')')
        return None
    if '×' in s:
        ps=[inner(p) for p in s.split('×')]
        if all(ps): return (' × '.join(p[0] for p in ps),' × '.join(p[1] for p in ps))
        return None
    return atom(s)
def cap(x): return x[:1].upper()+x[1:]
def phrase(s,sep,cap_=True,cap=True):
    if s in M: return M[s]
    vi=[];en=[]
    for p in top_split(s):
        if p in ('・','·','、'): vi.append(sep);en.append(sep);continue
        if not p: continue
        a=inner(p)
        if a is None: return None
        vi.append(a[0]);en.append(a[1])
    v=''.join(vi).strip(); e=''.join(en).strip()
    return (cap and globals()['cap'](v) or v, cap and globals()['cap'](e) or e) if cap else (v,e)
out={}; miss=[]
def add(s,sep=', '):
    if not s or not CJK.search(s) or s in out: return
    r=phrase(s,sep)
    if r is None: miss.append(s); return
    out[s]=list(r)
for f in ['pose-zh.json']:
    for it in json.load(open(D+f)):
        for k in ['体系','分类','姿势名称','角度']: add(it.get(k),' · ')
for f in ['costume-zh.json','costume-anime-zh.json','costume-gia-anime-zh.json','costume-shisei-zh.json']:
    for it in json.load(open(D+f)):
        for k in ['一级分类','分类','来源']: add(it.get(k),' · ')
        add(it['服装名称'],' · ' if it.get('source')=='shisei' else ', ')
        for t in it.get('标签',[]): add(t)
for it in json.load(open(D+'portrait-zh.json')):
    for k in ['分区','发长','发型名称','标题']: add(it.get(k),' · ')
for k,v in M.items(): add(k,' · ')
print('entries',len(out),'missing',len(miss),sorted(set(miss))[:30])
if miss: sys.exit(1)
json.dump(out,open(os.path.join(ROOT,'src','i18n','data-dict.json'),'w'),ensure_ascii=False,indent=0,sort_keys=True)
