import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

// Initialize mermaid with dark theme
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
        primaryColor: '#8b5cf6',
        primaryTextColor: '#f3f4f6',
        primaryBorderColor: '#6d28d9',
        lineColor: '#9ca3af',
        secondaryColor: '#1f2937',
        tertiaryColor: '#374151',
        background: '#111827',
        mainBkg: '#1f2937',
        nodeBorder: '#6d28d9',
        clusterBkg: '#374151',
        titleColor: '#f3f4f6',
        edgeLabelBackground: '#1f2937',
    },
    flowchart: {
        curve: 'basis',
        padding: 20,
    },
    sequence: {
        actorMargin: 50,
        messageMargin: 40,
    }
});

// Mermaid diagram component
function MermaidDiagram({ code }) {
    const containerRef = useRef(null);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const renderDiagram = async () => {
            if (!code || !containerRef.current) return;

            try {
                const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, code);
                setSvg(svg);
                setError('');
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Could not render diagram');
            }
        };

        renderDiagram();
    }, [code]);

    if (error) {
        return (
            <div className="mermaid-error">
                <span>⚠️ {error}</span>
                <pre className="code-block"><code>{code}</code></pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="mermaid-diagram"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

export default function ChatMessage({ message, isUser }) {
    return (
        <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
            <div className="chat-message-avatar">
                {isUser ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a10 10 0 0 0-7.35 16.76l-.3 3.84a.5.5 0 0 0 .72.48l3.72-1.86A10 10 0 1 0 12 2z" />
                        <circle cx="8" cy="12" r="1" fill="currentColor" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        <circle cx="16" cy="12" r="1" fill="currentColor" />
                    </svg>
                )}
            </div>
            <div className="chat-message-content">
                {isUser ? (
                    message.content
                ) : (
                    <div className="markdown-content">
                        <ReactMarkdown
                            components={{
                                // Custom styling for code blocks - detect mermaid
                                code: ({ node, inline, className, children, ...props }) => {
                                    const codeContent = String(children).replace(/\n$/, '');
                                    const match = /language-(\w+)/.exec(className || '');
                                    const language = match ? match[1] : '';

                                    // Check if it's a mermaid diagram
                                    if (!inline && (language === 'mermaid' ||
                                        codeContent.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph)/))) {
                                        return <MermaidDiagram code={codeContent} />;
                                    }

                                    return inline ? (
                                        <code className="inline-code" {...props}>
                                            {children}
                                        </code>
                                    ) : (
                                        <pre className="code-block">
                                            {language && <div className="code-language">{language}</div>}
                                            <code {...props}>{children}</code>
                                        </pre>
                                    );
                                },
                                // Style lists
                                ul: ({ children }) => <ul className="markdown-list">{children}</ul>,
                                ol: ({ children }) => <ol className="markdown-list markdown-list-ordered">{children}</ol>,
                                // Style headings
                                h1: ({ children }) => <h1 className="markdown-heading">{children}</h1>,
                                h2: ({ children }) => <h2 className="markdown-heading">{children}</h2>,
                                h3: ({ children }) => <h3 className="markdown-heading">{children}</h3>,
                                // Style paragraphs
                                p: ({ children }) => <p className="markdown-paragraph">{children}</p>,
                                // Style links
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
                                        {children}
                                    </a>
                                ),
                                // Style blockquotes
                                blockquote: ({ children }) => (
                                    <blockquote className="markdown-blockquote">{children}</blockquote>
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
