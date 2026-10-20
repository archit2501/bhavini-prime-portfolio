# Fidelity review against primevideo.com

The site follows Prime Video's web UI as closely as an independent homage can (decision Q2). This review compares what the site renders with what was measured on primevideo.com.

**Method**

- The Prime values are the live measurements in `research/04-live-inspection.md`. They were taken on the logged-out India storefront at 1440×900 with `getComputedStyle` and `getBoundingClientRect`.
- The site's values were read the same way from the built site, at 1440×900 in Chromium, on 20 October 2026.
- No screenshots of Prime Video are kept in this repository, because Amazon's imagery isn't ours to publish. The reference stills stay in the local, git-ignored `research/refs/`.

Status: **=** matches; **fixed** was off and is now corrected in this review; **≈** is close, with the difference noted; **deviation** is a deliberate difference, explained below the tables.

## Global and navigation

| Element                | primevideo.com                                                                         | This site                                          | Status    |
| ---------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- | --------- |
| Page background        | `#00050D`                                                                              | `rgb(0, 5, 13)`                                    | =         |
| Body text              | 16px / 24px, 400                                                                       | 16px / 24px, 400                                   | =         |
| Content gutter at 1440 | 72px                                                                                   | 72px (wordmark, hero copy, rows all start at x=72) | =         |
| UI face                | Amazon Ember (proprietary)                                                             | Inter, size-adjusted Arial fallback                | deviation |
| Nav height             | 66px                                                                                   | 66px                                               | =         |
| Nav item               | 16px, 500, 0.64px tracking, padding 0 14px, 42px tall, radius 8                        | the same                                           | =         |
| Active nav item        | `rgba(255,255,255,.2)` + radial glow from the top + `0 -4px 16px rgba(255,255,255,.2)` | the same                                           | =         |
| Scrolled nav bar       | `rgba(25,30,37,.8)`, `blur(16px)`, radius 0 0 12 12, two-layer shadow, inset 51px      | the same; 1338px wide                              | =         |
| Icon buttons           | round, about 39×37                                                                     | round, 40×40                                       | ≈         |
| Footer                 | `#8197A4` text, `#79B8F3` links, 15px                                                  | `rgb(129,151,164)`, `rgb(121,184,243)`, 15px       | =         |

## Home: hero and rows

| Element                  | primevideo.com                                                               | This site                                                  | Status           |
| ------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------- |
| Hero height              | screen width × 37/88                                                         | the same, but never below 36rem from 600px up (task 4.1.1) | ≈                |
| Primary CTA              | white, `#00050D` text, 20/23px 500, padding 8px 21px, 62px tall, radius 8    | the same                                                   | =                |
| CTA transition           | `transform .2s cubic-bezier(.25,1,.5,1)`, background, colour, outline        | transform and background, same curve                       | ≈                |
| Round + and ⓘ            | 61×61, `rgba(255,255,255,.2)`, round, `transform/background .3s ease-in-out` | the same                                                   | =                |
| Ranking / status line    | `#37F1A3`, 16px 700, trending icon                                           | `rgb(55,241,163)`, 16px 700, trending icon                 | =                |
| Entitlement line         | 16px / 20px, blue check `#0070F0`                                            | 16px / 24px                                                | fixed (now 20px) |
| Maturity / period chip   | 13px 700, `#33373D`, padding 3px 7px, radius 3                               | the same                                                   | =                |
| Row heading              | 20px / 28px, 700                                                             | the same                                                   | =                |
| See more                 | 20px 400 with chevron, about 36px after the heading                          | 20px 400, 36px after                                       | =                |
| Landscape card           | 251×141, radius 8, 10px gap                                                  | 251×141, radius 8, 10px gap                                | =                |
| Ribbon                   | white, `#00050D`, 11px 700, padding 3px 5px, radius 3 bottom-left            | the same                                                   | =                |
| Autoplaying hero trailer | cross-fades in after about 3s                                                | slow push-in on the still art                              | deviation        |

## Hover card

| Element        | primevideo.com                                                                   | This site                                | Status           |
| -------------- | -------------------------------------------------------------------------------- | ---------------------------------------- | ---------------- |
| Grow           | 1.56×, `transform .3s cubic-bezier(.2,.45,0,1)` after a 100ms hover-intent delay | 1.56×, same curve, 100ms delay in script | =                |
| Width / shadow | 392px, `0 4px 8px 2px rgba(0,5,13,.5)`                                           | 392px, the same shadow                   | =                |
| Panel          | `#000`, radius 0 0 8 8, padding 10px 20px 20px                                   | the same                                 | =                |
| Title          | 24px / 27px, 700                                                                 | the same                                 | =                |
| CTA            | 18px / 22px 500, padding 5px 15px, 54px tall, radius 8, plus a 50px round +      | 18px / 27px                              | fixed (now 22px) |
| Synopsis       | `#F1F1F1`, 16px / 19px 500, three lines                                          | the same                                 | =                |

## Title detail page

| Element              | primevideo.com                                                               | This site                       | Status           |
| -------------------- | ---------------------------------------------------------------------------- | ------------------------------- | ---------------- |
| Round action buttons | 48×48, `rgba(0,5,13,.4)`, 3px `rgba(255,255,255,.35)` border                 | the same                        | =                |
| CTA                  | 348×62, radius 8, padding 8px 21px                                           | the same                        | =                |
| Status chip          | 13px 700, padding 3px 7px, radius 3                                          | the same                        | =                |
| Synopsis             | 18px / 25px 500, 652px wide at x≈448, three lines                            | the same, at x=448              | =                |
| Genre row            | 16px 700 underlined links, `•` in `#B3B3B3`, mood/year `#999`                | the same                        | =                |
| Tabs                 | 18px / 25px 500, 1.08px tracking, 66px tall, about 28px apart, 3px white bar | 18px / 27px                     | fixed (now 25px) |
| Season / count       | 20px 700 / 20px 400 `#AAA`                                                   | the same                        | =                |
| Episode still        | 302×170, radius 8                                                            | 306×172 (the grid fills 1296px) | ≈                |
| Episode title        | 20px / 24px 700, 0.4px tracking, uppercase                                   | the same                        | =                |
| Episode synopsis     | 18px / 25px 500 `#AAA`                                                       | the same                        | =                |

## Search

| Element             | primevideo.com                                                            | This site                                | Status                                                                         |
| ------------------- | ------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| Panel               | `rgba(25,30,37,.8)`, `blur(16px)`, radius 12, padding 21px, dims the page | `rgba(25,30,37,.92)`, otherwise the same | ≈ (more opaque, so the `#B3B3B3` result text keeps 4.5:1 over bright hero art) |
| Panel width         | about 1140px, centred under the nav                                       | full width between the nav's edges       | fixed (now 1140px, centred)                                                    |
| Field               | `#33373D`, radius 8, 66px tall, 20px 700, 3px white focus outline         | the same                                 | =                                                                              |
| Clear               | 18px 500, padding 12px 24px, radius 8                                     | 16px 600, padding 0 16px                 | fixed                                                                          |
| Result title / meta | 20px 500 / 16px 500 `#B3B3B3`                                             | meta at 400                              | fixed (now 500)                                                                |

## Categories

| Element             | primevideo.com                                                       | This site                                      | Status |
| ------------------- | -------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| Headings            | `Categories` 32px / 36px 700, `Genres` 20px 700                      | the same                                       | =      |
| Genre tile          | 248×140, five across, about 10px apart, coloured glow, name 20px 700 | 251×142 (the grid fills 1296px), name 20px 700 | ≈      |
| Featured collection | bright Prime blue `#4A8FF5`, name centred 20px 700                   | `rgb(74,143,245)`                              | =      |

## Career Guide (Live TV guide)

| Element         | primevideo.com                                        | This site | Status                                    |
| --------------- | ----------------------------------------------------- | --------- | ----------------------------------------- |
| Programme block | `#191E25`, radius 0 8 8 0, 100px tall, padding 0 16px | the same  | =                                         |
| ON NOW heading  | 16px 700 uppercase                                    | the same  | =                                         |
| Time markers    | 16px 700 `#AAA` with a tick                           | 14px 700  | fixed (now 16px; Januaries show the year) |
| Now pill        | white, black 18px 500, radius 8, padding 4px 8px 3px  | 14px      | fixed (now 18px)                          |
| Now line        | 1px `rgba(255,255,255,.4)`                            | the same  | =                                         |
| ON NOW progress | 6px, rounded, `rgba(255,255,255,.2)` track, red fill  | the same  | =                                         |

## Deliberate deviations

The look matches Prime Video; the marks, names and content are not Amazon's (decision Q2):

- **Wordmark and ident:**
  - A lowercase "bhavini" wordmark with an original blue swoosh ending in a dot. It never uses the "prime video" logo or the smile.
  - The "bhavini original" ident replaces "prime original" / "Amazon Original".
  - The intro sting and its three-note flourish are original (`src/lib/flourish.ts`).
- **Type:** Inter replaces Amazon Ember, which is proprietary. Title lettering is drawn at build time in Archivo, Inter and Playfair Display outlines.
- **Names:**
  - "Behind the scenes" replaces X-Ray, and there is no IMDb badge.
  - "Open to roles" replaces "Included with Prime".
  - "Recruiters also viewed" replaces "Customers also watched".
  - "Who's visiting?" replaces "Who's watching?".
  - "Career Guide" replaces Live TV, and "Contact" replaces Subscriptions.
- **Left out:** "Join Prime", the language selector and the maturity ratings. A period chip ("2026") takes the place of the rating chip.
- **No autoplaying hero trailer.** The trailers carry on-screen text, so playing them behind the hero copy would clash. Trailers play on detail pages (immersive scroll) and in the player.
- **The footer** says "Not affiliated with Amazon, Prime Video or IMDb." It's on every page, and the player carries it in its bottom bar.

## Checked in the built site

- `tests/brand-guard.test.ts` runs again on `dist/` in CI.
  - It finds no Amazon name, font, hosted art or feature label in anything a visitor sees, apart from the disclaimer.
  - It now also checks that **every built page carries the disclaimer**.
- `tests/contact-privacy.test.ts` finds no plain email address or phone number in `src/`, `public/` or `dist/`.
