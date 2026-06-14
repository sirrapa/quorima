# Quorima

Agentic C-level board (SaaS) voor **Sirrapa Group Holding B.V.** (100% Armand Parris). Een Chief of Staff orchestreert vier C-level agents (CEO/CFO/COO/CMO) over de holding en drie werkmaatschappijen (Sirrapa ICT, Sirrapa Vastgoed, Sirrapa Property Group Ltd). Alle redeneerwerk via Claude API + Agent SDK; tools volgen `domain.action`; escalaties lopen altijd via Chief of Staff → `escalate_to_human()`.

## Componenten

| Map | Wat | Status |
|---|---|---|
| `agent_prompts/` | system-prompts: Chief of Staff + CEO/CFO/COO/CMO | 📋 prompts; alleen CFO draait als code |
| `quorima-mvp/` | werkende CFO daily-flash (TS): ports/adapters, KPI-engine, escalatie, digest | ✅ draaiende code |
| `kpis/` | KPI-definities per werkmaatschappij, UK-acquisitie en holding | 📋 gedefinieerd |
| `connectors/` | Twinfield (OAuth2) + Xero/HubSpot/Ponto/TrueLayer setup-notities | Twinfield-adapter ✅, rest 📋 |
| `wizard/` | integrator-wizard blueprint, tenant-config, 5 entity-templates | 📋 spec |
| `dashboard/` | management-cockpit (statisch) + live factuur-feed | ✅ statisch + feed |
| `branding/`, `strategy/` | brand/IP-plan, groei- en C2R-strategie | assets/docs |

Architectuur-detail: `Quorima_Architectuur_v0.4.docx`. Draaiende deel = één verticale plak (CFO daily-flash voor Vastgoed via de Ports-laag).

## Twee CFO-lagen (Quorima ↔ Hermes)

Naast Quorima draait er al een **tweede CFO-laag** op Hermes — let op het onderscheid:

- **Quorima-CFO** = *board/analyse*: leest Twinfield grootboek → DSCR/NOI/refi + escalaties (deze repo).
- **Hermes-CFO** = *admin/operatie*: de Gmail factuur-pipeline (triage, Basecone-routing, betaalmonitor), always-on op Hermes. Gedocumenteerd in de MyBrain-vault `03. Areas/financial-control/`.

Ze koppelen via de Twinfield office-codes: Hermes duwt facturen de boeken in (Basecone→Twinfield), Quorima leest ze eruit. Het dashboard toont de Hermes-output via `dashboard/data/invoice-overview.json`. Zie `HANDOFF-2026-06-13.md` → "Cross-link naar het Hermes/CFO-deel".

## Status / connectiviteit

- Connectors staan op `oauth_status: pending` — nog geen live financiële data.
- **Twinfield** is gemigreerd naar OAuth2 (oude SOAP-logon is door Twinfield uitgezet); wacht op een geregistreerde OAuth-app (`client_id`/`secret`) via de accountant/Twinfield-helpdesk. Zie `connectors/twinfield_oauth2_migration.md`.
- Verificatie: `cd quorima-mvp && npm install && npm run flash:dry-run` (Vastgoed daily-flash op mock); open `dashboard/index.html` via de Launch preview.
