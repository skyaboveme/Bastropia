#!/usr/bin/env python3
"""Make branded Bastropia news share cards in the Facebook story style."""

from __future__ import annotations

import re
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
NEWS_DIR = ROOT / 'src' / 'content' / 'news'
OUT_DIR = ROOT / 'public' / 'images' / 'news'
LOGO = ROOT / 'public' / 'brand' / 'logo-masthead.png'
AERIAL = ROOT / 'public' / 'images' / 'bastrop-aerial.jpg'

PINE = (16, 40, 31)
PINE_MID = (14, 74, 60)
CREAM = (251, 250, 246)
INK = (20, 26, 23)
SOFT = (85, 98, 91)
SUN = (240, 180, 41)
WHITE = (255, 255, 255)

SIZE = (1200, 1200)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
  candidates = [
    '/System/Library/Fonts/Supplemental/Georgia Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Georgia.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/Library/Fonts/Arial Bold.ttf' if bold else '/Library/Fonts/Arial.ttf',
  ]
  for path in candidates:
    try:
      return ImageFont.truetype(path, size)
    except OSError:
      continue
  return ImageFont.load_default()


def parse_frontmatter(path: Path) -> dict[str, str]:
  text = path.read_text()
  if not text.startswith('---'):
    return {}
  block = text.split('---', 2)[1]
  data: dict[str, str] = {}
  for line in block.strip().splitlines():
    if ':' not in line:
      continue
    key, value = line.split(':', 1)
    data[key.strip()] = value.strip().strip('"').strip("'")
  return data


def wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
  words = text.split()
  lines: list[str] = []
  current = ''
  for word in words:
    trial = f'{current} {word}'.strip()
    if draw.textlength(trial, font=font) <= max_width:
      current = trial
    else:
      if current:
        lines.append(current)
      current = word
  if current:
    lines.append(current)
  return lines[:5]


def make_card(title: str, place: str, badge: str, out: Path) -> None:
  img = Image.new('RGB', SIZE, CREAM)
  draw = ImageDraw.Draw(img)

  # Photo band from aerial, darkened
  if AERIAL.exists():
    photo = Image.open(AERIAL).convert('RGB')
    photo = photo.resize((1200, 560), Image.Resampling.LANCZOS)
    overlay = Image.new('RGB', photo.size, PINE)
    photo = Image.blend(photo, overlay, 0.35)
    img.paste(photo, (0, 260))
  else:
    draw.rectangle((0, 260, 1200, 820), fill=PINE_MID)

  # Footer
  draw.rectangle((0, 820, 1200, 1200), fill=PINE)

  # Badge
  badge_font = load_font(28, bold=True)
  badge_text = badge.upper()
  bw = draw.textlength(badge_text, font=badge_font) + 48
  draw.rounded_rectangle((48, 48, 48 + bw, 104), radius=28, fill=SUN)
  draw.text((72, 62), badge_text, fill=INK, font=badge_font)

  # Logo
  if LOGO.exists():
    logo = Image.open(LOGO).convert('RGBA')
    logo.thumbnail((140, 150), Image.Resampling.LANCZOS)
    img.paste(logo, (1020, 36), logo)

  title_font = load_font(64, bold=True)
  lines = wrap(draw, title, title_font, 1040)
  y = 300
  for line in lines:
    draw.text((80, y), line, fill=WHITE, font=title_font)
    y += 78

  place_font = load_font(36, bold=True)
  draw.text((80, 700), place.upper(), fill=SUN, font=place_font)

  footer_font = load_font(42, bold=True)
  draw.text((80, 920), 'Read the story at Bastropia.com', fill=WHITE, font=footer_font)
  meta_font = load_font(30)
  draw.text((80, 1000), 'Bastrop County news · events · local desk', fill=(200, 220, 210), font=meta_font)

  # Corner pines (simple triangles)
  for x in (40, 1080):
    draw.polygon([(x, 1180), (x + 40, 1080), (x + 80, 1180)], fill=PINE_MID)

  out.parent.mkdir(parents=True, exist_ok=True)
  img.save(out, 'JPEG', quality=88, optimize=True)


def slug_image_name(slug: str) -> str:
  return re.sub(r'[^a-z0-9-]+', '-', slug.lower()).strip('-') + '.jpg'


def main() -> None:
  updated = 0
  for path in sorted(NEWS_DIR.glob('*.md')):
    data = parse_frontmatter(path)
    if not data.get('title'):
      continue
    if data.get('image'):
      continue
    slug = path.stem
    image_name = slug_image_name(slug)
    out = OUT_DIR / image_name
    place = data.get('place', 'Bastrop County')
    badge = 'Local news' if place != 'Countywide' else 'Countywide'
    make_card(data['title'], place, badge, out)
    text = path.read_text()
    # Insert image after place line in frontmatter
    if 'image:' not in text.split('---', 2)[1]:
      text = text.replace(
        f"place: {data['place']}\n",
        f"place: {data['place']}\nimage: /images/news/{image_name}\n",
        1,
      )
      path.write_text(text)
      updated += 1
      print(f'wrote {out.name} → {path.name}')
  # Refresh Care-A-Van from the Facebook master if present
  fb = Path.home() / 'Downloads' / 'facebook-care-a-van.png'
  care = OUT_DIR / 'care-a-van-lost-pines.jpg'
  if fb.exists():
    Image.open(fb).convert('RGB').resize((1200, 1200), Image.Resampling.LANCZOS).save(
      care, 'JPEG', quality=88, optimize=True
    )
    print(f'refreshed {care.name} from Facebook master')
  print(f'done: {updated} stories')


if __name__ == '__main__':
  main()
