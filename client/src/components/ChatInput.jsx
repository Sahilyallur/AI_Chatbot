import { useState, useRef, useEffect } from 'react';

const FILE_TYPES = [
    { id: 'image', label: 'Image (OCR)', icon: '🖼️', accept: '.jpg,.jpeg,.png,.gif,.webp', description: 'Extract text from images' },
    { id: 'pdf', label: 'PDF Document', icon: '📄', accept: '.pdf', description: 'Extract text from PDFs' },
    { id: 'word', label: 'Word Document', icon: '📃', accept: '.doc,.docx', description: 'Extract text from Word files' },
    { id: 'text', label: 'Text File', icon: '📝', accept: '.txt,.md,.csv,.json', description: 'Plain text, Markdown, CSV, JSON' },
];

export default function ChatInput({ onSend, onFileUpload, disabled, uploading }) {
    const [message, setMessage] = useState('');
    const [attachedFile, setAttachedFile] = useState(null);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [selectedFileType, setSelectedFileType] = useState(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [message]);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowFileMenu(false);
            }
        }
        if (showFileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showFileMenu]);

    async function handleSubmit(e) {
        e.preventDefault();
        if ((message.trim() || attachedFile) && !disabled && !uploading) {
            // If there's a file attached, upload it first
            if (attachedFile) {
                try {
                    const uploadedFile = await onFileUpload(attachedFile);
                    // Send message with file ID
                    if (message.trim()) {
                        onSend(message.trim(), uploadedFile?.id ? [uploadedFile.id] : []);
                    }
                } catch (err) {
                    console.error('File upload failed:', err);
                }
                setAttachedFile(null);
            } else {
                onSend(message.trim(), []);
            }
            setMessage('');
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    }

    function handleFileTypeSelect(fileType) {
        setSelectedFileType(fileType);
        setShowFileMenu(false);
        // Trigger file input with the specific accept type
        if (fileInputRef.current) {
            fileInputRef.current.accept = fileType.accept;
            fileInputRef.current.click();
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (file) {
            setAttachedFile(file);
        }
        e.target.value = '';
        setSelectedFileType(null);
    }

    function removeAttachedFile() {
        setAttachedFile(null);
    }

    function toggleFileMenu() {
        setShowFileMenu(!showFileMenu);
    }

    return (
        <div className="chat-input-container">
            {/* Attached file preview */}
            {attachedFile && (
                <div className="attached-file-preview">
                    <div className="attached-file-info">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14,2 14,8 20,8" />
                        </svg>
                        <span className="attached-file-name">{attachedFile.name}</span>
                        <span className="attached-file-size">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                        type="button"
                        className="attached-file-remove"
                        onClick={removeAttachedFile}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            <form className="chat-input-wrapper" onSubmit={handleSubmit}>
                <div className="chat-input-box">
                    {/* File attachment button with dropdown */}
                    <div className="file-attach-wrapper" ref={menuRef}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            className="chat-inline-btn chat-attach-btn"
                            onClick={toggleFileMenu}
                            disabled={disabled || uploading}
                            title="Attach file"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                        </button>

                        {/* File type dropdown menu */}
                        {showFileMenu && (
                            <div className="file-type-menu">
                                <div className="file-type-menu-header">Select File Type</div>
                                {FILE_TYPES.map(fileType => (
                                    <button
                                        key={fileType.id}
                                        type="button"
                                        className="file-type-option"
                                        onClick={() => handleFileTypeSelect(fileType)}
                                    >
                                        <span className="file-type-icon">{fileType.icon}</span>
                                        <div className="file-type-info">
                                            <span className="file-type-label">{fileType.label}</span>
                                            <span className="file-type-desc">{fileType.description}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <textarea
                        ref={textareaRef}
                        className="chat-input"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={attachedFile
                            ? "Add a prompt for your file... (Enter to send)"
                            : "Type your message... (Enter to send, Shift+Enter for new line)"
                        }
                        disabled={disabled || uploading}
                        rows={1}
                    />

                    <button
                        type="submit"
                        className="chat-inline-btn chat-send-btn"
                        disabled={disabled || uploading || (!message.trim() && !attachedFile)}
                    >
                        {disabled || uploading ? (
                            <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22,2 15,22 11,13 2,9" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
