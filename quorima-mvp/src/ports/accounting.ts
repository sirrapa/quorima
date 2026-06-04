// Quorima — AccountingPort
// Vendor-onafhankelijke interface waar elke accounting-connector aan voldoet.
// Implementaties: TwinfieldAccountingPort, XeroAccountingPort (later), MockAccountingPort

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
} from "../types.js";

export interface TxFilter {
  from?: string; // ISO date
  to?: string;
  accountCodePrefix?: string;
  costCenter?: string;
}

export interface AccountingPort {
  /** Returns all entities the connected user is authorised for. */
  listEntities(): Promise<Entity[]>;

  /** Standard reporting endpoints. */
  getPnL(entityId: EntityId, period: Period): Promise<PnLReport>;
  getBalanceSheet(entityId: EntityId, asOf: string): Promise<BalanceSheet>;
  listAccounts(entityId: EntityId): Promise<Account[]>;
  listTransactions(entityId: EntityId, filter: TxFilter): Promise<Transaction[]>;

  /**
   * Vastgoed-specifieke afgeleiden — bouw rent-roll en loan-register op
   * uit grootboek + dimensies. Sommige connectors (bv. Xero met
   * tracking categories) kunnen dit native; andere (Twinfield zonder
   * Vastgoed-module) leiden het af via account-mappings.
   */
  deriveLoanRegister(entityId: EntityId): Promise<Loan[]>;
  deriveRentRoll(entityId: EntityId): Promise<Tenancy[]>;
}
