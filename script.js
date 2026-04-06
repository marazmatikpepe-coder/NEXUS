// NEXUS AI Assistant - Полностью переписанный скрипт
class NexusAI {
    constructor() {
        this.isActive = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.screenStream = null;
        this.userStream = null;
        this.conversationHistory = [];
        this.isProcessing = false;
        
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
            aiName: document.getElementById('aiName')
        };
        
        this.init();
    }
    
    init() {
        console.log('🚀 Инициализация NEXUS...');
        
        // Загружаем сохранённые настройки
        this.loadSettings();
        
        // Привязываем события к кнопкам
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.shareScreenBtn.addEventListener('click', () => this.shareScreen());
        
        // Сохраняем настройки при изменении
        const settingsInputs = ['apiKey', 'aiName', 'voiceType', 'voiceLang'];
        settingsInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.saveSettings());
            }
        });
        
        // Инициализируем голоса для браузерного синтеза
        if ('speechSynthesis' in window) {
            speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                speechSynthesis.getVoices();
            };
        }
        
        console.log('✅ NEXUS готов к работе');
    }
    
    loadSettings() {
        const settings = ['apiKey', 'aiName', 'voiceType', 'voiceLang'];
        settings.forEach(key => {
            const element = document.getElementById(key);
            const saved = localStorage.getItem(key);
            if (saved && element) {
                element.value = saved;
            }
        });
    }
    
    saveSettings() {
        const settings = ['apiKey', 'aiName', 'voiceType', 'voiceLang'];
        settings.forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                localStorage.setItem(key, element.value);
            }
        });
        console.log('💾 Настройки сохранены');
    }
    
    async start() {
        // Проверяем API ключ
        if (!this.elements.apiKey.value || this.elements.apiKey.value.length < 10) {
            alert('⚠️ Пожалуйста, введи OpenRouter API Key в настройках!\n\nПолучи его на: https://openrouter.ai/keys');
            return;
        }
        
        try {
            this.updateStatus('Запуск системы...', 'offline');
            
            // Запрашиваем доступ к микрофону и камере
            console.log('🎤 Запрашиваем доступ к микрофону и камере...');
            this.userStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // Показываем видео с камеры
            this.elements.userVideo.srcObject = this.userStream;
            
            // Настраиваем запись аудио
            this.setupAudioRecording();
            
            // Меняем состояние
            this.isActive = true;
            this.elements.startBtn.disabled = true;
            this.elements.stopBtn.disabled = false;
            this.elements.shareScreenBtn.disabled = false;
            
            this.updateStatus('🟢 Активен - Говори!', 'online');
            this.addMessage('system', '✅ NEXUS активирован. Начни говорить - я слушаю!');
            
            // Приветствие
            await this.speak('Привет! Я NEXUS, твой AI ассистент с голосом и зрением. Чем могу помочь?');
            
        } catch (error) {
            console.error('❌ Ошибка запуска:', error);
            
            let errorMessage = 'Не удалось получить доступ к камере и микрофону.';
            if (error.name === 'NotAllowedError') {
                errorMessage += '\n\nРазреши доступ к камере и микрофону в настройках браузера!';
            } else if (error.name === 'NotFoundError') {
                errorMessage += '\n\nКамера или микрофон не найдены. Подключи устройства и попробуй снова.';
            }
            
            alert('❌ ' + errorMessage);
            this.updateStatus('Ошибка запуска', 'offline');
        }
    }
    
    setupAudioRecording() {
        try {
            // Создаём MediaRecorder для записи голоса
            const options = {
                mimeType: 'audio/webm;codecs=opus'
            };
            
            // Проверяем поддержку формата
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/webm';
            }
            
            this.mediaRecorder = new MediaRecorder(this.userStream, options);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                if (this.audioChunks.length === 0) return;
                
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.audioChunks = [];
                
                // Обрабатываем только если есть достаточно данных
                if (audioBlob.size > 5000 && !this.isProcessing) {
                    await this.processAudio(audioBlob);
                }
            };
            
            console.log('🎙️ Аудиозапись настроена');
            
            // Запускаем непрерывную запись
            this.startContinuousRecording();
            
        } catch (error) {
            console.error('❌ Ошибка настройки записи:', error);
        }
    }
    
    startContinuousRecording() {
        if (!this.isActive || !this.mediaRecorder) return;
        
        try {
            this.mediaRecorder.start();
            
            // Останавливаем и перезапускаем каждые 4 секунды
            setTimeout(() => {
                if (this.isActive && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                    
                    // Перезапускаем через короткую паузу
                    setTimeout(() => {
                        this.startContinuousRecording();
                    }, 100);
                }
            }, 4000);
            
        } catch (error) {
            console.error('❌ Ошибка записи:', error);
        }
    }
    
    async processAudio(audioBlob) {
        if (this.isProcessing) {
            console.log('⏳ Уже обрабатывается предыдущий запрос...');
            return;
        }
        
        this.isProcessing = true;
        
        try {
            this.updateStatus('👂 Слушаю...', 'speaking');
            
            // Транскрибируем аудио в текст
            const text = await this.transcribeAudio(audioBlob);
            
            if (text && text.trim().length > 2) {
                console.log('📝 Распознано:', text);
                this.addMessage('user', text);
                
                // Получаем ответ от AI
                await this.getAIResponse(text);
            }
            
        } catch (error) {
            console.error('❌ Ошибка обработки аудио:', error);
            this.addMessage('system', '❌ Ошибка: ' + error.message);
        } finally {
            this.isProcessing = false;
            if (this.isActive) {
                this.updateStatus('🟢 Активен - Говори!', 'online');
            }
        }
    }
    
    async transcribeAudio(audioBlob) {
        try {
            // Конвертируем Blob в File для FormData
            const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
            
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('model', 'whisper-1');
            formData.append('language', 'ru');
            
            // Используем OpenAI Whisper API через OpenRouter
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.elements.apiKey.value}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Whisper API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.text || '';
            
        } catch (error) {
            console.error('❌ Ошибка транскрипции:', error);
            
            // Если Whisper не работает, показываем сообщение
            this.addMessage('system', '⚠️ Не удалось распознать речь. Проверь API ключ или попробуй говорить громче.');
            return '';
        }
    }
    
    async getAIResponse(userMessage) {
        try {
            this.updateStatus('🤔 Думаю...', 'speaking');
            
            // Делаем скриншот экрана если доступен
            let screenImage = null;
            if (this.screenStream && this.screenStream.active) {
                screenImage = await this.captureScreen();
            }
            
            // Формируем системный промпт
            const systemPrompt = `Ты ${this.elements.aiName.value || 'NEXUS'} - умный AI ассистент с голосом и зрением. 

Твои способности:
- Видишь пользователя через веб-камеру
${screenImage ? '- Видишь экран пользователя в реальном времени' : ''}
- Общаешься голосом
- Помогаешь с любыми вопросами

Стиль общения:
- Дружелюбный и естественный
- Краткий и по делу (максимум 2-3 предложения)
- Используй эмодзи для эмоциональности
- Говори на русском языке

Если видишь экран - комментируй что на нём, помогай с тем что видишь.`;

            // Формируем сообщения для API
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                ...this.conversationHistory.slice(-8), // Последние 4 обмена
                {
                    role: 'user',
                    content: screenImage ? [
                        { 
                            type: 'text', 
                            text: userMessage 
                        },
                        { 
                            type: 'image_url', 
                            image_url: { 
                                url: screenImage,
                                detail: 'low'
                            } 
                        }
                    ] : userMessage
                }
            ];
            
            console.log('🤖 Отправляю запрос к AI...');
            
            // Выбираем модель в зависимости от наличия изображения
            const model = screenImage 
                ? 'qwen/qwen-2-vl-72b-instruct' 
                : 'qwen/qwen-2.5-72b-instruct';
            
            // Запрос к OpenRouter API
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.elements.apiKey.value}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'NEXUS AI Assistant'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 300,
                    top_p: 0.9,
                    frequency_penalty: 0.5,
                    presence_penalty: 0.5
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            console.log('💬 Ответ AI:', aiResponse);
            
            // Добавляем в историю разговора
            this.conversationHistory.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: aiResponse }
            );
            
            // Ограничиваем историю (храним максимум 10 сообщений)
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }
            
            // Показываем ответ
            this.addMessage('ai', aiResponse);
            
            // Озвучиваем ответ
            await this.speak(aiResponse);
            
        } catch (error) {
            console.error('❌ Ошибка AI:', error);
            
            let errorMsg = 'Произошла ошибка при обращении к AI';
            if (error.message.includes('401') || error.message.includes('authentication')) {
                errorMsg = 'Неверный API ключ. Проверь ключ в настройках!';
            } else if (error.message.includes('insufficient_quota')) {
                errorMsg = 'Недостаточно средств на балансе OpenRouter. Пополни баланс!';
            } else if (error.message.includes('rate_limit')) {
                errorMsg = 'Слишком много запросов. Подожди немного.';
            }
            
            this.addMessage('system', '❌ ' + errorMsg);
        }
    }
    
    async speak(text) {
        const voiceType = document.getElementById('voiceType')?.value || 'browser';
        
        try {
            this.updateStatus('🗣️ Говорю...', 'speaking');
            
            if (voiceType === 'browser') {
                // Браузерный синтез речи (работает везде)
                return new Promise((resolve) => {
                    // Останавливаем предыдущую речь
                    window.speechSynthesis.cancel();
                    
                    const utterance = new SpeechSynthesisUtterance(text);
                    const voiceLang = document.getElementById('voiceLang')?.value || 'ru-RU';
                    
                    utterance.lang = voiceLang;
                    utterance.rate = 1.0;
                    utterance.pitch = 1.0;
                    utterance.volume = 1.0;
                    
                    // Пытаемся найти лучший голос для языка
                    const voices = window.speechSynthesis.getVoices();
                    const preferredVoice = voices.find(v => 
                        v.lang === voiceLang || v.lang.startsWith(voiceLang.split('-')[0])
                    );
                    
                    if (preferredVoice) {
                        utterance.voice = preferredVoice;
                        console.log('🎤 Использую голос:', preferredVoice.name);
                    }
                    
                    utterance.onend = () => {
                        console.log('✅ Озвучка завершена');
                        if (this.isActive) {
                            this.updateStatus('🟢 Активен - Говори!', 'online');
                        }
                        resolve();
                    };
                    
                    utterance.onerror = (event) => {
                        console.error('❌ Ошибка озвучки:', event);
                        if (this.isActive) {
                            this.updateStatus('🟢 Активен - Говори!', 'online');
                        }
                        resolve();
                    };
                    
                    window.speechSynthesis.speak(utterance);
                });
                
            } else if (voiceType === 'google') {
                // Google Text-to-Speech (бесплатный публичный API)
                const voiceLang = document.getElementById('voiceLang')?.value || 'ru-RU';
                const langCode = voiceLang.split('-')[0];
                
                // Разбиваем текст на части (Google TTS ограничен 200 символами)
                const chunks = this.splitTextIntoChunks(text, 200);
                
                for (const chunk of chunks) {
                    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${langCode}&client=tw-ob`;
                    
                    await new Promise((resolve, reject) => {
                        const audio = new Audio(url);
                        
                        audio.play().catch(err => {
                            console.error('❌ Ошибка воспроизведения:', err);
                            reject(err);
                        });
                        
                        audio.onended = resolve;
                        audio.onerror = reject;
                    });
                }
                
                if (this.isActive) {
                    this.updateStatus('🟢 Активен - Говори!', 'online');
                }
            }
            
        } catch (error) {
            console.error('❌ Ошибка озвучки:', error);
            
            // Если Google TTS не сработал, переключаемся на браузерный
            if (voiceType === 'google') {
                console.log('🔄 Переключаюсь на браузерный голос...');
                const voiceTypeElement = document.getElementById('voiceType');
                if (voiceTypeElement) {
                    voiceTypeElement.value = 'browser';
                    this.saveSettings();
                }
                return this.speak(text);
            }
            
            if (this.isActive) {
                this.updateStatus('🟢 Активен - Говори!', 'online');
            }
        }
    }
    
    splitTextIntoChunks(text, maxLength) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const chunks = [];
        let currentChunk = '';
        
        for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= maxLength) {
                currentChunk += sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = sentence;
            }
        }
        
        if (currentChunk) chunks.push(currentChunk.trim());
        
        return chunks;
    }
    
    async shareScreen() {
        try {
            console.log('🖥️ Запрашиваем доступ к экрану...');
            
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: 1920,
                    height: 1080,
                    frameRate: 10
                }
            });
            
            // Создаём временное видео для рендеринга на canvas
            const video = document.createElement('video');
            video.srcObject = this.screenStream;
            video.autoplay = true;
            video.muted = true;
            
            const canvas = this.elements.screenCanvas;
            const ctx = canvas.getContext('2d');
            
            // Функция для отрисовки экрана на canvas
            const drawScreen = () => {
                if (this.screenStream && this.screenStream.active) {
                    canvas.width = video.videoWidth || 1920;
                    canvas.height = video.videoHeight || 1080;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    requestAnimationFrame(drawScreen);
                }
            };
            
            // Начинаем рисовать когда видео загрузится
            video.onloadedmetadata = () => {
                console.log('✅ Демонстрация экрана активна');
                drawScreen();
            };
            
            // Отслеживаем когда пользователь остановит демонстрацию
            this.screenStream.getVideoTracks()[0].onended = () => {
                console.log('⏹️ Демонстрация экрана остановлена');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.addMessage('system', '🖥️ Демонстрация экрана остановлена');
            };
            
            this.addMessage('system', '🖥️ Демонстрация экрана активна. Теперь я вижу твой экран!');
            
        } catch (error) {
            console.error('❌ Ошибка демонстрации экрана:', error);
            
            if (error.name === 'NotAllowedError') {
                alert('❌ Доступ к экрану отклонён. Разреши демонстрацию экрана!');
            } else {
                alert('❌ Не удалось получить доступ к экрану: ' + error.message);
            }
        }
    }
    
    async captureScreen() {
        if (!this.screenStream || !this.screenStream.active) {
            return null;
        }
        
        try {
            const canvas = this.elements.screenCanvas;
            
            // Конвертируем canvas в base64 изображение
            const imageData = canvas.toDataURL('image/jpeg', 0.6);
            
            return imageData;
            
        } catch (error) {
            console.error('❌ Ошибка захвата экрана:', error);
            return null;
        }
    }
    
    stop() {
        console.log('⏹️ Остановка NEXUS...');
        
        this.isActive = false;
        this.isProcessing = false;
        
        // Останавливаем все медиа-стримы
        if (this.userStream) {
            this.userStream.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Остановлен трек:', track.kind);
            });
            this.userStream = null;
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
        
        // Останавливаем MediaRecorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        // Останавливаем синтез речи
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // Очищаем видео
        this.elements.userVideo.srcObject = null;
        
        // Очищаем canvas
        const ctx = this.elements.screenCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.elements.screenCanvas.width, this.elements.screenCanvas.height);
        
        // Меняем состояние кнопок
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.shareScreenBtn.disabled = true;
        
        this.updateStatus('Не подключен', 'offline');
        this.addMessage('system', '⏹️ NEXUS остановлен');
        
        console.log('✅ NEXUS успешно остановлен');
    }
    
    updateStatus(text, state) {
        this.elements.statusText.textContent = text;
        this.elements.statusDot.className = `status-dot ${state}`;
    }
    
    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        let senderName = '';
        if (sender === 'user') {
            senderName = '👤 Ты';
        } else if (sender === 'ai') {
            senderName = `🤖 ${this.elements.aiName.value || 'NEXUS'}`;
        } else {
            senderName = '⚙️ Система';
        }
        
        messageDiv.innerHTML = `
            <strong>${senderName}</strong>
            <div>${text}</div>
        `;
        
        this.elements.transcript.appendChild(messageDiv);
        
        // Прокручиваем вниз
        this.elements.transcript.scrollTop = this.elements.transcript.scrollHeight;
        
        // Ограничиваем количество сообщений (максимум 50)
        const messages = this.elements.transcript.querySelectorAll('.message');
        if (messages.length > 50) {
            messages[0].remove();
        }
    }
}

// Инициализация NEXUS при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Загрузка NEXUS AI Assistant...');
    window.nexus = new NexusAI();
    console.log('✨ NEXUS готов к работе!');
});
