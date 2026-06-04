# Quorima — IP, Domain & Brand Protection Plan

**Versie:** v0.1 · 27 april 2026
**Status:** `quorima.ai` is geregistreerd ✓ — overige bescherming nog open

---

## 1. Domain strategie

### Wat je al hebt
- `quorima.ai` — uitstekend voor de productpositionering. Past bij elke modern AI-product.

### Wat ik aanraad om binnen 7 dagen te registreren

**Tier 1 — kritisch (samen ~€60/jaar):**
| Domein | Reden | Geschatte kosten/jaar |
|---|---|---|
| `quorima.com` | Default expectation; ~70% van b2b traffic typt `.com` ongeacht je officiële TLD. Defensief tegen domain squatters. | ~€10 |
| `quorima.eu` | EU markt focus; sterk merkanker bij EUIPO trademark filing. | ~€8 |
| `quorima.nl` | Lokale herkenning bij NL klanten en search SEO. | ~€7 |
| `quorima.io` | Techy/SaaS standaard; voorkomt dat een dev-tool met dezelfde naam ernaast bestaat. | ~€35 |

**Tier 2 — defensief (samen ~€60/jaar):**
| Domein | Reden | Kosten |
|---|---|---|
| `quorima.app` | Modern, mobiel. Optioneel maar laag-risico. | ~€15 |
| `quorima.co` | Vaak getypt als typo voor `.com`. Defensief. | ~€25 |
| `getquorima.com` | Marketing-friendly URL voor ads/landing pages. | ~€10 |
| `joinquorima.com` | Vanity voor onboarding. | ~€10 |

**Aanbevolen registrar:** [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) — registreert at-cost, geen mark-up, hoge security defaults (2FA, DNSSEC, registry locks). Goedkoper en veiliger dan GoDaddy/Namecheap voor het lange termijn.

**Totaal Tier 1 + Tier 2:** ~€120/jaar voor volledige domain-bescherming.

### Wat te doen na registratie
1. Stel domain forwarding in: `quorima.com`, `quorima.eu`, `quorima.nl`, `quorima.io` allemaal redirect naar `quorima.ai` (of later naar `quorima.com` als je dat de canonical maakt).
2. Activeer DNSSEC + Registry Lock op Cloudflare voor alle domains.
3. Set up catch-all email forwards (bijv. alles van `quorima.com` → `armand.parris@sirrapagroup.com` totdat je dedicated mailboxes nodig hebt).

---

## 2. Trademark strategie

### Pre-filing: eerst gratis searches doen

Voor je geld uitgeeft aan een filing wil je weten of "QUORIMA" botst met bestaande merken. Check minimaal:

| Database | URL | Wat je zoekt |
|---|---|---|
| EUIPO eSearch | euipo.europa.eu/eSearch/ | "QUORIMA" en "QUOR*" wildcard in classes 9 & 42 |
| UKIPO trademark search | gov.uk/search-for-trademark | Idem |
| USPTO TESS (US) | tmsearch.uspto.gov | Idem (alleen relevant als je US plant) |
| WIPO Global Brand Database | branddb.wipo.int | International overzicht |

> **Belangrijk:** "Quorum" als merk wordt al gebruikt door meerdere partijen (Quorum Software, Quorum Information Technologies). Het verschil tussen "Quorum" en "Quorima" zal in een conflictbeoordeling cruciaal zijn — meestal gunstig voor jou (verschillende uitspraak, verschillende eindstam) maar niet gegarandeerd.

### Filing-strategie

**Aanbevolen filings (prioriteit):**

| # | Office | Geografische dekking | Classes | Kosten | Tijdlijn |
|---|---|---|---|---|---|
| 1 | **EUIPO** | 27 EU lidstaten in één filing | 9 + 42 | €1.000 (€850 + €150 voor extra class) | 5–7 maanden tot registratie |
| 2 | **UKIPO** | Verenigd Koninkrijk | 9 + 42 | £220 (£170 + £50 extra class) | 4–6 maanden |
| 3 | (later) USPTO | Verenigde Staten | 9 + 42 | ~$500/klasse (TEAS Plus) | 12–18 maanden |

**Waarom Class 9 + Class 42:**
- **Class 9** (downloadable software) — dekt de wizard als installer, eventuele desktop apps, mobile apps.
- **Class 42** (SaaS, software-as-a-service, design & development) — dekt het core cloud-product.

Class 35 (business management consulting) is optioneel als je trademark-bescherming wil voor advies/consultancy onder de Quorima naam. Voor pure SaaS niet nodig.

### Process-overzicht EUIPO filing

```
Week 0    Filing online via EUIPO portal (€1.000 betalen)
Week 1-4  Formal examination (volledigheid)
Week 5-12 Substantive examination (verwarrings-check)
Week 13   Publication (start van 3-mnd opposition window)
Week 25   Indien geen opposition → registration
```

### Wanneer een trademark attorney inschakelen

**Niet nodig voor:**
- Standard EUIPO/UKIPO filing in 1-2 classes — kun je zelf via online portals.

**Wel aanbevolen voor:**
- Pre-filing clearance opinion (~€500–1.000) — vooral als de "Quorum" wildcard search verwarringsrisico's toont.
- Reactie op een opposition (als het misgaat in week 13–25).

Aanbevolen NL trademark attorneys voor SaaS: NLO (Nederlandsch Octrooibureau), Arnold + Siedsma, V.O. Patents & Trademarks. Vaak hebben ze flat fees voor EUIPO+UKIPO+USPTO bundels (~€2.000–3.500 all-in).

---

## 3. Defensieve social / platform handles

Claim deze binnen 48 uur — meeste zijn gratis maar onomkeerbaar verloren als iemand anders ze pakt:

| Platform | Handle/URL | Waarom |
|---|---|---|
| LinkedIn Company Page | `linkedin.com/company/quorima` | Belangrijkste B2B kanaal voor SaaS |
| X / Twitter | `@quorima` of `@quorima_ai` | Tech-community awareness |
| GitHub org | `github.com/quorima` | Voor open-source connectors / SDK |
| Product Hunt | `producthunt.com/products/quorima` | Launch-kanaal als je publiek lanceert |
| Crunchbase | `crunchbase.com/organization/quorima` | Voor investor visibility |
| Domains email | `hi@quorima.ai` of `hello@quorima.ai` | Werk via Google Workspace of Fastmail (~€6/mnd/seat) |

---

## 4. Totale investering voor volledige bescherming

| Item | Eenmalig | Jaarlijks |
|---|---|---|
| Tier 1 + 2 domains | — | ~€120 |
| EUIPO trademark (Class 9+42) | €1.000 | €0 (verlenging na 10 jr) |
| UKIPO trademark (Class 9+42) | £220 (~€260) | €0 (verlenging na 10 jr) |
| Optioneel: pre-filing attorney clearance | €500–1.000 | — |
| Google Workspace email | — | ~€72/jr |
| **Totaal jaar 1** | **~€1.500–2.500** | **~€200/jr** |

**Worst case:** zonder bescherming pakt iemand `quorima.com` en eist €5K+ om hem terug te kopen, of registreert "QUORIMA" bij EUIPO en dwingt jou tot een naamswijziging. Voor €1.500 elimineer je beide risico's.

---

## 5. 7-dagen actie-checklist

Volgorde, prioriteit:

| Dag | Actie | Tijd | Waarde |
|---|---|---|---|
| Dag 1 | EUIPO eSearch + UKIPO + WIPO databases checken op `QUORIMA` en `QUOR*` | 30 min | Vóór je geld uitgeeft, bevestigen dat de naam echt vrij is |
| Dag 1 | LinkedIn company page aanmaken (basis: naam, logo placeholder, 1-zin bio) | 15 min | Lock-in handle |
| Dag 1 | GitHub org `quorima` claimen | 5 min | Lock-in |
| Dag 2 | Cloudflare account → Tier 1 domains registreren (`quorima.com`, `.eu`, `.nl`, `.io`) | 30 min | Domain protection |
| Dag 2 | X / Twitter handle claimen | 5 min | Lock-in |
| Dag 3 | Tier 2 domains registreren | 15 min | Defensief |
| Dag 3 | Domain forwarding instellen (alles → `quorima.ai`) + DNSSEC aan | 20 min | Single landing |
| Dag 4 | Optional: trademark attorney bellen voor clearance opinion (alleen als wildcard search rare hits gaf) | 30 min call | Risico-reductie |
| Dag 5–7 | EUIPO filing (online) | 1–2 uur | Officiële merkbescherming aanvragen |
| Dag 7 | UKIPO filing (online) | 1 uur | UK markt-bescherming |

Wil je dat ik:
1. De EUIPO eSearch alvast voor je doe en een conflict-rapport opstel?
2. Een drafting van de filing-omschrijving voor Class 9 + 42 schrijf (je kunt die direct copy-paste in het EUIPO formulier)?
3. Een logo/wordmark-richting voorstellen voor het visuele merk dat bij je trademark filing meegaat?

Geef aan wat de eerstvolgende stap is, dan unblock ik die.
