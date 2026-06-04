# Twinfield zonder Webservice key — fallback-opties

**Datum:** 30 april 2026
**Context:** Wat doen we als de Webservice key niet (snel) beschikbaar is, of nooit geleverd wordt door Hilleke / Twinfield support? Quorima moet niet stilvallen op één API-credential.

**Conclusie vooraf:** Een gelaagde aanpak (bank-feed + maandelijkse PDF van Hilleke + eenmalige seed-export) dekt **~80% van de daily flash** zonder ooit een Webservice key nodig te hebben. Twinfield wordt daarmee een *nice-to-have* in plaats van een *blocker*.

---

## 1. Wat heeft de daily flash écht nodig?

Voordat we naar alternatieven kijken — een eerlijke audit van wat de CFO agent élke ochtend nodig heeft:

| Datapunt | Frequentie | Bron-realiteit | Tolerantie staleness |
|---|---|---|---|
| Cash positie (bank saldo) | Dagelijks | Bank, niet Twinfield | 0–24u |
| Rente-uitgaven (DSCR teller) | Maandelijks | Twinfield maand-afsluiting | 30 dagen |
| NOI / huurinkomsten | Maandelijks | Twinfield + lease contracts | 30 dagen |
| Loan register (saldi, rentes, looptijden) | Kwartaal | Lease contracts + bank | 90 dagen |
| Rent roll (tenancies, indexaties) | Kwartaal | Lease contracts | 90 dagen |
| Refi runway | Maandelijks | Cash + loans | 30 dagen |

**Inzicht:** alleen *cash positie* is écht real-time. De rest mag een paar weken oud zijn — de KPI's blijven dan nog steeds bruikbaar genoeg om escalaties te triggeren.

---

## 2. Alternatieve data-routes — vergelijking

### A. Bank-feed (PSD2 — Ponto / Tink / TrueLayer)

- **Latency:** 1–24u (real-time waar mogelijk)
- **Build effort:** Laag — Ponto heeft een REST API, OAuth-flow, Nederlandse banken (ABN, Rabo, ING) supported
- **Operational overhead:** Eenmalige consent (90 dagen), daarna automatisch
- **KPI coverage:**
  - ✓ Cash positie — **direct**
  - ✓ Rente-betalingen (transacties met "rente" / "interest") — **proxy voor DSCR teller**
  - ✓ Huurinkomsten (transacties met tenant-IBAN match) — **proxy voor NOI**
  - ✗ Boekhoudkundige accruals (afschrijvingen, voorzieningen)
- **Kosten:** Ponto ~€20/mnd voor 1 entiteit, €60/mnd voor 3
- **Voordeel:** Mantra "we kunnen altijd zien hoeveel geld er op de rekening staat" wordt waar
- **Nadeel:** Geen P&L of balans — alleen cash-bewegingen

### B. Maandelijkse PDF/CSV export van Hilleke

- **Latency:** 30 dagen (wanneer maandafsluiting klaar is)
- **Build effort:** Laag — drop-folder + Claude vision OCR pipeline
- **Operational overhead:** Hilleke stuurt 1× per maand een set van 3 PDFs/CSVs (P&L + Balans per BV)
- **KPI coverage:**
  - ✓ NOI (huur − operationele kosten)
  - ✓ Rente-uitgaven (P&L regel)
  - ✓ Loan saldi (uit balans)
  - ✓ DSCR (volledig)
  - ✓ Refi runway (volledig)
  - ✗ Real-time cash
- **Kosten:** €0 als Hilleke dit als onderdeel van haar service doet, anders ~€50/mnd extra
- **Voordeel:** Officieel, audit-proof, bevat alle accruals
- **Nadeel:** 30 dagen oud; afhankelijk van Hilleke's planning

### C. Eenmalige CSV-export uit Twinfield UI

- **Latency:** Eenmalig op moment van export
- **Build effort:** Heel laag — Twinfield UI heeft "Exporteren" knop op transacties, P&L, balans
- **Operational overhead:** Jij doet zelf 1× per maand een handmatige export (5 min werk)
- **KPI coverage:** Alles, maar niet automatisch
- **Kosten:** €0
- **Voordeel:** Werkt direct vandaag, geen API nodig
- **Nadeel:** Handmatig — niet schaalbaar, geen "agentic" feeling

### D. Browser-automation / RPA (Playwright op Twinfield UI)

- **Latency:** Dagelijks of on-demand
- **Build effort:** Hoog — login flow + 2FA + DOM-parsing van Twinfield UI; breekt bij elke UI-update
- **Operational overhead:** Hoog — fragiel, sessies vervallen, captcha-risico
- **KPI coverage:** In theorie alles
- **Kosten:** Ontwikkeltijd 2–3 dagen + structurele maintenance
- **Voordeel:** Volledige data-toegang zonder API
- **Nadeel:** Tegen Twinfield's gebruiksvoorwaarden mogelijk; fragiel; security-risico (credentials in headless browser)
- **Verdict:** **Niet aanbevolen** — te broos voor productie

### E. E-mail scheduled reports + IMAP parsing

- **Latency:** Wekelijks/maandelijks (instelbaar in Twinfield)
- **Build effort:** Medium — IMAP listener + attachment parser
- **Operational overhead:** Eenmalige config van scheduled reports in Twinfield UI
- **KPI coverage:** Wat je in de scheduled reports zet (P&L + balans is standaard mogelijk)
- **Kosten:** €0
- **Voordeel:** Ander credential-pad (alleen UI-config nodig, geen API key)
- **Nadeel:** Email is geen schone transport-laag; PDFs vereisen OCR
- **Verdict:** Goede tussenoplossing als optie B (Hilleke) niet vlot loopt

### F. Twinfield Connect / Marketplace integraties

- **Latency:** Variabel
- **Build effort:** Medium
- **Operational overhead:** Configureren in Twinfield admin
- **KPI coverage:** Beperkt tot wat de specifieke integratie biedt
- **Kosten:** Per integratie verschillend (€10–50/mnd)
- **Voordeel:** Geen eigen development
- **Nadeel:** Marketplace bestaat vooral voor *push naar Twinfield* (orders, facturen) — niet voor *pull eruit*. Geen passende integratie voor onze use case gevonden.
- **Verdict:** Skip

### G. Boekhouder-portaal upgrade-verzoek

- **Latency:** Niet van toepassing — dit is een procesverzoek
- **Build effort:** N/A
- **Vraag aan Hilleke:** "Kunnen we het Twinfield-pakket upgraden naar één met API-toegang?"
- **Wat dat oplost:** Geeft alsnog Webservice key route, maar via een ander pakket
- **Kosten:** Twinfield API-pakket ~€10–30/mnd extra
- **Verdict:** Parallel pad — goed om alvast te starten, ook al kiezen we eerst voor B

---

## 3. Aanbevolen gelaagde fallback-strategie

Combineer drie lagen om de daily flash zo goed mogelijk te benaderen zonder Webservice key:

### Laag 1 — Real-time cash via bank-feed (Ponto)

```
ABN, Rabo, ING (zakelijk per BV)
   ↓ PSD2 OAuth
Ponto API
   ↓ daily pull
Quorima cash-port
```

**Levert:** dagelijkse cash-positie per BV, rente-betalingen (op datum van afschrijving), huurinkomsten (op datum van bijschrijving).

**Bouwen:** 1 dag werk. Ponto adapter is dezelfde port-pattern als Twinfield — implementeer `BankFeedPort` en `Ponto` adapter.

### Laag 2 — Maandelijkse boekhoud-snapshot van Hilleke

```
Hilleke (1× per maand, na afsluiting):
   3× PDF (P&L per BV) + 3× PDF (Balans per BV) + Loan register Excel
   ↓ email → drop folder
Quorima ingest pipeline:
   PDF → Claude vision OCR → JSON → Quorima KPI engine
```

**Levert:** Volledige NOI, DSCR, loan saldi, refi-runway op T-30. Audit-proof want komt rechtstreeks van de accountant.

**Bouwen:** 1 dag werk. PDF-OCR via Claude vision is robuust voor standaard Twinfield-rapport layouts.

**Vraag aan Hilleke:** "Kun je elke 1e van de maand een bundeltje (P&L + balans + loan register) naar `quorima-ingest@sirrapagroup.com` mailen, of in een gedeelde Drive-map zetten?"

### Laag 3 — Lease contracts + manuele rent roll

Eenmalig vastleggen in YAML / Notion / Airtable:
- Per pand: huurder, huurprijs/maand, indexatieclausule, einddatum, deposit
- Per lening: bank, hoofdsom, rente, looptijd, einddatum, aflossingsschema

Dit is *master data* dat zelden verandert — kwartaal-update is genoeg. Quorima leest dit als configuratie, niet als API-call.

### Resultaat van deze drie lagen samen

| KPI | Dekking | Latency | Bron |
|---|---|---|---|
| Cash positie | 100% | 0–24u | Bank-feed |
| DSCR (cash-basis) | 95% | 0–24u | Bank-feed (rente-betalingen + huur) |
| DSCR (accrual) | 100% | 30d | Maandelijkse PDF |
| NOI | 100% | 30d | Maandelijkse PDF |
| Refi runway | 100% | 30d | Maandelijkse PDF + lease contracts |
| Loan register | 100% | 90d | Lease contracts (master data) |
| Rent roll | 100% | 90d | Lease contracts (master data) |
| **Daily flash trigger-kwaliteit** | **~80–90%** | gemixt | gecombineerd |

---

## 4. Wat verliezen we t.o.v. directe Twinfield API?

| Functie | Met Webservice key | Zonder (gelaagd) |
|---|---|---|
| Real-time accrual P&L | ✓ | ✗ (30 dagen lag) |
| Drill-down naar individuele transacties | ✓ | ✗ (alleen cash via bank, geen accrual) |
| Multi-period vergelijking on-demand | ✓ | Beperkt |
| Self-healing data refresh | ✓ | ✗ (handmatig herstel bij PDF-parsing fouten) |
| Audit trail per query | ✓ | Beperkt (alleen op ingest-niveau) |

**Wat blijft volledig overeind:**
- De drie escalatie-thresholds (DSCR < 1.0, refi runway < 6 mnd, NOI < budget)
- De CFO agent met "never invent numbers" principe
- De daily flash als ochtendritueel
- Het port-adapter pattern (Twinfield blijft als adapter beschikbaar voor later)

---

## 5. Migratie-pad

```
Vandaag:               Mock data + .env zonder password
   ↓
Week 1:                Bank-feed adapter (Ponto, 3 BVs)
   ↓
Week 2:                PDF-ingest pipeline + 1e maand-bundel van Hilleke
   ↓
Week 3:                Lease contracts naar YAML, rent roll & loan register live
   ↓
Maand 2:               Daily flash live met gelaagde data
   ↓
Later (parallel):      Webservice key komt alsnog → Twinfield adapter activeren
                       (port-pattern maakt dit een config-switch, geen rewrite)
```

---

## 6. Actie-items (parallel aan Hilleke-mail)

1. **Vandaag** — Stuur Hilleke ook een tweede vraag: *"Kun je elke 1e van de maand een PDF-bundel sturen met P&L + balans per BV + loan register?"* — onafhankelijk van de Webservice key
2. **Deze week** — Open Ponto-account op `myponto.com`, maak sandbox-app, koppel ABN-rekening Vastgoed
3. **Deze week** — Maak `BankFeedPort` interface en `PontoAdapter` (mirror van AccountingPort design)
4. **Volgende week** — Bouw PDF-ingest CLI: `npm run ingest:hilleke <maand>`
5. **Continu** — Onderhoud Twinfield-adapter zodat hij klaarstaat zodra de Webservice key wel binnenkomt

---

## 7. Strategisch: dit is geen tegenvaller

Een belangrijk inzicht: **de gelaagde route is robuuster dan single-vendor API-afhankelijkheid**.

- Twinfield API kan downtime hebben → bank-feed loopt door
- Wolters Kluwer kan tarieven verhogen → bank-feed is goedkoper
- Klant in de toekomst gebruikt Exact / Reeleezee / etc. → bank-feed werkt voor iedereen
- Quorima als product wordt verkoopbaar zonder dat klanten Twinfield API-pakket hoeven aanschaffen

Dit fallback-pad is dus tegelijkertijd het *resilience-by-design* pad voor Quorima als SaaS. Bouwen!
