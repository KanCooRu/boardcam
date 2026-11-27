"""GPT 그림 자가 검사 (A13~A19).

사용법(게임 폴더에서):
    python3 tools/check-gpt-art.py            모든 카드 검사
    python3 tools/check-gpt-art.py A15        한 카드만 검사

각 파일의 크기, 투명 배경, 대칭, 9조각 규칙(모서리 밖 변이 고른지, 가운데가 평평한지),
곡괭이 기준점을 확인하고, 카드가 모두 통과하면 켜도 되는 스위치를 알려 줍니다.
그림을 고치지는 않습니다.
"""
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
A = ROOT / 'dist/client/assets'

# name, size, checks
CARDS = {
 'A13': ('BATTLE_UI_ART', [
   ('battle-ui/route-boss.webp', (128,128), ['alpha','round','symmetric']),
   ('battle-ui/boss-medal.webp', (160,160), ['alpha','round','symmetric','hollow']),
   ('battle-ui/boss-frame.webp', (384,128), ['alpha','slice28'])]),
 'A14': ('COMBAT_FX_ART', [
   ('combat-fx/crit-burst.webp', (256,256), ['alpha','round','not_black'])]),
 'A15': ('MINE_ART', [
   ('star-mine/pick-hand.webp', (380,380), ['alpha','pick_anchor']),
   ('star-mine/ore-node-0.webp', (256,256), ['alpha','round']),
   ('star-mine/ore-node-1.webp', (256,256), ['alpha','round','same_place:star-mine/ore-node-0.webp']),
   ('star-mine/ore-node-2.webp', (256,256), ['alpha','round','same_place:star-mine/ore-node-0.webp']),
   ('star-mine/ore-node-3.webp', (256,256), ['alpha','round','same_place:star-mine/ore-node-0.webp']),
   ('star-mine/gem.webp', (96,96), ['alpha','round'])]),
 'A16': ('BOSS_INTRO_ART', [
   ('battle-ui/boss-warning.webp', (1024,256), ['alpha','symmetric_loose','dark_center'])]),
 'A17~A19': ('UI_KIT_ART', [
   ('ui-kit/btn-gold.webp', (192,72), ['alpha','slice24']),
   ('ui-kit/btn-purple.webp', (192,72), ['alpha','slice24']),
   ('ui-kit/panel-frame.webp', (256,256), ['alpha','slice48']),
   ('ui-kit/divider.webp', (512,48), ['alpha','symmetric_loose']),
   ('ui-kit/nav-glow.webp', (160,48), ['alpha','symmetric_loose'])]),
}

def alpha(im): return im.getchannel('A')

def symmetry_error(im):
    a = im.convert('RGBA'); m = a.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    diff = ImageChops.difference(alpha(a), alpha(m))
    return ImageStat.Stat(diff).mean[0] / 255

def band_uniform(im, box, axis):
    """How much a band changes along its length (0 = identical everywhere)."""
    band = im.crop(box).convert('RGBA')
    w, h = band.size
    if axis == 'x':
        cols = [band.crop((x, 0, x+1, h)) for x in range(0, w, max(1, w//12))]
    else:
        cols = [band.crop((0, y, w, y+1)) for y in range(0, h, max(1, h//12))]
    base = cols[0]
    return max(ImageStat.Stat(ImageChops.difference(c, base)).mean[0] / 255 for c in cols[1:]) if len(cols) > 1 else 0

def check(path, size, rules):
    out = []
    f = A / path
    if not f.exists(): return [f'없음: {path}']
    im = Image.open(f)
    if f.suffix != '.webp': out.append('webp가 아님')
    if im.size != size: out.append(f'크기 {im.size[0]}×{im.size[1]} (필요 {size[0]}×{size[1]})')
    if im.mode not in ('RGBA', 'LA'): out.append('투명 채널(알파)이 없음 - 배경이 투명하지 않습니다'); return out
    a = alpha(im); w, h = im.size
    for rule in rules:
        if rule == 'alpha':
            corners = [a.getpixel((0,0)), a.getpixel((w-1,0)), a.getpixel((0,h-1)), a.getpixel((w-1,h-1))]
            if 'slice' not in ' '.join(rules) and max(corners) > 20: out.append('네 귀퉁이가 투명하지 않음(배경이 남아 있음)')
        elif rule == 'round':
            ring = [a.getpixel((x, y)) for x, y in [(2,h//2),(w-3,h//2),(w//2,2),(w//2,h-3)]]
            if max(ring) > 200: out.append('그림이 가장자리에 닿음 - 둘레에 여백을 주세요')
        elif rule == 'symmetric':
            e = symmetry_error(im)
            if e > 0.06: out.append(f'좌우 대칭이 아님(차이 {e:.2f}, 0.06 이하여야 함)')
        elif rule == 'symmetric_loose':
            e = symmetry_error(im)
            if e > 0.12: out.append(f'좌우 균형이 크게 어긋남(차이 {e:.2f})')
        elif rule == 'hollow':
            c = a.crop((int(w*.3), int(h*.3), int(w*.7), int(h*.7)))
            if ImageStat.Stat(c).mean[0] > 25: out.append('고리 안쪽이 투명하지 않음 - 가운데를 비워 주세요')
        elif rule == 'not_black':
            rgb = im.convert('RGB'); lum = ImageStat.Stat(rgb.convert('L'), mask=a.point(lambda v: 255 if v > 30 else 0)).mean[0]
            if lum < 60: out.append('그림이 너무 어둡습니다(밝게 더해지는 효과라 어두운 부분은 보이지 않습니다)')
        elif rule == 'dark_center':
            c = im.convert('L').crop((int(w*.3), int(h*.35), int(w*.7), int(h*.65)))
            if ImageStat.Stat(c).mean[0] > 110: out.append('가운데가 너무 밝음 - 글씨 자리이므로 어둡게 해 주세요')
        elif rule.startswith('slice'):
            k = int(rule[5:])
            if w <= 2*k or h <= 2*k: out.append(f'모서리 {k}px를 두기엔 그림이 작음'); continue
            top = band_uniform(im, (k, 0, w-k, k), 'x'); bottom = band_uniform(im, (k, h-k, w-k, h), 'x')
            left = band_uniform(im, (0, k, k, h-k), 'y'); right = band_uniform(im, (w-k, k, w, h-k), 'y')
            worst = max(top, bottom, left, right)
            if worst > 0.10: out.append(f'모서리 {k}px 밖의 변에 장식이 있음(변화 {worst:.2f}) - 장식은 모서리 안에만')
            centre = im.convert('RGB').crop((k, k, w-k, h-k))
            if ImageStat.Stat(centre).stddev[0] > 28: out.append('가운데에 무늬가 있음 - 고르게 칠해 주세요')
            if ImageStat.Stat(alpha(im).crop((k, k, w-k, h-k))).mean[0] < 120: out.append('가운데가 너무 투명함 - 판을 채워 주세요')
        elif rule == 'pick_anchor':
            tip = max(a.getpixel((x, y)) for x in range(368, 380) for y in range(146, 159))
            grip = max(a.getpixel((x, y)) for x in range(44, 63) for y in range(325, 344))
            if tip < 120: out.append('곡괭이 날 끝이 (375,152)에 없음')
            if grip < 120: out.append('손잡이(손)가 (53,334)에 없음')
        elif rule.startswith('same_place:'):
            other = A / rule.split(':', 1)[1]
            if other.exists():
                b1 = alpha(Image.open(other).convert('RGBA')).point(lambda v: 255 if v > 40 else 0).getbbox()
                b2 = a.point(lambda v: 255 if v > 40 else 0).getbbox()
                if b1 and b2 and max(abs(p - q) for p, q in zip(b1, b2)) > 14: out.append(f'0단계와 위치·크기가 다름 {b2} / {b1}')
    return out

def main():
    only = sys.argv[1:]
    ready = []
    for card, (switch, files) in CARDS.items():
        if only and card not in only: continue
        print(f'\n[{card}] 스위치 {switch}')
        ok = True
        for path, size, rules in files:
            problems = check(path, size, rules)
            print(('  통과  ' if not problems else '  고칠것 ') + path + ('' if not problems else ' → ' + ' / '.join(problems)))
            ok = ok and not problems
        if ok: ready.append(switch)
    print('\n켜도 되는 스위치: ' + (', '.join(ready) if ready else '아직 없음'))

if __name__ == '__main__':
    main()
