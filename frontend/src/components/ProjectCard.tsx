import { Link } from 'react-router-dom';
import type { Project } from '../hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: number) => void;
}

const industryLabels: Record<string, string> = {
  real_estate: 'Real Estate',
  ecommerce: 'E-Commerce / Retail',
  medical: 'Medical / Healthcare'
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  const handleDelete = () => {
    if (confirm(`Delete project for ${project.clientName}?`)) {
      onDelete(project.id);
    }
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 16,
      backgroundColor: 'white'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: 4 }}>{project.clientName}</h3>
          <p style={{ color: '#666', margin: 0, fontSize: 14 }}>{project.clientEmail}</p>
        </div>
        <span style={{
          backgroundColor: '#e0f2fe',
          color: '#0369a1',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12
        }}>
          {industryLabels[project.industry] || project.industry}
        </span>
      </div>

      <div style={{ marginTop: 12, color: '#666', fontSize: 14 }}>
        <p style={{ margin: 0 }}>
          Period: {formatDate(project.periodStart)} - {formatDate(project.periodEnd)}
        </p>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <Link
          to={`/projects/${project.id}`}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 4,
            fontSize: 14
          }}
        >
          Open
        </Link>
        <Link
          to={`/projects/${project.id}/edit`}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            textDecoration: 'none',
            borderRadius: 4,
            fontSize: 14
          }}
        >
          Edit
        </Link>
        <button
          onClick={handleDelete}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#dc2626',
            border: '1px solid #dc2626',
            borderRadius: 4,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
