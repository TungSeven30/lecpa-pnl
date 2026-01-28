/**
 * OWASP CSV Injection Prevention
 * Cells starting with =, +, -, @, \t, \r, \n can be interpreted as formulas
 * when opened in spreadsheets. Prefix with single quote to prevent execution.
 */

const DANGEROUS_CHARS = ['=', '+', '-', '@', '\t', '\r', '\n'];

export function sanitizeCSVField(value: string | null | undefined): string {
  if (value == null) return '';

  const str = String(value).trim();

  // Check if starts with dangerous character
  if (DANGEROUS_CHARS.some(char => str.startsWith(char))) {
    // Exception: negative numbers starting with - are OK
    // Only prefix if it's not a valid number
    if (str.startsWith('-')) {
      const withoutMinus = str.substring(1).replace(/[$,]/g, '');
      if (!isNaN(parseFloat(withoutMinus))) {
        return str; // Valid negative number, don't sanitize
      }
    }
    return `'${str}`;
  }

  return str;
}

/**
 * Sanitize all fields in a row object
 */
export function sanitizeRow<T extends Record<string, unknown>>(row: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[sanitizeCSVField(key)] = typeof value === 'string'
      ? sanitizeCSVField(value)
      : value;
  }
  return sanitized as T;
}
