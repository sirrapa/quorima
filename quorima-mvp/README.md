# Quorima MVP — CFO agent voor Sirrapa Vastgoed

Sprint 1 van Quorima. Doel: **een werkende daily flash digest** voor Sirrapa Vastgoed B.V., gevoed door Twinfield grootboekdata, met DSCR / NOI / refi-runway KPIs en een Claude Opus-gegenereerde briefing.

## Wat je krijgt

```
$ npm run flash:dry-run

» Quorima daily flash starting…
  mode: MOCK · llm: OFF
  entity: Sirrapa Vastgoed B.V.
  data fetched: P&L (8 lines), loans (3), recent tx (2)
  KPIs computed:
    DSCR 0.802 (red)
    NOI €11483/mo (no-budget)
    refi WACC 6.92% · runway 4.6mo (red)
  escalations: 2 (warning, critical)

# Sirrapa Vastgoed — Daily Flash
**2026-04-27** · entity: Sirrapa Vastgoed B.V.

## TL;DR
🚨 Refi-runway 4.6 mnd én DSCR 0.802. Crisis-protocol: lender-gesprek deze week.

## De drie KPI's
- 🔴 DSCR 0.802 — NOI €137.800/jr / debt service €171.900/jr
- ⚪ NOI €11.483/mnd — geen budget geconfigureerd
- 🔴 Refi-runway WACC 6.92% · repricing in 4.6 mnd op €2.350.000

## Wat te doen vandaag
- 🚨 KRITIEK — Crisis-protocol: lender-gesprek deze week, refi-roadmap binnen 30 dagen.
...
```

## Quick start (binnen 1 minuut testen, zonder API keys)

```bash
cd quorima-mvp
npm install
npm run flash:dry-run    # uses mock data + deterministic renderer
```

De `output/flash-YYYY-MM-DD.md` is wat je elke ochtend om 08:00 in je inbox of Slack krijgt.

## Met Claude Opus (LLM-mode, mock data)

```bash
cp .env.example .env
# Vul ANTHROPIC_API_KEY in .env in (claude.com/console → API Keys)
npm run flash:mock
```

Het verschil met dry-run: de CFO-agent (Claude Opus 4.8) herschrijft de briefing in
natuurlijker Nederlands, met betere TL;DR en actie-aanbevelingen. Inputs naar de
LLM zijn altijd grounded — zelfs Opus mag geen cijfers verzinnen, alle figures
moeten traceren naar tool-calls.

## Met echte Twinfield data (OAuth2)

Twinfield heeft de oude SOAP-logon (user + Webservice key) uitgezet — die geeft
nu `OAuth2AuthenticationRequired`. Toegang loopt via OpenID Connect. Voorwaarde:
een bij Twinfield geregistreerde OAuth-app (`client_id` + `client_secret`). Zie
[`../connectors/twinfield_oauth2_migration.md`](../connectors/twinfield_oauth2_migration.md) voor de aanvraag.

```bash
# in .env:
TWINFIELD_CLIENT_ID=...
TWINFIELD_CLIENT_SECRET=...
TWINFIELD_REDIRECT_URI=http://localhost:8080/callback
TWINFIELD_OFFICE_VASTGOED=21007
TWINFIELD_OFFICE_ICT=21005
TWINFIELD_OFFICE_HOLDING=21006

# Stap 1: eenmalige autorisatie (opent browser, login als APARRIS, consent)
npm run twinfield:auth        # slaat refresh_token op in .twinfield-tokens.json

# Stap 2: verifieer de koppeling (refresh → cluster → offices, geen LLM-credit)
npm run twinfield:test

# Stap 3: eerste live digest
npm run flash
```

`twinfield:auth` doet de authorization-code grant eenmalig; daarna refresht de
daily flash zelf het access_token (headless). Her-autoriseren is alleen nodig als
het refresh_token verloopt of wordt ingetrokken.

`twinfield:test` is je vangnet: het zegt expliciet of de token-refresh werkt,
welke cluster Twinfield toewijst, welke offices zichtbaar zijn, en welke nog
missen. Pas als die groen is, heeft `npm run flash` zin.

Cron `0 8 * * 1-5 cd /path/to/quorima-mvp && npm run flash` levert je elke
werkdag om 08:00 een digest in `./output/`.

## Architectuur

```
┌─────────────────────────────────────────────────────────────┐
│ src/cli/daily-flash.ts                          Entry point │
│   ↓ orchestreert alles, parst CLI flags                     │
├─────────────────────────────────────────────────────────────┤
│ src/adapters/                                               │
│   twinfield/  ← OAuth2 SOAP client + Browse XML mapper      │
│   mock/       ← fixture-driven, voor offline dev            │
│   beide implementeren AccountingPort                        │
├─────────────────────────────────────────────────────────────┤
│ src/ports/accounting.ts                                     │
│   Vendor-onafhankelijke interface — agents praten alleen    │
│   tegen Ports, nooit direct tegen Twinfield/Xero            │
├─────────────────────────────────────────────────────────────┤
│ src/domain/                                                 │
│   kpi.ts          ← computeDSCR, computeNOI, computeRefi    │
│   escalation.ts   ← maps KPI states → escalation events     │
│   pure functies, zero side effects, makkelijk te testen     │
├─────────────────────────────────────────────────────────────┤
│ src/agents/cfo.ts                                           │
│   Claude Opus 4.8 wrapper. Krijgt grounded data,            │
│   schrijft de briefing. Prime directive: never invent.      │
├─────────────────────────────────────────────────────────────┤
│ src/digest/render.ts                                        │
│   Deterministic markdown fallback (--no-llm modus)          │
└─────────────────────────────────────────────────────────────┘
```

Deze structuur is bewust dezelfde architectuur die straks de andere agents
(CEO/COO/CMO) en andere connectors (Xero, HubSpot, Twinfield-CRM) volgen.

## CLI flags

| Flag | Effect |
|------|--------|
| `--mock` | Gebruik MockAccountingPort + fixture (geen Twinfield-creds nodig) |
| `--no-llm` | Skip Claude Opus call, gebruik deterministic renderer |
| `--quiet` | Onderdruk progress logs (handig voor cron) |

| npm script | Combo |
|---|---|
| `npm run flash` | productie: real Twinfield + Claude Opus |
| `npm run flash:mock` | mock data + Claude Opus |
| `npm run flash:dry-run` | mock data + no LLM (gratis, geen API call) |
| `npm run twinfield:auth` | eenmalige OAuth2-autorisatie (browser-consent → refresh_token) |
| `npm run twinfield:test` | token-refresh + cluster + offices, voor koppeling-debug |
| `npm run test:smoke` | dry-run quiet, voor CI |

## Exit codes

- `0` — alles ok, geen kritieke escalatie
- `1` — fout in data-fetching of LLM-call
- `2` — kritieke escalatie gevuurd (cron-monitoring kan hierop alarmeren)

## Wat zit er nog niet in (Sprint 1.5+)

- **Lease-contract PDF parsing** voor WAULT/break-options metadata
- **Historical trend** (DSCR over laatste 4 kwartalen) voor "2 quarters in a row" rule
- **Slack delivery** ipv alleen file-output (hooks zijn er; SMTP/Slack adapter komt)
- **Cross-entity consolidatie** (Sprint 4)
- **CEO/COO/CMO agents** (Sprints 2-3)

## Hoe je hierop voortbouwt

1. **Voeg een nieuwe connector toe**: implementeer `AccountingPort` voor Xero in `src/adapters/xero/`. Geen wijzigingen aan agents of domain laag nodig.
2. **Voeg een KPI toe**: nieuwe pure functie in `src/domain/kpi.ts` + uitbreiden `VastgoedFlash` type. CFO-agent krijgt het via de `formatInput` payload.
3. **Voeg een escalatie-rule toe**: regel in `src/domain/escalation.ts`. Geen wijzigingen aan CFO-agent — die rapporteert wat hij krijgt.
4. **Voeg een nieuwe entity toe**: regel in `officeFromEntityId` mapping in Twinfield adapter, en de wizard tenant-config heeft het record al.

---

_v0.1 · 27 april 2026 · gebouwd op platform.claude.com (Claude Opus 4.6) + Twinfield + TypeScript_
