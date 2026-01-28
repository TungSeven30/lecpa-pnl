import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { BankType, AccountType } from '../services/bankConfigs';

export interface Upload {
  id: number;
  projectId: number;
  bankType: BankType;
  accountType: AccountType;
  filename: string;
  transactionCount: number;
  status: string;
  createdAt: string;
}

export interface TransactionInput {
  date: string;
  description: string;
  amount: number;
  memo: string | null;
}

export interface CreateUploadInput {
  bankType: BankType;
  accountType: AccountType;
  filename: string;
  transactions: TransactionInput[];
}

export function useUploads(projectId: number) {
  return useQuery({
    queryKey: ['uploads', projectId],
    queryFn: async () => {
      const response = await apiFetch<{ uploads: Upload[] }>(`/projects/${projectId}/uploads`);
      return response.uploads;
    },
    enabled: !!projectId
  });
}

export function useCreateUpload(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUploadInput) => {
      const response = await apiFetch<{ upload: Upload; imported: number }>(
        `/projects/${projectId}/uploads`,
        {
          method: 'POST',
          body: JSON.stringify(input)
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads', projectId] });
    }
  });
}

export function useDeleteUpload(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uploadId: number) => {
      const response = await fetch(`/api/projects/${projectId}/uploads/${uploadId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete upload' }));
        throw new Error(error.error || 'Failed to delete upload');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads', projectId] });
    }
  });
}
