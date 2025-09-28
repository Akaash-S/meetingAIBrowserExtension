const WEBSOCKET_URL = 'ws://localhost:5000/audio';
let websocket;
let mediaRecorder;
let audioStream;
let micStream;
let tabStream;

// Check if we're in the correct context
if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('Chrome extension APIs not available in this context');
} else {
    console.log('Offscreen document initialized successfully');
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {
    if (message.target !== 'offscreen') {
        return;
    }

    switch (message.type) {
        case 'start-recording':
            await startRecording();
            break;
        case 'stop-recording':
            stopRecording();
            break;
        default:
            console.warn(`Unexpected message received in offscreen.js: ${message.type}`);
    }
}

async function startRecording() {
    if (mediaRecorder?.state === 'recording') {
        console.warn('Recording is already in progress.');
        return;
    }

    try {
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia is not supported in this context');
        }

        // 1. Get microphone stream
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // 2. Get active tab and its audio stream
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabStream = await chrome.tabCapture.capture({ audio: true, video: false });

        // 3. Combine streams
        const audioContext = new AudioContext();
        const micSource = audioContext.createMediaStreamSource(micStream);
        const tabSource = audioContext.createMediaStreamSource(tabStream);
        const destination = audioContext.createMediaStreamDestination();
        micSource.connect(destination);
        tabSource.connect(destination);
        audioStream = destination.stream;

        // 4. Setup WebSocket
        websocket = new WebSocket(WEBSOCKET_URL);
        websocket.onopen = () => {
            chrome.runtime.sendMessage({ action: 'recording_started' });

            // 5. Start MediaRecorder
            mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0 && websocket.readyState === WebSocket.OPEN) {
                    websocket.send(event.data);
                }
            };
            mediaRecorder.start(1000); // Capture 1-second chunks
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.summary) {
                chrome.runtime.sendMessage({ action: 'update_summary', summary: data.summary });
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            chrome.runtime.sendMessage({ action: 'status_update', text: 'Error connecting to server.' });
            stopRecording();
        };

        websocket.onclose = () => {
            console.log('WebSocket connection closed');
            chrome.runtime.sendMessage({ action: 'status_update', text: 'Disconnected from server.' });
            stopRecording();
        };

    } catch (error) {
        console.error('Error starting recording in offscreen document:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Unknown error occurred';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No microphone found. Please connect a microphone.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Audio recording not supported in this browser.';
        } else if (error.message.includes('getUserMedia is not supported')) {
            errorMessage = 'Audio recording not available in this context.';
        } else {
            errorMessage = `Recording error: ${error.message}`;
        }
        
        chrome.runtime.sendMessage({ action: 'status_update', text: errorMessage });
        chrome.runtime.sendMessage({ action: 'recording_error', error: errorMessage });
    }
}

function stopRecording() {
    if (mediaRecorder?.state === 'recording') {
        mediaRecorder.stop();
    }
    websocket?.close();

    // Stop all tracks
    micStream?.getTracks().forEach(track => track.stop());
    tabStream?.getTracks().forEach(track => track.stop());
    audioStream?.getTracks().forEach(track => track.stop());

    // Clean up
    mediaRecorder = null;
    websocket = null;
    micStream = null;
    tabStream = null;
    audioStream = null;

    // Signal to the background script that we're done
    chrome.runtime.sendMessage({ action: 'recording_stopped' });
    chrome.runtime.sendMessage({ action: 'offscreen_stopped' });
}