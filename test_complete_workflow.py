#!/usr/bin/env python3
"""
Complete Extension Workflow Test
Tests the entire extension workflow from backend to database.
"""

import asyncio
import websockets
import json
import logging
import time
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

class CompleteWorkflowTester:
    def __init__(self):
        self.websocket_url = "ws://localhost:5000/audio"
        self.backend_url = "http://localhost:5000"
        self.test_user_id = "complete-workflow-test-user"
        self.meeting_id = None
        
        # Database connection - use Neon PostgreSQL
        self.database_url = os.getenv('DATABASE_URL', 'postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require')
        
    def get_db_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(self.database_url)
            return conn
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return None
    
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
    
    async def test_database_connection(self):
        """Test database connection"""
        logger.info("🧪 Testing database connection...")
        
        try:
            conn = self.get_db_connection()
            if not conn:
                logger.error("❌ Database connection failed")
                return False
            
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                
            conn.close()
            logger.info("✅ Database connection successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
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
                for i in range(3):
                    audio_message = {
                        "type": "audio_chunk",
                        "userId": self.test_user_id,
                        "meetingId": self.meeting_id,
                        "data": f"fake_audio_data_chunk_{i}",
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
    
    async def test_database_storage(self):
        """Test database storage"""
        logger.info("🧪 Testing database storage...")
        
        if not self.meeting_id:
            logger.error("❌ No meeting ID available for database test")
            return False
        
        try:
            conn = self.get_db_connection()
            if not conn:
                logger.error("❌ Database connection failed")
                return False
            
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Check if meeting exists
                cursor.execute("SELECT * FROM meetings WHERE id = %s", (self.meeting_id,))
                meeting = cursor.fetchone()
                
                if meeting:
                    logger.info(f"✅ Meeting found in database: {meeting['title']}")
                    logger.info(f"   Status: {meeting['status']}")
                    logger.info(f"   User ID: {meeting['user_id']}")
                    logger.info(f"   Created: {meeting['created_at']}")
                    return True
                else:
                    logger.error("❌ Meeting not found in database")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Database storage test failed: {e}")
            return False
        finally:
            if conn:
                conn.close()
    
    async def test_user_creation(self):
        """Test user creation in database"""
        logger.info("🧪 Testing user creation...")
        
        try:
            conn = self.get_db_connection()
            if not conn:
                logger.error("❌ Database connection failed")
                return False
            
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Check if test user exists
                cursor.execute("SELECT * FROM users WHERE id = %s", (self.test_user_id,))
                user = cursor.fetchone()
                
                if user:
                    logger.info(f"✅ Test user found: {user['name']} ({user['email']})")
                    return True
                else:
                    # Create test user
                    cursor.execute("""
                        INSERT INTO users (id, name, email, role, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        self.test_user_id,
                        "Test User",
                        "test@example.com",
                        "user",
                        "now()",
                        "now()"
                    ))
                    conn.commit()
                    logger.info("✅ Test user created in database")
                    return True
                    
        except Exception as e:
            logger.error(f"❌ User creation test failed: {e}")
            return False
        finally:
            if conn:
                conn.close()
    
    async def run_complete_test(self):
        """Run complete workflow test"""
        logger.info("🎯 Complete Extension Workflow Test")
        logger.info("=" * 50)
        
        tests = [
            ("Backend Health", self.test_backend_health),
            ("Database Connection", self.test_database_connection),
            ("WebSocket Connection", self.test_websocket_connection),
            ("User Creation", self.test_user_creation),
            ("Meeting Creation", self.test_meeting_creation),
            ("Audio Streaming", self.test_audio_streaming),
            ("Database Storage", self.test_database_storage)
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
            logger.info("🎉 Complete workflow test passed!")
            logger.info("Your AI Meeting Assistant extension is fully functional!")
        else:
            logger.error("❌ Some tests failed. Please check the logs above.")
            logger.info("Make sure your backend is running and database is accessible.")
        
        return passed == total

async def main():
    tester = CompleteWorkflowTester()
    success = await tester.run_complete_test()
    
    if success:
        logger.info("\n🚀 Ready to use your AI Meeting Assistant extension!")
        logger.info("1. Load extension in Chrome")
        logger.info("2. Go to any HTTPS website")
        logger.info("3. Click extension icon and start recording")
    else:
        logger.error("\n❌ Please fix the failing tests before using the extension.")

if __name__ == '__main__':
    asyncio.run(main())
