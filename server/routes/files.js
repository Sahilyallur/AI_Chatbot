import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { errorResponse, successResponse } from '../utils/helpers.js';
import { extractText, truncateForContext } from '../services/textExtractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = [
            'text/plain',
            'text/csv',
            'text/markdown',
            'application/json',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/projects/:projectId/files
 * List all files for a project
 */
router.get('/projects/:projectId/files', (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        const files = db.prepare(`
            SELECT id, project_id, filename, original_name, mime_type, size, 
                   extraction_method, created_at,
                   CASE WHEN extracted_text IS NOT NULL AND extracted_text != '' THEN 1 ELSE 0 END as has_text
            FROM files 
            WHERE project_id = ? 
            ORDER BY created_at DESC
        `).all(projectId);

        return successResponse(res, { files });
    } catch (error) {
        console.error('List files error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to fetch files');
    }
});

/**
 * POST /api/projects/:projectId/files
 * Upload a file to a project with optional text extraction
 */
router.post('/projects/:projectId/files', upload.single('file'), async (req, res) => {
    try {
        const { projectId } = req.params;
        const extractTextContent = req.query.extract !== 'false'; // Default: extract text

        if (!req.file) {
            return errorResponse(res, 400, 'No file', 'Please upload a file');
        }

        // Verify project belongs to user
        const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
            .get(projectId, req.user.id);

        if (!project) {
            // Delete uploaded file
            fs.unlinkSync(req.file.path);
            return errorResponse(res, 404, 'Not found', 'Project not found');
        }

        // Extract text if requested
        let extractedText = '';
        let extractionMethod = '';

        if (extractTextContent) {
            try {
                const result = await extractText(req.file.path, req.file.mimetype);
                extractedText = result.text;
                extractionMethod = result.method;
                console.log(`Text extracted using ${extractionMethod}: ${extractedText.length} chars`);
            } catch (err) {
                console.error('Text extraction failed:', err);
                // Continue without extracted text
            }
        }

        // Save file metadata to database
        const stmt = db.prepare(`
            INSERT INTO files (project_id, filename, original_name, mime_type, size, extracted_text, extraction_method)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            projectId,
            req.file.filename,
            req.file.originalname,
            req.file.mimetype,
            req.file.size,
            extractedText,
            extractionMethod
        );

        // Fetch using filename (more reliable than lastInsertRowid)
        const file = db.prepare(`
            SELECT id, project_id, filename, original_name, mime_type, size, 
                   extraction_method, created_at,
                   CASE WHEN extracted_text IS NOT NULL AND extracted_text != '' THEN 1 ELSE 0 END as has_text
            FROM files WHERE filename = ?
        `).get(req.file.filename);

        return successResponse(res, {
            file,
            textExtracted: extractedText.length > 0,
            textLength: extractedText.length
        }, 'File uploaded successfully');
    } catch (error) {
        console.error('Upload file error:', error);
        // Clean up uploaded file on error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        return errorResponse(res, 500, 'Server error', 'Failed to upload file');
    }
});

/**
 * GET /api/files/:id/text
 * Get the extracted text from a file
 */
router.get('/files/:id/text', (req, res) => {
    try {
        const fileId = req.params.id;

        // Verify file exists and belongs to user's project
        const file = db.prepare(`
            SELECT f.extracted_text, f.extraction_method, f.original_name FROM files f
            JOIN projects p ON f.project_id = p.id
            WHERE f.id = ? AND p.user_id = ?
        `).get(fileId, req.user.id);

        if (!file) {
            return errorResponse(res, 404, 'Not found', 'File not found');
        }

        return successResponse(res, {
            text: file.extracted_text || '',
            method: file.extraction_method || '',
            filename: file.original_name
        });
    } catch (error) {
        console.error('Get file text error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to get file text');
    }
});

/**
 * GET /api/files/:id
 * Download a file
 */
router.get('/files/:id', (req, res) => {
    try {
        const fileId = req.params.id;

        // Verify file exists and belongs to user's project
        const file = db.prepare(`
            SELECT f.* FROM files f
            JOIN projects p ON f.project_id = p.id
            WHERE f.id = ? AND p.user_id = ?
        `).get(fileId, req.user.id);

        if (!file) {
            return errorResponse(res, 404, 'Not found', 'File not found');
        }

        const filePath = path.join(uploadsDir, file.filename);

        if (!fs.existsSync(filePath)) {
            return errorResponse(res, 404, 'Not found', 'File not found on disk');
        }

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        fs.createReadStream(filePath).pipe(res);

    } catch (error) {
        console.error('Download file error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to download file');
    }
});

/**
 * DELETE /api/files/:id
 * Delete a file
 */
router.delete('/files/:id', (req, res) => {
    try {
        const fileId = req.params.id;

        // Verify file exists and belongs to user's project
        const file = db.prepare(`
            SELECT f.* FROM files f
            JOIN projects p ON f.project_id = p.id
            WHERE f.id = ? AND p.user_id = ?
        `).get(fileId, req.user.id);

        if (!file) {
            return errorResponse(res, 404, 'Not found', 'File not found');
        }

        // Delete file from disk
        const filePath = path.join(uploadsDir, file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        db.prepare('DELETE FROM files WHERE id = ?').run(fileId);

        return successResponse(res, null, 'File deleted successfully');
    } catch (error) {
        console.error('Delete file error:', error);
        return errorResponse(res, 500, 'Server error', 'Failed to delete file');
    }
});

export default router;
