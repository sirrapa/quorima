# Quorima — Integrator Wizard Blueprint

**Versie:** v0.2 · 26 april 2026
**Doelgebruiker:** Integrator (consultant / implementatie-partner) configureert Quorima voor een specifieke organisatie.
**Filosofie:** Hybride — *template-eerst, daarna verfijning*. Integrator kiest per BV een entity-type-template; de defaults zijn 80% goed; restant verfijnt hij in 1 sessie met de klant.

---

## Wizard structuur op hoog niveau

```
[ Stap 1 ] Deployment & licensing
   → SaaS multi-tenant of On-prem single-tenant
   → License key / Stripe sub
   → Anthropic workspace key

[ Stap 2 ] Holding setup
   → Holding naam, ultimate beneficial owner
   → Rapportagevaluta + fiscaal jaar
   → IFRS / NL GAAP rapportage-niveau

[ Stap 3 ] Voeg werkmaatschappijen toe (per BV / Ltd)
   → Land · valuta · GAAP · entity-type-template kiezen
   → Boekhoud-systeem koppelen (OAuth flow)
   → CRM koppelen indien relevant
   → KPIs accepteren of customizen
   → Escalatie-thresholds review

[ Stap 4 ] Cross-entity rules
   → Intercompany detectie · FX strategie · consolidatie kalender

[ Stap 5 ] Board configuratie
   → Welke C-level agents activeren
   → Communicatiekanalen (Slack/email/Teams)
   → Rapportageritmes (daily flash, weekly digest, monthly close)

[ Stap 6 ] Permissions
   → Owner / Board / C-level / Read-only rol per persoon

[ Stap 7 ] First run + sign-off
   → Wizard triggert kennismakings-board run
   → Integrator + klant tekenen output af
```

---

## Entity-type templates — catalogus

De wizard kent een groeiende set templates. **Per Sirrapa Group-tenant gebruiken we vier templates** (eentje per werkmaatschappij plus `Holding-Consolidation` voor de holding zelf).

### Template `ICT-Solo-Freelance`
Voor een ICT-vehikel met één natuurlijk persoon die freelance factureert (zoals Sirrapa ICT B.V.).

```json
{
  "template_id": "ICT-Solo-Freelance",
  "label": "ICT — Solo freelance / 1 persoons",
  "description": "DGA factureert zelf bij 1 of enkele klanten. Concentratie- en pipeline-KPI's.",
  "default_kpis": [
    {
      "id": "client_concentration_pct",
      "label": "Klant-concentratie %",
      "formula": "revenue_top_client_12m / total_revenue_12m * 100",
      "thresholds": { "green": "<=40", "yellow": "40-70", "red": ">70" },
      "escalation": "client_concentration_pct > 80 for 2+ quarters"
    },
    {
      "id": "monthly_billed_revenue",
      "label": "Effectieve maandomzet",
      "formula": "sum(invoice_amount) where invoice_date in month",
      "thresholds": { "green": ">=target", "yellow": "0.8-1.0*target", "red": "<0.8*target" },
      "escalation": "monthly_billed_revenue < 0.7*target for 2 months"
    },
    {
      "id": "pipeline_diversification_index",
      "label": "Pipeline diversificatie-index",
      "formula": "count(crm_deals where stage in ['qualified','proposal','verbal'] and account_id != top_client_id)",
      "thresholds": { "green": ">=2", "yellow": "1", "red": "0" },
      "escalation": "pipeline_diversification_index = 0 AND client_concentration_pct > 80"
    }
  ],
  "default_connectors": {
    "accounting": ["ExactOnline", "Twinfield"],
    "crm_optional": ["HubSpot-free", "Notion-Pipeline"],
    "psa": null
  },
  "default_chart_of_accounts_mapping": "nl-gaap-services-solo",
  "primary_agents": ["CMO", "CEO", "CFO"]
}
```

### Template `Property-Income-Geared`
Voor vastgoed-BV met huurinkomsten en hoge financiering / negatieve cashflow risico (zoals Sirrapa Vastgoed B.V.).

```json
{
  "template_id": "Property-Income-Geared",
  "label": "Vastgoed — Income, gefinancierd",
  "description": "Commerciele/zakelijke verhuur met hoge debt service. Survival-triangle KPIs.",
  "default_kpis": [
    {
      "id": "dscr",
      "label": "Debt Service Coverage Ratio",
      "formula": "noi_12m / (interest_12m + principal_12m)",
      "thresholds": { "green": ">=1.25", "yellow": "1.0-1.25", "red": "<1.0" },
      "escalation": "dscr < 1.0 for 2+ quarters → covenant + refinance immediate"
    },
    {
      "id": "noi_monthly",
      "label": "Net Operating Income (maandelijks)",
      "formula": "rental_income - operating_expenses (excl interest, depreciation, tax)",
      "thresholds": { "green": ">=budget", "yellow": "0.9-1.0*budget", "red": "<0.9*budget" },
      "escalation": "noi_yoy_drop > 10%"
    },
    {
      "id": "wacc_debt_and_refi_runway",
      "label": "Gewogen rente & refi-runway",
      "formula": "wacc = sum(loan_balance * rate) / sum(loan_balance); refi_runway = min(months_to_next_repricing)",
      "thresholds": {
        "green": "wacc<5 AND refi_runway>18",
        "yellow": "wacc 5-7 OR refi_runway 6-18",
        "red": "wacc>7 OR refi_runway<6"
      },
      "escalation": "refi_runway < 6 AND dscr < 1.0 → crisis protocol"
    }
  ],
  "default_connectors": {
    "accounting": ["ExactOnline", "Twinfield"],
    "property_management_optional": ["Rentman", "Twinq", "Manual-spreadsheet"],
    "loan_admin": ["Manual-loan-register", "Bank-feed (Ponto/Tink)"]
  },
  "default_chart_of_accounts_mapping": "nl-gaap-realestate-bv",
  "primary_agents": ["CFO", "CEO"]
}
```

### Template `Property-Develop-to-Hold`
Voor property die ontwikkelt om te behouden voor income (zoals Sirrapa Property Group Ltd.).

```json
{
  "template_id": "Property-Develop-to-Hold",
  "label": "Vastgoed — Develop-to-hold",
  "description": "Build/refurb projecten worden behouden voor rental income. Yield-on-cost als kern.",
  "default_kpis": [
    {
      "id": "stabilized_yield_on_cost",
      "label": "Stabilized Yield-on-Cost",
      "formula": "stabilized_noi / total_project_cost (acquisition + works + soft costs)",
      "thresholds": { "green": ">=0.07", "yellow": "0.055-0.069", "red": "<0.055" },
      "escalation": "yield_on_cost < 0.06 at planning → CEO go/no-go"
    },
    {
      "id": "time_to_stabilization_months",
      "label": "Time-to-Stabilization",
      "formula": "months from acquisition_date until occupancy >= 0.9 at target_rent",
      "thresholds": { "green": "<=plan", "yellow": "plan+1..plan+3", "red": ">plan+3" },
      "escalation": "actual > plan + 6 months"
    },
    {
      "id": "stabilized_portfolio_yield_dscr",
      "label": "Stabilized portfolio Net Yield + DSCR",
      "formula": "net_yield = annual_net_rent / current_value; dscr = noi / debt_service",
      "thresholds": {
        "green": "yield>=0.055 AND dscr>=1.4",
        "yellow": "one off",
        "red": "yield<0.045 OR dscr<1.2"
      },
      "escalation": "dscr<1.2 OR yield<0.045 → portfolio rebalance"
    }
  ],
  "default_connectors": {
    "accounting": ["Xero", "QuickBooks-Online"],
    "psa_or_project_tracker": ["Asana", "Monday", "Custom-Notion"],
    "valuation": ["Manual-quarterly", "Knight-Frank-feed-optional"]
  },
  "default_chart_of_accounts_mapping": "uk-frs102-realestate-ltd",
  "primary_agents": ["CFO", "COO", "CEO"]
}
```

### Template `Holding-Consolidation`
Voor een pure holding boven werkmaatschappijen (zoals Sirrapa Group Holding B.V.). Geen operationele KPI's — de holding stuurt op kapitaalallocatie, groeps-liquiditeit en intercompany-hygiëne. Dit is de gerealiseerde, consolidatie-specifieke vorm van het generieke `Family-Office-Holding`-idee.

```json
{
  "template_id": "Holding-Consolidation",
  "label": "Holding — consolidatie & kapitaalallocatie",
  "description": "Pure holding boven de werkmaatschappijen. Geen ops-KPIs; stuurt op groeps-liquiditeit, dry powder en intercompany-discipline.",
  "default_kpis": [
    {
      "id": "consolidated_net_cash_runway",
      "label": "Geconsolideerde netto cash + groeps-runway",
      "formula": "net_cash = sum(cash_all_entities + holding) - debt_service_due_90d; runway_months = net_cash / consolidated_monthly_net_burn",
      "thresholds": { "green": ">=12", "yellow": "6-12", "red": "<6" },
      "escalation": "runway_months < 6 → CFO+CEO liquidity protocol; runway_months <= entity('sirrapa-vastgoed').refi_runway → escalate_to_human()"
    },
    {
      "id": "free_deployable_capital",
      "label": "Vrije allocatie-ruimte (dry powder)",
      "formula": "net_cash - opco_operating_buffer(~3m opex) - committed_capital_calls_6m - debt_service_6m",
      "thresholds": { "green": ">=committed_calls_6m + vastgoed_refi_gap", "yellow": "covers one", "red": "covers neither" },
      "escalation": "free_deployable_capital < vastgoed_refi_gap → CEO capital-allocation beslissing (UK pauzeren of externe funding)"
    },
    {
      "id": "intercompany_and_mgmt_fee_coverage",
      "label": "Intercompany-discipline + mgmt-fee dekking",
      "formula": "ic_unreconciled = abs(net_intercompany_not_eliminated); mgmt_fee_coverage = mgmt_fee_income / holding_standalone_opex",
      "thresholds": {
        "green": "ic_unreconciled<=1000 AND no_item>90d AND coverage>=1.0",
        "yellow": "ic drift unknown OR coverage 0.8-1.0",
        "red": "item>90d OR coverage<0.8"
      },
      "escalation": "mgmt_fee_coverage < 0.8 OR ic_unreconciled > cross_entity.threshold at monthly close → CFO flag"
    }
  ],
  "default_connectors": {
    "accounting": ["Twinfield"],
    "consolidation": ["Quorima-native (multi-entity rollup)"],
    "bank_feed_optional": ["Ponto", "TrueLayer"]
  },
  "default_chart_of_accounts_mapping": "nl-gaap-holding-consolidation",
  "primary_agents": ["CFO", "CEO", "Chief-of-Staff"]
}
```

### Andere templates (toekomstige uitbreiding)
- `ICT-Services-Team` (≥3 consultants, MSP/retainers)
- `ICT-Product-SaaS` (ARR-driven)
- `Property-Develop-to-Sell` (flip strategy, GDV/cost focus)
- `Property-Pure-Investment` (geen development, alleen acquisitie & hold)
- `Trading-Distribution` (inventory, working capital)
- `Manufacturing-SME`
- `Healthcare-Practice`
- `Family-Office-Holding` (capital allocation only, geen ops)

---

## Wizard form-schema (JSON)

Dit is de payload die de integrator-wizard verzamelt. Wordt aan het eind opgeslagen als `tenant_config.json` in de Quorima datalaag en gebruikt om alle agents te configureren.

```json
{
  "$schema": "https://quorima.ai/schemas/tenant-config-v1.json",
  "tenant_id": "sirrapa-group-2026",
  "deployment": {
    "mode": "saas",
    "region": "eu-west",
    "anthropic_workspace": {
      "type": "platform.claude.com",
      "workspace_name": "sirrapa-group-quorima",
      "default_model_overrides": {
        "ceo_agent": "claude-opus-4-6",
        "cfo_agent": "claude-opus-4-6",
        "coo_agent": "claude-sonnet-4-6",
        "cmo_agent": "claude-sonnet-4-6"
      }
    }
  },
  "holding": {
    "legal_name": "Sirrapa Group Holding B.V.",
    "ultimate_beneficial_owner": "Armand Parris",
    "reporting_currency": "EUR",
    "fiscal_year_start": "01-01",
    "consolidation_gaap": "nl-gaap"
  },
  "entities": [
    {
      "id": "sirrapa-ict",
      "legal_name": "Sirrapa (ICT) B.V.",
      "country": "NL",
      "currency": "EUR",
      "gaap": "nl-gaap",
      "template": "ICT-Solo-Freelance",
      "connectors": {
        "accounting": { "vendor": "ExactOnline", "oauth_status": "pending" },
        "crm": { "vendor": "HubSpot", "oauth_status": "pending", "tier": "free" }
      },
      "kpi_overrides": [],
      "thresholds_overrides": {
        "monthly_billed_revenue.target_eur": 16000
      }
    },
    {
      "id": "sirrapa-vastgoed",
      "legal_name": "Sirrapa Vastgoed B.V.",
      "country": "NL",
      "currency": "EUR",
      "gaap": "nl-gaap",
      "template": "Property-Income-Geared",
      "connectors": {
        "accounting": { "vendor": "ExactOnline", "oauth_status": "pending" },
        "property_management": { "vendor": "Manual-spreadsheet" },
        "bank_feed": { "vendor": "Ponto", "oauth_status": "pending" }
      },
      "kpi_overrides": [],
      "manual_inputs_required": [
        "loan_register.csv (lender, balance, rate, repricing_date, fixed_period_end)"
      ]
    },
    {
      "id": "sirrapa-property-uk",
      "legal_name": "Sirrapa Property Group Ltd.",
      "country": "GB",
      "currency": "GBP",
      "gaap": "frs-102",
      "template": "Property-Develop-to-Hold",
      "connectors": {
        "accounting": { "vendor": "Xero", "oauth_status": "pending" },
        "project_tracker": { "vendor": "Asana", "oauth_status": "pending" }
      },
      "kpi_overrides": [],
      "manual_inputs_required": [
        "active_projects.csv (project_id, acquisition_date, total_cost, target_noi, expected_stabilization_date)"
      ]
    }
  ],
  "cross_entity": {
    "intercompany_detection": true,
    "fx_strategy": {
      "pnl_lines": "period_average",
      "balance_sheet_lines": "period_close",
      "ocr_translation_diff": "to_oci"
    },
    "consolidation_calendar": {
      "daily_flash": "08:00 CET",
      "weekly_digest": "Mon 09:00 CET",
      "monthly_close": "5th business day"
    }
  },
  "board_config": {
    "agents_active": ["chief_of_staff", "ceo", "cfo", "coo", "cmo"],
    "channels": {
      "slack_workspace_id": "T0XXXXXXX",
      "email_recipients": ["armand.parris@sirrapagroup.com"]
    },
    "report_cadence": {
      "daily_flash": ["cfo"],
      "weekly_digest": ["ceo", "cfo", "cmo"],
      "monthly_close": ["cfo"],
      "ad_hoc": ["ceo", "cmo"]
    },
    "escalation_routing": {
      "default_human_recipient": "armand.parris@sirrapagroup.com",
      "channel": "email_and_slack"
    }
  },
  "permissions": [
    {
      "user_email": "armand.parris@sirrapagroup.com",
      "role": "owner",
      "scope": "all_entities"
    }
  ],
  "compliance": {
    "data_processor_agreement_signed": false,
    "dpia_required": true,
    "anthropic_zero_retention_requested": true
  },
  "billing": {
    "tier": "Holding-SaaS",
    "stripe_customer_id": null,
    "soft_cap_tokens_per_month": null
  }
}
```

---

## Wizard-stappen — gedetailleerd (UX-niveau)

### Stap 1: Deployment & licensing (5 min)
| Veld | Type | Validatie |
|---|---|---|
| Deployment mode | radio: SaaS / On-prem | required |
| Region (SaaS) | dropdown: eu-west / eu-central / us-east | required if SaaS |
| Anthropic API key | password input | live test-call validatie |
| Anthropic workspace name | text | unique check |
| License key (on-prem) | text | check tegen license server |

### Stap 2: Holding setup (3 min)
| Veld | Type | Default |
|---|---|---|
| Legal name | text | — |
| UBO | text | — |
| Reporting currency | dropdown ISO 4217 | EUR |
| Fiscal year start | date (DD-MM) | 01-01 |
| Consolidation GAAP | dropdown: NL GAAP / IFRS / FRS 102 / US GAAP | NL GAAP |

### Stap 3: Werkmaatschappijen — herhaal per BV (10 min/stuk)

#### 3a. Basis
| Veld | Type | Default |
|---|---|---|
| Legal name | text | — |
| Country | dropdown | — |
| Currency | dropdown | suggested by country |
| Local GAAP | dropdown | suggested by country |
| **Entity-type-template** | **dropdown** met preview-card | — |

> De template-keuze is het sleutelmoment: kiest de integrator `Property-Income-Geared`, dan worden in 3b–3d de juiste connectors, KPI's en velden voorgevuld.

#### 3b. Connectors per entiteit
Wizard toont alleen de connectors die bij de template passen (volgens `default_connectors`). Bij elke connector: OAuth-knop of manual-upload-fallback.

#### 3c. KPI's accepteren / customizen
Tabel met de 3 default-KPI's van de template. Per KPI:
- Naam (read-only)
- Formule (read-only, expandable detail)
- **Thresholds (editable)** — green/yellow/red per KPI
- **Target waarden (editable)** — bv `monthly_billed_revenue.target_eur` voor ICT-Solo
- **Toggle**: KPI actief / inactief
- **+ Custom KPI toevoegen** (optioneel, advanced)

#### 3d. Escalation rules per KPI
Pre-filled vanuit template; integrator kan ontvangers aanpassen of severity verhogen.

### Stap 4: Cross-entity (5 min)
- Intercompany-detectie aan/uit + drempel (default: > €1K of > 0.5%)
- FX strategie (default vooringevuld per IFRS / NL GAAP convention)
- Consolidatie-kalender (daily/weekly/monthly tijden)

### Stap 5: Board configuratie (5 min)
- Welke agents actief
- Slack workspace OAuth + email recipients
- Cadence per rapportage-type

### Stap 6: Permissions (3 min)
- Voeg gebruikers toe met email + rol
- Optioneel: SSO/SAML config (alleen Enterprise tier)

### Stap 7: First run + sign-off (10 min wachten)
- Wizard triggert async een **dry run** van alle 4 agenten met de zojuist geconfigureerde data
- Geeft per agent een sample output
- Integrator + klant (UBO) tekenen digitaal af → tenant gaat live

---

## Defaults per land / valuta combinatie (auto-fill)

| Country | Currency | GAAP | Default accounting | Default bank feed |
|---|---|---|---|---|
| NL | EUR | NL GAAP | Exact Online | Ponto / Tink |
| BE | EUR | BE GAAP | Exact / Yuki | Ponto |
| DE | EUR | HGB | DATEV / Lexware | finAPI |
| GB | GBP | FRS 102 | Xero | TrueLayer |
| US | USD | US GAAP | QuickBooks Online | Plaid |
| IE | EUR | FRS 102 | Xero | TrueLayer |

---

## Validatie-regels (wizard kan niet verder voordat...)

1. Holding rapportagevaluta is gezet.
2. Minimaal 1 entiteit toegevoegd (anders is consolidatie zinloos).
3. Per entiteit minstens accounting connector OAuth voltooid OF manual mapping bevestigd.
4. Per template alle `manual_inputs_required` files geupload.
5. Anthropic API key is gevalideerd via test-call.
6. Owner-rol is toegekend aan minstens 1 user.
7. (SaaS) Stripe-subscription is actief OF in trial.

---

## Volgende uitbreidingen na v1

- **Reusable client config-bibliotheek** voor integrators — eigen template-overrides opslaan en hergebruiken bij andere klanten.
- **Setup recorder** — sla het ingevulde formulier op als JSON; later opnieuw deployen voor sandbox of staging.
- **Diff-mode** — bij wijzigingen aan tenant config: toon impact (welke agents/connectors raken het) voor approve.
- **White-label** — branded wizard voor accountancy-/MSP-firma's die Quorima onder eigen merk verkopen.
