// ========================================
// NEXUS — CORE LOGIC
// ========================================

let currentModel = CONFIG.DEFAULT_MODEL;
let chatHistory = [];
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let currentFile = null;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadSettings();
    updateTime();
    setInterval(updateTime, 1000);
    updateBattery();
    
    if (CONFIG.DARK_MODE_AUTO) {
        autoDetectTheme();
    }
    
    loadChatHistory();
    setupTextarea();
    setupFileHandlers();
    setupVoiceInput();
    
    console.log('⚡ NEXUS initialized');
}

// ========================================
// TIME & BATTERY
// ========================================

function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
    document.getElementById('statusTime').textContent = timeStr;
}

async function updateBattery() {
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            const level = Math.round(battery.level * 100);
            document.getElementById('battery').textContent = `${level}%`;
            
            battery.addEventListener('levelchange', () => {
                const newLevel = Math.round(battery.level * 100);
                document.getElementById('battery').textContent = `${newLevel}%`;
            });
        } catch (e) {
            document.getElementById('battery').textContent = '100%';
        }
    }
}

// ========================================
// THEMES
// ========================================

function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    hapticFeedback();
}

function autoDetectTheme() {
    const hour = new Date().getHours();
    const isDark = hour < 7 || hour >= 20;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.getElementById('darkModeToggle').checked = isDark;
}

// ========================================
// SETTINGS
// ========================================

function toggleSettings() {
    const sheet = document.getElementById('settingsSheet');
    sheet.classList.toggle('active');
    hapticFeedback();
}

function selectModel(button) {
    document.querySelectorAll('.model-card').forEach(card => {
        card.classList.remove('active');
    });
    
    button.classList.add('active');
    currentModel = button.dataset.model;
    localStorage.setItem('selectedModel', currentModel);
    
    const modelNames = {
        'gemini': 'Gemini Flash',
        'claude': 'Claude Sonnet',
        'llama': 'Llama 3.3 70B'
    };
    document.getElementById('modelName').textContent = modelNames[currentModel];
    
    hapticFeedback();
}

function loadSettings() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('darkModeToggle').checked = savedTheme === 'dark';
    }
    
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
        currentModel = savedModel;
        document.querySelector(`[data-model="${savedModel}"]`)?.classList.add('active');
    }
}

// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text && !currentFile) return;
    
    input.value = '';
    input.style.height = 'auto';
    
    addMessage(text || '📎 File', 'user', currentFile);
    showDynamicIsland();
    
    const typingId = addTypingIndicator();
    hapticFeedback();
    
    try {
        const response = await callAI(text, currentFile);
        removeTypingIndicator(typingId);
        await addMessage(response, 'bot');
        
        if (document.getElementById('voiceResponseToggle').checked) {
            speakText(response);
        }
        
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('❌ Error: ' + error.message, 'bot');
    } finally {
        hideDynamicIsland();
        currentFile = null;
    }
}

function addMessage(text, sender, file = null) {
    const chat = document.getElementById('chat');
    
    const welcome = chat.querySelector('.welcome-card');
    if (welcome) welcome.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    
    const avatar = sender === 'user' ? '👤' : '⚡';
    const time = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    let content = text;
    
    if (file && file.type.startsWith('image/')) {
        content = `<img src="${URL.createObjectURL(file)}" alt="Image"><br>${text}`;
    }
    
    msgDiv.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="bubble">
            <p>${content}</p>
            <span class="time-stamp">${time}</span>
        </div>
    `;
    
    chat.appendChild(msgDiv);
    chat.scrollTop = chat.scrollHeight;
    
    chatHistory.push({ sender, text, time });
    saveChatHistory();
    
    return new Promise(resolve => {
        if (sender === 'bot') {
            const p = msgDiv.querySelector('p');
            typeWriter(p, text).then(resolve);
        } else {
            resolve();
        }
    });
}

async function typeWriter(element, text) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await new Promise(r => setTimeout(r, 10));
    }
}

function addTypingIndicator() {
    const chat = document.getElementById('chat');
    const id = 'typing-' + Date.now();
    
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'message bot-message';
    typingDiv.innerHTML = `
        <div class="avatar">⚡</div>
        <div class="bubble typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    chat.appendChild(typingDiv);
    chat.scrollTop = chat.scrollHeight;
    
    return id;
}

function removeTypingIndicator(id) {
    document.getElementById(id)?.remove();
}

// ========================================
// AI API CALLS
// ========================================

async function callAI(text, file = null) {
    const apiKey = getAPIKey(currentModel);
    
    if (!apiKey || apiKey === 'PASTE_YOUR_KEY_HERE') {
        throw new Error('Please add API key in config.js!');
    }
    
    switch (currentModel) {
        case 'gemini':
            return await callGemini(text, file, apiKey);
        case 'claude':
            return await callClaude(text, apiKey);
        case 'llama':
            return await callLlama(text, apiKey);
        default:
            throw new Error('Unknown model');
    }
}

function getAPIKey(model) {
    switch (model) {
        case 'gemini': return CONFIG.GEMINI_API_KEY;
        case 'claude': return CONFIG.OPENROUTER_API_KEY;
        case 'llama': return CONFIG.GROQ_API_KEY;
        default: return null;
    }
}

async function callGemini(text, file, apiKey) {
    const url = `${API_ENDPOINTS.gemini}?key=${apiKey}`;
    
    let parts = [];
    
    if (file && file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        parts.push({
            inlineData: {
                mimeType: file.type,
                data: base64.split(',')[1]
            }
        });
    }
    
    if (text) {
        parts.push({ text });
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API error');
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function callClaude(text, apiKey) {
    const response = await fetch(API_ENDPOINTS.openrouter, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'NEXUS'
        },
        body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [{ role: 'user', content: text }],
            max_tokens: 2048
        })
    });
    
    if (!response.ok) {
        throw new Error('Claude API error');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

async function callLlama(text, apiKey) {
    const response = await fetch(API_ENDPOINTS.groq, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: text }],
            temperature: 0.7,
            max_tokens: 2048
        })
    });
    
    if (!response.ok) {
        throw new Error('Groq API error');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// ========================================
// FILE HANDLING
// ========================================

function setupFileHandlers() {
    const fileInput = document.getElementById('fileInput');
    const cameraInput = document.getElementById('cameraInput');
    
    fileInput.addEventListener('change', handleFileSelect);
    cameraInput.addEventListener('change', handleFileSelect);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    currentFile = file;
    
    if (file.type.startsWith('image/')) {
        showFilePreview(file);
    } else {
        document.getElementById('messageInput').placeholder = `📎 ${file.name}`;
    }
    
    hapticFeedback();
}

function showFilePreview(file) {
    const preview = document.getElementById('filePreview');
    const img = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    
    img.src = URL.createObjectURL(file);
    fileName.textContent = file.name;
    preview.classList.add('active');
}

function closePreview() {
    document.getElementById('filePreview').classList.remove('active');
    currentFile = null;
    document.getElementById('messageInput').placeholder = 'Message to NEXUS...';
}

function sendWithFile() {
    closePreview();
    sendMessage();
}

function openCamera() {
    document.getElementById('cameraInput').click();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ========================================
// VOICE INPUT
// ========================================

function setupVoiceInput() {
    const voiceBtn = document.getElementById('voiceBtn');
    let pressTimer;
    
    voiceBtn.addEventListener('mousedown', startPress);
    voiceBtn.addEventListener('mouseup', endPress);
    voiceBtn.addEventListener('touchstart', startPress);
    voiceBtn.addEventListener('touchend', endPress);
    
    function startPress(e) {
        e.preventDefault();
        pressTimer = setTimeout(() => {
            startRecording();
        }, 200);
    }
    
    function endPress(e) {
        e.preventDefault();
        clearTimeout(pressTimer);
        if (isRecording) {
            stopRecording();
        }
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await transcribeAudio(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        document.getElementById('voiceRecording').classList.add('active');
        hapticFeedback('medium');
        
    } catch (error) {
        alert('Please allow microphone access');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('voiceRecording').classList.remove('active');
        hapticFeedback();
    }
}

async function transcribeAudio(audioBlob) {
    try {
        showDynamicIsland('Processing audio...');
        
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'en');
        
        const response = await fetch(API_ENDPOINTS.whisper, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('Transcription error');
        
        const data = await response.json();
        document.getElementById('messageInput').value = data.text;
        
        hideDynamicIsland();
        
    } catch (error) {
        hideDynamicIsland();
        alert('Error: ' + error.message);
    }
}

// ========================================
// VOICE OUTPUT
// ========================================

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
    }
}

// ========================================
// DYNAMIC ISLAND
// ========================================

function showDynamicIsland(text = 'NEXUS thinking...') {
    const island = document.getElementById('island');
    island.querySelector('.ai-indicator span').textContent = text;
    island.classList.add('active');
}

function hideDynamicIsland() {
    setTimeout(() => {
        document.getElementById('island').classList.remove('active');
    }, 1000);
}

// ========================================
// UTILITIES
// ========================================

function setupTextarea() {
    const textarea = document.getElementById('messageInput');
    
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
    
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function clearChat() {
    if (confirm('Clear all chat history?')) {
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        location.reload();
    }
}

function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
        chatHistory = JSON.parse(saved);
    }
}

function hapticFeedback(type = 'light') {
    if (!document.getElementById('hapticToggle')?.checked) return;
    
    if ('vibrate' in navigator) {
        const patterns = {
            light: 10,
            medium: [10, 50, 10],
            heavy: [10, 100, 10]
        };
        navigator.vibrate(patterns[type]);
    }
}
