# Bhavini Malhotra — portfolio

Personal portfolio for Bhavini Malhotra, Sales & Operations Executive at F1Jobs.io in Bangalore. It is laid out like a streaming app: her roles are series, her education is films, her proof numbers are a Top 10, and her career is a TV guide.

**Not affiliated with Amazon, Prime Video or IMDb.** This is an independent homage. It never uses Amazon's logos, fonts, sounds, artwork or feature names (`tests/brand-guard.test.ts` checks it), and every page says so.

## What's in it

| Screen                                                                | Route                                                      |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| "Who's visiting?" profile picker, then the intro ident                | `/`, first visit of a session                              |
| Home: hero carousel, Continue watching, Top 10, rows, Browse by skill | `/`                                                        |
| Title pages: hero, Episodes / Related / Details tabs, closing rows    | `/title/<slug>/`                                           |
| Player with Skip intro, Next up and "Behind the scenes"               | `/watch/<slug>/`                                           |
| Search drop-down and results page                                     | nav search, `/search/?q=`                                  |
| Categories, skill pages and featured collections                      | `/skills/`, `/skills/<slug>/`, `/skills/collections/<id>/` |
| Career Guide (a Live TV-style timeline)                               | `/career-guide/`                                           |
| Contact storefront                                                    | `/contact/`                                                |
| My List                                                               | `/my-list/`                                                |

Built with Astro (static, no server), TypeScript, native web platform features (popover, dialog, view transitions, Web Audio) and very little JavaScript: under 10 KB gzipped on any page.

## Run it

Needs Node 22.22 or later (CI uses Node 24).

```bash
npm ci
```

```bash
npm run dev
```

Opens the dev server on http://localhost:4427. `npm run dev` and `npm run build` first run `npm run art`, which draws the key art, cards, episode stills and title lettering into `src/assets/art/generated/`. That folder is git-ignored and skipped when unchanged.

```bash
npm run build
```

```bash
npm run preview
```

`build` writes the static site to `dist/`, and `preview` serves it on port 4427.

## Check it

| Command                | What it runs                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`         | ESLint, including strict accessibility rules for `.astro` files                                                                       |
| `npm run type-check`   | `astro check`                                                                                                                         |
| `npm run format:check` | Prettier                                                                                                                              |
| `npm test`             | Vitest: unit tests for `src/lib/` (100% coverage, 80% required), plus guards for brand, contact privacy, contrast and trailer figures |
| `npm run test:e2e`     | Playwright on five devices (iPhone 15, Pixel 8, iPad, 1280 and 1440 desktops), including axe on every route                           |
| `npm run lighthouse`   | Lighthouse CI budgets: LCP ≤ 2.5 s, CLS ≤ 0.1, performance ≥ 0.9, accessibility 1.0                                                   |

CI (`.github/workflows/ci.yml`) runs quality, then test, then build on every push and pull request. The build job also scans `dist/` with the brand guard and the JavaScript budget, then runs Lighthouse.

More detail:

- `docs/a11y.md`: the WCAG 2.2 AA audit and a keyboard walkthrough of every screen.
- `docs/fidelity.md`: the side-by-side token review against primevideo.com.

## Change the content

Everything she has done lives in `src/content/` and is validated by Zod schemas (`src/lib/catalog-schema.ts`) and cross-checks (`checkCatalog` in `src/lib/catalog.ts`):

| File                                 | What it holds                                                           |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `titles/*.json`                      | One file per role or course: synopsis, episodes, skills, figures        |
| `figures.json`                       | Every number the site shows; `verified: true` once she has confirmed it |
| `skills.json`, `certifications.json` | Categories and certificates                                             |
| `rows.json`                          | The home page rows, in order                                            |
| `timeline.json`                      | The Career Guide's tracks and entries                                   |

`REQUIRE_VERIFIED=1 npm run build` refuses any figure that isn't confirmed. Use it for the public deploy.

The trailers are rendered with HyperFrames. To change one, see `media/trailers/README.md`. Every number on screen must be one of her confirmed figures; `tests/trailers.test.ts` checks it.

## Privacy

Her email address and phone number are public on the site (her choice). They are never written in plain text in this repository, its HTML or its JavaScript:

- They're stored reversed and base64-encoded (`src/lib/contact.ts`) and decoded only in the visitor's browser.
- `tests/contact-privacy.test.ts` fails if either appears in `src/`, `public/` or `dist/`.

Never paste them in plain text into code, comments or content.

## Deploy

GitHub Pages, by hand only: `.github/workflows/deploy.yml` runs from the Actions tab (Run workflow) and nowhere else.

- It refuses any branch but `main` and any commit whose CI run didn't pass.
- It builds the public site with `REQUIRE_VERIFIED=1`, the right `BASE_PATH` and `SITE_URL`, and scans it with the brand and privacy guards.
- It publishes the site, then runs `tests/e2e/deployed.spec.ts` against the live URL.

Before the first run:

1. In the repository settings, under Pages, set the source to **GitHub Actions**.
2. Keep every figure in `src/content/figures.json` confirmed (`"verified": true`; all are today). The public build refuses any she hasn't confirmed.

The project page lives at `https://archit2501.github.io/bhavini-prime-portfolio/`. Every internal link goes through `withBase` (`src/lib/url.ts`), so the base path is respected everywhere. To rehearse it locally:

```bash
BASE_PATH=/bhavini-prime-portfolio/ npm run build
```

```bash
BASE_PATH=/bhavini-prime-portfolio/ npx astro preview --port 4433
```

```bash
DEPLOYED_URL=http://localhost:4433/bhavini-prime-portfolio/ npx playwright test --project=desktop
```

## Licence

- **The code** is MIT licensed (`LICENSE`).
- **Bhavini Malhotra's content is not open source** and isn't covered by that licence: her name, resume, career details, figures (`src/content/`, `public/bhavini-malhotra-resume.pdf`), and the art, trailers and captions made from them. All rights reserved.
- **Fonts** are under the SIL Open Font Licence; the licences are in `scripts/art/fonts/` and the `@fontsource` packages.
  - Inter is the site's typeface.
  - Archivo, Inter and Playfair Display outlines are used for the title lettering.
