import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';
import { generateToken } from '../middleware/auth.js';
import { isValidEmail, isValidPassword, sanitizeUser, errorResponse, successResponse } from '../utils/helpers.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password) {
            return errorResponse(res, 400, 'Missing fields', 'Email and password are required');
        }

        if (!isValidEmail(email)) {
            return errorResponse(res, 400, 'Invalid email', 'Please provide a valid email address');
        }

        if (!isValidPassword(password)) {
            return errorResponse(res, 400, 'Weak password', 'Password must be at least 6 characters long');
        }

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return errorResponse(res, 409, 'Email exists', 'A user with this email already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        const stmt = db.prepare(
            'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
        );
        stmt.run(email, passwordHash, name || null);

        // Get the created user by email (more reliable than lastInsertRowid)
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            console.error('User not found after registration');
            return errorResponse(res, 500, 'Server error', 'Registration failed');
        }

        // Generate token
        const token = generateToken(user);

        return successResponse(res, {
            user: sanitizeUser(user),
            token
        }, 'Registration successful');

    } catch (error) {
        console.error('Registration error:', error);
        return errorResponse(res, 500, 'Server error', 'An error occurred during registration');
    }
});

/**
 * POST /api/auth/login
 * Login user with email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return errorResponse(res, 400, 'Missing fields', 'Email and password are required');
        }

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        console.log('Login attempt for:', email, 'User found:', !!user);

        if (!user) {
            return errorResponse(res, 401, 'Invalid credentials', 'Email or password is incorrect');
        }

        // Verify password
        console.log('Password hash from DB:', user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL');
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', isValid);

        if (!isValid) {
            return errorResponse(res, 401, 'Invalid credentials', 'Email or password is incorrect');
        }

        // Generate token
        const token = generateToken(user);

        return successResponse(res, {
            user: sanitizeUser(user),
            token
        }, 'Login successful');

    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 500, 'Server error', 'An error occurred during login');
    }
});

/**
 * POST /api/auth/verify
 * Verify token validity
 */
router.post('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return errorResponse(res, 401, 'No token', 'No token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);

        if (!user) {
            return errorResponse(res, 401, 'User not found', 'User no longer exists');
        }

        return successResponse(res, { user: sanitizeUser(user) }, 'Token is valid');
    } catch (error) {
        return errorResponse(res, 401, 'Invalid token', 'Token is invalid or expired');
    }
});

export default router;

