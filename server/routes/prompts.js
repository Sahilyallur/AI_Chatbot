import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { errorResponse, successResponse } from '../utils/helpers.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/projects/:projectId/prompts
 * List all prompts for a project
 */
router.get('/projects/:projectId/prompts', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project belongs to user
        const project = await db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        const prompts = await db.prepare(`
            SELECT * FROM prompts 
            WHERE project_id = ? 
            ORDER BY created_at DESC
        `).all(projectId);

        return successResponse(res, { prompts });
    } catch (error) {
        console.error('List prompts error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to fetch prompts');
    }
});

/**
 * POST /api/projects/:projectId/prompts
 * Create a new prompt for a project
 */
router.post('/projects/:projectId/prompts', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, content } = req.body;

        // Validate input
        if (!name || !name.trim()) {
            return errorResponse(res, 400, 'Missing name', 'Prompt name is required');
        }

        if (!content || !content.trim()) {
            return errorResponse(res, 400, 'Missing content', 'Prompt content is required');
        }

        // Verify project belongs to user
        const project = await db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        const stmt = db.prepare(`
            INSERT INTO prompts (project_id, name, content)
            VALUES (?, ?, ?)
        `);

        const result = await stmt.run(projectId, name.trim(), content.trim());

        const prompt = await db.prepare('SELECT * FROM prompts WHERE id = ?').get(result.lastInsertRowid);

        return successResponse(res, { prompt }, 'Prompt created successfully');
    } catch (error) {
        console.error('Create prompt error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to create prompt');
    }
});

/**
 * GET /api/prompts/:id
 * Get a specific prompt
 */
router.get('/prompts/:id', async (req, res) => {
    try {
        const prompt = await db.prepare(`
            SELECT p.* FROM prompts p
            JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = ? AND pr.user_id = ?
        `).get(req.params.id, req.user.id);

        if (!prompt) {
            return errorResponse(res, 404, 'Not found', 'Prompt not found');
        }

        return successResponse(res, { prompt });
    } catch (error) {
        console.error('Get prompt error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to fetch prompt');
    }
});

/**
 * PUT /api/prompts/:id
 * Update a prompt
 */
router.put('/prompts/:id', async (req, res) => {
    try {
        const { name, content } = req.body;
        const promptId = req.params.id;

        // Verify prompt exists and belongs to user's project
        const existing = await db.prepare(`
            SELECT p.* FROM prompts p
            JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = ? AND pr.user_id = ?
        `).get(promptId, req.user.id);

        if (!existing) {
            return errorResponse(res, 404, 'Not found', 'Prompt not found');
        }

        const stmt = db.prepare(`
            UPDATE prompts 
            SET name = COALESCE(?, name),
                content = COALESCE(?, content),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        await stmt.run(
            name?.trim() || null,
            content?.trim() || null,
            promptId
        );

        const prompt = await db.prepare('SELECT * FROM prompts WHERE id = ?').get(promptId);

        return successResponse(res, { prompt }, 'Prompt updated successfully');
    } catch (error) {
        console.error('Update prompt error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to update prompt');
    }
});

/**
 * DELETE /api/prompts/:id
 * Delete a prompt
 */
router.delete('/prompts/:id', async (req, res) => {
    try {
        const promptId = req.params.id;

        // Verify prompt exists and belongs to user's project
        const existing = await db.prepare(`
            SELECT p.* FROM prompts p
            JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = ? AND pr.user_id = ?
        `).get(promptId, req.user.id);

        if (!existing) {
            return errorResponse(res, 404, 'Not found', 'Prompt not found');
        }

        await db.prepare('DELETE FROM prompts WHERE id = ?').run(promptId);

        return successResponse(res, null, 'Prompt deleted successfully');
    } catch (error) {
        console.error('Delete prompt error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to delete prompt');
    }
});

export default router;
