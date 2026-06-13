# Quorima — KPI's voor de holding

Versie: v0.1 · 13 juni 2026
Entiteit: **Sirrapa Group Holding B.V.** (Twinfield office 21006 · 100% Armand Parris)

> De holding heeft géén operationele KPI's — die staan op de werkmaatschappij-kaarten (DSCR, klant-concentratie, pipeline). De holding stuurt op vier dingen: **kapitaalallocatie, groeps-liquiditeit, intercompany-hygiëne en groeps-risico**. Deze 3 must-watch KPI's bewaakt de board elke cycle; de Chief of Staff orchestreert, CFO+CEO zijn primair.

**Stuursignaal op dit moment.** Vastgoed heeft een refi-cliff (runway 4,6 mnd, DSCR 0,80), UK Property verbrandt cash in acquisitie-fase zónder project, en ICT draagt de groep maar is 100% klant-geconcentreerd. De holding-vraag is letterlijk: *kan ik de Vastgoed-refi dichten zónder UK te verhongeren?* De KPI's hieronder maken precies dat besluit meetbaar.

---

## Must-watch set

| # | KPI | Formule / definitie | Data bron | Health-drempels | Escalatie-trigger |
|---|---|---|---|---|---|
| 1 | **Geconsolideerde netto cash + groeps-runway** | (Σ cash & equivalents alle entiteiten + holding) − schulddienst die binnen 90 dagen vervalt. Runway = netto cash / geconsolideerde maandelijkse netto burn (incl. UK-acquisitie-spend en Vastgoed schulddienst-tekort) | Twinfield 21005·21006·21007 + Xero (UK) + bankfeeds Ponto/TrueLayer | Groen ≥ 12 mnd · Geel 6–12 mnd · Rood < 6 mnd | Groeps-runway < 6 mnd → CFO+CEO via Chief of Staff (liquiditeits-protocol). Runway ≤ Vastgoed-refi-runway (4,6 mnd) → kritiek, `escalate_to_human()` |
| 2 | **Vrije allocatie-ruimte (dry powder)** | Netto cash − operationele buffer opco's (≈ 3 mnd opex) − reeds toegezegde capital calls + schulddienst komende 6 mnd. = wat de holding vrij kan inzetten voor UK óf Vastgoed-refi | Afgeleid uit KPI 1 + committed-outflows register (leningadministratie Twinfield + handmatige capital-call lijst) | Groen ≥ toegezegde calls 6 mnd + Vastgoed-refi-gap · Geel dekt één van beide · Rood dekt geen van beide | Dry powder < Vastgoed-refi-gap → CEO capital-allocation beslissing (UK pauzeren of externe funding aantrekken) via Chief of Staff |
| 3 | **Intercompany-discipline + mgmt-fee dekking** | (a) \|netto intercompany-saldo dat niet sluit op consolidatie\| + ouderdom oudste open post; (b) mgmt-fee coverage = mgmt-fee inkomsten holding / holding-standalone opex | `cross_entity` intercompany-matching (drempel €1.000 / 0,5%) + Twinfield 21006 | Groen: IC sluit (≤ €1.000), geen post > 90 dgn én coverage ≥ 1,0 · Geel: IC-drift onbekend of coverage 0,8–1,0 · Rood: post > 90 dgn of coverage < 0,8 | Coverage < 0,8 (holding bloedt) of IC-drift > drempel bij maandafsluiting → CFO-flag |

### Waarom deze drie en niet "geconsolideerde omzet" of "groeps-EBITDA"
- Omzet/EBITDA-totalen herhalen alleen de opco-cijfers en sturen niets op holding-niveau — de holding produceert geen omzet, ze alloceert kapitaal.
- **KPI 1 = overleven** (heeft de groep cash), **KPI 2 = sturen** (wat kan ik inzetten), **KPI 3 = hygiëne** (lekt er kapitaal via niet-sluitende IC of een holding die zijn eigen kosten niet dekt). Samen beslaan ze de enige dimensies waarop een pure holding stuurbaar is.
- Dry powder (KPI 2) is bewust toegevoegd boven een kale cash-stand: het is de knop die je als UBO omdraait tussen Vastgoed redden en UK funden.

### Aanvullende metrics (zichtbaar, niet primair)
- **Geconsolideerde solvabiliteit (equity ratio)** — geconsolideerd eigen vermogen / balanstotaal. Groep-guardrail; Vastgoed-gearing drukt dit. Indicatief: Groen ≥ 30% · Geel 15–30% · Rood < 15%.
- **Inkomsten-/EBITDA-diversificatie per opco** — tilt de ICT-concentratie naar groepsniveau. Groen: geen opco > 60% van groeps-EBITDA · Geel 60–80% · Rood > 80%.
- **Consolidatie-tijdigheid** — maandafsluiting klaar op werkdag 5 (`cross_entity.consolidation_calendar.monthly_close_business_day`). Proces-KPI, geen financieel cijfer.

---

## Samenhang met de werkmaatschappij-KPI's

Deze file werkt de "Holding-niveau composietweergave" uit `KPIs_per_werkmaatschappij.md` uit tot een meetbare set. De opco-KPI's voeden de holding-KPI's:

| Holding-KPI | Gevoed door |
|---|---|
| Geconsolideerde netto cash + runway | ICT effectieve maandomzet (cash in) · Vastgoed NOI − schulddienst (cash uit) · UK capital deployment (cash uit) |
| Vrije allocatie-ruimte | Vastgoed refi-runway/-gap · UK time-to-LOI & committed capital |
| Intercompany + mgmt-fee | mgmt fees ICT/Vastgoed/UK naar holding · intercompany-leningen |

---

## Hoe deze KPI's worden geïmplementeerd

1. **Holding-template** — een vierde wizard-template `Holding-Consolidation` wordt aan de Sirrapa-tenant toegewezen voor entiteit 21006 en laadt deze definities, drempels en triggers.
2. **Drempels uit tenant-config** — de €1.000 / 0,5% intercompany-drempel komt rechtstreeks uit `wizard/sirrapa_tenant_config.example.json` (`cross_entity.intercompany_match_threshold`); pas daar aan, niet hier hardcoden bij implementatie.
3. **Dashboard** — de holding-kaart in `dashboard/index.html` toont deze 3 must-watch KPI's; zolang connectors op `oauth_status: pending` staan blijven ze grijs ("geen live data") conform de CFO-regel: geen cijfer zonder bron.
4. **Daily flash / monthly close** — KPI 1 en 2 lopen mee in de daily flash (CFO); KPI 3 wordt geverifieerd bij de maandafsluiting (werkdag 5).
