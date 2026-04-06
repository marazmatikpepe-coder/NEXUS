async speak(text) {
    const voiceType = document.getElementById('voiceType')?.value || 'browser';
    
    try {
        this.updateStatus('Говорю...', 'speaking');
        
        if (voiceType === 'browser') {
            // Используем встроенный браузерный синтез (работает везде!)
            return new Promise((resolve) => {
                const utterance = new SpeechSynthesisUtterance(text);
                const voiceLang = document.getElementById('voiceLang')?.value || 'ru-RU';
                
                utterance.lang = voiceLang;
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                
                // Выбираем голос
                const voices = speechSynthesis.getVoices();
                const voice = voices.find(v => v.lang.startsWith(voiceLang.split('-')[0]));
                if (voice) utterance.voice = voice;
                
                utterance.onend = () => {
                    this.updateStatus('Активен - говори!', 'online');
                    resolve();
                };
                
                utterance.onerror = () => {
                    this.updateStatus('Активен - говори!', 'online');
                    resolve();
                };
                
                speechSynthesis.speak(utterance);
            });
            
        } else if (voiceType === 'google') {
            // Google Cloud Text-to-Speech (бесплатно через публичный API)
            const voiceLang = document.getElementById('voiceLang')?.value || 'ru-RU';
            
            // Используем публичный прокси для Google TTS
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${voiceLang.split('-')[0]}&client=tw-ob`;
            
            const audio = new Audio(url);
            
            return new Promise((resolve) => {
                audio.play();
                
                audio.onended = () => {
                    this.updateStatus('Ак��ивен - говори!', 'online');
                    resolve();
                };
                
                audio.onerror = () => {
                    console.error('Ошибка Google TTS, переключаюсь на браузерный');
                    document.getElementById('voiceType').value = 'browser';
                    this.speak(text).then(resolve);
                };
            });
        }
        
    } catch (error) {
        console.error('Ошибка озвучки:', error);
        this.updateStatus('Активен - говори!', 'online');
    }
}
