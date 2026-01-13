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
 * Get chat history for a project
 */
router.get('/projects/:projectId/messages', (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        const messages = db.prepare(`
            SELECT * FROM messages 
            WHERE project_id = ? 
            ORDER BY created_at ASC
            LIMIT ? OFFSET ?
        `).all(projectId, parseInt(limit), parseInt(offset));

        const total = db.prepare('SELECT COUNT(*) as count FROM messages WHERE project_id = ?')
            .get(projectId).count;

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
        const { message, usePrompt } = req.body;

        if (!message || !message.trim()) {
            return errorResponse(res, 400, 'Missing message', 'Message content is required');
        }

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        // Save user message
        const userMsgStmt = db.prepare(`
            INSERT INTO messages (project_id, role, content)
            VALUES (?, 'user', ?)
        `);
        const userMsgResult = userMsgStmt.run(projectId, message.trim());

        // Build messages array for the API
        const systemMessages = [];

        // Add system prompt
        if (project.system_prompt) {
            systemMessages.push({
                role: 'system',
                content: project.system_prompt
            });
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

        // Get recent conversation history (last 20 messages)
        const history = db.prepare(`
            SELECT role, content FROM messages 
            WHERE project_id = ? AND id != ?
            ORDER BY created_at DESC 
            LIMIT 20
        `).all(projectId, userMsgResult.lastInsertRowid).reverse();

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
                const response = await sendStreamingChatCompletion(apiMessages, {
                    model: project.model
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);

                            if (data === '[DONE]') {
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;

                                if (content) {
                                    fullResponse += content;
                                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                                }
                            } catch (e) {
                                // Ignore parsing errors
                            }
                        }
                    }
                }

                // Save assistant message
                if (fullResponse) {
                    db.prepare(`
                        INSERT INTO messages (project_id, role, content)
                        VALUES (?, 'assistant', ?)
                    `).run(projectId, fullResponse);
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
                const assistantMsgStmt = db.prepare(`
                    INSERT INTO messages (project_id, role, content)
                    VALUES (?, 'assistant', ?)
                `);
                assistantMsgStmt.run(projectId, assistantMessage);

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
 * Clear chat history for a project
 */
router.delete('/projects/:projectId/messages', (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        db.prepare('DELETE FROM messages WHERE project_id = ?').run(projectId);

        return successResponse(res, null, 'Chat history cleared');
    } catch (error) {
        console.error('Clear messages error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to clear chat history');
    }
});

export default router;
