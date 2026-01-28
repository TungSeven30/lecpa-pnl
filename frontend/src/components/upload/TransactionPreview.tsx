import { ParsedRow } from '../../services/csvParser';
import { ColumnMapping } from '../../services/columnDetector';
import { formatAmountFromCents, normalizeAmount } from '../../services/amountNormalizer';
import { formatDate, parseTransactionDate } from '../../services/dateParser';
import { BankType, getBankConfig } from '../../services/bankConfigs';

interface TransactionPreviewProps {
  rows: ParsedRow[];
  mapping: ColumnMapping;
  bankType: BankType;
}

export function TransactionPreview({ rows, mapping, bankType }: TransactionPreviewProps) {
  const config = getBankConfig(bankType);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            {mapping.memo && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Memo</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, idx) => {
            let dateStr = '-';
            let amountStr = '-';
            let amountClass = 'text-gray-900';

            try {
              if (mapping.date && row[mapping.date]) {
                const date = parseTransactionDate(row[mapping.date], config);
                dateStr = formatDate(date);
              }
            } catch {
              dateStr = row[mapping.date || ''] || '-';
            }

            try {
              if (mapping.amount && row[mapping.amount]) {
                const cents = normalizeAmount(row[mapping.amount], bankType);
                amountStr = formatAmountFromCents(cents);
                amountClass = cents < 0 ? 'text-red-600' : 'text-green-600';
              }
            } catch {
              amountStr = row[mapping.amount || ''] || '-';
            }

            return (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {dateStr}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                  {mapping.description ? row[mapping.description] || '-' : '-'}
                </td>
                <td className={`px-4 py-3 text-sm text-right whitespace-nowrap ${amountClass}`}>
                  {amountStr}
                </td>
                {mapping.memo && (
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {row[mapping.memo] || '-'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-gray-500 text-center">
        Showing first {rows.length} rows as preview
      </p>
    </div>
  );
}
