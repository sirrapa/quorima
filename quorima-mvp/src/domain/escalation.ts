// Quorima — Escalation rules engine voor Vastgoed flash digest

import type {
  DSCRResult,
  Escalation,
  NOIResult,
  RefiRunwayResult,
} from "../types.js";

export interface EscalationContext {
  recipients: {
    cfo: string[];
    ceo: string[];
    coo: string[];
  };
  /** True als DSCR al twee opeenvolgende kwartalen onder 1.0 staat (geladen uit historie) */
  dscrBelowOneForTwoQuartersInRow?: boolean;
}

export function evaluateVastgoedEscalations(
  dscr: DSCRResult,
  noi: NOIResult,
  refi: RefiRunwayResult,
  ctx: EscalationContext,
): Escalation[] {
  const out: Escalation[] = [];

  // Rule 1 — DSCR < 1.0 voor 2 opeenvolgende kwartalen → covenant + refi protocol
  if (dscr.status === "red" && ctx.dscrBelowOneForTwoQuartersInRow === true) {
    out.push({
      level: "critical",
      rule: "vastgoed.dscr.covenant_protocol",
      message:
        `DSCR ${dscr.value} < 1.0 voor 2e kwartaal op rij. Onmiddellijk covenant-overleg ` +
        `met lenders en refi-protocol activeren.`,
      recipients: [...ctx.recipients.cfo, ...ctx.recipients.ceo],
    });
  } else if (dscr.status === "red") {
    out.push({
      level: "warning",
      rule: "vastgoed.dscr.below_one",
      message:
        `DSCR ${dscr.value} < 1.0 deze periode (NOI €${fmt(dscr.noi12m)} ` +
        `vs debt service €${fmt(dscr.debtService12m)}). Niet acuut covenant maar ` +
        `volgend kwartaal escaleert dit.`,
      recipients: ctx.recipients.cfo,
    });
  }

  // Rule 2 — Refi runway < 6 mnd én DSCR < 1.0 → crisis-protocol
  if (refi.status === "red" && dscr.status === "red") {
    out.push({
      level: "critical",
      rule: "vastgoed.refi.crisis_protocol",
      message:
        `Refi-runway ${refi.earliestRepricingMonths.toFixed(1)} mnd én DSCR ${dscr.value}. ` +
        `Crisis-protocol: lender-gesprek deze week, refi-roadmap binnen 30 dagen.`,
      recipients: [...ctx.recipients.cfo, ...ctx.recipients.ceo],
    });
  } else if (refi.status === "red") {
    out.push({
      level: "warning",
      rule: "vastgoed.refi.short_runway",
      message:
        `Refi-runway ${refi.earliestRepricingMonths.toFixed(1)} mnd of WACC ${(refi.wacc * 100).toFixed(2)}% — ` +
        `start lender-onderzoek deze maand.`,
      recipients: ctx.recipients.cfo,
    });
  }

  // Rule 3 — NOI YoY-drop > 10% (dit zou normaal vergelijking met vorige periode vergen,
  // hier alleen warning bij rood t.o.v. budget)
  if (noi.status === "red" && noi.varianceVsBudget != null) {
    out.push({
      level: "warning",
      rule: "vastgoed.noi.material_underperform",
      message:
        `NOI €${fmt(noi.monthly)}/mnd vs budget €${fmt(noi.budgetEur ?? 0)} ` +
        `(variance ${noi.varianceVsBudget >= 0 ? "+" : ""}€${fmt(noi.varianceVsBudget)}). ` +
        `COO-onderzoek: vacancy of stijgende OpEx?`,
      recipients: [...ctx.recipients.cfo, ...ctx.recipients.coo],
    });
  }

  return out;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("nl-NL");
}
