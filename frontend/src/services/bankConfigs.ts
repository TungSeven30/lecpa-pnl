// Bank type enum matching backend schema
export type BankType = 'chase' | 'bankofamerica' | 'wellsfargo' | 'capitalone' | 'amex';
export type AccountType = 'checking' | 'credit';

export interface BankConfig {
  name: string;
  // How to interpret amount signs
  // 'negative_is_expense': debits are negative (e.g., Chase)
  // 'positive_is_expense': debits are positive (e.g., BofA, Amex)
  amountNormalization: 'negative_is_expense' | 'positive_is_expense';
  // Expected date formats in order of preference
  dateFormats: string[];
  // Column header patterns for auto-detection
  columns: {
    date: RegExp;
    description: RegExp;
    amount: RegExp;
    memo?: RegExp;
  };
}

export const BANK_CONFIGS: Record<BankType, BankConfig> = {
  chase: {
    name: 'Chase',
    amountNormalization: 'negative_is_expense',
    dateFormats: ['MM/DD/YYYY', 'M/D/YYYY'],
    columns: {
      date: /posting\s*date|trans.*date|date/i,
      description: /description/i,
      amount: /amount/i,
      memo: /memo|detail/i
    }
  },
  bankofamerica: {
    name: 'Bank of America',
    amountNormalization: 'positive_is_expense',
    dateFormats: ['MM/DD/YYYY', 'M/D/YYYY'],
    columns: {
      date: /date|posted/i,
      description: /description|payee/i,
      amount: /amount/i,
      memo: /memo|reference/i
    }
  },
  wellsfargo: {
    name: 'Wells Fargo',
    amountNormalization: 'negative_is_expense',
    dateFormats: ['MM/DD/YYYY', 'M/D/YYYY'],
    columns: {
      date: /date/i,
      description: /description/i,
      amount: /amount/i,
      memo: /memo/i
    }
  },
  capitalone: {
    name: 'Capital One',
    amountNormalization: 'positive_is_expense',
    dateFormats: ['YYYY-MM-DD', 'MM/DD/YYYY'],
    columns: {
      date: /transaction\s*date|posted\s*date|date/i,
      description: /description|merchant/i,
      amount: /amount|debit|credit/i,
      memo: /category|memo/i
    }
  },
  amex: {
    name: 'American Express',
    amountNormalization: 'positive_is_expense',
    dateFormats: ['MM/DD/YYYY', 'M/D/YYYY'],
    columns: {
      date: /date/i,
      description: /description/i,
      amount: /amount/i,
      memo: /extended\s*details|memo/i
    }
  }
};

// Helper to get bank config with fallback
export function getBankConfig(bankType: BankType): BankConfig {
  return BANK_CONFIGS[bankType];
}

// Bank options for UI dropdowns
export const BANK_OPTIONS: Array<{ value: BankType; label: string }> = [
  { value: 'chase', label: 'Chase' },
  { value: 'bankofamerica', label: 'Bank of America' },
  { value: 'wellsfargo', label: 'Wells Fargo' },
  { value: 'capitalone', label: 'Capital One' },
  { value: 'amex', label: 'American Express' }
];

export const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'credit', label: 'Credit Card' }
];
