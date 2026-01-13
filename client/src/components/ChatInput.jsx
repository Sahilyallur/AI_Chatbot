import { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, disabled }) {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [message]);

    function handleSubmit(e) {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    }

    return (
        <div className="chat-input-container">
            <form className="chat-input-wrapper" onSubmit={handleSubmit}>
                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                    disabled={disabled}
                    rows={1}
                />
                <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={disabled || !message.trim()}
                >
                    {disabled ? (
                        <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22,2 15,22 11,13 2,9" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
}
