# Case Study — From 6 hours to 30 minutes per appraisal: building an AI-powered Class MA sourcing engine

*Published on LinkedIn / sirrapagroup.com · publicatie-klaar concept voor Track 1 (Productized Retainer) en Track 4 (PropTech-niche). Gebaseerd op Armand's daadwerkelijke werkwijze met NotebookLM + Claude bij Sirrapa Property Group.*

---

**TL;DR.** Class MA conversies in Hampshire werken alleen als je veel deals snel kunt screenen. Wij gingen van 6 uur per desktop-appraisal naar 30 minuten door commercial agent leads, planning data, comparables en lender-criteria in één AI-aangedreven research-stack te combineren. Hieronder het hoe en waarom — en wat het voor andere property operators kan betekenen.

---

## Waarom desktop-appraisal vroeger 6 uur duurde

Een typisch Class MA-target in Southampton landt bij ons via één van vier kanalen: een commercial agent (Lambert Smith Hampton, Savills, Primmer Olds B.A.S, Keygrove), een direct-mail-respons van een vacant Class E-eigenaar, een stalled planning application via een architect, of een auction-listing.

Wat doe je vervolgens? Voordat je een Heads of Terms tekent moet je weten:

1. **Use Class** — is het echt Class E? (geen office-to-resi exclusion via artikel 4 directive)
2. **PD-feasibility** — past het binnen Class MA criteria (max sq ft, max units, ratio toilets/woningen, daglicht)
3. **Indicative GDV** — verkoop- of verhuurwaarde van de geconverteerde appartementen op basis van comparables in een straal van 500m
4. **Total cost** — acquisitie + bouw (£/sq ft conversion-rate vergelijkbaar met andere C2R-projecten in Hampshire) + finance + fees
5. **Margin op total cost** — ≥ 20% of we kijken niet verder
6. **Exit-fit** — geschikt voor SSH (rolstoeltoegankelijk, parkeren, zorginstelling-eisen)? Of PBSA (afstand tot universiteit)? Of straight buy-to-let?
7. **Capital stack** — past het in onze 65/25/10 senior/mezz/equity structuur?

Per target kost dit handmatig 4–6 uur: planning portal openen, Land Registry, Rightmove + Zoopla voor comparables, Companies House voor de verkoper, BCIS voor build cost, lokale research voor SSH-aanbieders, planning consultant bellen voor PD-feasibility.

In een week zien we 8–12 nieuwe leads. Met 6 uur per appraisal is dat 48–72 uur — meer dan een fulltime job alleen voor screening. Dat is geen schaalbaar model.

## Wat we gebouwd hebben

We hebben de research-stack rond drie principes gebouwd:

**1. Capture once, query forever.** Elke target krijgt een eigen research-bundel: agent particulars (PDF), planning portal extracts, Land Registry titel, lokale comparables, BCIS-cost references, en lokale zorgaanbieders / universiteits-data. Bundel sources gaan in [Google NotebookLM](https://notebooklm.google.com) — een tool die specifiek voor multi-source research-grounding is gebouwd.

**2. Centralized thesis als grounding-laag.** Onze hele acquisitie-thesis (Hyper-Local Class MA Sniper Approach: Hampshire focus, 20%+ margin gate, FRI-leases met SSH/PBSA exit) zit als een eigen notebook en wordt automatisch meegenomen in elke target-evaluatie. Alle outputs worden tegen de thesis getoetst — niet ad-hoc tegen vage onderbuik.

**3. Structured output, not prose.** De AI-agent produceert geen vrije tekst maar een vast template: GDV range met low/mid/high, total cost breakdown, margin %, equity required, ROE, exit-fit score, three top risks. Dat past één-op-één in onze bestaande deal-tracker en kan direct in een investor pitch deck.

De stack:
- **NotebookLM** voor source-management en cross-document Q&A
- **Claude (Opus 4.6)** als reasoning-laag — voor cijfermatige feasibility, comparable-selection, en boardroom-grade output
- **Custom MCP-connectors** naar Land Registry, planning portals, en Rightmove voor live data
- **Eigen Twinfield + Xero koppeling** zodat post-acquisitie alle financial truth direct doorstroomt naar de holding-rapportage

## Het verschil

Voor 8 leads/week:

|  | Voor (handmatig) | Na (AI-stack) |
|---|---|---|
| Appraisal-tijd | 4–6 uur/lead | 30 min/lead |
| Wekelijks effort | 32–48 uur | 4 uur |
| Quality consistency | Variabel — afhankelijk van wie het deed | Identiek — dezelfde criteria, elke keer |
| Audit trail | Spreadsheet + email | Volledige sources + redenering opvraagbaar |
| Thesis-discipline | Drift mogelijk bij time-pressure | Hard-gated — non-thesis deals worden geflagd vóór 30 min op zijn |

Belangrijker dan tijd: **discipline**. Onze biggest risico in C2R is niet "te weinig deals zien" — het is "deal forceren omdat je er drie uur in hebt gestopt". Door de eerste filter naar 30 min te brengen is sunk-cost-fallacy daar weg. We zeggen makkelijker "no" — en dat is wat de 20%+ margin protect.

## Wat dit niet is

Het is geen AGI die deals voor ons sourcet. Vier dingen blijven mensenwerk:
- **Relaties met agents** — die bellen niet terug omdat je een AI hebt
- **Site visits** — geen LLM ruikt damp of voelt vloer-deflectie
- **Onderhandelen** — toon en timing zijn verplicht analoog
- **Lender-relaties** — mezzanine-investeerders willen jou, niet je tooling

Wat het *wel* doet is de 80% repetitief desktop-werk wegnemen zodat we 80% van onze tijd op die vier hierboven kunnen besteden.

## Wat dit voor andere property operators kan betekenen

Dezelfde stack werkt voor:
- **Andere PD-strategies** — Class G (retail uppers), Class O (office conversions), build-to-rent
- **Andere geografieën** — verander Hampshire-comparables voor Greater Manchester / West Midlands
- **Andere asset classes** — student housing aggregators, BTR portfolios, distressed retail acquirers
- **Family offices met vastgoedpoot** — die deals beoordelen naast de andere asset-classes en niet de bandbreedte hebben voor handmatige property research

Wat je zelf moet meebrengen:
- Een heldere acquisitie-thesis (zonder die zijn AI-outputs een Rorschach-test)
- Discipline om "no" te zeggen tegen non-thesis deals
- Iemand met domein-expertise die de output review't — AI draait af op patroonherkenning, jij weet wat een damp survey eigenlijk betekent

---

## Werkt dit voor jou?

Wij hebben deze stack van scratch gebouwd voor onze eigen Class MA pipeline in Hampshire. Voor andere property operators bieden we een advisory-traject aan waarin we deze patroon herhalen voor jouw thesis: bron-mapping, agent-prompts, output-templates, en governance.

[Maandelijkse advisory retainer · €2.500/mnd of €4.000 voor exec-deelname](mailto:armand.parris@sirrapagroup.com)

---

**Over Sirrapa Property Group.** UK-based property developer met focus op Class MA en Class G conversies in Hampshire. Onderdeel van Sirrapa Group Holding (NL), met zusterbedrijf Sirrapa Vastgoed B.V. (NL portfolio) en Sirrapa (ICT) B.V. (advisory voor PropTech). Develop-to-hold strategie via FRI leases met SSH / PBSA / Housing Association tegenpartijen. Capital allocation: £5M+ voor Q2–Q4 2026.
