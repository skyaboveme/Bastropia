# News story format

Stories live in `src/content/news/` as `.md` or `.mdx`. The story page turns the top of the story into an infographic: headline, dek, photo, then a grid of stat cards, then the article in a narrow column. Put `stats` on every story that has a count, dollar figure, percent, or date worth pulling out. Use only figures that are already in the story. Do not calculate a new number.

`keyFacts` still belongs on the story. Those sentences are the NewsArticle abstract. If `stats` is omitted, the page builds the cards from `keyFacts` instead.

## Frontmatter

```yaml
---
title: "Headline"
description: "Dek. One or two sentences."
pubDate: 2026-11-22T06:00:00-06:00
# updated: 2026-11-23T09:00:00-06:00 # set when a fact is corrected. The page shows Updated.
place: Bastrop County
author: ben-caxton # optional. Omit it and bastropia-daily-* is Michael Smith; every other story is Ben Caxton.
keyFacts:
  - "One sentence a reader can use without the rest of the story."
stats:
  - value: "1,590"
    label: "local Starlink workers"
    note: "SpaceX told county commissioners in May 2026."
    source: "Elgin Courier"
  - value: "$338.2 million"
    label: "taxable value in 2025"
    note: "2.2% of the county total."
    source: "Bastrop County FY2025 financial report"
  - value: "Feb. 2, 2026"
    label: "xAI merged into SpaceX"
    note: "Now SpaceXAI. X is part of it."
sourceUrl: https://example.com/story
sourceLabel: Elgin Courier
image: /images/news/<slug>.jpg
imageAlt: "What the photo shows."
imageCredit: "Photo credit and license."
tags:
  - business
---
```

## `stats`

`stats` is an optional list of up to 8 cards. Each card has:

| Field | Required | What to write |
|---|---|---|
| `value` | yes | The big figure, copied from the story. A count (`1,590`), money (`$338.2 million`), percent (`2.2%`), date (`Feb. 2, 2026`), or a short fact with no number (`Travis County`). |
| `label` | yes | A few words under the figure. `local Starlink workers`, not a full sentence. |
| `note` | no | One line of context. Another figure from the same sentence can live here. |
| `source` | no | The publication or document the figure comes from. A name, not a sentence. |

Quote any value that contains `:`, `$`, or `%`.

A fact with no number can still be a card. Use the short phrase as `value` and the rest as `label`, the way the Musk story uses `Travis County` / `Giga Texas and Neuralink`.

When `stats` is absent, the page reads `keyFacts` and pulls the leading money amount, percent, count, or date out of each sentence. A fact with no number becomes a short chip. That fallback is a backup. Hand-written `stats` are the version to ship.

## Body

Write short paragraphs. A line that is only bold (`**First, the names**`) becomes a subhead. `**What's next**`, `**Timeline**`, and `**At a glance**` followed by a list render as a timeline. `**Sources**` followed by a list stays at the bottom in smaller type.

A blockquote is a pull quote:

```md
> The plant employs 1,590 people.
```

An in-body number or a side note still uses `StatBox` in an `.mdx` file. `variant="note"` is the side callout. The header cards replace the old single stat box at the top of the story, so don't repeat the same figure in both places. See the comment at the top of `src/components/StatBox.astro`.

Photos: [sources/image-guide.md](sources/image-guide.md).
