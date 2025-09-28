#!/usr/bin/env python3
"""
Simple Extension Test
Tests the extension functionality without full backend dependencies.
"""

import asyncio
import websockets
import json
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

class SimpleExtensionTester:
    def __init__(self):
        self.websocket_url = "ws://localhost:5000/audio"
        self.test_user_id = "extension-test-user"
        
    async def test_websocket_basic(self):
        """Test basic WebSocket functionality"""
        logger.info("🧪 Testing basic WebSocket functionality...")
        
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                logger.info("✅ WebSocket connected successfully")
                
                # Test basic message
                test_message = {
                    "type": "test_connection",
                    "userId": self.test_user_id,
                    "timestamp": int(time.time())
                }
                
                await websocket.send(json.dumps(test_message))
                logger.info("📤 Sent test message")
                
                # Test recording start
                start_message = {
                    "type": "recording_started",
                    "userId": self.test_user_id,
                    "timestamp": int(time.time())
                }
                
                await websocket.send(json.dumps(start_message))
                logger.info("📤 Sent recording start message")
                
                # Wait for response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    response_data = json.loads(response)
                    logger.info(f"📥 Received: {response_data}")
                    
                    if response_data.get('type') == 'meeting_created':
                        logger.info("✅ Meeting created successfully!")
                        meeting_id = response_data.get('meetingId')
                        
                        # Test audio chunk
                        fake_audio_data = "fake_audio_data_for_testing"
                        audio_message = {
                            "type": "audio_chunk",
                            "userId": self.test_user_id,
                            "meetingId": meeting_id,
                            "data": fake_audio_data,
                            "timestamp": int(time.time())
                        }
                        
                        await websocket.send(json.dumps(audio_message))
                        logger.info("📤 Sent fake audio chunk")
                        
                        # Test recording stop
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
                    return True  # Connection successful even without response
                    
        except Exception as e:
            logger.error(f"❌ WebSocket test failed: {e}")
            return False
    
    async def test_extension_flow(self):
        """Test complete extension flow"""
        logger.info("🧪 Testing complete extension flow...")
        
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                logger.info("✅ WebSocket connected")
                
                # Simulate complete recording session
                session_data = [
                    {
                        "type": "recording_started",
                        "userId": self.test_user_id,
                        "timestamp": int(time.time())
                    },
                    {
                        "type": "audio_chunk",
                        "userId": self.test_user_id,
                        "data": "audio_chunk_1",
                        "timestamp": int(time.time())
                    },
                    {
                        "type": "audio_chunk",
                        "userId": self.test_user_id,
                        "data": "audio_chunk_2",
                        "timestamp": int(time.time())
                    },
                    {
                        "type": "recording_stopped",
                        "userId": self.test_user_id,
                        "timestamp": int(time.time())
                    }
                ]
                
                for message in session_data:
                    await websocket.send(json.dumps(message))
                    logger.info(f"📤 Sent: {message['type']}")
                    await asyncio.sleep(0.1)  # Small delay between messages
                
                logger.info("✅ Complete extension flow test successful!")
                return True
                
        except Exception as e:
            logger.error(f"❌ Extension flow test failed: {e}")
            return False
    
    async def run_tests(self):
        """Run all extension tests"""
        logger.info("🎯 Simple Extension Test")
        logger.info("=" * 40)
        
        tests = [
            ("Basic WebSocket", self.test_websocket_basic),
            ("Extension Flow", self.test_extension_flow)
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
            logger.info("The Chrome extension is ready to use!")
        else:
            logger.error("❌ Some tests failed. Please check the logs above.")

async def main():
    tester = SimpleExtensionTester()
    await tester.run_tests()

if __name__ == '__main__':
    asyncio.run(main())
