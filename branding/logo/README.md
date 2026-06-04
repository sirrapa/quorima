# Quorima logo bundel

Productie-klaar logo set, klaar voor upload naar domains, social platforms en apps.

## Snelste pad voor jouw 7-dagen IP-checklist

| Wat heb je nodig | Welk file | Waar uploaden |
|---|---|---|
| LinkedIn company logo (square) | `quorima-github-avatar.png` (460×460) | LinkedIn → Company page → Logo |
| LinkedIn cover image | `quorima-linkedin-cover.png` (1584×396) | LinkedIn → Company page → Cover |
| GitHub org avatar | `quorima-github-avatar.png` | github.com/organizations/quorima → Settings → Avatar |
| Twitter/X profile picture | `quorima-app-icon-512.png` | X → Profile → Edit |
| Twitter/X banner | `quorima-twitter-banner.png` (1500×500) | X → Profile → Edit banner |
| Website favicon | `quorima-favicon.ico` | upload naar root, link via `<link rel="icon" href="/favicon.ico">` |
| Apple touch icon | `quorima-app-icon-512.png` | als `apple-touch-icon.png` in root |
| Email signature | `quorima-email-signature.png` (380×90) | sluit aan in Gmail/Outlook signature |
| Pitch deck title slide | `quorima-lockup-horizontal-1200.png` | inline of als hero op dia 1 |

## Bestanden in deze folder

### Mark (alleen het symbool)
- `quorima-mark-color.svg` — primary purple, transparent bg
- `quorima-mark-color.svg` PNGs: 64, 128, 256, 512, 1024
- `quorima-mark-white.svg` — voor donkere achtergronden, transparent bg
- `quorima-mark-white-*.png` — 64, 128, 256, 512, 1024
- `quorima-mark-navy.svg` — voor formele documenten
- `quorima-mark-black.svg` — single-color fallback
- `quorima-favicon.svg` — geoptimaliseerd voor 32px
- `quorima-favicon-*.png` — 16, 32, 48, 64
- `quorima-favicon.ico` — multi-size .ico voor browsers

### Wordmark (alleen "quorima" tekst, Lato Bold)
- `quorima-wordmark.svg` — charcoal op transparent
- `quorima-wordmark-720.png` — voor donker drukwerk

### Lockups (mark + wordmark samen)
- `quorima-lockup-horizontal.svg` — meest gebruikte, hero-formaat
- `quorima-lockup-horizontal-1200.png` — voor docs en pitch decks
- `quorima-lockup-vertical.svg` — voor narrow contexts
- `quorima-lockup-vertical-600.png`
- `quorima-lockup-dark.svg` — white-on-dark variant
- `quorima-lockup-dark-1200.png`

### App icons
- `quorima-app-icon.svg` — purple bg + white mark + rounded corners
- `quorima-app-icon-256.png`, `-512.png`, `-1024.png`

### Social-ready bundles
- `quorima-linkedin-cover.png` — 1584×396, purple gradient + white lockup
- `quorima-twitter-banner.png` — 1500×500
- `quorima-github-avatar.png` — 460×460
- `quorima-email-signature.png` — 380×90

## Voor designers later

`BRAND_GUIDE.md` bevat de volledige spec — kleuren, typografie, do's/don'ts, web tokens. Als je een externe designer of agency inschakelt voor pitch deck of website, geef ze dat document mee — dan blijft het merk consistent.

## Bron / herproduceren

De SVGs zijn geconstrueerd vanuit puur geometrische primitives (geen externe assets). Om PNGs opnieuw te genereren in je eigen workflow:

```bash
# ImageMagick (macOS: brew install imagemagick)
convert -density 300 -background none quorima-mark-color.svg -resize 1024x1024 out.png
```

Of via Inkscape (`inkscape file.svg --export-png=out.png --export-width=1024`) of Figma (importeer SVG, exporteer PNG).
