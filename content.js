// AI Meeting Assistant - Content Script
class MeetingContentScript {
    constructor() {
        this.isRecording = false;
        this.recordingStartTime = null;
        this.setupEventListeners();
        this.detectMeetingPlatform();
    }

    setupEventListeners() {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
        });

        // Listen for page changes
        window.addEventListener('beforeunload', () => {
            if (this.isRecording) {
                this.stopRecording();
            }
        });
    }

    detectMeetingPlatform() {
        const url = window.location.href;
        const meetingPlatforms = {
            'zoom.us': 'Zoom',
            'meet.google.com': 'Google Meet',
            'teams.microsoft.com': 'Microsoft Teams',
            'webex.com': 'Cisco Webex',
            'gotomeeting.com': 'GoToMeeting',
            'bluejeans.com': 'BlueJeans'
        };

        for (const [domain, name] of Object.entries(meetingPlatforms)) {
            if (url.includes(domain)) {
                console.log(`Detected meeting platform: ${name}`);
                this.showMeetingIndicator(name);
                break;
            }
        }
    }

    showMeetingIndicator(platformName) {
        // Create a subtle indicator that we're on a meeting platform
        const indicator = document.createElement('div');
        indicator.id = 'meeting-assistant-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(102, 126, 234, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            cursor: pointer;
        `;
        indicator.textContent = `🎤 AI Assistant Ready`;
        indicator.title = `Recording available for ${platformName}`;

        document.body.appendChild(indicator);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 5000);
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'startRecording':
                    await this.startRecording();
                    sendResponse({ success: true });
                    break;

                case 'stopRecording':
                    await this.stopRecording();
                    sendResponse({ success: true });
                    break;

                case 'settingsUpdated':
                    this.handleSettingsUpdate(request.changes);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }

    async startRecording() {
        try {
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Show recording indicator
            this.showRecordingIndicator();
            
            // Notify background script
            chrome.runtime.sendMessage({
                action: 'recordingStarted',
                tabId: (await chrome.tabs.getCurrent()).id,
                timestamp: this.recordingStartTime
            });

        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }

    async stopRecording() {
        try {
            this.isRecording = false;
            this.recordingStartTime = null;
            
            // Hide recording indicator
            this.hideRecordingIndicator();
            
            // Notify background script
            chrome.runtime.sendMessage({
                action: 'recordingStopped',
                tabId: (await chrome.tabs.getCurrent()).id,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    }

    showRecordingIndicator() {
        // Remove existing indicator if any
        this.hideRecordingIndicator();

        const indicator = document.createElement('div');
        indicator.id = 'recording-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4757;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 10001;
            box-shadow: 0 4px 20px rgba(255, 71, 87, 0.3);
            animation: pulse 1.5s infinite;
            font-weight: 600;
        `;
        indicator.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; background: white; border-radius: 50%; margin-right: 8px; animation: blink 1s infinite;"></span>
            RECORDING
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.05); }
                100% { transform: translateX(-50%) scale(1); }
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(indicator);
    }

    hideRecordingIndicator() {
        const indicator = document.getElementById('recording-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    handleSettingsUpdate(changes) {
        console.log('Settings updated:', changes);
        // Handle settings changes if needed
    }
}

// Initialize content script
const meetingContentScript = new MeetingContentScript();
