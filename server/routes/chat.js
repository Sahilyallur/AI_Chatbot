import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { errorResponse, successResponse } from '../utils/helpers.js';
import { sendStreamingChatCompletion, parseSSEChunk } from '../services/llmService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/projects/:projectId/messages
 * Get chat history for a project (optionally filtered by conversation)
 */
router.get('/projects/:projectId/messages', (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit = 50, offset = 0, conversationId } = req.query;

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        let messages;
        let total;

        if (conversationId) {
            messages = db.prepare(`
                SELECT * FROM messages 
                WHERE project_id = ? AND conversation_id = ?
                ORDER BY created_at ASC
                LIMIT ? OFFSET ?
            `).all(projectId, conversationId, parseInt(limit), parseInt(offset));

            total = db.prepare('SELECT COUNT(*) as count FROM messages WHERE project_id = ? AND conversation_id = ?')
                .get(projectId, conversationId).count;
        } else {
            messages = db.prepare(`
                SELECT * FROM messages 
                WHERE project_id = ? 
                ORDER BY created_at ASC
                LIMIT ? OFFSET ?
            `).all(projectId, parseInt(limit), parseInt(offset));

            total = db.prepare('SELECT COUNT(*) as count FROM messages WHERE project_id = ?')
                .get(projectId).count;
        }

        return successResponse(res, { messages, total });
    } catch (error) {
        console.error('Get messages error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to fetch messages');
    }
});

/**
 * POST /api/projects/:projectId/chat
 * Send a message and get AI response (with streaming)
 */
router.post('/projects/:projectId/chat', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { message, usePrompt, conversationId, fileIds } = req.body;

        if (!message || !message.trim()) {
            return errorResponse(res, 400, 'Missing message', 'Message content is required');
        }

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        // If no conversation specified, create one or use the first message without conversation
        let actualConversationId = conversationId;

        if (conversationId) {
            // Verify conversation exists
            const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND project_id = ?')
                .get(conversationId, projectId);
            if (!conv) {
                return errorResponse(res, 404, 'Not found', 'Conversation not found');
            }

            // Update conversation timestamp
            db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(conversationId);
        }

        // Save user message
        const userMsgStmt = db.prepare(`
            INSERT INTO messages (project_id, conversation_id, role, content)
            VALUES (?, ?, 'user', ?)
        `);
        userMsgStmt.run(projectId, actualConversationId || null, message.trim());

        // Build messages array for the API
        const systemMessages = [];

        // Add system prompt
        if (project.system_prompt) {
            systemMessages.push({
                role: 'system',
                content: project.system_prompt
            });
        }

        // Add file context if fileIds are provided
        if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
            const filePlaceholders = fileIds.map(() => '?').join(',');
            const files = db.prepare(`
                SELECT original_name, extracted_text FROM files 
                WHERE id IN (${filePlaceholders}) AND project_id = ?
            `).all(...fileIds, projectId);

            if (files.length > 0) {
                let fileContext = 'The user has attached the following file(s) for context:\n\n';
                for (const file of files) {
                    if (file.extracted_text) {
                        fileContext += `--- FILE: ${file.original_name} ---\n${file.extracted_text.substring(0, 4000)}\n--- END OF FILE ---\n\n`;
                    }
                }
                systemMessages.push({
                    role: 'system',
                    content: fileContext
                });
            }
        }

        // Optionally use a saved prompt
        if (usePrompt) {
            const prompt = db.prepare(`
                SELECT * FROM prompts 
                WHERE id = ? AND project_id = ?
            `).get(usePrompt, projectId);

            if (prompt) {
                systemMessages.push({
                    role: 'system',
                    content: prompt.content
                });
            }
        }

        // Get recent conversation history (last 20 messages from this conversation)
        let history;
        if (actualConversationId) {
            history = db.prepare(`
                SELECT role, content FROM messages 
                WHERE project_id = ? AND conversation_id = ?
                ORDER BY created_at DESC 
                LIMIT 20
            `).all(projectId, actualConversationId).reverse();
        } else {
            history = db.prepare(`
                SELECT role, content FROM messages 
                WHERE project_id = ? AND conversation_id IS NULL
                ORDER BY created_at DESC 
                LIMIT 20
            `).all(projectId).reverse();
        }

        // Remove the last message (the one we just added) from history
        if (history.length > 0) {
            history.pop();
        }

        // Build full messages array
        const apiMessages = [
            ...systemMessages,
            ...history,
            { role: 'user', content: message.trim() }
        ];

        // Check if streaming is requested
        const streamMode = req.query.stream !== 'false';

        if (streamMode) {
            // Set up SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            let fullResponse = '';

            try {
                console.log('Sending request to model:', project.model);
                const response = await sendStreamingChatCompletion(apiMessages, {
                    model: project.model
                });

                console.log('Response status:', response.status, 'OK:', response.ok);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error Response:', errorText);
                    throw new Error(`API returned ${response.status}: ${errorText.substring(0, 200)}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let firstChunkLogged = false;

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        console.log('Stream done. Total response length:', fullResponse.length);
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });

                    // Log first chunk for debugging
                    if (!firstChunkLogged) {
                        console.log('First raw chunk:', chunk.substring(0, 500));
                        firstChunkLogged = true;
                    }

                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);

                            if (data === '[DONE]') {
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);

                                // Try multiple content extraction methods for different providers
                                let content = null;

                                // OpenAI/Standard format
                                if (parsed.choices?.[0]?.delta?.content) {
                                    content = parsed.choices[0].delta.content;
                                }
                                // Some models use message instead of delta
                                else if (parsed.choices?.[0]?.message?.content) {
                                    content = parsed.choices[0].message.content;
                                }
                                // Text completion format
                                else if (parsed.choices?.[0]?.text) {
                                    content = parsed.choices[0].text;
                                }
                                // Direct content field (some providers)
                                else if (parsed.content) {
                                    content = parsed.content;
                                }
                                // Anthropic format
                                else if (parsed.delta?.text) {
                                    content = parsed.delta.text;
                                }
                                // Completion from some models
                                else if (parsed.completion) {
                                    content = parsed.completion;
                                }

                                if (content) {
                                    fullResponse += content;
                                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                                } else if (Object.keys(parsed).length > 0 && !parsed.id && !parsed.model) {
                                    // Log unhandled response formats for debugging
                                    console.log('Unhandled response format:', JSON.stringify(parsed).substring(0, 300));
                                }
                            } catch (e) {
                                // Log parsing errors for debugging
                                console.log('SSE parse error:', e.message, 'Data:', data.substring(0, 100));
                            }
                        }
                    }
                }

                // If streaming didn't return content, try non-streaming fallback
                if (!fullResponse) {
                    console.log('Streaming returned empty response, trying non-streaming fallback...');
                    const { sendChatCompletion } = await import('../services/llmService.js');

                    try {
                        const fallbackResponse = await sendChatCompletion(apiMessages, {
                            model: project.model
                        });

                        if (fallbackResponse.choices?.[0]?.message?.content) {
                            fullResponse = fallbackResponse.choices[0].message.content;
                            res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
                            console.log('Non-streaming fallback successful, response length:', fullResponse.length);
                        }
                    } catch (fallbackError) {
                        console.error('Non-streaming fallback also failed:', fallbackError.message);
                    }
                }

                // Save assistant message
                if (fullResponse) {
                    db.prepare(`
                        INSERT INTO messages (project_id, conversation_id, role, content)
                        VALUES (?, ?, 'assistant', ?)
                    `).run(projectId, actualConversationId || null, fullResponse);
                }

                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                res.end();

            } catch (error) {
                console.error('Streaming error:', error);
                res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
                res.end();
            }

        } else {
            // Non-streaming response
            try {
                const { sendChatCompletion } = await import('../services/llmService.js');
                const response = await sendChatCompletion(apiMessages, {
                    model: project.model
                });

                const assistantMessage = response.choices?.[0]?.message?.content || '';

                // Save assistant message
                db.prepare(`
                    INSERT INTO messages (project_id, conversation_id, role, content)
                    VALUES (?, ?, 'assistant', ?)
                `).run(projectId, actualConversationId || null, assistantMessage);

                return successResponse(res, {
                    message: assistantMessage,
                    usage: response.usage
                });

            } catch (error) {
                console.error('Chat completion error:', error);
                return errorResponse(res, 500, 'LLM error', error.message || 'Failed to get AI response');
            }
        }

    } catch (error) {
        console.error('Chat error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to process chat message');
    }
});

/**
 * DELETE /api/projects/:projectId/messages
 * Clear chat history for a project (optionally for a specific conversation)
 */
router.delete('/projects/:projectId/messages', (req, res) => {
    try {
        const { projectId } = req.params;
        const { conversationId } = req.query;

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        if (conversationId) {
            db.prepare('DELETE FROM messages WHERE project_id = ? AND conversation_id = ?')
                .run(projectId, conversationId);
        } else {
            db.prepare('DELETE FROM messages WHERE project_id = ?').run(projectId);
        }

        return successResponse(res, null, 'Chat history cleared');
    } catch (error) {
        console.error('Clear messages error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to clear chat history');
    }
});

export default router;
