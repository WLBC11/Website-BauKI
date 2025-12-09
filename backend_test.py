#!/usr/bin/env python3
"""
Backend API Testing for ChatGPT Clone with N8N Integration
Tests all backend endpoints including N8N webhook integration
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://baulaw-chat.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.conversation_id = None
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        
    def test_root_endpoint(self):
        """Test GET /api/ endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Hello World":
                    self.log_test("GET /api/", True, "Returns correct hello world message")
                    return True
                else:
                    self.log_test("GET /api/", False, f"Unexpected message: {data}", data)
                    return False
            else:
                self.log_test("GET /api/", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("GET /api/", False, f"Request failed: {str(e)}")
            return False
    
    def test_chat_endpoint(self):
        """Test POST /api/chat endpoint with N8N webhook"""
        try:
            # Test data
            test_message = "Hello, how are you today? This is a test message from the ChatGPT clone."
            
            payload = {
                "message": test_message
            }
            
            print(f"Sending chat message: {test_message}")
            response = self.session.post(
                f"{API_BASE}/chat",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["response", "conversation_id", "message_id"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("POST /api/chat", False, f"Missing fields: {missing_fields}", data)
                    return False
                
                # Store conversation_id for later tests
                self.conversation_id = data["conversation_id"]
                
                # Validate response content
                if data["response"] and len(data["response"]) > 0:
                    self.log_test("POST /api/chat", True, 
                                f"N8N webhook integration working. Response length: {len(data['response'])} chars")
                    print(f"   AI Response: {data['response'][:100]}...")
                    return True
                else:
                    self.log_test("POST /api/chat", False, "Empty response from N8N webhook", data)
                    return False
                    
            else:
                self.log_test("POST /api/chat", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("POST /api/chat", False, "Request timeout - N8N webhook may be slow/unavailable")
            return False
        except Exception as e:
            self.log_test("POST /api/chat", False, f"Request failed: {str(e)}")
            return False
    
    def test_chat_with_conversation_id(self):
        """Test POST /api/chat with existing conversation_id"""
        if not self.conversation_id:
            self.log_test("POST /api/chat (existing conv)", False, "No conversation_id from previous test")
            return False
            
        try:
            payload = {
                "message": "Can you tell me more about that?",
                "conversation_id": self.conversation_id
            }
            
            response = self.session.post(
                f"{API_BASE}/chat",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Should return same conversation_id
                if data.get("conversation_id") == self.conversation_id:
                    self.log_test("POST /api/chat (existing conv)", True, 
                                "Conversation continuity maintained")
                    return True
                else:
                    self.log_test("POST /api/chat (existing conv)", False, 
                                f"Conversation ID mismatch: expected {self.conversation_id}, got {data.get('conversation_id')}")
                    return False
            else:
                self.log_test("POST /api/chat (existing conv)", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("POST /api/chat (existing conv)", False, f"Request failed: {str(e)}")
            return False
    
    def test_conversations_endpoint(self):
        """Test GET /api/conversations endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/conversations")
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if our conversation is in the list
                        if self.conversation_id:
                            conv_found = any(conv.get("id") == self.conversation_id for conv in data)
                            if conv_found:
                                self.log_test("GET /api/conversations", True, 
                                            f"Found {len(data)} conversations including test conversation")
                            else:
                                self.log_test("GET /api/conversations", False, 
                                            f"Test conversation {self.conversation_id} not found in {len(data)} conversations")
                                return False
                        else:
                            self.log_test("GET /api/conversations", True, f"Found {len(data)} conversations")
                    else:
                        self.log_test("GET /api/conversations", True, "No conversations found (empty list)")
                    return True
                else:
                    self.log_test("GET /api/conversations", False, f"Expected list, got {type(data)}", data)
                    return False
            else:
                self.log_test("GET /api/conversations", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("GET /api/conversations", False, f"Request failed: {str(e)}")
            return False
    
    def test_specific_conversation(self):
        """Test GET /api/conversations/{id} endpoint"""
        if not self.conversation_id:
            self.log_test("GET /api/conversations/{id}", False, "No conversation_id available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/conversations/{self.conversation_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check conversation structure
                required_fields = ["id", "title", "messages", "created_at", "updated_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("GET /api/conversations/{id}", False, f"Missing fields: {missing_fields}", data)
                    return False
                
                # Check messages
                if isinstance(data["messages"], list) and len(data["messages"]) >= 2:
                    self.log_test("GET /api/conversations/{id}", True, 
                                f"Conversation retrieved with {len(data['messages'])} messages")
                    return True
                else:
                    self.log_test("GET /api/conversations/{id}", False, 
                                f"Expected at least 2 messages, got {len(data.get('messages', []))}")
                    return False
            else:
                self.log_test("GET /api/conversations/{id}", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("GET /api/conversations/{id}", False, f"Request failed: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test error handling scenarios"""
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Invalid conversation ID
        total_tests += 1
        try:
            response = self.session.get(f"{API_BASE}/conversations/invalid-id-12345")
            if response.status_code == 404:
                self.log_test("Error handling (invalid conv ID)", True, "Returns 404 for invalid conversation ID")
                tests_passed += 1
            else:
                self.log_test("Error handling (invalid conv ID)", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Error handling (invalid conv ID)", False, f"Request failed: {str(e)}")
        
        # Test 2: Empty message
        total_tests += 1
        try:
            response = self.session.post(f"{API_BASE}/chat", json={"message": ""})
            # Should either work (empty message) or return appropriate error
            if response.status_code in [200, 400, 422]:
                self.log_test("Error handling (empty message)", True, f"Handles empty message appropriately (HTTP {response.status_code})")
                tests_passed += 1
            else:
                self.log_test("Error handling (empty message)", False, f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_test("Error handling (empty message)", False, f"Request failed: {str(e)}")
        
        # Test 3: Invalid JSON
        total_tests += 1
        try:
            response = self.session.post(f"{API_BASE}/chat", data="invalid json", 
                                       headers={"Content-Type": "application/json"})
            if response.status_code in [400, 422]:
                self.log_test("Error handling (invalid JSON)", True, f"Handles invalid JSON appropriately (HTTP {response.status_code})")
                tests_passed += 1
            else:
                self.log_test("Error handling (invalid JSON)", False, f"Expected 400/422, got {response.status_code}")
        except Exception as e:
            self.log_test("Error handling (invalid JSON)", False, f"Request failed: {str(e)}")
        
        return tests_passed == total_tests
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("BACKEND API TESTING - ChatGPT Clone with N8N Integration")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print()
        
        # Run tests in order
        tests = [
            ("Root Endpoint", self.test_root_endpoint),
            ("Chat Endpoint (N8N Integration)", self.test_chat_endpoint),
            ("Chat with Existing Conversation", self.test_chat_with_conversation_id),
            ("Conversations List", self.test_conversations_endpoint),
            ("Specific Conversation", self.test_specific_conversation),
            ("Error Handling", self.test_error_handling)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n--- Testing: {test_name} ---")
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name}: Unexpected error - {str(e)}")
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Check details above.")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Print detailed results for debugging
    print("\n" + "=" * 60)
    print("DETAILED TEST RESULTS")
    print("=" * 60)
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['details']}")
        if result['response_data'] and not result["success"]:
            print(f"   Response: {str(result['response_data'])[:200]}...")
    
    exit(0 if success else 1)