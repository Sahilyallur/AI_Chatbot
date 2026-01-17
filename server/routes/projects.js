import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { errorResponse, successResponse } from '../utils/helpers.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/projects
 * List all projects for the current user
 */
router.get('/', async (req, res) => {
    try {
        const projects = await db.prepare(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM messages WHERE project_id = p.id) as message_count,
                   (SELECT COUNT(*) FROM prompts WHERE project_id = p.id) as prompt_count
            FROM projects p 
            WHERE p.user_id = ? 
            ORDER BY p.updated_at DESC
        `).all(req.user.id);

        return successResponse(res, { projects });
    } catch (error) {
        console.error('List projects error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to fetch projects');
    }
});

/**
 * POST /api/projects
 * Create a new project/agent
 */
router.post('/', async (req, res) => {
    try {
        const { name, description, system_prompt, model } = req.body;

        if (!name || !name.trim()) {
            return errorResponse(res, 400, 'Missing name', 'Project name is required');
        }

        const trimmedName = name.trim();
        const stmt = db.prepare(`
            INSERT INTO projects (user_id, name, description, system_prompt, model)
            VALUES (?, ?, ?, ?, ?)
        `);

        await stmt.run(
            req.user.id,
            trimmedName,
            description || null,
            system_prompt || 'You are a helpful AI assistant.',
            model || process.env.DEFAULT_MODEL || 'openai/gpt-3.5-turbo'
        );

        // Get the created project by name and user (more reliable)
        const project = await db.prepare(
            'SELECT * FROM projects WHERE user_id = ? AND name = ? ORDER BY created_at DESC LIMIT 1'
        ).get(req.user.id, trimmedName);

        if (!project) {
            return errorResponse(res, 500, 'Server error', 'Failed to create project');
        }

        return successResponse(res, { project }, 'Project created successfully');
    } catch (error) {
        console.error('Create project error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to create project');
    }
});

/**
 * GET /api/projects/:id
 * Get a specific project
 */
router.get('/:id', async (req, res) => {
    try {
        const project = await db.prepare(`
            SELECT p.*,
                   (SELECT COUNT(*) FROM messages WHERE project_id = p.id) as message_count,
                   (SELECT COUNT(*) FROM prompts WHERE project_id = p.id) as prompt_count,
                   (SELECT COUNT(*) FROM files WHERE project_id = p.id) as file_count
            FROM projects p 
            WHERE p.id = ? AND p.user_id = ?
        `).get(req.params.id, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        return successResponse(res, { project });
    } catch (error) {
        console.error('Get project error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to fetch project');
    }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, description, system_prompt, model } = req.body;
        const projectId = req.params.id;

        // Check if project exists and belongs to user
        const existing = await db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!existing) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        const stmt = db.prepare(`
            UPDATE projects 
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                system_prompt = COALESCE(?, system_prompt),
                model = COALESCE(?, model),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `);

        await stmt.run(
            name || null,
            description !== undefined ? description : null,
            system_prompt || null,
            model || null,
            projectId,
            req.user.id
        );

        const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

        return successResponse(res, { project }, 'Project updated successfully');
    } catch (error) {
        console.error('Update project error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to update project');
    }
});

/**
 * DELETE /api/projects/:id
 * Delete a project and all associated data
 */
router.delete('/:id', async (req, res) => {
    try {
        const projectId = req.params.id;

        // Check if project exists and belongs to user
        const existing = await db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!existing) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        // Delete project (cascade will delete related records)
        await db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);

        return successResponse(res, null, 'Project deleted successfully');
    } catch (error) {
        console.error('Delete project error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to delete project');
    }
});

export default router;
