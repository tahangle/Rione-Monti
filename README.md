# Rione Monti

Single-page site for **Rione Monti** — an Italian-inspired catering house and
private-chef service in Paris. Editorial long-scroll home page: hero →
philosophie reveal → experiences (flipping ceramic plates) → *Notre début*
(maiolica-tile cascade) → menus → testimonials → contact → footer. Bilingual
(FR default, EN toggle) and fully responsive.

## How it's built

A hand-written static site — no build step, nothing to compile.

| File | What it is |
|------|-----------|
| `index.html` | All the markup + inline styles (structure & look). |
| `styles.css` | `@font-face` faces, keyframes, hover states, the `@media (max-width:820px)` mobile layout. |
| `script.js` | All behaviour: scroll-scrubbed sections, the FR/EN toggle, the overlay menu, the menu carousel, the bottle demo. Vanilla JS, no dependencies. |
| `assets/` | Images, SVGs, patterns, stickers. |
| `fonts/` | Display + text typefaces. |

It was recreated from a Claude design handoff. The prototype's design-tool
attributes (`ref`, `onClick`, `style-hover`) were converted to standard
patterns (`data-ref`, `data-action`, `data-hover`) and the prototype runtime was
reimplemented from scratch in `script.js`.

## Previewing locally

It's all relative paths, so you can just open `index.html` in a browser.
For navigation that behaves exactly like production, serve it:

```sh
npx serve .
```

## Before going fully live — two to-dos

1. **Fonts are trial / "unlicensed" cuts** (Rauschen, HAL Timezone). They're fine
   for review but **must be swapped for licensed versions** before this is a
   public commercial site.
2. **The contact form doesn't send yet.** Submitting just confirms on the button.
   Wire it to a real backend (a form service like Formspree, or an email
   endpoint) when ready.

---
Design & development by [Caterina Tahan](https://www.caterinatahan.com).
