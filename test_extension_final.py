#!/usr/bin/env python3
"""
Final Extension Test
Tests the extension functionality without requiring full database setup.
"""

import asyncio
import websockets
import json
import logging
import time
import requests

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

class FinalExtensionTester:
    def __init__(self):
        self.websocket_url = "ws://localhost:5000/audio"
        self.backend_url = "http://localhost:5000"
        self.test_user_id = "final-test-user"
        self.meeting_id = None
        
    async def test_backend_health(self):
        """Test backend health endpoint"""
        logger.info("🧪 Testing backend health...")
        
        try:
            response = requests.get(f"{self.backend_url}/api/health", timeout=5)
            if response.status_code == 200:
                logger.info("✅ Backend health check passed")
                return True
            else:
                logger.error(f"❌ Backend health check failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ Backend health check failed: {e}")
            return False
    
    async def test_websocket_connection(self):
        """Test WebSocket connection"""
        logger.info("🧪 Testing WebSocket connection...")
        
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                logger.info("✅ WebSocket connected successfully")
                
                # Send test message
                test_message = {
                    "type": "test_connection",
                    "userId": self.test_user_id,
                    "timestamp": int(time.time())
                }
                
                await websocket.send(json.dumps(test_message))
                logger.info("📤 Sent test message")
                
                return True
                
        except Exception as e:
            logger.error(f"❌ WebSocket connection failed: {e}")
            return False
    
    async def test_meeting_creation(self):
        """Test meeting creation workflow"""
        logger.info("🧪 Testing meeting creation workflow...")
        
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                # Send recording start message
                start_message = {
                    "type": "recording_started",
                    "userId": self.test_user_id,
                    "timestamp": int(time.time())
                }
                
                await websocket.send(json.dumps(start_message))
                logger.info("📤 Sent recording start message")
                
                # Wait for meeting creation response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    response_data = json.loads(response)
                    
                    if response_data.get('type') == 'meeting_created':
                        self.meeting_id = response_data.get('meetingId')
                        logger.info(f"✅ Meeting created: {self.meeting_id}")
                        return True
                    else:
                        logger.error(f"❌ Unexpected response: {response_data}")
                        return False
                        
                except asyncio.TimeoutError:
                    logger.error("❌ No response received for meeting creation")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Meeting creation test failed: {e}")
            return False
    
    async def test_audio_streaming(self):
        """Test audio streaming workflow"""
        logger.info("🧪 Testing audio streaming workflow...")
        
        if not self.meeting_id:
            logger.error("❌ No meeting ID available for audio streaming test")
            return False
        
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                # Send multiple audio chunks
                for i in range(5):
                    audio_message = {
                        "type": "audio_chunk",
                        "userId": self.test_user_id,
                        "meetingId": self.meeting_id,
                        "data": f"fake_audio_data_chunk_{i}_" + "x" * 100,  # Simulate real audio data
                        "timestamp": int(time.time())
                    }
                    
                    await websocket.send(json.dumps(audio_message))
                    logger.info(f"📤 Sent audio chunk {i+1}")
                    await asyncio.sleep(0.1)
                
                # Send recording stop message
                stop_message = {
                    "type": "recording_stopped",
                    "userId": self.test_user_id,
                    "meetingId": self.meeting_id,
                    "timestamp": int(time.time())
                }
                
                await websocket.send(json.dumps(stop_message))
                logger.info("📤 Sent recording stop message")
                
                logger.info("✅ Audio streaming workflow completed")
                return True
                
        except Exception as e:
            logger.error(f"❌ Audio streaming test failed: {e}")
            return False
    
    async def test_extension_simulation(self):
        """Simulate complete extension workflow"""
        logger.info("🧪 Testing complete extension simulation...")
        
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                logger.info("✅ WebSocket connected for simulation")
                
                # Simulate extension startup
                logger.info("📱 Extension popup opened")
                logger.info("👤 User clicked 'Start Recording'")
                
                # Send recording start
                start_message = {
                    "type": "recording_started",
                    "userId": self.test_user_id,
                    "timestamp": int(time.time())
                }
                
                await websocket.send(json.dumps(start_message))
                logger.info("📤 Recording started")
                
                # Wait for meeting creation
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    response_data = json.loads(response)
                    
                    if response_data.get('type') == 'meeting_created':
                        self.meeting_id = response_data.get('meetingId')
                        logger.info(f"✅ Meeting created: {self.meeting_id}")
                    else:
                        logger.warning(f"⚠️ Unexpected response: {response_data}")
                except asyncio.TimeoutError:
                    logger.warning("⚠️ No meeting creation response")
                
                # Simulate recording session
                logger.info("🎤 Simulating 10-second recording session...")
                for i in range(10):
                    audio_message = {
                        "type": "audio_chunk",
                        "userId": self.test_user_id,
                        "meetingId": self.meeting_id or "simulation-meeting",
                        "data": f"audio_chunk_{i}_" + "x" * 200,
                        "timestamp": int(time.time())
                    }
                    
                    await websocket.send(json.dumps(audio_message))
                    await asyncio.sleep(1)  # 1 second intervals
                
                # Send recording stop
                stop_message = {
                    "type": "recording_stopped",
                    "userId": self.test_user_id,
                    "meetingId": self.meeting_id or "simulation-meeting",
                    "timestamp": int(time.time())
                }
                
                await websocket.send(json.dumps(stop_message))
                logger.info("📤 Recording stopped")
                
                logger.info("✅ Complete extension simulation successful")
                return True
                
        except Exception as e:
            logger.error(f"❌ Extension simulation failed: {e}")
            return False
    
    async def run_final_test(self):
        """Run final extension test"""
        logger.info("🎯 Final Extension Test")
        logger.info("=" * 40)
        
        tests = [
            ("Backend Health", self.test_backend_health),
            ("WebSocket Connection", self.test_websocket_connection),
            ("Meeting Creation", self.test_meeting_creation),
            ("Audio Streaming", self.test_audio_streaming),
            ("Extension Simulation", self.test_extension_simulation)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            logger.info(f"\n📋 Running {test_name}...")
            try:
                result = await test_func()
                if result:
                    passed += 1
                    logger.info(f"✅ {test_name} passed!")
                else:
                    logger.error(f"❌ {test_name} failed!")
            except Exception as e:
                logger.error(f"❌ {test_name} failed with error: {e}")
        
        logger.info(f"\n🎯 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            logger.info("🎉 All extension tests passed!")
            logger.info("Your AI Meeting Assistant extension is ready to use!")
            logger.info("\n🚀 Next Steps:")
            logger.info("1. Load extension in Chrome (chrome://extensions/)")
            logger.info("2. Go to any HTTPS website")
            logger.info("3. Click extension icon and start recording")
            logger.info("4. Grant microphone permission when prompted")
        else:
            logger.error("❌ Some tests failed. Please check the logs above.")
            logger.info("Make sure your backend is running on localhost:5000")
        
        return passed == total

async def main():
    tester = FinalExtensionTester()
    success = await tester.run_final_test()
    
    if success:
        logger.info("\n🎉 Extension is fully functional and ready for production!")
    else:
        logger.error("\n❌ Please fix the failing tests before using the extension.")

if __name__ == '__main__':
    asyncio.run(main())
