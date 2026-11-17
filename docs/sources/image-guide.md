# News article images

Use this when adding a photo to a Bastropia news story. Every new article should have an image of the story’s focus when a properly licensed photo can be found. If none is available, publish the story without an image and note the miss; do not use an unlicensed photo.

## Where files go

- Put the image in the Bastropia repo at `public/images/news/<slug>.<ext>`.
- `<slug>` must match the article filename, without `.md` or `.mdx`. Example: `src/content/news/whataburger-bastrop-reopens-dec-8-sh-71.mdx` → `public/images/news/whataburger-bastrop-reopens-dec-8-sh-71.jpg`.
- Prefer `.jpg`. `.webp` is also fine. Do not use PNG unless the image needs transparency.
- The live URL is `https://bastropia.com/images/news/<slug>.jpg`. In frontmatter, use the site-root path, not a GitHub or Wikimedia URL.

## Frontmatter

The news collection already has an optional `image` field. Also set `imageAlt` and `imageCredit` whenever there is an image.

```yaml
image: /images/news/whataburger-bastrop-reopens-dec-8-sh-71.jpg
imageAlt: "A modern Whataburger restaurant with orange trim, stone accents, and a roadside Whataburger sign under a clear sky. This is a representative photo of the chain, not the Bastrop location."
imageCredit: "Photo by G. Edward Johnson via Wikimedia Commons (CC BY 4.0). A Whataburger in Tulsa, Oklahoma, used to show the chain's current building design; it is not the Bastrop restaurant. Image resized from the original."
```

- `image` is a root-relative path under `/images/news/`. Do not hotlink an external URL.
- `imageAlt` describes what is actually in the photograph. If the photo is not of the Bastrop County place in the story, say so in the alt text.
- `imageCredit` is the short line shown under the hero. Name the photographer or source, the license, and any important caveat (for example, that it is a representative photo). If you cropped or resized the original, say so.
- Quote values that contain colons, apostrophes, or other YAML punctuation.
- Older stories may have only `image`. That still works; alt falls back to the headline, and no credit line is shown. New stories should include all three fields.
- Omit all three fields rather than inventing a credit or leaving `image` pointing at a missing file.

The article page renders the photo as a hero under the lede, uses `image` for `og:image` and `twitter:image`, and uses `imageAlt` for the `img` alt and `og:image:alt`. Home and news list cards are still text-only and do not show thumbnails.

## Size

- About 1600px wide. Height can follow the photo; 16:9 or about 2:1 works well as a hero.
- Keep the file under 300KB. A quality-80–85 JPEG is usually enough.
- Do not upscale a small original.
- Do not commit the full-resolution camera file.

## Licensing rules

Search in this order, and stop at the first usable photo of the story’s focus:

1. A freely licensed or public-domain photo: Wikimedia Commons, government / official public-information sources, Unsplash, or Pexels. A photo of the exact Bastrop County place is best. A clearly labeled representative photo (for example, another Whataburger of the current building design) is acceptable when no local photo is available.
2. An official press or media image that is explicitly offered for media use (for example, a company newsroom photo with a stated media license). Keep a record of that permission.

Do **not**:

- Copy or hotlink photos from news outlets (KXAN, the Statesman, Community Impact, and similar).
- Copy or hotlink photos from Facebook, Instagram, Nextdoor, or other social media.
- Use a screenshot of someone else’s story or a still from a TV report.
- Use a logo, map pin, or decorative stock image as a stand-in when the story has a real-world subject.

If you cannot find a properly licensed image, leave the image fields off and mention that in the delivery note. Never use an unlicensed photo.

## Credit format

Keep the on-page credit to one or two short sentences:

`Photo by <name> via <source> (<license>). <Where and what it shows, plus any caveat>. <“Image cropped and resized” if you changed it>.`

Examples:

- `Photo by G. Edward Johnson via Wikimedia Commons (CC BY 4.0). A Whataburger in Tulsa, Oklahoma, used to show the chain's current building design; it is not the Bastrop restaurant. Image resized from the original.`
- `Photo by the City of Bastrop, public domain.`
- `Photo by Jane Perez / Unsplash.`

Record the source page, license, author, and original filename in the pull request or daily notes so the credit can be checked later.

## Checklist

- [ ] Licensed source confirmed; license and author recorded
- [ ] File at `public/images/news/<slug>.jpg`, about 1600px wide and under 300KB
- [ ] Frontmatter has `image`, `imageAlt`, and `imageCredit`
- [ ] Alt text and credit are accurate about what the photo actually shows
