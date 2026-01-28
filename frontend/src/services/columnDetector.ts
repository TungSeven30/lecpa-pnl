import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { BankConfig } from './bankConfigs';

dayjs.extend(customParseFormat);

export interface ColumnMapping {
  date: string | null;
  description: string | null;
  amount: string | null;
  memo: string | null;
}

// Common date formats to try when validating
const VALIDATION_DATE_FORMATS = [
  'MM/DD/YYYY', 'M/D/YYYY',
  'YYYY-MM-DD',
  'DD/MM/YYYY', 'D/M/YYYY',
  'MMM DD, YYYY',
  'MMMM D, YYYY'
];

/**
 * Validate if a value looks like a date
 */
function isValidDate(value: string): boolean {
  if (!value || value.trim() === '') return false;
  return VALIDATION_DATE_FORMATS.some(fmt =>
    dayjs(value, fmt, true).isValid()
  );
}

/**
 * Validate if a value looks like an amount
 */
function isValidAmount(value: string): boolean {
  if (!value || value.trim() === '') return false;
  // Remove currency symbols, commas, parentheses (for negative)
  const cleaned = value.replace(/[$,()]/g, '').trim();
  return !isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned));
}

/**
 * Auto-detect column mapping from headers and first row
 */
export function detectColumns(
  headers: string[],
  firstRow: Record<string, string>,
  bankConfig?: BankConfig
): ColumnMapping {
  const mapping: ColumnMapping = {
    date: null,
    description: null,
    amount: null,
    memo: null
  };

  // Use bank-specific patterns if available, otherwise use generic patterns
  const patterns = bankConfig?.columns || {
    date: /date|posted|trans/i,
    description: /desc|merchant|vendor|payee|name/i,
    amount: /amount|debit|credit/i,
    memo: /memo|note|comment|detail|reference/i
  };

  // Find date column
  mapping.date = headers.find(h => patterns.date.test(h)) || null;

  // Validate with content if found
  if (mapping.date && !isValidDate(firstRow[mapping.date])) {
    // Try other date-like headers
    const altDate = headers.find(h =>
      h !== mapping.date &&
      patterns.date.test(h) &&
      isValidDate(firstRow[h])
    );
    mapping.date = altDate || mapping.date;
  }

  // Find amount column
  mapping.amount = headers.find(h => patterns.amount.test(h)) || null;

  if (mapping.amount && !isValidAmount(firstRow[mapping.amount])) {
    const altAmount = headers.find(h =>
      h !== mapping.amount &&
      patterns.amount.test(h) &&
      isValidAmount(firstRow[h])
    );
    mapping.amount = altAmount || mapping.amount;
  }

  // Find description column
  mapping.description = headers.find(h => patterns.description.test(h)) || null;

  // Find memo column (optional)
  if (patterns.memo) {
    mapping.memo = headers.find(h => patterns.memo!.test(h)) || null;
  }

  return mapping;
}

/**
 * Check if all required columns are mapped
 */
export function hasRequiredMappings(mapping: ColumnMapping): boolean {
  return !!(mapping.date && mapping.description && mapping.amount);
}

/**
 * Get list of missing required columns
 */
export function getMissingColumns(mapping: ColumnMapping): string[] {
  const missing: string[] = [];
  if (!mapping.date) missing.push('Date');
  if (!mapping.description) missing.push('Description');
  if (!mapping.amount) missing.push('Amount');
  return missing;
}
