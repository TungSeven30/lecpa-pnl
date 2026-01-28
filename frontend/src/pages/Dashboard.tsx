import { Link } from 'react-router-dom';
import { useProjects, useDeleteProject } from '../hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import { Layout } from '../components/Layout';

export function Dashboard() {
  const { data: projects, isLoading, error } = useProjects();
  const deleteProject = useDeleteProject();

  const handleDelete = (id: number) => {
    deleteProject.mutate(id);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Projects</h2>
        <Link
          to="/projects/new"
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 6,
            fontWeight: 500
          }}
        >
          + New Project
        </Link>
      </div>

      {isLoading && <p>Loading projects...</p>}

      {error && (
        <p style={{ color: 'red' }}>Failed to load projects. Please try again.</p>
      )}

      {projects && projects.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#666', marginBottom: 16 }}>No projects yet.</p>
          <Link
            to="/projects/new"
            style={{ color: '#2563eb' }}
          >
            Create your first project
          </Link>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}>
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
