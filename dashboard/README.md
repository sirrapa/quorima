# Quorima - Management dashboard

Statische momentopname die als cockpit dient over de agentic C-suite van de holding (Sirrapa Group Holding B.V.): per werkmaatschappij de must-watch KPIs, openstaande flags en de connector-status.

## Bestanden

- `index.html` - het dashboard. Open via de Launch preview of een webserver (de factuur-feed laadt niet via `file://` wegens CORS).
- `data/invoice-overview.json` - de **live** factuur-feed (echte bedragen/ID's). **Gitignored** — Hermes schrijft dit lokaal, het wordt niet gecommit. Zie "Factuur-feed (Hermes)".
- `data/invoice-overview.example.json` - placeholder-versie (wel gecommit), als fallback en schema-voorbeeld.

## Factuur-feed (Hermes)

De sectie "Openstaande facturen - CFO-admin" wordt niet meer hardgecodeerd maar ingelezen uit `data/invoice-overview.json`. Dat is het koppelpunt met de **Hermes Gmail factuur-pipeline** (MyBrain `03. Areas/financial-control/`): Hermes/Freya genereert het overzicht en schrijft (of synct) het naar dit pad. Het dashboard fetcht het bij het laden; bij afwezigheid toont het netjes "geen feed".

Contract `quorima.invoice-overview.v1`:

```json
{
  "schema": "quorima.invoice-overview.v1",
  "generated_at": "ISO-8601 met tz",
  "source": "Hermes Gmail factuur-pipeline (Freya)",
  "account": "armand.parris@sirrapa.com",
  "invoices": [
    {
      "entity": "SIT|SVG|SGH|SPG|null",
      "office": "21005|21006|21007|null",
      "supplier": "string",
      "reference": "factuur-/draftnummer",
      "amount_eur": 0.0,
      "due_date": "YYYY-MM-DD|null",
      "status": "incasso|monitor|still-to-pay|basecone-draft|review",
      "link": "gmail-permalink|null",
      "note": "string|null"
    }
  ]
}
```

`status` mapt op de drie routeringsklassen uit de unified spec (incasso/monitor/still-to-pay) plus `basecone-draft` (wacht op approval) en `review`. `office` is de Twinfield office-code = dezelfde codes als in de tenant-config en de Basecone-routing.

**Privacy:** de live `data/invoice-overview.json` bevat echte bedragen en Basecone-ID's en is daarom **gitignored** (de repo is publiek). Hermes schrijft/synct dit bestand lokaal; het dashboard fetcht het en valt terug op `invoice-overview.example.json` (placeholder) als het ontbreekt. Alleen de `.example` wordt gecommit.

## Datastatus (belangrijk)

Conform de CFO-regel "nooit een cijfer zonder bron":

- Connectors (Twinfield, Xero, HubSpot, Ponto, TrueLayer) staan op `oauth_status: pending` in de tenant-config, dus er is nog geen live financiele data.
- Getoonde KPI-waarden zijn targets/drempels of mock uit de CFO-MVP (`quorima-mvp/output/flash-2026-04-27.md`).
- Openstaande facturen (CFO-admin) komen uit de live feed `data/invoice-overview.json`, gevoed door de Hermes Gmail factuur-pipeline (MyBrain financial-control). Zie "Factuur-feed (Hermes)".

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
