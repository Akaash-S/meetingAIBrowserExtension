const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

// A function to create and manage the offscreen document
async function setupOffscreenDocument(path) {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL(path)]
    });

    if (existingContexts.length > 0) {
        return;
    }

    await chrome.offscreen.createDocument({
        url: path,
        reasons: ['USER_MEDIA'],
        justification: 'Microphone access is required to record meeting audio.',
    });
}

// A function to close the offscreen document
async function closeOffscreenDocument() {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
    });

    if (existingContexts.length > 0) {
        await chrome.offscreen.closeDocument();
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(async (message) => {
    switch (message.action) {
        case 'start_recording':
            await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
            // Pass the start message to the offscreen document
            chrome.runtime.sendMessage({ target: 'offscreen', type: 'start-recording' });
            break;
        case 'stop_recording':
            // Pass the stop message to the offscreen document
            chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop-recording' });
            break;
        // Listen for the offscreen document to signal it has stopped, then close it
        case 'offscreen_stopped':
            await closeOffscreenDocument();
            break;
    }
    return true;
});
