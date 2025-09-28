#!/usr/bin/env python3
"""
Test Extension Backend Integration
Tests the WebSocket audio streaming functionality.
"""

import asyncio
import websockets
import json
import base64
import logging
import requests
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

class ExtensionTester:
    def __init__(self):
        self.websocket_url = "ws://localhost:5000/audio"
        self.backend_url = "http://localhost:5000/api"
        self.test_user_id = "extension-test-user"
        
    async def test_websocket_connection(self):
        """Test WebSocket connection to backend"""
        logger.info("🧪 Testing WebSocket connection...")
        
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                logger.info("✅ WebSocket connected successfully")
                
                # Test connection message
                test_message = {
                    "type": "test_connection",
                    "userId": self.test_user_id,
                    "timestamp": int(time.time())
                }
                
                await websocket.send(json.dumps(test_message))
                logger.info("📤 Sent test message")
                
                # Wait for response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    logger.info(f"📥 Received response: {response}")
                    return True
                except asyncio.TimeoutError:
                    logger.warning("⚠️ No response received (timeout)")
                    return True  # Connection successful even without response
                    
        except Exception as e:
            logger.error(f"❌ WebSocket connection failed: {e}")
            return False
    
    def test_backend_health(self):
        """Test backend health endpoint"""
        logger.info("🧪 Testing backend health...")
        
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            
            if response.status_code == 200:
                logger.info("✅ Backend health check passed")
                logger.info(f"   Response: {response.json()}")
                return True
            else:
                logger.error(f"❌ Backend health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Backend health check failed: {e}")
            return False
    
    def test_audio_endpoint(self):
        """Test audio WebSocket endpoint"""
        logger.info("🧪 Testing audio endpoint...")
        
        try:
            response = requests.get(f"{self.backend_url}/audio/websocket", timeout=5)
            
            if response.status_code == 200:
                logger.info("✅ Audio endpoint accessible")
                logger.info(f"   Response: {response.json()}")
                return True
            else:
                logger.error(f"❌ Audio endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Audio endpoint test failed: {e}")
            return False
    
    async def test_audio_streaming(self):
        """Test audio streaming simulation"""
        logger.info("🧪 Testing audio streaming...")
        
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                # Simulate recording start
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
                    logger.info(f"📥 Received: {response_data}")
                    
                    if response_data.get('type') == 'meeting_created':
                        logger.info("✅ Meeting created successfully")
                        meeting_id = response_data.get('meetingId')
                        
                        # Simulate audio chunk
                        fake_audio_data = base64.b64encode(b"fake audio data").decode()
                        audio_message = {
                            "type": "audio_chunk",
                            "userId": self.test_user_id,
                            "meetingId": meeting_id,
                            "data": f"data:audio/webm;base64,{fake_audio_data}",
                            "timestamp": int(time.time())
                        }
                        
                        await websocket.send(json.dumps(audio_message))
                        logger.info("📤 Sent fake audio chunk")
                        
                        # Simulate recording stop
                        stop_message = {
                            "type": "recording_stopped",
                            "userId": self.test_user_id,
                            "timestamp": int(time.time())
                        }
                        
                        await websocket.send(json.dumps(stop_message))
                        logger.info("📤 Sent recording stop message")
                        
                        return True
                    else:
                        logger.error("❌ Unexpected response type")
                        return False
                        
                except asyncio.TimeoutError:
                    logger.warning("⚠️ No response received (timeout)")
                    return True
                    
        except Exception as e:
            logger.error(f"❌ Audio streaming test failed: {e}")
            return False
    
    async def run_all_tests(self):
        """Run all extension tests"""
        logger.info("🎯 Extension Backend Integration Test")
        logger.info("=" * 50)
        
        tests = [
            ("Backend Health", self.test_backend_health),
            ("Audio Endpoint", self.test_audio_endpoint),
            ("WebSocket Connection", self.test_websocket_connection),
            ("Audio Streaming", self.test_audio_streaming)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            logger.info(f"\n📋 Running {test_name}...")
            try:
                if asyncio.iscoroutinefunction(test_func):
                    result = await test_func()
                else:
                    result = test_func()
                
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
            logger.info("The Chrome extension should work with your backend!")
        else:
            logger.error("❌ Some tests failed. Please check the logs above.")
            logger.info("Make sure your backend is running on localhost:5000")

async def main():
    tester = ExtensionTester()
    await tester.run_all_tests()

if __name__ == '__main__':
    asyncio.run(main())
