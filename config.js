// ========================================
// NEXUS - API CONFIGURATION
// ========================================

const CONFIG = {
    // 1. Gemini API (Google AI Studio)
    // Get here: https://aistudio.google.com/app/apikey
    // Free: 1500 requests/day
    GEMINI_API_KEY: "PASTE_YOUR_KEY_HERE",
    
    // 2. Groq API (for Llama & Whisper voice)
    // Get here: https://console.groq.com/keys
    // Free: 14400 requests/day
    GROQ_API_KEY: "PASTE_YOUR_KEY_HERE",
    
    // 3. OpenRouter API (for Claude)
    // Get here: https://openrouter.ai/keys
    // Free: 200 requests/day
    OPENROUTER_API_KEY: "PASTE_YOUR_KEY_HERE",

    // Default settings
    DEFAULT_MODEL: "gemini",
    ENABLE_VOICE: true,
    ENABLE_SOUND: true,
    ENABLE_HAPTIC: true,
    DARK_MODE_AUTO: true
};

// API Endpoints
const API_ENDPOINTS = {
    gemini: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    groq: "https://api.groq.com/openai/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    whisper: "https://api.groq.com/openai/v1/audio/transcriptions"
};
