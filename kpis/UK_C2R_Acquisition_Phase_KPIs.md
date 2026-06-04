# Sirrapa Property Group Ltd. — Acquisition Phase KPIs

**Strategie:** Commercial-to-Residential (C2R) conversie onder UK Permitted Development (Class MA / Class O / prior approval routes) en gerelateerde acquisitie-routes.
**Huidige fase:** Acquisition — nog geen actieve projecten. Develop-to-Hold KPI's vuren niet zinvol totdat eerste object is verworven.
**Boekhouding:** Xero · **Currency:** GBP

---

## Wat verandert er per fase

De UK-entiteit doorloopt drie fases met elk een andere KPI-set. Quorima switcht automatisch van template wanneer de trigger wordt geraakt.

| Fase | Trigger om in deze fase te zitten | KPI-set |
|---|---|---|
| **1. Acquisition** *(nu)* | Geen project in build of stabilisatie | Pipeline, deal velocity, capital deployment |
| **2. Build / Refurb** | ≥ 1 project verworven, nog niet ≥ 90% verhuurd | Build cost vs budget, build progress, lease-up traction |
| **3. Develop-to-Hold (steady state)** | ≥ 1 project gestabiliseerd | Yield-on-cost, time-to-stabilization, portfolio yield + DSCR |

> Eerste object verwerven = automatische template-switch van `Property-C2R-Acquisition-Phase` naar `Property-Develop-to-Hold` (met Build-fase overlap). De wizard kan deze switch ook handmatig forceren als de integrator wil.

---

## Acquisition-Phase: 3 KPI's

### KPI 1 — Qualified pipeline (£ GDV) op C2R-feasibility
**Definitie:** som van de geschatte GDV (Gross Development Value) van targets die door de eerste feasibility-check zijn — d.w.z. waarvoor:
- Permitted Development Rights waarschijnlijk gelden (geen artikel 4-richtlijn lokaal),
- indicative yield-on-cost ≥ 7% bij voorzichtige aannames,
- LTV-financierbaarheid via standaard development lender.

**Formule:** `Σ(estimated_GDV) where target.feasibility_status = "qualified"`

**Drempels:**
- 🟢 Groen: ≥ £8M qualified pipeline (genoeg keuze om 1 deal/kwartaal door te zetten).
- 🟡 Geel: £3–8M.
- 🔴 Rood: < £3M (deal-flow is te dun).

**Data bron:** HubSpot deal-pipeline (UK Property workspace) met custom `c2r_feasibility` veld + Xero (uitgaven aan source-fees, surveys).

**Escalatie:** < £3M voor 2 maanden op rij → CEO + CMO joint flag (sourcing-strategie review).

---

### KPI 2 — Time-from-lead-to-LOI (dagen)
**Definitie:** mediane doorlooptijd van eerste lead-detectie tot getekende LOI / offer per gekwalificeerde target.

**Formule:** `median(loi_signed_date - lead_first_seen_date)` over rolling 90 dagen.

**Drempels:**
- 🟢 Groen: ≤ 21 dagen (snelle markt, gedegen process).
- 🟡 Geel: 22–45 dagen.
- 🔴 Rood: > 45 dagen (markt is competitief; trage besluitvorming verliest deals).

**Data bron:** HubSpot deal stage-history.

**Escalatie:** > 60 dagen op rolling basis → COO + CEO joint review (proces-issue of beslissings-bottleneck).

> Bonus-kanttekening: bij C2R zijn vaak surveys en planning-checks nodig vóór LOI. Targetwaarde van 21 dagen veronderstelt dat indicative feasibility light is (bureau-deskwerk + 1 site visit). Voor complexe targets (mixed-use, listed buildings) is dit niet realistisch — splits dan op naar segmentaire mediaan.

---

### KPI 3 — Capital deployment ratio
**Definitie:** verhouding van actief gecommitteerd kapitaal tegen beschikbaar (cash + commited credit lines + investor commitments).

**Formule:** `(cash_in_loi_or_under_offer + cash_under_due_diligence) / total_available_capital`

**Drempels:**
- 🟢 Groen: 60–85% (gezonde balans tussen actief inzetten en buffer).
- 🟡 Geel: 30–60% (te veel idle kapitaal of net begonnen) of 85–95%.
- 🔴 Rood: < 30% (kapitaal staat lui te zijn) of > 95% (geen buffer voor verrassingen).

**Data bron:** Xero (cash on balance) + handmatige investor-commitment ledger (later: lender/investor MCP) + HubSpot deal-stage cash-tags.

**Escalatie:** < 30% voor 2 maanden → CEO flag (capital is ofwel niet productief, ofwel te conservatief beleggen-mode).

---

## Wat de Acquisition-Phase template laadt

```json
{
  "template_id": "Property-C2R-Acquisition-Phase",
  "label": "UK C2R — Acquisition phase",
  "description": "Commercial-to-Residential UK strategie, sourcing-fase. Switch automatisch naar Develop-to-Hold zodra eerste project is verworven.",
  "default_kpis": [
    {
      "id": "qualified_pipeline_gbp",
      "label": "Qualified pipeline £ GDV",
      "formula": "sum(estimated_GDV) where feasibility_status='qualified'",
      "thresholds": { "green": ">=8000000", "yellow": "3000000-8000000", "red": "<3000000" },
      "escalation": "value < 3000000 for 2+ months"
    },
    {
      "id": "time_lead_to_loi_days",
      "label": "Time-from-lead-to-LOI (dagen)",
      "formula": "median(loi_signed_date - lead_first_seen_date) over 90d",
      "thresholds": { "green": "<=21", "yellow": "22-45", "red": ">45" },
      "escalation": "median > 60 days"
    },
    {
      "id": "capital_deployment_ratio",
      "label": "Capital deployment ratio",
      "formula": "committed_capital / total_available_capital",
      "thresholds": { "green": "0.60-0.85", "yellow": "0.30-0.60 OR 0.85-0.95", "red": "<0.30 OR >0.95" },
      "escalation": "ratio < 0.30 for 2+ months"
    }
  ],
  "default_connectors": {
    "accounting": ["Xero"],
    "deal_pipeline": ["HubSpot-free", "Notion-pipeline"],
    "feasibility_data_optional": ["Land-Registry", "Rightmove-feed", "Knight-Frank-research"]
  },
  "phase_switch": {
    "to_template": "Property-Develop-to-Hold",
    "trigger": "first_acquired_project.exists == true"
  }
}
```

---

## Sirrapa C2R Acquisition Thesis — uit NotebookLM SPG-Development

**Strategy name:** "Hyper-Local Class MA Sniper Approach"

### Geografisch
- **Primair:** Southampton, Portsmouth (Hampshire — sterke economische fundamentals, woningtekort)
- **Secundair:** Winchester, Basingstoke
- **Hyper-local focus** — geen breed UK-mandaat; concentratie wint van diversificatie in deze fase

### Asset types (Class E commercieel)
| Strategie | Asset shape | Doelhuurder | USP |
|---|---|---|---|
| **Class MA** (commercial → residential) | Vrijstaand / halfvrijstaand kantoor of light industrial | Specialised Supported Housing (SSH) zorgaanbieders | Gelijkvloers, rolstoeltoegankelijk, eigen parkeren |
| **Class G** (retail uppers) | Terraced winkelpand high street, bij voorkeur end-of-terrace | Mixed-use: winkel onder + woningen erboven | Hoekpand met aparte ingang voor bovenwoning |

### Size
- **2.000 – 10.000 sq ft** per pand
- **5 – 20 units** per project
- Capital allocation: **£5M+** (in pitch naar agents/sellers gepositioneerd)

### Return-criteria (HARDE GATES)
- **Minimum profit margin: 20–30% op total cost** (acquisitiekost + bouw + finance + fees)
- **Equity buffer: 20–30% op dag 1** — wij kopen alleen als markt > 30% moet dalen voor inleg in gevaar komt
- **Return on Equity: ≥ 20%** (kwartaaldoel: 1e deal Heads of Terms gesigneerd met deze criteria)

### Capital stack
| Laag | LTV | Rente / rendement | Zekerheid |
|---|---|---|---|
| Senior Debt (commerciële bank) | 65–70% | ~9–10% | First Charge |
| Mezzanine (NL holding / private investors / family offices) | 20–30% | 8–12% (soms 12–15%), rolled-up | Second Charge |
| Developer Equity (Sirrapa) | 0–10% | "sweat equity" | Aandelen / P.G. |

### Exit-strategie: **Develop-to-Hold**
- Geen flip — refinancieren post-conversion en aanhouden voor lange termijn cashflow
- Verhuur via **FRI leases** (Full Repairing and Insuring) aan blue-chip counterparties:
  - **SSH** (Specialised Supported Housing) — Housing Associations / zorginstellingen, government-backed contracts
  - **PBSA** (Purpose-Built Student Accommodation) — Tier-1 universiteiten

### Sourcing-kanalen voor M&A Scout
- **Volume:** top-10 commercial agents in Hampshire — Lambert Smith Hampton, Savills Southampton, Primmer Olds B.A.S, Keygrove. Wekelijkse calls (Maandag-cadence).
- **Kwaliteit:** direct-to-vendor approach — "any vacant B1 offices or retail uppers sitting on market 6+ months?"
- **Leads:** stalled planning applications via local architects + planning consultants in Hampshire
- **Off-market:** direct mail aan eigenaren van vacant Class E in target postcodes (10 brieven/week)

### Geüpdatete feasibility-criteria voor de M&A Scout sub-agent

```yaml
acquisition_thesis_uk:
  geography:
    primary: ["Southampton", "Portsmouth"]
    secondary: ["Winchester", "Basingstoke"]
  asset:
    use_class_in: ["E"]
    floor_area_sqft: [2000, 10000]
    units_per_project: [5, 20]
    sub_strategies:
      - { id: "class_ma_ssh", asset_shape: "detached/semi-detached", target_tenant: "SSH" }
      - { id: "class_g_mixed_use", asset_shape: "terraced_high_street", target_tenant: "mixed_retail_resi" }
  financial_gates:
    min_margin_on_total_cost_pct: 20
    target_margin_pct: 25
    min_return_on_equity_pct: 20
    equity_buffer_pct_min: 20
  capital_stack:
    senior_debt_ltv_max: 0.70
    mezzanine_ltv_max: 0.30
    developer_equity_pct: 0.10
    mezz_rate_target_pct: [10, 12]
  exit:
    strategy: "develop-to-hold"
    target_lease_type: "FRI"
    target_tenant_categories: ["SSH", "PBSA", "Council", "HA"]
```

### Wat dit verandert in de KPI-thresholds

**Qualified pipeline (KPI 1):** definitie aangescherpt — "qualified" = passes de 20% margin gate én 20% ROE in desktop appraisal. Niet alleen "yield-on-cost ≥ 7%".

**Capital deployment ratio (KPI 3):** noemer = £5M+ allocation (gecommunicerd aan agents). Teller = cash + commitments in actieve LOI/DD/exchange. Idle £5M = rood.

**Time-to-LOI (KPI 2):** in lijn met weekly cadence (5 calls + 3 desktop appraisals + 1 site viewing/HoT per week) is target ≤ 21 dagen realistisch voor pre-qualified targets.

### Quarterly milestone tracking (uit notebook)

> **Q1 2026 doel (uit notebook):** 1e deal Heads of Terms gesigneerd op underutilised commercial asset in Southampton, ≥ 20% ROE.

**Status check (board-relevant):** vandaag is 26 april 2026 — Q1 2026 is voorbij. Als er geen HoT is gesigneerd in Q1, is dat een **flag voor de CEO-agent**: was de target te ambitieus, of is sourcing-velocity te laag? CEO sub-agent moet dit als eerste agendapunt opnemen in de Sprint 0 board run.

**Weekly leading indicators** (COO-tracking):
- 5 commercial agent calls/week in Hampshire
- 3 desktop appraisals/week tegen 20%+ margin filter
- 1 site viewing OF 1 HoT-offer/week
- 10 direct-mail letters/week naar Class E-eigenaren
- 2 architect/planning consultant connecties/week

### Notebook-koppeling

De M&A Scout sub-agent kan via MCP de SPG NotebookLM notebooks bevragen:
- `SPG - Development` → masterthesis (gebruikt voor scoring-criteria)
- `SPG - Area SOU & PO` → market intelligence Hampshire
- Specifieke target-notebooks (`77-81 Shirley High Street`, `42 High Street Southampton`, etc.) → per-asset due diligence

> Dit is een **uniek Quorima-voordeel**: de M&A Scout heeft directe toegang tot alle bestaande research, zonder dat Armand opnieuw briefs hoeft te schrijven.
