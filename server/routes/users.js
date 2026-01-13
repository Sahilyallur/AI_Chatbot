import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sanitizeUser, errorResponse, successResponse } from '../utils/helpers.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', (req, res) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

        if (!user) {
            return errorResponse(res, 404, 'Not found', 'User not found');
        }

        return successResponse(res, { user: sanitizeUser(user) });
    } catch (error) {
        console.error('Get user error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to fetch user profile');
    }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Get current user
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            return errorResponse(res, 404, 'Not found', 'User not found');
        }

        let updates = [];
        let params = [];

        // Update name if provided
        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }

        // Update email if provided
        if (email && email !== user.email) {
            // Check if email is already taken
            const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
            if (existingUser) {
                return errorResponse(res, 409, 'Email exists', 'This email is already in use');
            }
            updates.push('email = ?');
            params.push(email);
        }

        // Update password if provided
        if (newPassword) {
            if (!currentPassword) {
                return errorResponse(res, 400, 'Missing password', 'Current password is required to set new password');
            }

            const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValidPassword) {
                return errorResponse(res, 401, 'Invalid password', 'Current password is incorrect');
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            updates.push('password_hash = ?');
            params.push(passwordHash);
        }

        if (updates.length === 0) {
            return errorResponse(res, 400, 'No updates', 'No valid fields to update');
        }

        // Add updated_at
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);

        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        db.prepare(sql).run(...params);

        // Get updated user
        const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        return successResponse(res, { user: sanitizeUser(updatedUser) }, 'Profile updated successfully');

    } catch (error) {
        console.error('Update user error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to update profile');
    }
});

export default router;
