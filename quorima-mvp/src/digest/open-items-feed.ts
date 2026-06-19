// Quorima — Open-items feed writer (crediteuren + debiteuren)
// Schrijft dashboard/data/open-items.json (gitignored, live) met de openstaande
// posten per relatie uit Twinfield, voor alle administraties. Vervangt de oude
// Basecone/Gmail-factuurfeed als bron voor de dashboard-sectie "Openstaande posten".
// Zelfde patroon als de andere feeds: alleen de .example staat in de publieke repo.

import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import type { Entity, OpenItem } from "../types.js";

const SHORT: Record<string, string> = {
  "sirrapa-vastgoed": "SVG",
  "sirrapa-ict": "ICT",
  "sirrapa-holding": "SGH",
};

interface FeedRow {
  entity: string; // korte code (SVG/ICT/SGH)
  entityName: string;
  office: string;
  relation: string;
  amount_eur: number;
}

export interface OpenItemsFeed {
  schema: "quorima.open-items.v1";
  generated_at: string;
  as_of: string;
  source: string;
  totals: {
    payable_eur: number;
    receivable_eur: number;
    payable_count: number;
    receivable_count: number;
  };
  by_entity: Array<{
    entity: string;
    entityName: string;
    office: string;
    payable_eur: number;
    receivable_eur: number;
  }>;
  payables: FeedRow[];
  receivables: FeedRow[];
}

const r2 = (n: number): number => Math.round(n * 100) / 100;
const shortFor = (id: string): string => SHORT[id] ?? id;

export function buildOpenItemsFeed(
  entities: Entity[],
  items: OpenItem[],
  opts: { generatedAt: string; asOf: string },
): OpenItemsFeed {
  const nameById = new Map(entities.map((e) => [e.id, e.legalName]));
  const toRow = (i: OpenItem): FeedRow => ({
    entity: shortFor(i.entityId),
    entityName: nameById.get(i.entityId) ?? i.entityId,
    office: i.office,
    relation: i.relationName,
    amount_eur: r2(i.amountEur),
  });
  const byAmount = (a: FeedRow, b: FeedRow): number => b.amount_eur - a.amount_eur;

  const payables = items.filter((i) => i.side === "payable").map(toRow).sort(byAmount);
  const receivables = items.filter((i) => i.side === "receivable").map(toRow).sort(byAmount);
  const sum = (xs: FeedRow[]): number => r2(xs.reduce((t, x) => t + x.amount_eur, 0));

  const by_entity = entities.map((e) => {
    const ap = items.filter((i) => i.entityId === e.id && i.side === "payable");
    const ar = items.filter((i) => i.entityId === e.id && i.side === "receivable");
    return {
      entity: shortFor(e.id),
      entityName: e.legalName,
      office: ap[0]?.office ?? ar[0]?.office ?? "",
      payable_eur: r2(ap.reduce((t, i) => t + i.amountEur, 0)),
      receivable_eur: r2(ar.reduce((t, i) => t + i.amountEur, 0)),
    };
  });

  return {
    schema: "quorima.open-items.v1",
    generated_at: opts.generatedAt,
    as_of: opts.asOf,
    source: "Twinfield · grootboek (crediteuren 1700 / debiteuren 1300) per relatie",
    totals: {
      payable_eur: sum(payables),
      receivable_eur: sum(receivables),
      payable_count: payables.length,
      receivable_count: receivables.length,
    },
    by_entity,
    payables,
    receivables,
  };
}

export async function writeOpenItemsFeed(
  entities: Entity[],
  items: OpenItem[],
  opts: { dataDir: string; generatedAt: string; asOf: string },
): Promise<string> {
  const feed = buildOpenItemsFeed(entities, items, opts);
  const path = resolve(opts.dataDir, "open-items.json");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(feed, null, 2) + "\n", "utf-8");
  return path;
}
