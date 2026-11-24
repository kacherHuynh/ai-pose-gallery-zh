"""Glossary-based composer for costume names (greedy segmentation into colour /
modifier / noun atoms). EN keeps Chinese modifier order; VI reverses it so the
noun comes first (e.g. 黑色百褶迷你半身裙 -> "black pleated mini skirt" /
"chân váy mini xếp ly đen")."""
import json,re,sys,glob,os
HERE=os.path.dirname(os.path.abspath(__file__))
G={}
for f in sorted(glob.glob(os.path.join(HERE,'glossary','*.tsv'))):
    for line in open(f):
        if not line.strip() or line.startswith('#'): continue
        p=line.rstrip('\n').split('\t')
        if len(p)<4: print('BAD',f,line,file=sys.stderr); continue
        G[p[1]]=(p[0],p[2],p[3])
def seg(s):
    n=len(s); best=[None]*(n+1); best[0]=[]
    for i in range(n):
        if best[i] is None: continue
        for j in range(n,i,-1):
            w=s[i:j]
            if w in G or re.fullmatch(r'[A-Za-z0-9\-\+]+',w):
                cand=best[i]+[w]
                if best[j] is None or len(cand)<len(best[j]): best[j]=cand
    return best[n]
def compose(s):
    if '配' in s and all(seg(p) for p in s.split('配')):
        parts=[compose(p) for p in s.split('配')]
        return ' with '.join(p[0] for p in parts), ' phối '.join(p[1] for p in parts)
    if '与' in s and all(seg(p) for p in s.split('与')):
        parts=[compose(p) for p in s.split('与')]
        return ' & '.join(p[0] for p in parts), ' & '.join(p[1] for p in parts)
    t=seg(s)
    if t is None: return None
    toks=[(G[w] if w in G else ('M',w,w)) for w in t]
    cols=[x for x in toks if x[0]=='C']; rest=[x for x in toks if x[0]!='C']
    en=' '.join(([ '/'.join(c[1] for c in cols)] if cols else [])+[x[1] for x in rest])
    vi_rest=[x[2] for x in reversed(rest)]
    vi=' '.join(vi_rest+([ '/'.join(c[2] for c in cols)] if cols else []))
    if not rest: vi='màu '+vi
    return en.strip(),vi.strip()
