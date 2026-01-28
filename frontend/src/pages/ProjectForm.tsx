import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProject, useCreateProject, useUpdateProject } from '../hooks/useProjects';
import { Layout } from '../components/Layout';

const projectSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(100),
  clientEmail: z.string().email('Invalid email address'),
  industry: z.enum(['real_estate', 'ecommerce', 'medical'], {
    errorMap: () => ({ message: 'Please select an industry' })
  }),
  periodStart: z.string().min(1, 'Start date is required'),
  periodEnd: z.string().min(1, 'End date is required')
}).refine(data => new Date(data.periodStart) < new Date(data.periodEnd), {
  message: 'End date must be after start date',
  path: ['periodEnd']
});

type ProjectFormData = z.infer<typeof projectSchema>;

export function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const projectId = id ? parseInt(id) : undefined;

  const { data: existingProject, isLoading: loadingProject } = useProject(projectId);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      industry: undefined,
      periodStart: '',
      periodEnd: ''
    }
  });

  // Populate form when editing
  useEffect(() => {
    if (existingProject) {
      reset({
        clientName: existingProject.clientName,
        clientEmail: existingProject.clientEmail,
        industry: existingProject.industry,
        periodStart: existingProject.periodStart.split('T')[0],
        periodEnd: existingProject.periodEnd.split('T')[0]
      });
    }
  }, [existingProject, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (isEdit && projectId) {
        await updateProject.mutateAsync({ id: projectId, ...data });
      } else {
        await createProject.mutateAsync(data);
      }
      navigate('/dashboard');
    } catch {
      // Error handled by mutation
    }
  };

  if (isEdit && loadingProject) {
    return <Layout title="Loading..."><p>Loading project...</p></Layout>;
  }

  const inputStyle = {
    width: '100%',
    padding: 10,
    fontSize: 16,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 4,
    fontWeight: 500 as const
  };

  const errorStyle = {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4
  };

  return (
    <Layout title={isEdit ? 'Edit Project' : 'New Project'}>
      <div style={{ maxWidth: 600 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle} htmlFor="clientName">Client Name</label>
          <input
            id="clientName"
            type="text"
            {...register('clientName')}
            style={inputStyle}
            placeholder="Acme Corp"
          />
          {errors.clientName && <p style={errorStyle}>{errors.clientName.message}</p>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle} htmlFor="clientEmail">Client Email</label>
          <input
            id="clientEmail"
            type="email"
            {...register('clientEmail')}
            style={inputStyle}
            placeholder="client@example.com"
          />
          {errors.clientEmail && <p style={errorStyle}>{errors.clientEmail.message}</p>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle} htmlFor="industry">Industry</label>
          <select
            id="industry"
            {...register('industry')}
            style={inputStyle}
          >
            <option value="">Select industry...</option>
            <option value="real_estate">Real Estate</option>
            <option value="ecommerce">E-Commerce / Retail</option>
            <option value="medical">Medical / Healthcare</option>
          </select>
          {errors.industry && <p style={errorStyle}>{errors.industry.message}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle} htmlFor="periodStart">Period Start</label>
            <input
              id="periodStart"
              type="date"
              {...register('periodStart')}
              style={inputStyle}
            />
            {errors.periodStart && <p style={errorStyle}>{errors.periodStart.message}</p>}
          </div>
          <div>
            <label style={labelStyle} htmlFor="periodEnd">Period End</label>
            <input
              id="periodEnd"
              type="date"
              {...register('periodEnd')}
              style={inputStyle}
            />
            {errors.periodEnd && <p style={errorStyle}>{errors.periodEnd.message}</p>}
          </div>
        </div>

        {(createProject.error || updateProject.error) && (
          <p style={{ color: '#dc2626', marginBottom: 16 }}>
            {createProject.error?.message || updateProject.error?.message || 'An error occurred'}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 16,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Saving...' : (isEdit ? 'Update Project' : 'Create Project')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
      </div>
    </Layout>
  );
}
