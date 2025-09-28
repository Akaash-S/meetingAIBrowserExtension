/**
 * Debug Error Script for AI Meeting Assistant Extension
 * This script helps identify and debug common extension errors
 */

class ExtensionDebugger {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    log(type, message, details = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, type, message, details };
        
        switch (type) {
            case 'error':
                this.errors.push(logEntry);
                console.error(`[${timestamp}] ERROR:`, message, details);
                break;
            case 'warning':
                this.warnings.push(logEntry);
                console.warn(`[${timestamp}] WARNING:`, message, details);
                break;
            case 'info':
                this.info.push(logEntry);
                console.info(`[${timestamp}] INFO:`, message, details);
                break;
        }
    }

    checkBrowserCompatibility() {
        this.log('info', 'Checking browser compatibility...');
        
        const checks = {
            'Chrome/Edge': /Chrome|Edg/.test(navigator.userAgent),
            'HTTPS': window.isSecureContext,
            'MediaRecorder': typeof MediaRecorder !== 'undefined',
            'getUserMedia': !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            'WebSocket': typeof WebSocket !== 'undefined',
            'AudioContext': !!(window.AudioContext || window.webkitAudioContext),
            'Permissions API': 'permissions' in navigator
        };

        Object.entries(checks).forEach(([feature, supported]) => {
            if (supported) {
                this.log('info', `✓ ${feature} is supported`);
            } else {
                this.log('error', `✗ ${feature} is NOT supported`);
            }
        });

        return checks;
    }

    async checkMicrophoneAccess() {
        this.log('info', 'Checking microphone access...');
        
        try {
            // Check permission status
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'microphone' });
                this.log('info', `Microphone permission status: ${permission.state}`);
                
                if (permission.state === 'denied') {
                    this.log('error', 'Microphone access is blocked. Enable it in Chrome settings: chrome://settings/content/microphone');
                    return false;
                }
            }

            // Test microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.log('info', '✓ Microphone access granted');
            
            // Stop the test stream
            stream.getTracks().forEach(track => track.stop());
            return true;
            
        } catch (error) {
            this.log('error', 'Microphone access failed', {
                name: error.name,
                message: error.message,
                code: error.code
            });
            return false;
        }
    }

    testAudioContext() {
        this.log('info', 'Testing AudioContext...');
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                this.log('error', 'AudioContext not supported');
                return false;
            }

            const audioContext = new AudioContextClass();
            this.log('info', `AudioContext created successfully. State: ${audioContext.state}`);
            
            if (audioContext.state === 'suspended') {
                this.log('warning', 'AudioContext is suspended. User interaction required to resume.');
            }

            return true;
        } catch (error) {
            this.log('error', 'AudioContext creation failed', {
                name: error.name,
                message: error.message
            });
            return false;
        }
    }

    testMediaRecorder() {
        this.log('info', 'Testing MediaRecorder...');
        
        try {
            // Create a dummy stream for testing
            const canvas = document.createElement('canvas');
            const stream = canvas.captureStream();
            
            const recorder = new MediaRecorder(stream);
            this.log('info', '✓ MediaRecorder created successfully');
            
            return true;
        } catch (error) {
            this.log('error', 'MediaRecorder creation failed', {
                name: error.name,
                message: error.message
            });
            return false;
        }
    }

    async runFullDiagnostic() {
        this.log('info', 'Starting full diagnostic...');
        
        const results = {
            browserCompatibility: this.checkBrowserCompatibility(),
            microphoneAccess: await this.checkMicrophoneAccess(),
            audioContext: this.testAudioContext(),
            mediaRecorder: this.testMediaRecorder()
        };

        this.log('info', 'Diagnostic complete', results);
        
        return {
            results,
            errors: this.errors,
            warnings: this.warnings,
            info: this.info
        };
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            isSecureContext: window.isSecureContext,
            errors: this.errors,
            warnings: this.warnings,
            info: this.info
        };

        console.log('=== EXTENSION DEBUG REPORT ===');
        console.log(JSON.stringify(report, null, 2));
        
        return report;
    }
}

// Auto-run diagnostic when script loads
if (typeof window !== 'undefined') {
    window.ExtensionDebugger = ExtensionDebugger;
    
    // Run diagnostic automatically
    const debugger = new ExtensionDebugger();
    debugger.runFullDiagnostic().then(() => {
        debugger.generateReport();
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExtensionDebugger;
}
