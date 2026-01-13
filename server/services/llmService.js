/**
 * LLM Service - OpenRouter Integration
 * Handles all communication with the OpenRouter API
 */

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

/**
 * Send a chat completion request to OpenRouter
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - The API response
 */
export async function sendChatCompletion(messages, options = {}) {
    const {
        model = process.env.DEFAULT_MODEL || 'openai/gpt-3.5-turbo',
        temperature = 0.7,
        maxTokens = 1000,
        stream = false
    } = options;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'AI Chatbot Platform'
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `OpenRouter API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Send a streaming chat completion request to OpenRouter
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Configuration options
 * @returns {Promise<ReadableStream>} - The streaming response
 */
export async function sendStreamingChatCompletion(messages, options = {}) {
    const {
        model = process.env.DEFAULT_MODEL || 'openai/gpt-3.5-turbo',
        temperature = 0.7,
        maxTokens = 1000
    } = options;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'AI Chatbot Platform'
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `OpenRouter API error: ${response.status}`);
    }

    return response;
}

/**
 * Parse a Server-Sent Events (SSE) chunk
 * @param {string} chunk - The raw SSE chunk
 * @returns {Object|null} - Parsed data or null
 */
export function parseSSEChunk(chunk) {
    const lines = chunk.split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
                return { done: true };
            }
            try {
                return JSON.parse(data);
            } catch (e) {
                // Ignore parsing errors for incomplete chunks
            }
        }
    }
    return null;
}

/**
 * Get list of available models from OpenRouter
 * @returns {Promise<Array>} - List of available models
 */
export async function getAvailableModels() {
    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
}
