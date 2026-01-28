import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { BankConfig } from './bankConfigs';

dayjs.extend(customParseFormat);

// Fallback formats if bank-specific formats fail
const FALLBACK_DATE_FORMATS = [
  'MM/DD/YYYY', 'M/D/YYYY',
  'YYYY-MM-DD',
  'DD/MM/YYYY', 'D/M/YYYY',
  'MMM DD, YYYY',
  'MMMM D, YYYY',
  'MM-DD-YYYY',
  'YYYY/MM/DD'
];

/**
 * Parse a date string using bank-specific formats with fallback
 * Returns Date object or throws if unparseable
 */
export function parseTransactionDate(
  rawDate: string,
  bankConfig?: BankConfig
): Date {
  const trimmed = rawDate.trim();

  if (!trimmed) {
    throw new Error('Empty date value');
  }

  // Try bank-specific formats first
  if (bankConfig?.dateFormats) {
    for (const format of bankConfig.dateFormats) {
      const parsed = dayjs(trimmed, format, true);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }
  }

  // Try fallback formats
  for (const format of FALLBACK_DATE_FORMATS) {
    const parsed = dayjs(trimmed, format, true);
    if (parsed.isValid()) {
      return parsed.toDate();
    }
  }

  // Last resort: let dayjs try to auto-parse
  const autoParsed = dayjs(trimmed);
  if (autoParsed.isValid()) {
    return autoParsed.toDate();
  }

  throw new Error(`Unable to parse date: "${rawDate}"`);
}

/**
 * Check if a date is within a range (inclusive)
 */
export function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date
): boolean {
  const d = dayjs(date).startOf('day');
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).endOf('day');

  return (d.isSame(start) || d.isAfter(start)) &&
         (d.isSame(end) || d.isBefore(end));
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return dayjs(date).format('MM/DD/YYYY');
}
