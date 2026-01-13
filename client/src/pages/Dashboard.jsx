import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../api';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', system_prompt: '' });
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            const response = await getProjects();
            setProjects(response.data.projects);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateProject(e) {
        e.preventDefault();
        if (!newProject.name.trim()) return;

        setCreating(true);
        try {
            const response = await createProject(newProject);
            setProjects([response.data.project, ...projects]);
            setShowCreateModal(false);
            setNewProject({ name: '', description: '', system_prompt: '' });
            // Navigate to the new project
            navigate(`/projects/${response.data.project.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    }

    function handleProjectClick(project) {
        navigate(`/projects/${project.id}`);
    }

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="container">
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className="page-title">My Projects</h1>
                            <p className="page-subtitle">Create and manage your AI chatbot agents</p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Project
                        </button>
                    </div>

                    {error && (
                        <div className="form-error" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="empty-state">
                            <div className="loading-spinner" style={{ width: 48, height: 48 }} />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="empty-state">
                            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="10" y1="10" x2="14" y2="10" />
                            </svg>
                            <h3 className="empty-state-title">No projects yet</h3>
                            <p className="empty-state-description">
                                Create your first AI chatbot project to get started. Each project can have its own personality and knowledge.
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Create Your First Project
                            </button>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {projects.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onClick={() => handleProjectClick(project)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Project"
            >
                <form onSubmit={handleCreateProject}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="projectName">Project Name *</label>
                        <input
                            id="projectName"
                            type="text"
                            className="form-input"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                            placeholder="My AI Assistant"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="projectDescription">Description</label>
                        <textarea
                            id="projectDescription"
                            className="form-input form-textarea"
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            placeholder="What does this chatbot do?"
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="systemPrompt">System Prompt</label>
                        <textarea
                            id="systemPrompt"
                            className="form-input form-textarea"
                            value={newProject.system_prompt}
                            onChange={(e) => setNewProject({ ...newProject, system_prompt: e.target.value })}
                            placeholder="You are a helpful AI assistant..."
                            rows={4}
                        />
                        <small style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                            The system prompt defines your chatbot's personality and behavior.
                        </small>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={creating || !newProject.name.trim()}
                        >
                            {creating ? (
                                <>
                                    <div className="loading-spinner" />
                                    Creating...
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
