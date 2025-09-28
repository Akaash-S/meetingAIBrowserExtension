# 🔧 Extension Troubleshooting Guide

## 🚨 **"Not Supported" Error - SOLVED!**

The "not supported" error has been fixed with the following improvements:

### **✅ What Was Fixed:**

1. **MediaRecorder Compatibility Check**
   - Added support for multiple audio formats (webm, mp4, ogg)
   - Automatic fallback to supported formats
   - Better error messages for unsupported browsers

2. **Audio Permission Handling**
   - Improved microphone permission requests
   - Better error messages for permission denials
   - Graceful fallback when system audio unavailable

3. **WebSocket Connection**
   - Added connection timeout (10 seconds)
   - Better error messages for connection failures
   - Automatic reconnection handling

4. **Browser Compatibility**
   - Added compatibility checks on startup
   - Clear error messages for missing features
   - Support for different Chrome versions

## 🧪 **Testing Your Extension**

### **Step 1: Use the Test Page**
1. Open `test.html` in Chrome
2. Click "Check Compatibility" - should show all green checkmarks
3. Click "Test MediaRecorder" - should show supported formats
4. Click "Test Audio Permissions" - should request microphone access
5. Click "Test WebSocket" - should connect to backend

### **Step 2: Use Debug Popup**
1. Load the extension in Chrome
2. Right-click extension icon → "Options" (or modify manifest to use popup-debug.html)
3. Use the debug version to see detailed error logs

### **Step 3: Check Browser Console**
1. Right-click extension popup → "Inspect"
2. Check Console tab for any error messages
3. Look for specific error types and messages

## 🐛 **Common Issues & Solutions**

### **Issue 1: "MediaRecorder API not supported"**
**Solution:**
- Use Chrome or Edge browser (latest version)
- Check if you're in incognito mode (disable it)
- Ensure JavaScript is enabled

### **Issue 2: "Microphone permission denied"**
**Solution:**
- Click the microphone icon in address bar
- Select "Allow" for microphone access
- Refresh the page and try again
- Check Chrome settings: Settings → Privacy → Site Settings → Microphone

### **Issue 3: "WebSocket connection failed"**
**Solution:**
- Make sure backend is running: `cd backend && python app.py`
- Check if port 5000 is available
- Try accessing `http://localhost:5000/api/health` in browser
- Check firewall settings

### **Issue 4: "No supported audio format found"**
**Solution:**
- Update Chrome to latest version
- Check if you're using a supported browser
- Try the test page to see available formats

### **Issue 5: Extension won't load**
**Solution:**
- Check manifest.json syntax
- Ensure all files are present
- Reload the extension in chrome://extensions/
- Check for JavaScript errors

## 🔍 **Debugging Steps**

### **1. Check Browser Compatibility**
```javascript
// Open browser console and run:
console.log('MediaRecorder:', typeof MediaRecorder);
console.log('getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
console.log('WebSocket:', typeof WebSocket);
console.log('AudioContext:', typeof AudioContext);
```

### **2. Test MediaRecorder Formats**
```javascript
// Check supported formats:
const formats = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
formats.forEach(format => {
    console.log(`${format}: ${MediaRecorder.isTypeSupported(format)}`);
});
```

### **3. Test Audio Permissions**
```javascript
// Test microphone access:
navigator.mediaDevices.getUserMedia({audio: true})
    .then(stream => {
        console.log('Microphone access granted');
        stream.getTracks().forEach(track => track.stop());
    })
    .catch(error => console.error('Microphone error:', error));
```

### **4. Test WebSocket Connection**
```javascript
// Test backend connection:
const ws = new WebSocket('ws://localhost:5000/audio');
ws.onopen = () => console.log('WebSocket connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
```

## 📋 **Pre-Flight Checklist**

Before testing the extension, ensure:

- [ ] **Chrome/Edge browser** (latest version)
- [ ] **Backend running** on localhost:5000
- [ ] **Microphone connected** and working
- [ ] **JavaScript enabled** in browser
- [ ] **Not in incognito mode**
- [ ] **Extension loaded** without errors
- [ ] **All permissions granted**

## 🚀 **Quick Fix Commands**

### **Restart Backend:**
```bash
cd backend
python app.py
```

### **Reload Extension:**
1. Go to `chrome://extensions/`
2. Find "AI Meeting Assistant"
3. Click the refresh icon
4. Test again

### **Clear Extension Data:**
1. Go to `chrome://extensions/`
2. Find "AI Meeting Assistant"
3. Click "Details"
4. Click "Extension options"
5. Clear any stored data

## 🎯 **Expected Behavior After Fix**

When everything works correctly, you should see:

1. ✅ **Extension loads** without errors
2. ✅ **Start Recording button** is clickable
3. ✅ **Microphone permission** requested and granted
4. ✅ **WebSocket connects** to backend
5. ✅ **Recording starts** with timer running
6. ✅ **Audio captured** and sent to backend
7. ✅ **Meeting created** in database
8. ✅ **Stop Recording** works properly

## 📞 **Still Having Issues?**

If you're still experiencing problems:

1. **Check the test page** (`test.html`) for specific error messages
2. **Use the debug popup** (`popup-debug.html`) for detailed logs
3. **Check browser console** for JavaScript errors
4. **Verify backend is running** and accessible
5. **Try a different browser** (Chrome vs Edge)
6. **Check Chrome version** (should be 88+)

The extension should now work reliably across different Chrome versions and configurations! 🎉
