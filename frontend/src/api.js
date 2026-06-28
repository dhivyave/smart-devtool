import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Analyze ──────────────────────────────────────────────────────────────────

export const analyzeApiDoc = async (url, useCase, language, userId = null) => {
    const response = await api.post('/analyze', {
        url,
        use_case: useCase,
        language,
        user_id: userId
    });
    return response.data;
};

// ─── Single Analysis ──────────────────────────────────────────────────────────

export const getAnalysis = async (id) => {
    const response = await api.get(`/analysis/${id}`);
    return response.data;
};

// ─── History ──────────────────────────────────────────────────────────────────

export const getHistory = async (userId = null) => {
    const params = userId ? { user_id: userId } : {};
    const response = await api.get('/history', { params });
    return response.data;
};

export const deleteAnalysis = async (id) => {
    const response = await api.delete(`/history/${id}`);
    return response.data;
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const sendChatMessage = async (message, userId = null, analysisContext = null, conversationHistory = []) => {
    const response = await api.post('/chat', {
        message,
        user_id: userId,
        analysis_context: analysisContext,
        conversation_history: conversationHistory
    });
    return response.data;
};

export const getChatHistory = async (userId = null) => {
    const params = userId ? { user_id: userId } : {};
    const response = await api.get('/chat/history', { params });
    return response.data;
};

export const clearChatHistory = async (userId = null) => {
    const params = userId ? { user_id: userId } : {};
    const response = await api.delete('/chat/history', { params });
    return response.data;
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportText = async (analysisId) => {
    const response = await api.post('/export/text', { analysis_id: analysisId });
    return response.data;
};

export const downloadTextFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export default api;
