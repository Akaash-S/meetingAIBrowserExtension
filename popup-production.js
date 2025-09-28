// AI Meeting Assistant - Production Popup Logic
// This version is configured for production deployment on Render

class MeetingRecorder {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioStream = null;
        this.websocket = null;
        this.startTime = null;
        this.timerInterval = null;
        
        // Production backend URL - update this with your Render service URL
        this.backendUrl = 'wss://your-service-name.onrender.com/audio';
        this.apiUrl = 'https://your-service-name.onrender.com/api';
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
        this.checkCompatibility();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.testBtn = document.getElementById('testBtn');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('status-text');
        this.timer = document.getElementById('timer');
        this.platformName = document.getElementById('platform-name');
        this.transcriptText = document.getElementById('transcript-text');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.uploadBtn.addEventListener('click', () => this.uploadMeeting());
        this.testBtn.addEventListener('click', () => this.testWorkflow());
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['backendUrl', 'apiUrl', 'userId']);
            this.backendUrl = result.backendUrl || this.backendUrl;
            this.apiUrl = result.apiUrl || this.apiUrl;
            this.userId = result.userId || 'extension-user';
        } catch (error) {
            console.error('Error loading settings:', error);
            // Use default production URLs
        }
    }

    checkCompatibility() {
        // Check for required APIs
        const requirements = {
            'MediaRecorder API': typeof MediaRecorder !== 'undefined',
            'getUserMedia': navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
            'WebSocket': typeof WebSocket !== 'undefined',
            'AudioContext': typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
            'Secure Context': window.isSecureContext
        };

        const missing = Object.entries(requirements)
            .filter(([name, supported]) => !supported)
            .map(([name]) => name);

        if (missing.length > 0) {
            this.showMessage(`Missing required features: ${missing.join(', ')}. Please use Chrome or Edge on HTTPS.`, 'error');
            this.startBtn.disabled = true;
        } else {
            console.log('All compatibility checks passed');
        }
    }

    async requestMicrophonePermission() {
        try {
            // Check if we're in a secure context first
            if (!window.isSecureContext) {
                throw new Error('Microphone access requires HTTPS. Please use the extension on a secure website (https://).');
            }

            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Microphone access not supported. Please use Chrome, Edge, or Firefox browser.');
            }

            // Check current permission status
            let permissionStatus = 'unknown';
            try {
                const permission = await navigator.permissions.query({ name: 'microphone' });
                permissionStatus = permission.state;
            } catch (e) {
                // Permission query might not be supported in all browsers
                console.log('Permission query not supported, proceeding with getUserMedia');
            }

            if (permissionStatus === 'denied') {
                throw new Error('Microphone access is blocked. Please enable it in Chrome settings: chrome://settings/content/microphone');
            }

            // Request microphone access with user-friendly error handling
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });

            // Stop the test stream immediately
            stream.getTracks().forEach(track => track.stop());
            
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Microphone permission denied. Please click "Allow" when prompted, or enable microphone access in Chrome settings: chrome://settings/content/microphone');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No microphone found. Please connect a microphone and try again.');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Microphone access not supported. Please use Chrome, Edge, or Firefox browser.');
            } else if (error.name === 'NotReadableError') {
                throw new Error('Microphone is being used by another application. Please close other applications and try again.');
            } else if (error.name === 'OverconstrainedError') {
                throw new Error('Microphone constraints cannot be satisfied. Please check your microphone settings.');
            } else if (error.name === 'SecurityError') {
                throw new Error('Microphone access blocked due to security restrictions. Please use HTTPS.');
            } else {
                throw new Error(`Microphone access failed: ${error.message}`);
            }
        }
    }

    async startRecording() {
        try {
            this.showMessage('Requesting microphone access...', 'info');
            this.updateStatus('connecting', 'Requesting permissions...');

            // Check MediaRecorder support
            if (!window.MediaRecorder) {
                throw new Error('MediaRecorder API not supported in this browser');
            }

            // Check if we're in a secure context (required for microphone access)
            if (!window.isSecureContext) {
                throw new Error('Microphone access requires HTTPS. Please use the extension on a secure website.');
            }

            // Check for supported MIME types
            const supportedTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg;codecs=opus'
            ];
            
            let selectedMimeType = null;
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    break;
                }
            }
            
            if (!selectedMimeType) {
                throw new Error('No supported audio format found');
            }

            // Request microphone permission first
            await this.requestMicrophonePermission();
            this.showMessage('Microphone access granted!', 'success');

            // Now get the actual stream for recording
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // Try to get system audio (may not be available in all contexts)
            let systemStream = null;
            try {
                systemStream = await navigator.mediaDevices.getDisplayMedia({
                    video: false,
                    audio: true
                });
            } catch (error) {
                console.warn('System audio not available, using microphone only:', error);
                this.showMessage('System audio not available, recording microphone only', 'info');
            }

            // Use microphone stream as primary
            this.audioStream = micStream;

            // If we have system audio, try to combine (simplified approach)
            if (systemStream) {
                try {
                    // Check if AudioContext is available
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContextClass) {
                        throw new Error('AudioContext not supported');
                    }
                    
                    const audioContext = new AudioContextClass();
                    
                    // Check if the context is in a suspended state
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }
                    
                    const micSource = audioContext.createMediaStreamSource(micStream);
                    const systemSource = audioContext.createMediaStreamSource(systemStream);
                    
                    const destination = audioContext.createMediaStreamDestination();
                    micSource.connect(destination);
                    systemSource.connect(destination);

                    this.audioStream = destination.stream;
                } catch (error) {
                    console.warn('Could not combine audio streams, using microphone only:', error);
                    this.audioStream = micStream;
                }
            }

            // Setup MediaRecorder with fallback options
            const recorderOptions = {
                audioBitsPerSecond: 128000
            };
            
            if (selectedMimeType) {
                recorderOptions.mimeType = selectedMimeType;
            }

            try {
                this.mediaRecorder = new MediaRecorder(this.audioStream, recorderOptions);
            } catch (error) {
                console.error('Error creating MediaRecorder:', error);
                // Try with minimal options
                try {
                    this.mediaRecorder = new MediaRecorder(this.audioStream);
                } catch (fallbackError) {
                    console.error('Error creating MediaRecorder with fallback:', fallbackError);
                    throw new Error('Failed to create audio recorder. Please try a different browser or check your audio settings.');
                }
            }

            // Setup WebSocket connection
            await this.connectWebSocket();

            // Start recording
            this.mediaRecorder.start(1000); // Send chunks every 1 second
            this.isRecording = true;
            this.startTime = Date.now();

            // Update UI
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.updateStatus('recording', 'Recording...');
            this.startTimer();

            this.showMessage('Recording started successfully!', 'success');

        } catch (error) {
            console.error('Error starting recording:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Recording failed';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found. Please connect a microphone and try again.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Audio recording not supported in this browser. Please use Chrome or Edge.';
            } else if (error.message.includes('MediaRecorder API not supported')) {
                errorMessage = 'MediaRecorder API not supported. Please use a modern browser.';
            } else if (error.message.includes('No supported audio format')) {
                errorMessage = 'No supported audio format found. Please use Chrome or Edge.';
            } else {
                errorMessage = `Error: ${error.message}`;
            }
            
            this.showMessage(errorMessage, 'error');
            this.updateStatus('stopped', 'Ready to record');
        }
    }

    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                // Close existing connection if any
                if (this.websocket) {
                    this.websocket.close();
                }

                this.websocket = new WebSocket(this.backendUrl);
                
                // Set timeout for connection
                const connectionTimeout = setTimeout(() => {
                    if (this.websocket.readyState === WebSocket.CONNECTING) {
                        this.websocket.close();
                        reject(new Error('WebSocket connection timeout. Make sure backend is deployed and running.'));
                    }
                }, 15000); // 15 second timeout for production
                
                this.websocket.onopen = () => {
                    console.log('WebSocket connected to production backend');
                    clearTimeout(connectionTimeout);
                    resolve();
                };

                this.websocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    clearTimeout(connectionTimeout);
                    reject(new Error('WebSocket connection failed. Make sure backend is deployed and running.'));
                };

                this.websocket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleBackendMessage(data);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.websocket.onclose = (event) => {
                    console.log('WebSocket disconnected:', event.code, event.reason);
                    clearTimeout(connectionTimeout);
                    
                    if (this.isRecording) {
                        this.showMessage('Connection lost. Recording stopped.', 'error');
                        this.stopRecording();
                    }
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    handleBackendMessage(data) {
        switch (data.type) {
            case 'meeting_created':
                this.meetingId = data.meetingId;
                console.log('Meeting created:', this.meetingId);
                this.showMessage(`Meeting created: ${this.meetingId}`, 'success');
                break;
            case 'transcript':
                this.showMessage(`Transcript: ${data.text}`, 'info');
                break;
            case 'summary':
                this.showMessage(`Summary: ${data.summary}`, 'info');
                break;
            case 'tasks':
                this.showMessage(`Tasks extracted: ${data.tasks.length}`, 'info');
                break;
            case 'error':
                this.showMessage(`Backend error: ${data.message}`, 'error');
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    stopRecording() {
        try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }

            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
            }

            if (this.websocket) {
                this.websocket.close();
            }

            this.isRecording = false;
            this.stopTimer();

            // Update UI
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.updateStatus('stopped', 'Ready to record');

            this.showMessage('Recording stopped successfully!', 'success');

        } catch (error) {
            console.error('Error stopping recording:', error);
            this.showMessage(`Error stopping recording: ${error.message}`, 'error');
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.startTime) {
                const elapsed = Date.now() - this.startTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timer.textContent = '00:00';
    }

    updateStatus(status, text) {
        this.statusIndicator.className = `status-indicator ${status}`;
        this.statusText.textContent = text;
    }

    async processCompleteAudio() {
        try {
            console.log('Processing complete audio...');
            
            // Get the meeting title
            const meetingTitle = document.getElementById('meetingTitle')?.value || 'Meeting Recording';
            
            // Create a new MediaRecorder to capture the complete audio
            const completeAudioChunks = [];
            const completeRecorder = new MediaRecorder(this.audioStream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            completeRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    completeAudioChunks.push(event.data);
                }
            };
            
            completeRecorder.onstop = async () => {
                try {
                    // Combine all audio chunks
                    const completeAudioBlob = new Blob(completeAudioChunks, { type: 'audio/webm' });
                    
                    // Convert to base64
                    const reader = new FileReader();
                    reader.onload = () => {
                        const audioData = reader.result;
                        
                        // Send complete audio for processing
                        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                            this.websocket.send(JSON.stringify({
                                type: 'process_audio',
                                meetingId: this.currentMeetingId,
                                userId: this.userId,
                                audioData: audioData,
                                meetingTitle: meetingTitle,
                                timestamp: Date.now()
                            }));
                            
                            this.showMessage('Processing audio... This may take a few minutes.', 'info');
                        }
                    };
                    reader.readAsDataURL(completeAudioBlob);
                    
                } catch (error) {
                    console.error('Error processing complete audio:', error);
                    this.showMessage('Error processing audio', 'error');
                }
            };
            
            // Record for a very short time to capture the complete audio
            completeRecorder.start();
            setTimeout(() => {
                completeRecorder.stop();
            }, 100);
            
        } catch (error) {
            console.error('Error in processCompleteAudio:', error);
            this.showMessage('Error processing complete audio', 'error');
        }
    }

    async uploadMeeting() {
        try {
            this.showMessage('Starting meeting upload...', 'info');
            this.updateStatus('connecting', 'Uploading meeting...');
            this.uploadBtn.disabled = true;

            // Create a file input for audio upload
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'audio/*';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            fileInput.onchange = async (event) => {
                try {
                    const file = event.target.files[0];
                    if (!file) {
                        this.showMessage('No file selected', 'error');
                        return;
                    }

                    this.showMessage('Processing uploaded audio...', 'info');
                    
                    // Read the file as base64
                    const reader = new FileReader();
                    reader.onload = () => {
                        const audioData = reader.result;
                        const meetingId = `upload-${Date.now()}`;
                        const meetingTitle = file.name.replace(/\.[^/.]+$/, '') || 'Uploaded Meeting';

                        // Connect to WebSocket and send the audio
                        this.connectWebSocket().then(() => {
                            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                                this.websocket.send(JSON.stringify({
                                    type: 'process_audio',
                                    meetingId: meetingId,
                                    userId: this.userId,
                                    audioData: audioData,
                                    meetingTitle: meetingTitle,
                                    timestamp: Date.now()
                                }));
                                this.showMessage('Processing uploaded audio... This may take a few minutes.', 'info');
                            } else {
                                this.showMessage('Failed to connect to backend', 'error');
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('Error processing uploaded file:', error);
                    this.showMessage('Error processing uploaded file', 'error');
                } finally {
                    document.body.removeChild(fileInput);
                    this.uploadBtn.disabled = false;
                    this.updateStatus('stopped', 'Ready to record');
                }
            };

            // Trigger file selection
            fileInput.click();

        } catch (error) {
            console.error('Error in uploadMeeting:', error);
            this.showMessage('Error uploading meeting', 'error');
            this.uploadBtn.disabled = false;
            this.updateStatus('stopped', 'Ready to record');
        }
    }

    async testWorkflow() {
        try {
            this.showMessage('Testing complete workflow...', 'info');
            this.updateStatus('connecting', 'Testing workflow...');
            this.testBtn.disabled = true;

            // Generate a test audio file (sine wave)
            const testAudioBlob = await this.generateTestAudio();
            const meetingId = `test-${Date.now()}`;
            const meetingTitle = 'Test Meeting';

            this.showMessage('Generated test audio, processing...', 'info');

            // Connect to WebSocket and send the test audio
            await this.connectWebSocket();
            
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                const reader = new FileReader();
                reader.onload = () => {
                    const audioData = reader.result;
                    this.websocket.send(JSON.stringify({
                        type: 'process_audio',
                        meetingId: meetingId,
                        userId: this.userId,
                        audioData: audioData,
                        meetingTitle: meetingTitle,
                        timestamp: Date.now()
                    }));
                    this.showMessage('Test workflow started... This may take a few minutes.', 'info');
                };
                reader.readAsDataURL(testAudioBlob);
            } else {
                this.showMessage('Failed to connect to backend for testing', 'error');
            }

        } catch (error) {
            console.error('Error in testWorkflow:', error);
            this.showMessage('Error testing workflow', 'error');
        } finally {
            this.testBtn.disabled = false;
            this.updateStatus('stopped', 'Ready to record');
        }
    }

    async generateTestAudio() {
        // Generate a 5-second sine wave test audio
        const sampleRate = 44100;
        const duration = 5; // seconds
        const frequency = 440; // A4 note
        const samples = sampleRate * duration;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
        }
        
        // Convert to WAV format
        const wavBuffer = this.audioBufferToWav(buffer);
        return new Blob([wavBuffer], { type: 'audio/wav' });
    }

    audioBufferToWav(buffer) {
        const length = buffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Convert float samples to 16-bit PCM
        const channelData = buffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
        
        return arrayBuffer;
    }

    showMessage(message, type) {
        // Create or update message display
        let messageDiv = document.getElementById('message-display');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'message-display';
            messageDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 10px;
                border-radius: 5px;
                color: white;
                font-size: 12px;
                z-index: 1000;
                max-width: 200px;
                word-wrap: break-word;
            `;
            document.body.appendChild(messageDiv);
        }

        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };

        messageDiv.style.backgroundColor = colors[type] || colors.info;
        messageDiv.textContent = message;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageDiv && messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// Initialize the recorder when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    const recorder = new MeetingRecorder();

    // Setup MediaRecorder event listeners
    if (recorder.mediaRecorder) {
        recorder.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && recorder.websocket && recorder.websocket.readyState === WebSocket.OPEN) {
                // Send audio chunk to backend
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        // Validate the data URL format
                        const result = reader.result;
                        if (!result || typeof result !== 'string') {
                            console.error('Invalid audio data format');
                            return;
                        }
                        
                        // Ensure proper data URL format
                        if (!result.startsWith('data:audio/')) {
                            console.error('Invalid audio data URL format');
                            return;
                        }
                        
                        const audioData = {
                            type: 'audio_chunk',
                            userId: recorder.userId,
                            data: result,
                            timestamp: Date.now()
                        };
                        recorder.websocket.send(JSON.stringify(audioData));
                    } catch (error) {
                        console.error('Error processing audio data:', error);
                    }
                };
                reader.onerror = (error) => {
                    console.error('FileReader error:', error);
                };
                reader.readAsDataURL(event.data);
            }
        };

        recorder.mediaRecorder.onstop = () => {
            console.log('Recording stopped');
            if (recorder.websocket && recorder.websocket.readyState === WebSocket.OPEN) {
                // Send recording stopped message
                recorder.websocket.send(JSON.stringify({
                    type: 'recording_stopped',
                    userId: recorder.userId,
                    timestamp: Date.now()
                }));
                
                // Process the complete audio data
                recorder.processCompleteAudio();
            }
        };
    }
});
