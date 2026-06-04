# Quorima — Brand Guide v1.0

**Vastgelegd:** 27 april 2026
**Voor:** logo-, kleur- en typografische beslissingen tijdens elke uiting van het merk Quorima.

---

## 1. The Mark — "Round Table"

Een cirkel met 5 punten op de perimeter: vier C-level agents (CEO/CFO/COO/CMO) plus een grotere accent-punt bovenaan voor de Chief of Staff orchestrator. De compositie verbeeldt een boardroom-tafel van bovenaf. Een kleine center-dot suggereert het convergentiepunt waar consensus ontstaat.

**Constructie**
- ViewBox: `0 0 100 100`
- Outer ring: `cx=50 cy=50 r=42` · stroke `4`
- Orchestrator (top): `cx=50 cy=8 r=8`
- C-level dots (4×): `r=5.5`, gepositioneerd op 72°-intervallen vanaf top
- Center dot: `cx=50 cy=50 r=2.6` · `opacity=0.45`

**Clear-space rule**
Houd minstens **een halve mark-hoogte** vrij rond de mark in elke layout. Niets mag binnen die marge — geen tekst, geen andere logo's, geen randen.

---

## 2. The Wordmark

**Typeface:** Lato Bold (Google Fonts, SIL OFL — gratis voor commercieel gebruik). Open-source, geometrisch-humanistisch, ontworpen door Łukasz Dziedzic. Past bij modern SaaS én voelt premium.

**Specs**
- Font weight: **Bold (700)**
- Letter case: **lowercase only** ("quorima") — never "Quorima" of "QUORIMA" in het wordmark
- Tracking / letter-spacing: **−0.04em** (negatief; de letters staan iets dichter)
- Color: `#1a2233` (charcoal) op licht · `#f7f8fb` (white-90) op donker

**Waarom lowercase**
Lowercase voelt benaderbaar en modern, past bij de toon van een AI-product dat *naast* de gebruiker staat (niet erboven). Boardroom-software doet vaak het tegenovergestelde — zwaar uppercase, formeel, intimiderend. Quorima is bewust friendlier.

---

## 3. Color Palette

### Primary
| Token | Hex | RGB | Gebruik |
|---|---|---|---|
| `quorima-purple` | `#6b46c1` | 107, 70, 193 | Primary brand · mark · accents · CTA |
| `quorima-purple-light` | `#a78bda` | 167, 139, 218 | Mark op donkere achtergrond · highlights |
| `quorima-purple-tint` | `#ede9fe` | 237, 233, 254 | Backgrounds · success states |

### Secondary
| Token | Hex | Gebruik |
|---|---|---|
| `quorima-navy` | `#1f3864` | Headings · table headers · serieus-corporate context |
| `quorima-charcoal` | `#1a2233` | Primary body text · wordmark on light |
| `quorima-grey` | `#6b7387` | Secondary text · timestamps · meta |

### Semantic
| Token | Hex | Gebruik |
|---|---|---|
| `green` | `#16a34a` | Health status groen · success |
| `amber` | `#f59e0b` | Geel · warning |
| `red` | `#dc2626` | Rood · critical · escalation |
| `surface-light` | `#f7f8fb` | App background light |
| `surface-dark` | `#0f172a` | App background dark |

---

## 4. Lockups — wanneer welke variant

| Variant | File | Wanneer |
|---|---|---|
| **Mark only** | `quorima-mark-color.svg` | App icon, favicon, social avatar, sticker, watermark op foto's |
| **Wordmark only** | `quorima-wordmark.svg` | Email signature footer, lange productschermen waar mark elders zichtbaar is |
| **Horizontal lockup** | `quorima-lockup-horizontal.svg` | Web header, document headers, presentations title slides |
| **Vertical lockup** | `quorima-lockup-vertical.svg` | Posters, business cards, narrow side-panels |
| **Dark variant** | `quorima-lockup-dark.svg` | Donkere achtergronden — gebruik white mark + lavender-tinted ring |
| **Mono navy / black** | `quorima-mark-navy.svg`, `-black.svg` | Single-color drukwerk, faxes, fallback voor B/W context |

---

## 5. Do's en Don'ts

### Do
- ✅ Gebruik altijd de officiële SVG-files (deze folder); never re-typed
- ✅ Behoud de clear-space marge rond de mark
- ✅ Gebruik white-on-purple-gradient voor hero / cover-images (LinkedIn, Twitter)
- ✅ Op donkere achtergronden: gebruik de white mark of de `purple-light` tint
- ✅ Pair met **Lato** voor body text waar mogelijk; **Inter** als web fallback

### Don't
- ❌ Verstrek de mark niet — geen vertical/horizontal scaling die aspect verandert
- ❌ Roteer de mark niet — het is altijd recht-omhoog (orchestrator-dot blijft bovenaan)
- ❌ Verkleur niet ad-hoc — alleen de officiële mono varianten zijn toegestaan
- ❌ Plaats de mark niet op rumoerige achtergronden (foto's met veel detail) — gebruik dan een solid panel
- ❌ Vervang het wordmark niet door een andere font — Lato Bold is brand-defining
- ❌ Gebruik nooit "Quorima" met hoofdletters in het wordmark zelf (in body text mag wel)

---

## 6. Trademark notice

`Quorima™` is een handelsmerk van Sirrapa Group Holding B.V., geregistreerd bij EUIPO en UKIPO (in proces). Bij externe communicatie:
- Eerste vermelding per document: `Quorima™`
- Volgende vermeldingen: `Quorima` (zonder ™)

---

## 7. Asset bundel — wat gebruik je waar

| Use case | File |
|---|---|
| Website favicon | `quorima-favicon.ico` (16/32/48 bundle), of `quorima-favicon.svg` |
| Apple touch icon | `quorima-app-icon-512.png` |
| Android adaptive icon | `quorima-app-icon-1024.png` (foreground) op purple background |
| LinkedIn company avatar | `quorima-github-avatar.png` (460×460) |
| LinkedIn cover image | `quorima-linkedin-cover.png` (1584×396) |
| Twitter/X profile pic | `quorima-app-icon-512.png` |
| Twitter/X banner | `quorima-twitter-banner.png` (1500×500) |
| GitHub org avatar | `quorima-github-avatar.png` |
| Email signature | `quorima-email-signature.png` |
| Product Hunt thumbnail | `quorima-app-icon-1024.png` |
| Pitch deck cover slide | `quorima-lockup-vertical-600.png` of `-horizontal-1200.png` |
| Letterhead / contracts | `quorima-mark-navy.svg` + Lato Regular body |

---

## 8. Web implementation

### CSS variables
```css
:root {
  --quorima-purple: #6b46c1;
  --quorima-purple-light: #a78bda;
  --quorima-purple-tint: #ede9fe;
  --quorima-navy: #1f3864;
  --quorima-charcoal: #1a2233;
  --quorima-grey: #6b7387;
  --surface-light: #f7f8fb;
  --surface-dark: #0f172a;
}
```

### Typography stack
```css
font-family: "Lato", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
```

### Lato via Google Fonts
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
```

---

## 9. Versie-historie

| Versie | Datum | Wijziging |
|---|---|---|
| 1.0 | 27 apr 2026 | Initial release. Round Table mark + Lato Bold wordmark + purple/navy palette gevestigd. |
