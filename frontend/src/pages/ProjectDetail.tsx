import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useUploads, useCreateUpload, useDeleteUpload, TransactionInput } from '../hooks/useUploads';
import { Layout } from '../components/Layout';
import { UploadZone } from '../components/upload/UploadZone';
import { ColumnMapper } from '../components/upload/ColumnMapper';
import { TransactionPreview } from '../components/upload/TransactionPreview';
import { parseCSV, ParsedRow, getPreviewRows } from '../services/csvParser';
import { detectColumns, ColumnMapping } from '../services/columnDetector';
import { parseTransactionDate, isDateInRange } from '../services/dateParser';
import { normalizeAmount } from '../services/amountNormalizer';
import { BankType, AccountType, BANK_OPTIONS, ACCOUNT_TYPE_OPTIONS, getBankConfig } from '../services/bankConfigs';

type UploadState = 'idle' | 'selecting-bank' | 'mapping' | 'processing';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || '0');

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const { data: uploads, isLoading: uploadsLoading } = useUploads(projectId);
  const createUpload = useCreateUpload(projectId);
  const deleteUpload = useDeleteUpload(projectId);

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [bankType, setBankType] = useState<BankType>('chase');
  const [accountType, setAccountType] = useState<AccountType>('checking');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingUploadId, setDeletingUploadId] = useState<number | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadError(null);

    try {
      const result = await parseCSV(file);
      setParsedData(result.data);
      setHeaders(result.headers);

      if (result.errors.length > 0) {
        setUploadError(`CSV warnings: ${result.errors.slice(0, 3).join('; ')}`);
      }

      setUploadState('selecting-bank');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setUploadState('idle');
    }
  };

  const handleBankConfirm = () => {
    const config = getBankConfig(bankType);
    const detected = detectColumns(headers, parsedData[0], config);
    setColumnMapping(detected);
    setUploadState('mapping');
  };

  const handleMappingConfirm = async (mapping: ColumnMapping) => {
    if (!project || !selectedFile) return;

    setUploadState('processing');
    setUploadError(null);

    try {
      const config = getBankConfig(bankType);
      const periodStart = new Date(project.periodStart);
      const periodEnd = new Date(project.periodEnd);

      // Transform and filter transactions
      const transactions: TransactionInput[] = [];

      for (const row of parsedData) {
        try {
          const date = parseTransactionDate(row[mapping.date!], config);

          // Filter by project date range (UPLD-04)
          if (!isDateInRange(date, periodStart, periodEnd)) {
            continue;
          }

          const amount = normalizeAmount(row[mapping.amount!], bankType);

          transactions.push({
            date: date.toISOString(),
            description: row[mapping.description!] || '',
            amount,
            memo: mapping.memo ? row[mapping.memo] || null : null
          });
        } catch {
          // Skip rows with invalid data
          continue;
        }
      }

      if (transactions.length === 0) {
        setUploadError('No transactions found within the project date range');
        setUploadState('idle');
        return;
      }

      await createUpload.mutateAsync({
        bankType,
        accountType,
        filename: selectedFile.name,
        transactions
      });

      // Reset state
      setUploadState('idle');
      setSelectedFile(null);
      setParsedData([]);
      setHeaders([]);
      setColumnMapping(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload');
      setUploadState('idle');
    }
  };

  const handleCancel = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping(null);
    setUploadError(null);
  };

  const handleDeleteUpload = async (uploadId: number) => {
    if (!confirm('Are you sure you want to delete this upload? All associated transactions will be removed.')) {
      return;
    }

    setDeletingUploadId(uploadId);
    try {
      await deleteUpload.mutateAsync(uploadId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete upload');
    } finally {
      setDeletingUploadId(null);
    }
  };

  if (projectLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading project...</div>
        </div>
      </Layout>
    );
  }

  if (projectError || !project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
          <Link to="/dashboard" className="mt-4 text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.clientName}</h1>
            <p className="text-gray-500">
              {new Date(project.periodStart).toLocaleDateString()} - {new Date(project.periodEnd).toLocaleDateString()}
            </p>
          </div>
          <Link
            to={`/projects/${project.id}/edit`}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit Project
          </Link>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Upload Bank Statement</h2>

          {uploadError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {uploadState === 'idle' && (
            <UploadZone onFileSelect={handleFileSelect} />
          )}

          {uploadState === 'selecting-bank' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                File: <span className="font-medium">{selectedFile?.name}</span>
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank</label>
                  <select
                    value={bankType}
                    onChange={(e) => setBankType(e.target.value as BankType)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {BANK_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {ACCOUNT_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBankConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Next: Column Mapping
                </button>
              </div>
            </div>
          )}

          {uploadState === 'mapping' && columnMapping && (
            <div className="space-y-6">
              <ColumnMapper
                headers={headers}
                initialMapping={columnMapping}
                onConfirm={handleMappingConfirm}
                onCancel={handleCancel}
              />

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                <TransactionPreview
                  rows={getPreviewRows(parsedData, 5)}
                  mapping={columnMapping}
                  bankType={bankType}
                />
              </div>
            </div>
          )}

          {uploadState === 'processing' && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Processing upload...</div>
            </div>
          )}
        </div>

        {/* Uploads List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Uploaded Statements</h2>

          {uploadsLoading ? (
            <p className="text-gray-500">Loading uploads...</p>
          ) : uploads && uploads.length > 0 ? (
            <div className="divide-y">
              {uploads.map(upload => (
                <div key={upload.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{upload.filename}</p>
                    <p className="text-sm text-gray-500">
                      {upload.bankType} • {upload.accountType} • {upload.transactionCount} transactions
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">
                      {new Date(upload.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteUpload(upload.id)}
                      disabled={deletingUploadId === upload.id}
                      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                    >
                      {deletingUploadId === upload.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No statements uploaded yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
