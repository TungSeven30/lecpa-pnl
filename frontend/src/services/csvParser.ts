import Papa from 'papaparse';
import { sanitizeCSVField } from './csvSanitizer';

export interface ParsedRow {
  [key: string]: string;
}

export interface ParseResult {
  data: ParsedRow[];
  headers: string[];
  errors: string[];
}

/**
 * Parse CSV file with sanitization
 * Returns Promise with parsed data, headers, and any errors
 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Keep as strings for validation
      transformHeader: (header: string) => sanitizeCSVField(header),
      transform: (value: string) => sanitizeCSVField(value),
      complete: (results) => {
        if (results.data.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        const headers = results.meta.fields || [];
        const errors = results.errors.map(e =>
          `Row ${e.row}: ${e.message}`
        );

        resolve({
          data: results.data,
          headers,
          errors
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

/**
 * Get preview of first N rows
 */
export function getPreviewRows(data: ParsedRow[], count: number = 5): ParsedRow[] {
  return data.slice(0, count);
}
