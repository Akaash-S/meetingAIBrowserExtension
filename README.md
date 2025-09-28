# 🎤 AI Meeting Assistant - Chrome Extension

A powerful Chrome browser extension that records online meeting sessions with AI-powered transcription, task extraction, and minute-to-minute summaries.

## ✨ Features

- **🎙️ Audio Recording**: Captures both microphone and system audio
- **🤖 AI Transcription**: Real-time speech-to-text using RapidAPI
- **📝 Task Extraction**: Automatically extracts action items and decisions
- **📊 Minute-to-Minute Summaries**: Live meeting summaries every 60 seconds
- **📅 Calendar Integration**: Auto-updates calendar with deadlines
- **💾 Database Storage**: Stores all data in Neon PostgreSQL
- **☁️ Cloud Storage**: Files stored in Supabase/AWS S3

## 🚀 Installation

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `browserExtension` folder
4. The extension should now appear in your extensions list

### 2. Configure Backend

Make sure your backend is running on `http://localhost:5000` with the following environment variables:

```env
# RapidAPI for Speech-to-Text
RAPIDAPI_KEY=your-rapidapi-key
RAPIDAPI_HOST=speech-to-text-api1.p.rapidapi.com

# Gemini API for Task Extraction
GEMINI_API_KEY=your-gemini-api-key

# Database
DATABASE_URL=your-neon-postgresql-url
```

### 3. Start Backend Server

```bash
cd backend
python app.py
```

## 🎯 Usage

### 1. Start Recording

1. Click the extension icon in your browser toolbar
2. Click "Start Recording" button
3. Grant microphone and screen capture permissions
4. The extension will start recording both mic and system audio

### 2. During Recording

- **Real-time Transcription**: See live transcript in the popup
- **Task Extraction**: Action items automatically extracted
- **Live Summaries**: Get minute-to-minute summaries
- **Visual Indicator**: Recording indicator shows on the page

### 3. Stop Recording

1. Click "Stop Recording" in the extension popup
2. Recording will be saved to the database
3. Tasks and summaries will be available in your dashboard

## 🔧 Technical Details

### Extension Architecture

```
browserExtension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic and audio recording
├── background.js         # Service worker for background tasks
├── content.js            # Content script for page interaction
└── icons/                # Extension icons
```

### Audio Processing Flow

1. **Audio Capture**: MediaRecorder API captures audio streams
2. **Chunk Processing**: Audio sent in 1-second chunks via WebSocket
3. **Transcription**: RapidAPI converts audio to text
4. **AI Analysis**: Gemini API extracts tasks and insights
5. **Database Storage**: All data stored in Neon PostgreSQL
6. **Real-time Updates**: Live feedback to extension UI

### WebSocket Communication

```javascript
// Audio chunk format
{
  type: 'audio_chunk',
  userId: 'user-id',
  data: 'base64-encoded-audio',
  timestamp: 1234567890
}

// Response format
{
  type: 'transcript',
  text: 'transcribed text',
  timestamp: '2025-09-27T19:30:00Z'
}
```

## 🛠️ Development

### Prerequisites

- Chrome browser with developer mode enabled
- Python 3.8+ for backend
- Node.js (optional, for building)

### Backend Requirements

```bash
pip install flask flask-cors psycopg2-binary websockets requests python-dotenv
```

### Extension Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh button on the extension
4. Test your changes

## 📱 Supported Platforms

The extension automatically detects and works with:

- **Zoom** (zoom.us)
- **Google Meet** (meet.google.com)
- **Microsoft Teams** (teams.microsoft.com)
- **Cisco Webex** (webex.com)
- **GoToMeeting** (gotomeeting.com)
- **BlueJeans** (bluejeans.com)

## 🔒 Permissions

The extension requires these permissions:

- **tabCapture**: To capture system audio
- **storage**: To save settings and preferences
- **activeTab**: To interact with the current tab
- **scripting**: To inject content scripts
- **background**: For background processing

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure to grant microphone and screen capture permissions
2. **WebSocket Connection Failed**: Check if backend is running on localhost:5000
3. **Transcription Not Working**: Verify RapidAPI key is configured
4. **Tasks Not Extracted**: Check Gemini API key configuration

### Debug Mode

Enable debug logging in the extension:

1. Open Chrome DevTools
2. Go to Console tab
3. Look for extension logs

## 📊 Data Flow

```
Extension → WebSocket → Backend → RapidAPI → Gemini API → Database
    ↓           ↓           ↓           ↓           ↓
  Audio    Transcription  Analysis   Tasks    Storage
```

## 🎉 Success!

Your AI Meeting Assistant extension is now ready to record and transcribe meetings with automatic task extraction and real-time summaries!

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify backend server is running
3. Check API keys are configured correctly
4. Ensure database connection is working
