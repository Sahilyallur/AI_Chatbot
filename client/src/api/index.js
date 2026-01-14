const API_BASE = '/api';

/**
 * Get stored auth token
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Set auth token
 */
export function setToken(token) {
    localStorage.setItem('token', token);
}

/**
 * Remove auth token
 */
export function removeToken() {
    localStorage.removeItem('token');
}

/**
 * Make API request with authentication
 */
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || 'An error occurred');
    }

    return data;
}

// ============================================
// Auth API
// ============================================

export async function register(email, password, name) {
    const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name })
    });
    if (response.data?.token) {
        setToken(response.data.token);
    }
    return response;
}

export async function login(email, password) {
    const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    if (response.data?.token) {
        setToken(response.data.token);
    }
    return response;
}

export function logout() {
    removeToken();
}

// ============================================
// User API
// ============================================

export async function getCurrentUser() {
    return apiRequest('/users/me');
}

export async function updateUser(data) {
    return apiRequest('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// ============================================
// Projects API
// ============================================

export async function getProjects() {
    return apiRequest('/projects');
}

export async function getProject(id) {
    return apiRequest(`/projects/${id}`);
}

export async function createProject(data) {
    return apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateProject(id, data) {
    return apiRequest(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteProject(id) {
    return apiRequest(`/projects/${id}`, {
        method: 'DELETE'
    });
}

// ============================================
// Prompts API
// ============================================

export async function getPrompts(projectId) {
    return apiRequest(`/projects/${projectId}/prompts`);
}

export async function createPrompt(projectId, data) {
    return apiRequest(`/projects/${projectId}/prompts`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updatePrompt(id, data) {
    return apiRequest(`/prompts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deletePrompt(id) {
    return apiRequest(`/prompts/${id}`, {
        method: 'DELETE'
    });
}

// ============================================
// Conversations API
// ============================================

export async function getConversations(projectId) {
    return apiRequest(`/projects/${projectId}/conversations`);
}

export async function createConversation(projectId, title = 'New Chat') {
    return apiRequest(`/projects/${projectId}/conversations`, {
        method: 'POST',
        body: JSON.stringify({ title })
    });
}

export async function updateConversation(id, title) {
    return apiRequest(`/conversations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title })
    });
}

export async function deleteConversation(id) {
    return apiRequest(`/conversations/${id}`, {
        method: 'DELETE'
    });
}

// ============================================
// Chat API
// ============================================

export async function getMessages(projectId, conversationId = null, limit = 50, offset = 0) {
    const convParam = conversationId ? `&conversationId=${conversationId}` : '';
    return apiRequest(`/projects/${projectId}/messages?limit=${limit}&offset=${offset}${convParam}`);
}

export async function sendMessage(projectId, message, options = {}) {
    return apiRequest(`/projects/${projectId}/chat?stream=false`, {
        method: 'POST',
        body: JSON.stringify({ message, ...options })
    });
}

/**
 * Send message with streaming response
 */
export async function sendMessageStream(projectId, message, onChunk, options = {}) {
    const token = getToken();

    const response = await fetch(`${API_BASE}/projects/${projectId}/chat?stream=true`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message, ...options })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to send message');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));

                    if (data.done) {
                        return fullContent;
                    }

                    if (data.content) {
                        fullContent += data.content;
                        onChunk(data.content, fullContent);
                    }

                    if (data.error) {
                        throw new Error(data.error);
                    }
                } catch (e) {
                    // Ignore parsing errors for incomplete chunks
                    if (e.message !== 'Unexpected end of JSON input') {
                        console.error('Parse error:', e);
                    }
                }
            }
        }
    }

    return fullContent;
}

export async function clearMessages(projectId, conversationId = null) {
    const convParam = conversationId ? `?conversationId=${conversationId}` : '';
    return apiRequest(`/projects/${projectId}/messages${convParam}`, {
        method: 'DELETE'
    });
}

// ============================================
// Files API
// ============================================

export async function getFiles(projectId) {
    return apiRequest(`/projects/${projectId}/files`);
}

export async function getFileText(fileId) {
    return apiRequest(`/files/${fileId}/text`);
}

export async function uploadFile(projectId, file) {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || 'Upload failed');
    }

    return data;
}

export async function deleteFile(id) {
    return apiRequest(`/files/${id}`, {
        method: 'DELETE'
    });
}

export function getFileDownloadUrl(id) {
    return `${API_BASE}/files/${id}`;
}
