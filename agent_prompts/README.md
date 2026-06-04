# Quorima — Agent System Prompts

C-level agentic board voor de holding (Sirrapa ICT, Sirrapa Vastgoed, Sirrapa Property Group).
Alle redeneerwerk via **platform.claude.com** (Claude API + Agent SDK).

## Bestanden

| File | Rol | Model |
|------|-----|-------|
| `00_chief_of_staff.md` | Orchestrator (geen C-level) | `claude-opus-4-6` |
| `01_ceo_agent.md` | Strategie & M&A deal flow | `claude-opus-4-6` |
| `02_cfo_agent.md` | Financiële consolidatie | `claude-opus-4-6` |
| `03_coo_agent.md` | Operations & delivery | `claude-sonnet-4-6` |
| `04_cmo_agent.md` | Sales pipeline & marketing | `claude-sonnet-4-6` |

## Hoe te gebruiken

Bij gebruik in de Claude Agent SDK:

```ts
import { Anthropic } from "@anthropic-ai/sdk";
import fs from "node:fs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const cfoSystem = fs.readFileSync("agent_prompts/02_cfo_agent.md", "utf-8");

const res = await client.messages.create({
  model: "claude-opus-4-6",
  system: cfoSystem,
  max_tokens: 4096,
  tools: [/* AccountingPort tools, FX, ledger query */],
  messages: [{ role: "user", content: "Geef de daily flash voor 25 april 2026." }]
});
```

## Tool-naming conventie

Alle tools volgen `domain.action` (bijv. `accounting.get_pnl`, `crm.list_deals`). Dit maakt prompts portable tussen connectors — alleen de implementatie achter de Port verschilt.

## Escalatie

Elke agent heeft expliciete escalatie-triggers. Deze lopen altijd via `Chief of Staff → escalate_to_human()`, nooit direct vanuit een sub-agent. Dat houdt de audit trail schoon.
