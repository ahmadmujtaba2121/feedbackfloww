export const AI_CONFIG = {
    GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyATESi14TLWGFqPJUajMf78fKEXFXhZp0c',
    MODEL: 'gemini-pro'
};

export const AI_ROLES = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system'
};

export const AI_CONTEXTS = {
    PROJECT: 'project',
    REVIEW: 'review',
    TASK: 'task',
    GENERAL: 'general'
}; 