export default function ProjectCard({ project, onClick }) {
    return (
        <div className="project-card" onClick={onClick}>
            <div className="project-card-header">
                <div className="project-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
            </div>

            <h3 className="project-card-title">{project.name}</h3>

            <p className="project-card-description">
                {project.description || 'No description provided'}
            </p>

            <div className="project-card-stats">
                <div className="project-card-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {project.message_count || 0} messages
                </div>
                <div className="project-card-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14,2 14,8 20,8" />
                    </svg>
                    {project.prompt_count || 0} prompts
                </div>
            </div>
        </div>
    );
}
