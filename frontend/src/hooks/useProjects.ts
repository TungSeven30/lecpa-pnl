import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface Project {
  id: number;
  userId: number;
  clientName: string;
  clientEmail: string;
  industry: 'real_estate' | 'ecommerce' | 'medical';
  periodStart: string;
  periodEnd: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  clientName: string;
  clientEmail: string;
  industry: 'real_estate' | 'ecommerce' | 'medical';
  periodStart: string;
  periodEnd: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const data = await apiFetch<{ projects: Project[] }>('/projects');
      return data.projects;
    }
  });
}

export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const data = await apiFetch<{ project: Project }>(`/projects/${id}`);
      return data.project;
    },
    enabled: !!id
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: CreateProjectInput) => {
      const data = await apiFetch<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify(project)
      });
      return data.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateProjectInput> & { id: number }) => {
      const data = await apiFetch<{ project: Project }>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return data.project;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}
