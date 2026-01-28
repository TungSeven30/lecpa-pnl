import { useState } from 'react';
import { ColumnMapping, hasRequiredMappings, getMissingColumns } from '../../services/columnDetector';

interface ColumnMapperProps {
  headers: string[];
  initialMapping: ColumnMapping;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

export function ColumnMapper({
  headers,
  initialMapping,
  onConfirm,
  onCancel
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping);

  const handleChange = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: value || null
    }));
  };

  const isValid = hasRequiredMappings(mapping);
  const missing = getMissingColumns(mapping);

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Confirm Column Mapping</h3>
        <p className="mt-1 text-sm text-gray-500">
          We detected the columns below. Please verify or correct the mapping.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date Column <span className="text-red-500">*</span>
          </label>
          <select
            value={mapping.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select column...</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description Column <span className="text-red-500">*</span>
          </label>
          <select
            value={mapping.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select column...</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount Column <span className="text-red-500">*</span>
          </label>
          <select
            value={mapping.amount || ''}
            onChange={(e) => handleChange('amount', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select column...</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Memo Column (optional)
          </label>
          <select
            value={mapping.memo || ''}
            onChange={(e) => handleChange('memo', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">None</option>
            {headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      {!isValid && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            Missing required columns: {missing.join(', ')}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(mapping)}
          disabled={!isValid}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
            isValid
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Confirm & Import
        </button>
      </div>
    </div>
  );
}
