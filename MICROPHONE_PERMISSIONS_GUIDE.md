# 🎤 Microphone Permissions Guide

## Quick Fix for "Microphone Permission Denied" Error

### ✅ **Step 1: Check Your Website**
- Make sure you're on an **HTTPS website** (https://)
- The extension won't work on HTTP sites for security reasons
- Try: `https://meet.google.com`, `https://teams.microsoft.com`, or `https://zoom.us`

### ✅ **Step 2: Grant Microphone Permission**
1. Click the extension icon
2. Click "Start Recording"
3. When prompted, click **"Allow"** for microphone access
4. If you accidentally clicked "Block", see Step 3 below

### ✅ **Step 3: Fix Blocked Permissions**
1. Open Chrome Settings: `chrome://settings/content/microphone`
2. Find your website in the list
3. Click the dropdown next to it
4. Select **"Allow"**
5. Refresh the page and try again

### ✅ **Step 4: Check System Settings**
1. **Windows**: Right-click speaker icon → "Open Sound settings" → "Input" → Select your microphone
2. **Mac**: System Preferences → Security & Privacy → Microphone → Enable Chrome
3. **Linux**: Check your audio system settings

### ✅ **Step 5: Close Other Apps**
- Close any other applications using the microphone
- This includes: Zoom, Teams, Discord, Skype, etc.
- Only one app can use the microphone at a time

## 🔧 **Advanced Troubleshooting**

### **Check Extension Permissions**
1. Go to `chrome://extensions/`
2. Find "AI Meeting Assistant"
3. Click "Details"
4. Make sure "Microphone" permission is enabled

### **Reset Extension**
1. Go to `chrome://extensions/`
2. Find "AI Meeting Assistant"
3. Click "Remove"
4. Reload the extension from the developer mode

### **Check Browser Compatibility**
- ✅ Chrome 88+ (Recommended)
- ✅ Edge 88+
- ✅ Firefox 85+
- ❌ Safari (Not supported)

### **Test Microphone**
1. Go to `https://www.onlinemictest.com/`
2. Click "Test Microphone"
3. If it works there, the issue is with the extension
4. If it doesn't work, check your system settings

## 🚨 **Common Error Messages & Solutions**

### **"Microphone permission denied"**
- **Solution**: Click "Allow" when prompted, or enable in Chrome settings

### **"No microphone found"**
- **Solution**: Connect a microphone or check system audio settings

### **"Microphone access requires HTTPS"**
- **Solution**: Use the extension on an HTTPS website

### **"Microphone is being used by another application"**
- **Solution**: Close other apps using the microphone

### **"Microphone access not supported"**
- **Solution**: Use Chrome, Edge, or Firefox browser

## 📞 **Still Having Issues?**

1. **Restart Chrome** completely
2. **Check Windows/Mac audio settings**
3. **Try a different microphone**
4. **Update Chrome** to the latest version
5. **Disable other extensions** temporarily

## 🎯 **Quick Test**

1. Go to `https://meet.google.com`
2. Click the extension icon
3. Click "Start Recording"
4. Click "Allow" when prompted
5. You should see "Microphone access granted!"

---

**Need more help?** Check the browser console (F12) for detailed error messages.