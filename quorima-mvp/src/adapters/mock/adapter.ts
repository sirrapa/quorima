// Mock adapter — voor offline development en CI.
// Gebruikt fixture-data die de gespannen Sirrapa Vastgoed situatie reflecteert:
// commerciële huur, hoge rente, DSCR onder 1.0.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(__dirname, "../../../fixtures/vastgoed-sample.json");

interface Fixture {
  entity: Entity;
  accounts: Account[];
  transactions: Transaction[];
  pnl12m: PnLReport;
  balanceSheet: BalanceSheet;
  loans: Loan[];
  tenancies: Tenancy[];
}

export class MockAccountingPort implements AccountingPort {
  private fixture: Fixture | null = null;

  private async load(): Promise<Fixture> {
    if (this.fixture) return this.fixture;
    const raw = await readFile(FIXTURE_PATH, "utf-8");
    this.fixture = JSON.parse(raw) as Fixture;
    return this.fixture;
  }

  async listEntities(): Promise<Entity[]> {
    const f = await this.load();
    return [f.entity];
  }

  async getPnL(_entityId: EntityId, _period: Period): Promise<PnLReport> {
    const f = await this.load();
    return f.pnl12m;
  }

  async getBalanceSheet(_entityId: EntityId, _asOf: string): Promise<BalanceSheet> {
    const f = await this.load();
    return f.balanceSheet;
  }

  async listAccounts(_entityId: EntityId): Promise<Account[]> {
    const f = await this.load();
    return f.accounts;
  }

  async listTransactions(_entityId: EntityId, filter: TxFilter): Promise<Transaction[]> {
    const f = await this.load();
    return f.transactions.filter((tx) => {
      if (filter.from && tx.date < filter.from) return false;
      if (filter.to && tx.date > filter.to) return false;
      if (filter.accountCodePrefix && !tx.account.startsWith(filter.accountCodePrefix)) return false;
      if (filter.costCenter && tx.costCenter !== filter.costCenter) return false;
      return true;
    });
  }

  async deriveLoanRegister(_entityId: EntityId): Promise<Loan[]> {
    const f = await this.load();
    return f.loans;
  }

  async deriveRentRoll(_entityId: EntityId): Promise<Tenancy[]> {
    const f = await this.load();
    return f.tenancies;
  }
}
