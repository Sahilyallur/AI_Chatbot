/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * Minimum 6 characters
 */
export function isValidPassword(password) {
    return password && password.length >= 6;
}

/**
 * Sanitize user object for response (remove sensitive data)
 */
export function sanitizeUser(user) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
}

/**
 * Format error response
 */
export function errorResponse(res, statusCode, error, message) {
    return res.status(statusCode).json({ error, message });
}

/**
 * Format success response
 */
export function successResponse(res, data, message = 'Success') {
    return res.json({ success: true, message, data });
}

/**
 * Async route handler wrapper
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
