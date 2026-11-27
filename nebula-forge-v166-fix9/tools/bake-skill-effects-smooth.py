"""Smoother skill films: 36 cels (6x6) instead of 16, with in-between source frames blended.

The recipes, source paintings, pivots and floor projection all come from bake-skill-effects.py.
Two things change:
  * each layer's painted frame is a blend of the two nearest source frames instead of a hard step,
    so the flame, ice or lightning shape morphs instead of jumping between a few drawings;
  * the film is sampled at 36 moments and plays about 1.4 times longer, so the eye sees the motion.
Outputs sit beside the 16-cel originals (which the optional Unity renderer still reads):
  assets/skill-casts/<name>.s36.webp  960x960   (6x6 cels of 160px)
  assets/skill-casts/<name>.s36.avif  1920x1920 (6x6 cels of 320px)
and skill-films.js gains a sixth column, the cel count (36).

Usage:  python3 tools/bake-skill-effects-smooth.py            all 60 skills
        python3 tools/bake-skill-effects-smooth.py fireball   one skill, for a quick look
"""
import importlib.util, json, sys
from math import sin, cos, pi, radians
from pathlib import Path
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('bake16', HERE / 'bake-skill-effects.py')
base = importlib.util.module_from_spec(spec); spec.loader.exec_module(base)

CELS, GRID = 36, 6
LIFE_SCALE = 1.4
CELL, HD_CELL, OUT = base.CELL, base.HD_CELL, base.OUT

def blended(art, f, tint):
    """Source painting at a fractional frame index: a premultiplied blend of its two neighbours."""
    i = int(f); frac = f - i
    a = base.source(art, i, 0, tint)
    if frac < 0.02: return a
    b = base.source(art, min(15, i + 1), 0, tint)
    if b.size != a.size: b = b.resize(a.size, Image.Resampling.LANCZOS)
    return Image.blend(a.convert('RGBa'), b.convert('RGBa'), frac).convert('RGBA')

def draw(canvas, spec, t, k, samples=1):
    art,width,start,end,angle0,turn,dx,dy,(vx,vy),tint,opacity,flip,(sx,sy),(first,last)=spec
    u=(t-start)/(end-start)
    if not 0<=u<=1: return
    phase=min(1,.12+.88*u)
    peak=sin(pi*u/2)
    if art=='crest':
        phase=min(3,phase*3.6); ix=int(phase)
        a=base.source(art,ix,k,tint); b=base.source(art,min(3,ix+1),k,tint)
        im=Image.blend(a.convert('RGBa'),b.resize(a.size,Image.Resampling.LANCZOS).convert('RGBa'),phase-ix).convert('RGBA')
        px,py=[v/100 for v in base.SIGNATURE[k]]
    else:
        im=blended(art, min(last, first+phase*(last-first)), tint)
        px,py=base.PIVOTS[art]
        if k in base.FLOOR_IDS and art in base.FLOOR_PIVOTS:
            xrow,yrow=base.FLOOR_PIVOTS[art]; px,py=xrow/160,yrow/160
    size=round(samples*width*(.83+.17*peak))
    w=max(1,round(size*sx)); h=max(1,round(size*sy*im.height/im.width))
    im=im.resize((w,h),Image.Resampling.LANCZOS)
    if flip: im=ImageOps.mirror(im); px=1-px
    # A slower tail: the last fifth fades instead of the last tenth.
    alpha=opacity*min(1,(1-u)*4.2+.02)
    im.putalpha(im.getchannel('A').point(lambda a:round(max(0,a-3)*alpha)))
    angle=angle0+turn*peak
    if angle: im=im.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
    ax=(px-.5)*w; ay=(py-.5)*h; theta=radians(angle)
    x=canvas.width/2+samples*(dx+vx*u)-(cos(theta)*ax+sin(theta)*ay)
    y=canvas.height/2+samples*(dy+vy*u)-(-sin(theta)*ax+cos(theta)*ay)
    canvas.alpha_composite(im,(round(x-im.width/2),round(y-im.height/2)))

def render(k, layers, frame, samples):
    side=512*samples; im=Image.new('RGBA',(side,side))
    for spec in layers: draw(im, spec, (frame+.30)/CELS, k, samples)
    return base.project_foreground(im, samples) if k in base.FLOOR_IDS else im

def bake(k, recipe):
    name,span,life,layers=recipe
    frames=[render(k,layers,f,1) for f in range(CELS)]
    bounds=[b for im in frames if (b:=im.getchannel('A').point(lambda a:255 if a>6 else 0).getbbox())]
    left=min(b[0] for b in bounds); right=max(b[2] for b in bounds)
    top=min(b[1] for b in bounds); bottom=max(b[3] for b in bounds)
    size=max(right-left,bottom-top)+8
    left=(left+right-size)//2; top=(top+bottom-size)//2
    out=Image.new('RGBA',(GRID*CELL,GRID*CELL)); hd=Image.new('RGBA',(GRID*HD_CELL,GRID*HD_CELL))
    hd_crop=(left*2,top*2,(left+size)*2,(top+size)*2)
    for f,im in enumerate(frames):
        cell=im.crop((left,top,left+size,top+size)).resize((CELL,CELL),Image.Resampling.LANCZOS)
        out.paste(cell,(f%GRID*CELL,f//GRID*CELL))
        detail=render(k,layers,f,2).crop(hd_crop).resize((HD_CELL,HD_CELL),Image.Resampling.LANCZOS)
        hd.paste(detail,(f%GRID*HD_CELL,f//GRID*HD_CELL))
    out.save(OUT/(name+'.s36.webp'),quality=76,method=4,alpha_quality=78)
    hd.save(OUT/(name+'.s36.avif'),quality=58,speed=7,max_threads=2)
    return [name,span,round(life*LIFE_SCALE),round((256-left)/size,4),round((256-top)/size,4),CELS]

if __name__=='__main__':
    only=sys.argv[1:]
    assert len(base.CASTS)==60
    if only:
        for k,recipe in enumerate(base.CASTS):
            if recipe[0] in only: print(bake(k,recipe))
        sys.exit(0)
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=4) as workers: meta=list(workers.map(bake,range(60),base.CASTS))
    films=base.CLIENT/'skill-films.js'
    text=films.read_text()
    ripple=text[text.index('const PIERCE_RIPPLE_FILM='):]
    films.write_text('// Generated by tools/bake-skill-effects-smooth.py. URL stem, width fraction, milliseconds, contact x/y, cel count.\n'
        '// A cel count of 36 means assets/skill-casts/<stem>.s36.(avif|webp) on a 6x6 grid; 16 means the original 4x4 sheets.\n'
        'const SKILL_FILMS=[\n'+',\n'.join(' '+json.dumps(row,separators=(',',':')) for row in meta)+'\n];\n'+ripple)
