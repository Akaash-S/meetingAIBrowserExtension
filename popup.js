const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const status = document.getElementById('status');
const summary = document.getElementById('summary');

// Update UI based on stored state when popup is opened
chrome.storage.local.get(['isRecording'], (result) => {
    if (result.isRecording) {
        setRecordingState();
    } else {
        setStoppedState();
    }
});

startButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'start_recording' });
});

stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stop_recording' });
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'recording_started') {
        setRecordingState();
        status.textContent = 'Recording...';
    } else if (message.action === 'recording_stopped') {
        setStoppedState();
        status.textContent = 'Recording stopped. Processing results...';
    } else if (message.action === 'update_summary') {
        summary.innerHTML += message.summary + '<br>';
    } else if (message.action === 'status_update') {
        status.textContent = message.text;
    }
});

function setRecordingState() {
    startButton.disabled = true;
    stopButton.disabled = false;
    status.textContent = 'Recording...';
}

function setStoppedState() {
    startButton.disabled = false;
    stopButton.disabled = true;
    status.textContent = 'Ready to record';
}