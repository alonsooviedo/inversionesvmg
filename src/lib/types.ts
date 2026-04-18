export type AccountType = "empresa" | "persona";
export type InstrumentType = "fondo_vista" | "fondo_cerrado" | "cdp" | "bono";
export type Currency = "CRC" | "USD" | "EUR";
export type InvestmentStatus = "active" | "liquidated" | "sold";
export type TransactionType =
  | "interest"
  | "deposit"
  | "liquidation"
  | "sale"
  | "purchase";
export type InterestFrequency =
  | "diaria"
  | "mensual"
  | "trimestral"
  | "semestral"
  | "al_vencimiento";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  active: boolean;
  created_at: string;
}

export interface Institution {
  id: string;
  name: string;
  country: string;
  active: boolean;
  created_at: string;
}

export interface Investment {
  id: string;
  account_id: string;
  institution_id: string;
  name: string;
  instrument_type: InstrumentType;
  currency: Currency;
  iban?: string;
  initial_amount: number;
  current_balance: number;
  interest_rate?: number;
  interest_frequency?: InterestFrequency;
  purchase_date?: string;
  maturity_date?: string;
  status: InvestmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations (joined)
  account?: Account;
  institution?: Institution;
}

export interface SubAccount {
  id: string;
  investment_id: string;
  account_id: string;
  amount: number;
  percentage?: number;
  notes?: string;
  created_at: string;
  account?: Account;
}

export interface Transaction {
  id: string;
  investment_id: string;
  transaction_date: string;
  type: TransactionType;
  amount: number;
  balance_after?: number;
  sale_price?: number;
  sale_gain?: number;
  description?: string;
  created_at: string;
  investment?: Investment;
}

export interface ExchangeRate {
  id: string;
  period: string;
  usd_to_crc: number;
  notes?: string;
  created_at: string;
}

export interface MonthlySnapshot {
  id: string;
  investment_id: string;
  period: string;
  closing_balance: number;
  interest_earned: number;
  created_at: string;
  investment?: Investment;
}

// Aggregated types for dashboard
export interface PortfolioSummary {
  total_usd: number;
  total_crc: number;
  total_in_usd: number; // everything converted to USD
  monthly_interest_usd: number;
  monthly_interest_crc: number;
  ytd_interest_usd: number;
  ytd_interest_crc: number;
  by_institution: InstitutionSummary[];
  by_type: TypeSummary[];
  by_account: AccountSummary[];
}

export interface InstitutionSummary {
  institution: Institution;
  total_usd: number;
  total_crc: number;
  investment_count: number;
}

export interface TypeSummary {
  type: InstrumentType;
  total_usd: number;
  percentage: number;
}

export interface AccountSummary {
  account: Account;
  total_usd: number;
  total_crc: number;
}
