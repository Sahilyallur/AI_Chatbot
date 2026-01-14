import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

// These are CommonJS, need to use createRequire
const require = createRequire(import.meta.url);
const mammoth = require('mammoth');

/**
 * Text Extractor Service
 * Extracts text from various file types including images (OCR), PDFs, and Word docs
 */

/**
 * Extract text from an image using Tesseract OCR
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractFromImage(filePath) {
    try {
        console.log('Extracting text from image:', filePath);
        const result = await Tesseract.recognize(filePath, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });
        return result.data.text.trim();
    } catch (error) {
        console.error('OCR extraction error:', error);
        throw new Error('Failed to extract text from image');
    }
}

/**
 * Extract text from a PDF file using pdfjs-dist
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractFromPDF(filePath) {
    try {
        console.log('Extracting text from PDF:', filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('PDF file not found:', filePath);
            return '';
        }

        const dataBuffer = fs.readFileSync(filePath);
        console.log('PDF buffer size:', dataBuffer.length, 'bytes');

        // Convert buffer to Uint8Array for pdfjs
        const data = new Uint8Array(dataBuffer);

        // Load the PDF document
        const pdf = await getDocument({ data, useSystemFonts: true }).promise;
        console.log('PDF loaded, pages:', pdf.numPages);

        let fullText = '';

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        console.log('PDF text extracted, length:', fullText.length);
        return fullText.trim();
    } catch (error) {
        console.error('PDF extraction error:', error.message);
        console.error('Full error:', error);
        return '';
    }
}

/**
 * Extract text from a Word document (.docx)
 * @param {string} filePath - Path to the Word file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractFromWord(filePath) {
    try {
        console.log('Extracting text from Word document:', filePath);
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value.trim();
    } catch (error) {
        console.error('Word extraction error:', error);
        throw new Error('Failed to extract text from Word document');
    }
}

/**
 * Read text from a plain text file
 * @param {string} filePath - Path to the text file
 * @returns {Promise<string>} - File contents
 */
export async function extractFromText(filePath) {
    try {
        console.log('Reading text file:', filePath);
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error('Text file read error:', error);
        throw new Error('Failed to read text file');
    }
}

/**
 * Extract text from a file based on its MIME type
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<{text: string, method: string}>} - Extracted text and method used
 */
export async function extractText(filePath, mimeType) {
    let text = '';
    let method = '';

    try {
        if (mimeType.startsWith('image/')) {
            text = await extractFromImage(filePath);
            method = 'ocr';
        } else if (mimeType === 'application/pdf') {
            text = await extractFromPDF(filePath);
            method = 'pdf';
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword') {
            text = await extractFromWord(filePath);
            method = 'word';
        } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
            text = await extractFromText(filePath);
            method = 'text';
        } else {
            return { text: '', method: 'unsupported' };
        }

        return { text, method };
    } catch (error) {
        console.error('Text extraction failed:', error);
        return { text: '', method: 'error' };
    }
}

/**
 * Truncate text to a maximum length for chat context
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 4000 chars)
 * @returns {string} - Truncated text
 */
export function truncateForContext(text, maxLength = 4000) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '\n\n[... text truncated ...]';
}
