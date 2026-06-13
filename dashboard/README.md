# Quorima - Management dashboard

Statische momentopname die als cockpit dient over de agentic C-suite van de holding (Sirrapa Group Holding B.V.): per werkmaatschappij de must-watch KPIs, openstaande flags en de connector-status.

## Bestanden

- `index.html` - het dashboard. Open in een browser of via de Launch preview.

## Datastatus (belangrijk)

Conform de CFO-regel "nooit een cijfer zonder bron":

- Connectors (Twinfield, Xero, HubSpot, Ponto, TrueLayer) staan op `oauth_status: pending` in de tenant-config, dus er is nog geen live financiele data.
- Getoonde KPI-waarden zijn targets/drempels of mock uit de CFO-MVP (`quorima-mvp/output/flash-2026-04-27.md`).
- Admin-items (openstaande facturen, Basecone-draft) zijn live uit de Gmail factuur-pipeline (MyBrain financial-control).

## Bronnen

- `kpis/KPIs_per_werkmaatschappij.md`
- `kpis/UK_C2R_Acquisition_Phase_KPIs.md`
- `wizard/sirrapa_tenant_config.example.json`
- `quorima-mvp/README.md` + `output/flash-2026-04-27.md`
- `agent_prompts/` (rolverdeling C-suite)

## Live maken

1. Koppel de connectors (OAuth) per entiteit; begin met Twinfield voor Vastgoed (de CFO-MVP draait daar al op).
2. Voed de KPI-waarden uit de Ports-laag (`accounting.*` etc.) in plaats van mock.
3. Genereer het dashboard uit dezelfde data als de daily flash, zodat elk cijfer traceerbaar blijft naar een tool-call.

Brand: Quorima purple `#6b46c1` / navy `#1f3864`, Lato. Zie `branding/logo/BRAND_GUIDE.md`.
