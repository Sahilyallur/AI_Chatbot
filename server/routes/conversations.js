import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { errorResponse, successResponse } from '../utils/helpers.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/projects/:projectId/conversations
 * List all conversations for a project
 */
router.get('/projects/:projectId/conversations', (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        const conversations = db.prepare(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
                   (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
            FROM conversations c
            WHERE c.project_id = ?
            ORDER BY c.updated_at DESC
        `).all(projectId);

        return successResponse(res, { conversations });
    } catch (error) {
        console.error('List conversations error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to fetch conversations');
    }
});

/**
 * POST /api/projects/:projectId/conversations
 * Create a new conversation
 */
router.post('/projects/:projectId/conversations', (req, res) => {
    try {
        const { projectId } = req.params;
        const { title } = req.body;

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        const stmt = db.prepare(
            'INSERT INTO conversations (project_id, title) VALUES (?, ?)'
        );
        stmt.run(projectId, title || 'New Chat');

        // Get the created conversation
        const conversation = db.prepare(
            'SELECT * FROM conversations WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
        ).get(projectId);

        return successResponse(res, { conversation }, 'Conversation created');
    } catch (error) {
        console.error('Create conversation error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to create conversation');
    }
});

/**
 * PUT /api/conversations/:id
 * Update a conversation (e.g., rename)
 */
router.put('/conversations/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        // Verify conversation belongs to user's project
        const conversation = db.prepare(`
            SELECT c.* FROM conversations c
            JOIN projects p ON c.project_id = p.id
            WHERE c.id = ? AND p.user_id = ?
        `).get(id, req.user.id);

        if (!conversation) {
            return errorResponse(res, 404, 'Not found', 'Conversation not found');
        }

        db.prepare(
            'UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(title || conversation.title, id);

        const updated = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);

        return successResponse(res, { conversation: updated }, 'Conversation updated');
    } catch (error) {
        console.error('Update conversation error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to update conversation');
    }
});

/**
 * DELETE /api/conversations/:id
 * Delete a conversation and its messages
 */
router.delete('/conversations/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Verify conversation belongs to user's project
        const conversation = db.prepare(`
            SELECT c.* FROM conversations c
            JOIN projects p ON c.project_id = p.id
            WHERE c.id = ? AND p.user_id = ?
        `).get(id, req.user.id);

        if (!conversation) {
            return errorResponse(res, 404, 'Not found', 'Conversation not found');
        }

        db.prepare('DELETE FROM conversations WHERE id = ?').run(id);

        return successResponse(res, null, 'Conversation deleted');
    } catch (error) {
        console.error('Delete conversation error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to delete conversation');
    }
});

export default router;
