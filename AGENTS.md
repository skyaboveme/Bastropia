## Publish

When the user says publish, the order is local, then GitHub, then Cloudflare.

1. Commit the work on `main`.
2. Push that commit to `origin/main`.
3. Deploy that same commit with `npm run deploy`.

Do not deploy from a bot branch or from a copy of the repo that is behind this folder. A push to `main` is the copy Cloudflare should be running.

Grokbot may update live information: new events, news, court notes, and Bastropia Social items. Those changes belong in `src/content/` and `public/images/`. Merge that pull request into `main`, then deploy. Do not let a bot branch replace `main`. A bot change that edits the header, homepage, or other shared code waits for review, because deploying that branch would remove pages that exist only on `main`.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
