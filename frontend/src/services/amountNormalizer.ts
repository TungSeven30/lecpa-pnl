import { BankConfig, BankType, BANK_CONFIGS } from './bankConfigs';

/**
 * Parse amount string to number
 * Handles: $1,234.56, (500.00), -500.00, 500.00
 */
export function parseAmount(rawAmount: string): number {
  if (!rawAmount || rawAmount.trim() === '') {
    throw new Error('Empty amount value');
  }

  let cleaned = rawAmount.trim();

  // Check for parentheses (accounting notation for negative)
  const isParenthesized = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isParenthesized) {
    cleaned = cleaned.slice(1, -1);
  }

  // Remove currency symbols and commas
  cleaned = cleaned.replace(/[$,]/g, '');

  const amount = parseFloat(cleaned);

  if (isNaN(amount) || !isFinite(amount)) {
    throw new Error(`Invalid amount: "${rawAmount}"`);
  }

  // Apply parentheses negation
  return isParenthesized ? -amount : amount;
}

/**
 * Normalize amount to standard convention: negative = expense, positive = income
 * Returns amount in cents (integer)
 */
export function normalizeAmount(
  rawAmount: string,
  bankType: BankType
): number {
  const config = BANK_CONFIGS[bankType];
  let amount = parseAmount(rawAmount);

  // Apply bank-specific normalization
  if (config.amountNormalization === 'positive_is_expense') {
    // Bank shows expenses as positive, we need them negative
    amount = -amount;
  }
  // If 'negative_is_expense', amount is already in correct format

  // Convert to cents (integer storage)
  return Math.round(amount * 100);
}

/**
 * Format cents to display string
 */
export function formatAmountFromCents(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(dollars);
}

/**
 * Get sign indicator for amount
 */
export function getAmountSign(cents: number): 'expense' | 'income' {
  return cents < 0 ? 'expense' : 'income';
}
