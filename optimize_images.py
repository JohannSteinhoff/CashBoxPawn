#!/usr/bin/env python3
"""One-off image optimizer for the Cash Box Pawn site.

Resizes oversized source photos, strips EXIF, and writes both an optimized
JPEG (fallback) and a WebP (served first via <picture>). Run from the repo root.
"""
import os
from PIL import Image, ImageOps

IMG = os.path.join(os.path.dirname(__file__), "images")

# max display width (px) per image; we only ever downscale
TARGETS = {
    "hero.jpg": 1600,
    "about.jpg": 900,
    "storefront.jpg": 800,
    "service-1.jpg": 800, "service-2.jpg": 800, "service-3.jpg": 800, "service-4.jpg": 800,
}
# all gallery-*.jpg double as lightbox images -> a bit larger
GALLERY_W = 1100

def target_width(name):
    if name in TARGETS:
        return TARGETS[name]
    if name.startswith("gallery-"):
        return GALLERY_W
    return 1000

def process_jpg(name):
    path = os.path.join(IMG, name)
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)          # bake in orientation, drop EXIF
    im = im.convert("RGB")
    w = target_width(name)
    if im.width > w:
        h = round(im.height * w / im.width)
        im = im.resize((w, h), Image.LANCZOS)
    base = os.path.splitext(name)[0]
    before = os.path.getsize(path)
    im.save(path, "JPEG", quality=80, optimize=True, progressive=True)
    webp = os.path.join(IMG, base + ".webp")
    im.save(webp, "WEBP", quality=80, method=6)
    print(f"{name:18} {before//1024:4d}KB -> jpg {os.path.getsize(path)//1024:4d}KB "
          f"/ webp {os.path.getsize(webp)//1024:4d}KB  ({im.width}x{im.height})")

def process_logo():
    path = os.path.join(IMG, "logo.png")
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.width > 120:
        h = round(im.height * 120 / im.width)
        im = im.resize((120, h), Image.LANCZOS)
    before = os.path.getsize(path)
    im.save(path, "PNG", optimize=True)
    im.save(os.path.join(IMG, "logo.webp"), "WEBP", quality=90, method=6)
    print(f"{'logo.png':18} {before//1024:4d}KB -> png {os.path.getsize(path)//1024:4d}KB "
          f"({im.width}x{im.height})")

def process_hero():
    # The hero is the LCP image: keep a jpg fallback plus a responsive set of
    # WebPs so phones download a small file instead of the full-width one.
    src = Image.open(os.path.join(IMG, "hero.jpg"))
    src = ImageOps.exif_transpose(src).convert("RGB")
    if src.width > 1600:
        src = src.resize((1600, round(src.height * 1600 / src.width)), Image.LANCZOS)
    src.save(os.path.join(IMG, "hero.jpg"), "JPEG", quality=80, optimize=True, progressive=True)
    for w in (768, 1200, 1600):
        im = src.resize((w, round(src.height * w / src.width)), Image.LANCZOS) if w < src.width else src
        out = os.path.join(IMG, f"hero-{w}.webp")
        im.save(out, "WEBP", quality=68, method=6)
        print(f"hero-{w}.webp        {os.path.getsize(out)//1024:4d}KB  ({im.width}x{im.height})")

def main():
    for name in sorted(os.listdir(IMG)):
        if name == "hero.jpg":
            continue  # handled separately (responsive set)
        if name.lower().endswith(".jpg"):
            process_jpg(name)
    process_hero()
    process_logo()

if __name__ == "__main__":
    main()
