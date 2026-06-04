// Twinfield AccountingPort — production adapter.
//
// Twinfield biedt twee API's: SOAP (sessie-based, oudere stijl) en REST
// (OAuth2). Voor Sprint 1 gebruiken we SOAP omdat de SOAP-route geen
// OAuth-app-registratie bij Wolters Kluwer vereist — we gebruiken een
// service-account dat de klant zelf aanmaakt in Twinfield admin met
// "Webservices"-rol.
//
// Architectuur:
//   1. Sessie login → Session.Logon (Twinfield)
//   2. Cluster discovery → Sessie geeft cluster URL terug
//   3. Process XML → POST /webservices/processxml.asmx?wsdl
//      met BrowseXML / ColumnsXML voor grootboek-queries
//
// Voor de eerste iteratie van de MVP focussen we op de minimale set
// queries die de drie KPIs voeden: P&L, transactions per account-prefix,
// en lening-saldi (uit balans-rekeningen).

import * as soap from "soap";
import type {
  Account,
  BalanceSheet,
  Entity,
  EntityId,
  Loan,
  Period,
  PnLReport,
  Tenancy,
  Transaction,
} from "../../types.js";
import type { AccountingPort, TxFilter } from "../../ports/accounting.js";

const LOGON_WSDL = "https://login.twinfield.com/webservices/session.asmx?wsdl";

export interface TwinfieldConfig {
  organisation: string;
  user: string;
  password: string;
}

interface Session {
  cluster: string;
  sessionId: string;
}

export class TwinfieldAccountingPort implements AccountingPort {
  private session: Session | null = null;
  private processXmlClient: soap.Client | null = null;

  constructor(private config: TwinfieldConfig) {}

  // ─── Connection lifecycle ───────────────────────────────────────────

  private async ensureSession(): Promise<Session> {
    if (this.session) return this.session;

    const client = await soap.createClientAsync(LOGON_WSDL);
    const [result] = await client.LogonAsync({
      user: this.config.user,
      password: this.config.password,
      organisation: this.config.organisation,
    });

    if (result.LogonResult !== "Ok") {
      throw new Error(`Twinfield logon failed: ${result.LogonResult}`);
    }

    const cluster = result.cluster as string;
    const headers = (client.lastResponseHeaders ?? "") as string;
    const sessionMatch = /SessionID=([^;]+)/.exec(headers);
    if (!sessionMatch) throw new Error("Twinfield: no SessionID returned");

    this.session = { cluster, sessionId: sessionMatch[1]! };
    return this.session;
  }

  private async ensureProcessClient(): Promise<soap.Client> {
    if (this.processXmlClient) return this.processXmlClient;
    const sess = await this.ensureSession();
    const wsdl = `${sess.cluster}/webservices/processxml.asmx?wsdl`;
    const client = await soap.createClientAsync(wsdl);
    client.addSoapHeader({ Header: { SessionID: sess.sessionId } }, "", "tw", "http://www.twinfield.com/");
    this.processXmlClient = client;
    return client;
  }

  // ─── Public AccountingPort interface ────────────────────────────────

  async listEntities(): Promise<Entity[]> {
    // Twinfield's cluster-level "list offices" returns the offices
    // (administraties) the user is authorised for. For Sirrapa we map
    // the three offices to canonical Quorima entities.
    const officeIds = [
      process.env.TWINFIELD_OFFICE_VASTGOED,
      process.env.TWINFIELD_OFFICE_ICT,
      process.env.TWINFIELD_OFFICE_HOLDING,
    ].filter(Boolean) as string[];

    const ids: Record<string, EntityId> = {
      [process.env.TWINFIELD_OFFICE_VASTGOED ?? "21007"]: "sirrapa-vastgoed",
      [process.env.TWINFIELD_OFFICE_ICT ?? "21005"]: "sirrapa-ict",
      [process.env.TWINFIELD_OFFICE_HOLDING ?? "21006"]: "sirrapa-holding",
    };
    const names: Record<string, string> = {
      [process.env.TWINFIELD_OFFICE_VASTGOED ?? "21007"]: "Sirrapa Vastgoed B.V.",
      [process.env.TWINFIELD_OFFICE_ICT ?? "21005"]: "Sirrapa (ICT) B.V.",
      [process.env.TWINFIELD_OFFICE_HOLDING ?? "21006"]: "Sirrapa Group Holding B.V.",
    };

    return officeIds.map((office) => ({
      id: ids[office] ?? `twinfield-${office}`,
      legalName: names[office] ?? `Office ${office}`,
      country: "NL",
      currency: "EUR",
      gaap: "nl-gaap",
    }));
  }

  async getPnL(entityId: EntityId, period: Period): Promise<PnLReport> {
    const office = officeFromEntityId(entityId);
    const client = await this.ensureProcessClient();

    // Browse XML voor een rolling 12m P&L: vraag alle entries op
    // grootboekrekeningen met type "income" of "expense".
    const fromYM = formatYearMonth(rolling12mStart(period));
    const toYM = formatYearMonth(periodEndDate(period));

    const browse = `<?xml version="1.0"?>
<columns code="000" cluster="financial" xmlns="" >
  <column id="1"><field>fin.trs.line.dim1</field><label>account</label><visible>true</visible></column>
  <column id="2"><field>fin.trs.line.dim1.name</field><label>name</label><visible>true</visible></column>
  <column id="3"><field>fin.trs.line.valuesigned</field><label>amount</label><visible>true</visible><operator>sum</operator></column>
  <column id="4"><field>fin.trs.head.yearperiod</field><from>${fromYM}</from><to>${toYM}</to></column>
  <column id="5"><field>fin.trs.line.matchstatus</field><visible>false</visible></column>
  <column id="6"><field>fin.trs.head.code</field><visible>false</visible></column>
</columns>`;

    const [result] = await client.ProcessXmlStringAsync({ xmlRequest: browse });
    return parsePnLFromBrowseXml(result.ProcessXmlStringResult, entityId, period);
  }

  async getBalanceSheet(entityId: EntityId, asOf: string): Promise<BalanceSheet> {
    const _office = officeFromEntityId(entityId); // reserved for future use
    const client = await this.ensureProcessClient();
    const ym = formatYearMonth(new Date(asOf));

    const browse = `<?xml version="1.0"?>
<columns code="030" cluster="financial" xmlns="">
  <column id="1"><field>fin.trs.line.dim1</field><label>account</label><visible>true</visible></column>
  <column id="2"><field>fin.trs.line.dim1.name</field><label>name</label><visible>true</visible></column>
  <column id="3"><field>fin.trs.line.valuesigned</field><label>amount</label><operator>sum</operator></column>
  <column id="4"><field>fin.trs.head.yearperiod</field><to>${ym}</to></column>
</columns>`;

    const [result] = await client.ProcessXmlStringAsync({ xmlRequest: browse });
    return parseBalanceSheetFromBrowseXml(result.ProcessXmlStringResult, entityId, asOf);
  }

  async listAccounts(entityId: EntityId): Promise<Account[]> {
    const office = officeFromEntityId(entityId);
    const client = await this.ensureProcessClient();
    const xml = `<list><type>dimensions</type><office>${office}</office><dimtype>BAS</dimtype></list>`;
    const [result] = await client.ProcessXmlStringAsync({ xmlRequest: xml });
    return parseAccountsList(result.ProcessXmlStringResult);
  }

  async listTransactions(entityId: EntityId, filter: TxFilter): Promise<Transaction[]> {
    const _office = officeFromEntityId(entityId);
    const client = await this.ensureProcessClient();
    const fromYM = filter.from ? formatYearMonth(new Date(filter.from)) : "2026/01";
    const toYM = filter.to ? formatYearMonth(new Date(filter.to)) : formatYearMonth(new Date());

    const browse = `<?xml version="1.0"?>
<columns code="030" cluster="financial" xmlns="">
  <column id="1"><field>fin.trs.head.code</field><visible>true</visible></column>
  <column id="2"><field>fin.trs.head.number</field><visible>true</visible></column>
  <column id="3"><field>fin.trs.head.date</field><visible>true</visible></column>
  <column id="4"><field>fin.trs.line.dim1</field><visible>true</visible></column>
  <column id="5"><field>fin.trs.line.description</field><visible>true</visible></column>
  <column id="6"><field>fin.trs.line.debitvalue</field><visible>true</visible></column>
  <column id="7"><field>fin.trs.line.creditvalue</field><visible>true</visible></column>
  <column id="8"><field>fin.trs.head.yearperiod</field><from>${fromYM}</from><to>${toYM}</to></column>
  ${filter.accountCodePrefix ? `<column id="9"><field>fin.trs.line.dim1</field><from>${filter.accountCodePrefix}0</from><to>${filter.accountCodePrefix}9</to></column>` : ""}
</columns>`;
    const [result] = await client.ProcessXmlStringAsync({ xmlRequest: browse });
    return parseTransactionsBrowseXml(result.ProcessXmlStringResult, entityId);
  }

  async deriveLoanRegister(entityId: EntityId): Promise<Loan[]> {
    // Twinfield zonder Vastgoed-module bevat geen gestructureerd
    // leningenregister. We synthetiseren uit:
    //   - balans-rekeningen onder prefix 07xx / 08xx (saldo per lening)
    //   - rentelasten-grootboek 4400-range, gegroepeerd per cost-center
    //     (cost-center vertegenwoordigt typisch de lening)
    //
    // Voor de MVP-bootstrap: lever een minimal schema en laat de
    // integrator tijdens wizard stap 3d eenmalig de rate +
    // nextRepricingDate per lening aanvullen. Dat aanvulrecord wordt
    // opgeslagen in Quorima's eigen contract-store.
    const bs = await this.getBalanceSheet(entityId, new Date().toISOString().slice(0, 10));
    const candidates = bs.lines.filter(
      (l) => /^0[78]/.test(l.account) && l.side === "liability" && Math.abs(l.amount) > 0,
    );
    return candidates.map((l) => ({
      id: `loan-${l.account}`,
      lender: l.name,
      balance: Math.abs(l.amount),
      currency: bs.currency,
      // Defaults — overgeschreven door integrator-mapping (TODO: load Quorima contract-store)
      rate: 0.06,
      nextRepricingDate: null,
      fixedPeriodEnd: null,
      monthlyPrincipal: 0,
    }));
  }

  async deriveRentRoll(_entityId: EntityId): Promise<Tenancy[]> {
    // Vergelijkbare beperking: zonder Vastgoed-module geen
    // contract-metadata. Lease summary komt in Quorima via PDF-parsing
    // pipeline (Sprint 1.5). Hier returnen we een lege array — de CFO
    // agent kan toch DSCR/NOI berekenen want die hangen op grootboek.
    return [];
  }
}

// ─── XML parsers ────────────────────────────────────────────────────
// Voor de MVP zijn dit minimal-effort regex-based parsers. In productie
// vervangen we ze door een proper XML lib (fast-xml-parser) plus tests.

function parsePnLFromBrowseXml(xml: string, entityId: EntityId, period: Period): PnLReport {
  const lines: PnLReport["lines"] = [];
  let revenue = 0;
  let opex = 0;
  let interest = 0;

  const rowRe = /<tr[\s\S]*?<\/tr>/g;
  const rows = xml.match(rowRe) ?? [];
  for (const row of rows) {
    const accMatch = /<td[^>]*>(\d{4})<\/td>/.exec(row);
    const nameMatch = /<td[^>]*>([^<]{2,})<\/td>\s*<td[^>]*>-?[\d.,]+<\/td>/.exec(row);
    const amountMatch = /<td[^>]*>(-?[\d.,]+)<\/td>\s*<\/tr>/.exec(row);
    if (!accMatch || !amountMatch) continue;

    const account = accMatch[1]!;
    const name = nameMatch?.[1] ?? account;
    const amount = parseDutchNumber(amountMatch[1]!);

    lines.push({ account, name, amount });

    if (account.startsWith("8")) revenue += amount;
    else if (account.startsWith("44")) interest += Math.abs(amount);
    else if (account.startsWith("4")) opex += Math.abs(amount);
  }

  return {
    entityId,
    period,
    currency: "EUR",
    lines,
    totals: {
      revenue,
      operatingExpenses: opex,
      interestExpense: interest,
      depreciation: 0, // TODO: pull from 03xx-range when needed
      tax: 0,
      netResult: revenue - opex - interest,
    },
  };
}

function parseBalanceSheetFromBrowseXml(xml: string, entityId: EntityId, asOf: string): BalanceSheet {
  const lines: BalanceSheet["lines"] = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  const rowRe = /<tr[\s\S]*?<\/tr>/g;
  const rows = xml.match(rowRe) ?? [];
  for (const row of rows) {
    const accMatch = /<td[^>]*>(\d{4})<\/td>/.exec(row);
    const nameMatch = /<td[^>]*>([^<]{2,})<\/td>/.exec(row);
    const amountMatch = /<td[^>]*>(-?[\d.,]+)<\/td>\s*<\/tr>/.exec(row);
    if (!accMatch || !amountMatch) continue;
    const account = accMatch[1]!;
    const name = nameMatch?.[1] ?? account;
    const amount = parseDutchNumber(amountMatch[1]!);

    let side: "asset" | "liability" | "equity";
    if (account.startsWith("0")) {
      const n = Number(account.slice(0, 2));
      if (n < 5) side = "asset";
      else side = "equity";
    } else if (account.startsWith("1")) {
      side = "asset";
    } else if (account.startsWith("0700") || account.startsWith("07") || account.startsWith("08")) {
      side = "liability";
    } else {
      side = "asset";
    }

    if (side === "asset") totalAssets += amount;
    else if (side === "liability") totalLiabilities += Math.abs(amount);
    else totalEquity += Math.abs(amount);

    lines.push({ account, name, amount, side });
  }

  return {
    entityId,
    asOf,
    currency: "EUR",
    lines,
    totals: { totalAssets, totalLiabilities, totalEquity },
  };
}

function parseAccountsList(xml: string): Account[] {
  // Twinfield <list> response wraps <dimension code="..." name="..." />
  const out: Account[] = [];
  const dimRe = /<dimension[\s\S]*?code="([^"]+)"[\s\S]*?name="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = dimRe.exec(xml)) !== null) {
    const code = m[1]!;
    const name = m[2]!;
    let type: Account["type"] = "asset";
    if (code.startsWith("4")) type = "expense";
    else if (code.startsWith("8")) type = "income";
    else if (code.startsWith("07") || code.startsWith("08")) type = "liability";
    else if (code.startsWith("05")) type = "equity";
    out.push({ code, name, type });
  }
  return out;
}

function parseTransactionsBrowseXml(xml: string, entityId: EntityId): Transaction[] {
  const out: Transaction[] = [];
  const rowRe = /<tr[\s\S]*?<\/tr>/g;
  const cells = (row: string): string[] => {
    const tdRe = /<td[^>]*>([^<]*)<\/td>/g;
    const result: string[] = [];
    let mm: RegExpExecArray | null;
    while ((mm = tdRe.exec(row)) !== null) result.push(mm[1] ?? "");
    return result;
  };
  const rows = xml.match(rowRe) ?? [];
  for (const row of rows) {
    const c = cells(row);
    if (c.length < 7) continue;
    out.push({
      id: `${c[0]}-${c[1]}`,
      entityId,
      date: c[2] ?? "",
      account: c[3] ?? "",
      description: c[4] ?? "",
      debit: parseDutchNumber(c[5] ?? "0"),
      credit: parseDutchNumber(c[6] ?? "0"),
      currency: "EUR",
    });
  }
  return out;
}

// ─── helpers ────────────────────────────────────────────────────────

function officeFromEntityId(entityId: EntityId): string {
  const map: Record<string, string | undefined> = {
    "sirrapa-vastgoed": process.env.TWINFIELD_OFFICE_VASTGOED ?? "21007",
    "sirrapa-ict": process.env.TWINFIELD_OFFICE_ICT ?? "21005",
    "sirrapa-holding": process.env.TWINFIELD_OFFICE_HOLDING ?? "21006",
  };
  const office = map[entityId];
  if (!office) throw new Error(`No Twinfield office mapping for entity ${entityId}`);
  return office;
}

function formatYearMonth(d: Date): string {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodEndDate(p: Period): Date {
  if (p.period === "FY") return new Date(p.year, 11, 31);
  if (p.period === "Q1") return new Date(p.year, 2, 31);
  if (p.period === "Q2") return new Date(p.year, 5, 30);
  if (p.period === "Q3") return new Date(p.year, 8, 30);
  if (p.period === "Q4") return new Date(p.year, 11, 31);
  return new Date(p.year, p.period as number, 0);
}

function rolling12mStart(p: Period): Date {
  const end = periodEndDate(p);
  return new Date(end.getFullYear() - 1, end.getMonth() + 1, 1);
}

function parseDutchNumber(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/\./g, "").replace(",", ".").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
