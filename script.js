// NEXUS AI Assistant - Главный скрипт
class NexusAI {
    constructor() {
        this.isActive = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.screenStream = null;
        this.userStream = null;
        this.conversationHistory = [];
        
        // Элементы DOM
        this.elements = {
            status: document.getElementById('status'),
            statusText: document.getElementById('statusText'),
            statusDot: document.querySelector('.status-dot'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            shareScreenBtn: document.getElementById('shareScreenBtn'),
            userVideo: document.getElementById('userVideo'),
            screenCanvas: document.getElementById('screenCanvas'),
            transcript: document.getElementById('transcript'),
            apiKey: document.getElementById('apiKey'),
            elevenLabsKey: document.getElementById('elevenLabsKey'),
            aiName: document.getElementById('aiName'),
            voiceId: document.getElementById('voiceId')
        };
        
        this.init();
    }
    
    init() {
        // Загружаем сохранённые настройки
        this.loadSettings();
        
        // Привязываем события
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.shareScreenBtn.addEventListener('click', () => this.shareScreen());
        
        // Сохраняем настройки при изменении
        [this.elements.apiKey, this.elements.elevenLabsKey, this.elements.aiName, this.elements.voiceId].forEach(input => {
            input.addEventListener('change', () => this.saveSettings());
        });
        
        console.log('✅ NEXUS инициализирован');
    }
    
    loadSettings() {
        const settings = ['apiKey', 'elevenLabsKey', 'aiName', 'voiceId'];
        settings.forEach(key => {
            const saved = localStorage.getItem(key);
            if (saved && this.elements[key]) {
                this.elements[key].value = saved;
            }
        });
    }
    
    saveSettings() {
        const settings = ['apiKey', 'elevenLabsKey', 'aiName', 'voiceId'];
        settings.forEach(key => {
            if (this.elements[key]) {
                localStorage.setItem(key, this.elements[key].value);
            }
        });
    }
    
    async start() {
        if (!this.elements.apiKey.value) {
            alert('⚠️ Введи OpenRouter API Key в настройках!');
            return;
        }
        
        try {
            this.updateStatus('Запуск...', 'offline');
            
            // Запрашиваем доступ к микрофону и камере
            this.userStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            this.elements.userVideo.srcObject = this.userStream;
            
            // Настраиваем запись аудио
            this.setupAudioRecording();
            
            this.isActive = true;
            this.elements.startBtn.disabled = true;
            this.elements.stopBtn.disabled = false;
            this.elements.shareScreenBtn.disabled = false;
            
            this.updateStatus('Активен - говори!', 'online');
            this.addMessage('system', 'NEXUS активирован. Нажми на микрофон и начни говорить!');
            
            // Приветствие
            await this.speak('Привет! Я NEXUS, твой AI ассистент. Чем могу помочь?');
            
        } catch (error) {
            console.error('Ошибка запуска:', error);
            alert('❌ Не удалось получить доступ к камере/микрофону: ' + error.message);
            this.updateStatus('Ошибка', 'offline');
        }
    }
    
    setupAudioRecording() {
        // Используем MediaRecorder для записи голоса
        this.mediaRecorder = new MediaRecorder(this.userStream, {
            mimeType: 'audio/webm'
        });
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.audioChunks = [];
            
            if (audioBlob.size > 1000) { // Только если есть звук
                await this.processAudio(audioBlob);
            }
        };
        
        // Запускаем запись с интервалами (каждые 3 секунды проверяем речь)
        this.startContinuousRecording();
    }
    
    startContinuousRecording() {
        if (!this.isActive) return;
        
        this.mediaRecorder.start();
        
        setTimeout(() => {
            if (this.isActive && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
                setTimeout(() => this.startContinuousRecording(), 100);
            }
        }, 3000);
    }
    
    async processAudio(audioBlob) {
        try {
            this.updateStatus('Слушаю...', 'speaking');
            
            // Конвертируем в текст через Whisper API (через OpenRouter)
            const text = await this.transcribeAudio(audioBlob);
            
            if (text && text.trim().length > 0) {
                this.addMessage('user', text);
                
                // Получаем ответ от AI
                await this.getAIResponse(text);
            }
            
            this.updateStatus('Активен - говори!', 'online');
            
        } catch (error) {
            console.error('Ошибка обработки аудио:', error);
            this.updateStatus('Активен - говори!', 'online');
        }
    }
    
    async transcribeAudio(audioBlob) {
        // Используем Whisper через OpenAI API (доступен через OpenRouter)
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        
        try {
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.elements.apiKey.value}`
                },
                body: formData
            });
            
            const data = await response.json();
            return data.text || '';
        } catch (error) {
            console.error('Ошибка транскрипции:', error);
            return '';
        }
    }
    
    async getAIResponse(userMessage) {
        try {
            this.updateStatus('Думаю...', 'speaking');
            
            // Делаем скриншот экрана если доступен
            let screenImage = null;
            if (this.screenStream) {
                screenImage = await this.captureScreen();
            }
            
            // Формируем сообщение для AI
            const messages = [
                {
                    role: 'system',
                    content: `Ты ${this.elements.aiName.value} - умный AI ассистент с голосом и зрением. Ты видишь пользователя через камеру${screenImage ? ' и его экран' : ''}. Отвечай кратко, по-дружески и полезно. Максимум 2-3 предложения.`
                },
                ...this.conversationHistory.slice(-6), // Последние 3 обмена
                {
                    role: 'user',
                    content: screenImage ? [
                        { type: 'text', text: userMessage },
                        { type: 'image_url', image_url: { url: screenImage } }
                    ] : userMessage
                }
            ];
            
            // Запрос к Qwen2.5-VL через OpenRouter
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.elements.apiKey.value}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'NEXUS AI'
                },
                body: JSON.stringify({
                    model: screenImage ? 'qwen/qwen-2-vl-72b-instruct' : 'qwen/qwen-2.5-72b-instruct',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 200
                })
            });
            
            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            // Добавляем в историю
            this.conversationHistory.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: aiResponse }
            );
            
            this.addMessage('ai', aiResponse);
            
            // Озвучиваем ответ
            await this.speak(aiResponse);
            
        } catch (error) {
            console.error('Ошибка AI:', error);
            this.addMessage('system', '❌ Ошибка: ' + error.message);
        }
    }
    
    async speak(text) {
        if (!this.elements.elevenLabsKey.value) {
            console.log('ElevenLabs ключ не указан, пропускаем озвучку');
            return;
        }
        
        try {
            this.updateStatus('Говорю...', 'speaking');
            
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.elements.voiceId.value}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': this.elements.elevenLabsKey.value
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            await audio.play();
            
            audio.onended = () => {
                this.updateStatus('Активен - говори!', 'online');
            };
            
        } catch (error) {
            console.error('Ошибка озвучки:', error);
            this.updateStatus('Активен - говори!', 'online');
        }
    }
    
    async shareScreen() {
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            });
            
            const video = document.createElement('video');
            video.srcObject = this.screenStream;
            video.play();
            
            const canvas = this.elements.screenCanvas;
            const ctx = canvas.getContext('2d');
            
            // Рисуем экран на canvas
            const drawScreen = () => {
                if (this.screenStream && this.screenStream.active) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    requestAnimationFrame(drawScreen);
                }
            };
            
            video.onloadedmetadata = () => drawScreen();
            
            this.addMessage('system', '🖥️ Демонстрация экрана включена');
            
        } catch (error) {
            console.error('Ошибка демонстрации экрана:', error);
            alert('❌ Не удалось получить доступ к экрану');
        }
    }
    
    async captureScreen() {
        if (!this.screenStream) return null;
        
        const canvas = this.elements.screenCanvas;
        return canvas.toDataURL('image/jpeg', 0.7);
    }
    
    stop() {
        this.isActive = false;
        
        if (this.userStream) {
            this.userStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        this.elements.userVideo.srcObject = null;
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.shareScreenBtn.disabled = true;
        
        this.updateStatus('Не подключен', 'offline');
        this.addMessage('system', 'NEXUS остановлен');
    }
    
    updateStatus(text, state) {
        this.elements.statusText.textContent = text;
        this.elements.statusDot.className = `status-dot ${state}`;
    }
    
    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const senderName = sender === 'user' ? 'Ты' : 
                          sender === 'ai' ? this.elements.aiName.value : 
                          'Система';
        
        messageDiv.innerHTML = `
            <strong>${senderName}:</strong>
            ${text}
        `;
        
        this.elements.transcript.appendChild(messageDiv);
        this.elements.transcript.scrollTop = this.elements.transcript.scrollHeight;
    }
}

// Запускаем NEXUS когда страница загружена
document.addEventListener('DOMContentLoaded', () => {
    window.nexus = new NexusAI();
});
