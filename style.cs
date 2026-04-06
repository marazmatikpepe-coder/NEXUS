@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

:root {
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --secondary: #ec4899;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
    --bg-dark: #0f172a;
    --bg-card: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border: #334155;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg-dark);
    color: var(--text-primary);
    min-height: 100vh;
    padding: 20px;
    background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.2) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.2) 0px, transparent 50%);
    background-attachment: fixed;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Header */
.header {
    text-align: center;
    margin-bottom: 40px;
    position: relative;
}

.header h1 {
    font-size: 72px;
    font-weight: 900;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
    letter-spacing: -2px;
    animation: glow 3s ease-in-out infinite;
    text-shadow: 0 0 80px rgba(99, 102, 241, 0.5);
}

@keyframes glow {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.2); }
}

.subtitle {
    color: var(--text-secondary);
    font-size: 20px;
    font-weight: 300;
    letter-spacing: 1px;
}

/* Status Bar */
.status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 20px;
    background: var(--bg-card);
    border-radius: 16px;
    margin-bottom: 30px;
    border: 1px solid var(--border);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
}

.status-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    position: relative;
}

.status-dot::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.status-dot.offline {
    background: var(--danger);
}

.status-dot.offline::before {
    background: var(--danger);
}

.status-dot.online {
    background: var(--success);
}

.status-dot.online::before {
    background: var(--success);
}

.status-dot.speaking {
    background: var(--warning);
}

.status-dot.speaking::before {
    background: var(--warning);
}

@keyframes ping {
    75%, 100% {
        transform: scale(2);
        opacity: 0;
    }
}

#statusText {
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
}

/* Video Container */
.video-container {
    position: relative;
    background: var(--bg-card);
    border-radius: 24px;
    overflow: hidden;
    margin-bottom: 30px;
    height: 600px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    border: 1px solid var(--border);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

#userVideo, #screenCanvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
}

.ai-avatar {
    position: absolute;
    bottom: 30px;
    right: 30px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 42px;
    font-weight: 900;
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.6);
    position: relative;
    border: 4px solid rgba(255, 255, 255, 0.2);
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

.pulse {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.4);
    animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

/* Controls */
.controls {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-bottom: 40px;
    flex-wrap: wrap;
}

.btn {
    padding: 18px 36px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
    width: 300px;
    height: 300px;
}

.btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.btn:active {
    transform: translateY(-1px);
}

.btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
}

.btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
}

.btn-danger {
    background: linear-gradient(135deg, var(--danger), #dc2626);
    color: white;
}

.btn-secondary {
    background: linear-gradient(135deg, #64748b, #475569);
    color: white;
}

/* Transcript */
.transcript-container {
    margin-bottom: 40px;
}

.transcript-container h3 {
    margin-bottom: 20px;
    color: var(--text-primary);
    font-size: 24px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
}

.transcript {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 30px;
    min-height: 250px;
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid var(--border);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.transcript::-webkit-scrollbar {
    width: 8px;
}

.transcript::-webkit-scrollbar-track {
    background: var(--bg-dark);
    border-radius: 10px;
}

.transcript::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 10px;
}

.message {
    margin-bottom: 20px;
    padding: 16px 20px;
    border-radius: 16px;
    line-height: 1.6;
    animation: slideIn 0.3s ease-out;
    position: relative;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.message.user {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1));
    margin-left: 15%;
    border-left: 4px solid var(--primary);
}

.message.ai {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.1));
    margin-right: 15%;
    border-left: 4px solid var(--secondary);
}

.message.system {
    background: rgba(100, 116, 139, 0.2);
    text-align: center;
    border-left: 4px solid var(--text-secondary);
}

.message strong {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.8;
}

/* Settings */
.settings {
    background: var(--bg-card);
    padding: 30px;
    border-radius: 20px;
    border: 1px solid var(--border);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.settings h3 {
    margin-bottom: 25px;
    color: var(--text-primary);
    font-size: 24px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
}

.settings-grid {
    display: grid;
    gap: 25px;
}

.setting-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.setting-item label {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.setting-item input {
    padding: 14px 18px;
    border: 2px solid var(--border);
    border-radius: 12px;
    font-size: 15px;
    background: var(--bg-dark);
    color: var(--text-primary);
    transition: all 0.3s;
    font-family: 'Inter', monospace;
}

.setting-item input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.setting-item small {
    color: var(--text-secondary);
    font-size: 13px;
}

.setting-item small a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
}

.setting-item small a:hover {
    text-decoration: underline;
}

/* Responsive */
@media (max-width: 968px) {
    .header h1 {
        font-size: 48px;
    }
    
    .video-container {
        grid-template-columns: 1fr;
        height: auto;
    }
    
    #userVideo, #screenCanvas {
        height: 300px;
    }
    
    .controls {
        flex-direction: column;
    }
    
    .btn {
        width: 100%;
    }
    
    .message.user, .message.ai {
        margin-left: 0;
        margin-right: 0;
    }
}

/* Loading Animation */
@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
}
