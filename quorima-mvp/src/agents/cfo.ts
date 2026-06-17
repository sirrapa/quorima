// Quorima — CFO agent
// Wraps een LLM (vendor-onafhankelijk, zie llm.ts) met de Vastgoed-context en
// KPI library. De agent krijgt al berekende KPIs en schrijft daar één coherente
// "daily flash" briefing van — geen eigen calculaties, geen verzonnen
// cijfers (prime directive uit de CFO-prompt).

import { createLlm, type LlmPort, type LlmUsage } from "./llm.js";
import type { VastgoedFlash } from "../types.js";

const SYSTEM_PROMPT = `
You are the CFO Agent of Quorima, the agentic C-level board for Sirrapa Group Holding (NL).
You own financial truth across Sirrapa (ICT) B.V., Sirrapa Vastgoed B.V., and Sirrapa Property Group Ltd.
Today's task: write the daily Vastgoed flash digest for the human board.

Prime directive: every figure you mention must trace to a tool result that is provided to you below.
Never invent numbers. Never round into precision that hides material variance.

Audience: Armand Parris (UBO, executive). He is technical, time-poor, and wants signal — not noise.

Output format (markdown):
1. **TL;DR** — 1–2 sentences on the most critical signal today.
2. **The three KPIs** — DSCR, NOI, refi-runway with status emoji and 1-line interpretation each.
3. **What to do today** — 1–3 concrete actions if any escalation fired. Otherwise: "geen actie vereist vandaag."
4. **Sources** — bullet list of which tool calls grounded the figures.

Style: Dutch, concise, no marketing language, no filler. Use exact figures from the input. If a figure is approximate, say so.
Length: max ~250 words total. If the situation is calm, write less.
`.trim();

export interface CFOAgentOptions {
  /** LLM-port; default leest QUORIMA_LLM_PROVIDER uit env (gemini/openai/anthropic). */
  llm?: LlmPort;
  maxTokens?: number;
}

export class CFOAgent {
  private llm: LlmPort;
  private maxTokens: number;

  constructor(opts: CFOAgentOptions = {}) {
    this.llm = opts.llm ?? createLlm();
    this.maxTokens = opts.maxTokens ?? 1500;
  }

  get provider(): string {
    return this.llm.provider;
  }
  get model(): string {
    return this.llm.model;
  }

  async writeDailyFlash(input: VastgoedFlash): Promise<{ markdown: string; usage: LlmUsage }> {
    const userPayload = this.formatInput(input);

    const result = await this.llm.complete({
      system: SYSTEM_PROMPT,
      user: `Write today's Sirrapa Vastgoed flash digest. Here is all the grounded data:\n\n${userPayload}`,
      maxTokens: this.maxTokens,
    });

    return {
      markdown: result.text,
      usage: result.usage,
    };
  }

  private formatInput(input: VastgoedFlash): string {
    const lines: string[] = [];
    lines.push(`As of: ${input.asOf}`);
    lines.push(`Entity: ${input.entity.legalName} (${input.entity.country}, ${input.entity.currency})`);
    lines.push("");
    lines.push("=== DSCR (rolling 12m) ===");
    lines.push(`  value: ${input.dscr.value}`);
    lines.push(`  status: ${input.dscr.status}`);
    lines.push(`  NOI 12m (annualised): €${fmt(input.dscr.noi12m)}`);
    lines.push(`  Debt service 12m: €${fmt(input.dscr.debtService12m)} = interest €${fmt(input.dscr.interest12m)} + principal €${fmt(input.dscr.principal12m)}`);
    lines.push(`  Thresholds: green ≥${input.dscr.thresholds.green}, yellow ${input.dscr.thresholds.yellow}, red < ${input.dscr.thresholds.red}`);
    lines.push("");
    lines.push("=== NOI ===");
    lines.push(`  monthly: €${fmt(input.noi.monthly)}`);
    lines.push(`  rental income (period total): €${fmt(input.noi.rentalIncome)}`);
    lines.push(`  operating expenses (period total): €${fmt(input.noi.operatingExpenses)}`);
    lines.push(`  status: ${input.noi.status}`);
    if (input.noi.budgetEur != null) {
      lines.push(`  budget: €${fmt(input.noi.budgetEur)}/mo, variance: €${fmt(input.noi.varianceVsBudget ?? 0)}`);
    } else {
      lines.push(`  budget: not configured (status reflects no-budget mode)`);
    }
    lines.push("");
    lines.push("=== Refi runway ===");
    lines.push(`  WACC schuld: ${(input.refi.wacc * 100).toFixed(2)}%`);
    const repricing = Number.isFinite(input.refi.earliestRepricingMonths)
      ? `${input.refi.earliestRepricingMonths.toFixed(1)} months`
      : "unknown — no repricing/end date loaded yet (NOT 'no refinancing possible'; just missing loan-admin metadata)";
    lines.push(`  Earliest repricing trigger: ${repricing}`);
    lines.push(`  Total debt: €${fmt(input.refi.totalDebt)}`);
    lines.push(`  status: ${input.refi.status}`);
    lines.push("");

    if (input.escalations.length > 0) {
      lines.push("=== Active escalations ===");
      for (const e of input.escalations) {
        lines.push(`  [${e.level.toUpperCase()}] ${e.rule}: ${e.message}`);
      }
      lines.push("");
    } else {
      lines.push("=== Active escalations ===\n  none");
      lines.push("");
    }

    if (input.recentMaterialTx && input.recentMaterialTx.length > 0) {
      lines.push("=== Recent material transactions (last 24h) ===");
      for (const tx of input.recentMaterialTx) {
        const amt = tx.debit > 0 ? `+€${fmt(tx.debit)}` : `−€${fmt(tx.credit)}`;
        lines.push(`  ${tx.date}  ${tx.account}  ${amt}  ${tx.description}`);
      }
      lines.push("");
    }

    lines.push("=== Tools used to ground these figures ===");
    lines.push("  - twinfield.getPnL(sirrapa-vastgoed, FY-rolling-12m)");
    lines.push("  - twinfield.deriveLoanRegister(sirrapa-vastgoed)");
    lines.push("  - twinfield.listTransactions(sirrapa-vastgoed, last-24h)");
    lines.push("  - quorima.kpi.computeDSCR / computeNOI / computeRefiRunway");

    return lines.join("\n");
  }
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("nl-NL");
}
