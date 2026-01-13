import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, getMessages, sendMessageStream, clearMessages, updateProject, deleteProject, getPrompts, createPrompt, deletePrompt, getFiles, uploadFile, deleteFile } from '../api';
import Navbar from '../components/Navbar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Modal from '../components/Modal';

export default function Chat() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const [project, setProject] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [streamingMessage, setStreamingMessage] = useState('');

    // Settings modal
    const [showSettings, setShowSettings] = useState(false);
    const [editProject, setEditProject] = useState({});
    const [saving, setSaving] = useState(false);

    // Prompts management
    const [showPrompts, setShowPrompts] = useState(false);
    const [prompts, setPrompts] = useState([]);
    const [newPrompt, setNewPrompt] = useState({ name: '', content: '' });

    // Files management
    const [showFiles, setShowFiles] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadProject();
        loadMessages();
    }, [projectId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    async function loadProject() {
        try {
            const response = await getProject(projectId);
            setProject(response.data.project);
            setEditProject(response.data.project);
        } catch (err) {
            setError(err.message);
            if (err.message.includes('not found')) {
                navigate('/dashboard');
            }
        }
    }

    async function loadMessages() {
        try {
            const response = await getMessages(projectId);
            setMessages(response.data.messages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSendMessage(content) {
        setSending(true);
        setError('');
        setStreamingMessage('');

        // Add user message immediately
        const userMessage = {
            id: Date.now(),
            role: 'user',
            content,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            await sendMessageStream(
                projectId,
                content,
                (chunk, fullContent) => {
                    setStreamingMessage(fullContent);
                }
            );

            // Add the complete assistant message
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: streamingMessage || 'Response received',
                created_at: new Date().toISOString()
            }]);
            setStreamingMessage('');

            // Reload messages to get proper IDs
            loadMessages();

        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    async function handleClearChat() {
        if (!confirm('Are you sure you want to clear all chat history?')) return;

        try {
            await clearMessages(projectId);
            setMessages([]);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSaveSettings(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await updateProject(projectId, editProject);
            setProject(response.data.project);
            setShowSettings(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteProject() {
        if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return;

        try {
            await deleteProject(projectId);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    }

    // Prompts functions
    async function loadPrompts() {
        try {
            const response = await getPrompts(projectId);
            setPrompts(response.data.prompts);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleCreatePrompt(e) {
        e.preventDefault();
        if (!newPrompt.name.trim() || !newPrompt.content.trim()) return;

        try {
            const response = await createPrompt(projectId, newPrompt);
            setPrompts([response.data.prompt, ...prompts]);
            setNewPrompt({ name: '', content: '' });
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDeletePrompt(promptId) {
        if (!confirm('Delete this prompt?')) return;
        try {
            await deletePrompt(promptId);
            setPrompts(prompts.filter(p => p.id !== promptId));
        } catch (err) {
            setError(err.message);
        }
    }

    // Files functions
    async function loadFiles() {
        try {
            const response = await getFiles(projectId);
            setFiles(response.data.files);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await uploadFile(projectId, file);
            setFiles([response.data.file, ...files]);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    async function handleDeleteFile(fileId) {
        if (!confirm('Delete this file?')) return;
        try {
            await deleteFile(fileId);
            setFiles(files.filter(f => f.id !== fileId));
        } catch (err) {
            setError(err.message);
        }
    }

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div className="loading-spinner" style={{ width: 48, height: 48 }} />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="sidebar-header">
                        <Link to="/dashboard" className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15,18 9,12 15,6" />
                            </svg>
                            Back to Projects
                        </Link>
                    </div>

                    <div className="sidebar-content">
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                            {project?.name}
                        </h3>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                            {project?.description || 'No description'}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <button
                                className="sidebar-item"
                                onClick={() => { setShowPrompts(true); loadPrompts(); }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14,2 14,8 20,8" />
                                </svg>
                                Prompts
                            </button>

                            <button
                                className="sidebar-item"
                                onClick={() => { setShowFiles(true); loadFiles(); }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                </svg>
                                Files
                            </button>

                            <button
                                className="sidebar-item"
                                onClick={() => setShowSettings(true)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                                Settings
                            </button>

                            <button
                                className="sidebar-item"
                                onClick={handleClearChat}
                                style={{ color: 'var(--error-500)' }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3,6 5,6 21,6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Clear Chat
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                            Model: {project?.model || 'Default'}
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {error && (
                        <div style={{
                            padding: 'var(--space-3) var(--space-4)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--error-500)',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            {error}
                            <button
                                onClick={() => setError('')}
                                style={{ marginLeft: 'var(--space-2)', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div className="chat-messages">
                        {messages.length === 0 && !streamingMessage ? (
                            <div className="empty-state">
                                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <h3 className="empty-state-title">Start a conversation</h3>
                                <p className="empty-state-description">
                                    Send a message to begin chatting with your AI assistant.
                                </p>
                            </div>
                        ) : (
                            <>
                                {messages.map(message => (
                                    <ChatMessage
                                        key={message.id}
                                        message={message}
                                        isUser={message.role === 'user'}
                                    />
                                ))}
                                {streamingMessage && (
                                    <ChatMessage
                                        message={{ content: streamingMessage }}
                                        isUser={false}
                                    />
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <ChatInput onSend={handleSendMessage} disabled={sending} />
                </div>
            </div>

            {/* Settings Modal */}
            <Modal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                title="Project Settings"
            >
                <form onSubmit={handleSaveSettings}>
                    <div className="form-group">
                        <label className="form-label">Project Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={editProject.name || ''}
                            onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input form-textarea"
                            value={editProject.description || ''}
                            onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">System Prompt</label>
                        <textarea
                            className="form-input form-textarea"
                            value={editProject.system_prompt || ''}
                            onChange={(e) => setEditProject({ ...editProject, system_prompt: e.target.value })}
                            rows={5}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Model</label>
                        <select
                            className="form-input"
                            value={editProject.model || 'openai/gpt-3.5-turbo'}
                            onChange={(e) => setEditProject({ ...editProject, model: e.target.value })}
                        >
                            <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="openai/gpt-4">GPT-4</option>
                            <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet</option>
                            <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                            <option value="google/gemini-pro">Gemini Pro</option>
                            <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
                        </select>
                    </div>

                    <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleDeleteProject}
                        >
                            Delete Project
                        </button>
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowSettings(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Prompts Modal */}
            <Modal
                isOpen={showPrompts}
                onClose={() => setShowPrompts(false)}
                title="Saved Prompts"
            >
                <form onSubmit={handleCreatePrompt} style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="form-group">
                        <label className="form-label">Prompt Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newPrompt.name}
                            onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                            placeholder="e.g., Code Review"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Prompt Content</label>
                        <textarea
                            className="form-input form-textarea"
                            value={newPrompt.content}
                            onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                            placeholder="Enter the prompt text..."
                            rows={3}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">
                        Add Prompt
                    </button>
                </form>

                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {prompts.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-4)' }}>
                            No saved prompts yet
                        </p>
                    ) : (
                        prompts.map(prompt => (
                            <div
                                key={prompt.id}
                                style={{
                                    padding: 'var(--space-3)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--space-2)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 500, marginBottom: 'var(--space-1)' }}>{prompt.name}</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        {prompt.content.substring(0, 100)}...
                                    </div>
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleDeletePrompt(prompt.id)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3,6 5,6 21,6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            {/* Files Modal */}
            <Modal
                isOpen={showFiles}
                onClose={() => setShowFiles(false)}
                title="Project Files"
            >
                <div style={{ marginBottom: 'var(--space-4)' }}>
                    <input
                        type="file"
                        id="fileUpload"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        accept=".txt,.csv,.md,.json,.pdf,.jpg,.jpeg,.png,.gif,.webp"
                    />
                    <label htmlFor="fileUpload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                        {uploading ? (
                            <>
                                <div className="loading-spinner" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17,8 12,3 7,8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Upload File
                            </>
                        )}
                    </label>
                </div>

                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {files.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-4)' }}>
                            No files uploaded yet
                        </p>
                    ) : (
                        files.map(file => (
                            <div
                                key={file.id}
                                style={{
                                    padding: 'var(--space-3)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--space-2)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                        <polyline points="14,2 14,8 20,8" />
                                    </svg>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{file.original_name}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                            {(file.size / 1024).toFixed(1)} KB
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleDeleteFile(file.id)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3,6 5,6 21,6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </>
    );
}
