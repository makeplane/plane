#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
V1 vs V2 API Comparison Test Suite

This script tests all migrated endpoints and compares V1 and V2 responses
to ensure backward compatibility and correctness.

Usage:
    python test_v1_v2_comparison.py --token <session_id> --workspace-id <uuid> [options]
"""

import argparse
import json
import sys
import io
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

import requests
from requests.exceptions import RequestException
from deepdiff import DeepDiff
from colorama import init, Fore, Style

# Initialize colorama for cross-platform colored output
init(autoreset=True)


class TestStatus(Enum):
    """Test result status"""

    PASS = "✅ PASS"
    FAIL = "❌ FAIL"
    SKIP = "⏭️  SKIP"
    ERROR = "⚠️  ERROR"


@dataclass
class TestResult:
    """Result of a single endpoint comparison test"""

    endpoint_name: str
    v1_url: str
    v2_url: str
    status: TestStatus
    message: str = ""
    differences: Optional[Dict] = None
    v1_response: Optional[Dict] = None
    v2_response: Optional[Dict] = None
    error: Optional[str] = None


@dataclass
class TestConfig:
    """Configuration for test execution"""

    base_url: str = "http://localhost:8002"
    session_token: Optional[str] = None
    workspace_id: Optional[str] = None
    chat_id: Optional[str] = None
    verbose: bool = False
    skip_streaming: bool = False
    skip_oauth: bool = False
    skip_webhooks: bool = True  # Skip by default (requires GitHub signature)
    created_resources: Dict[str, Any] = field(default_factory=dict)


class APITester:
    """Main test runner for V1/V2 API comparison"""

    def __init__(self, config: TestConfig):
        self.config = config
        self.results: List[TestResult] = []
        self.session = requests.Session()

        # Set default headers
        if config.session_token:
            self.session.cookies.set("plane-session-id", config.session_token)

    def _make_request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict] = None,
        data: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        files: Optional[Dict] = None,
        params: Optional[Dict] = None,
        stream: bool = False,
    ) -> Tuple[Optional[requests.Response], Optional[str]]:
        """Make HTTP request with error handling"""
        # Print request details if verbose
        if self.config.verbose:
            print(f"{Fore.CYAN}→ {method} {url}{Style.RESET_ALL}")
            if params:
                print(f"  Params: {json.dumps(params, indent=2)}")
            if json_data:
                print(f"  JSON: {json.dumps(json_data, indent=2)}")
            if headers:
                print(f"  Headers: {json.dumps(headers, indent=2)}")

        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                data=data,
                json=json_data,
                files=files,
                params=params,
                stream=stream,
                timeout=30,
            )

            # Print response status if verbose
            if self.config.verbose:
                print(f"  ← Status: {response.status_code}")

            return response, None
        except RequestException as e:
            return None, str(e)

    def _compare_responses(
        self,
        v1_data: Any,
        v2_data: Any,
        ignore_keys: Optional[List[str]] = None,
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Compare two response objects for equality.

        Args:
            v1_data: V1 API response data
            v2_data: V2 API response data
            ignore_keys: List of keys to ignore in comparison

        Returns:
            Tuple of (are_equal, differences)
        """
        if ignore_keys is None:
            ignore_keys = []

        # Add common keys to ignore (timestamps, IDs that might differ)
        default_ignore = [
            "created_at",
            "updated_at",
            "timestamp",
            "request_id",
        ]
        ignore_keys.extend(default_ignore)

        # Build exclude paths for both top-level and nested keys
        exclude_paths = [f"root['{key}']" for key in ignore_keys]

        # Also exclude these keys at any nesting level using regex
        exclude_regex_paths = [
            r"root\['attachment'\]\['id'\]",
            r"root\['attachment'\]\['attachment_id'\]",
            r"root\[.*\]\['created_at'\]",
            r"root\[.*\]\['updated_at'\]",
            r"root\[.*\]\['timestamp'\]",
        ]

        diff = DeepDiff(
            v1_data,
            v2_data,
            ignore_order=True,
            exclude_paths=exclude_paths,
            exclude_regex_paths=exclude_regex_paths,
        )

        are_equal = len(diff) == 0
        differences = dict(diff) if not are_equal else None

        return are_equal, differences

    def _add_result(self, result: TestResult):
        """Add test result and print status"""
        self.results.append(result)

        # Color-coded output
        if result.status == TestStatus.PASS:
            color = Fore.GREEN
        elif result.status == TestStatus.FAIL:
            color = Fore.RED
        elif result.status == TestStatus.SKIP:
            color = Fore.YELLOW
        else:
            color = Fore.MAGENTA

        print(f"{color}{result.status.value}{Style.RESET_ALL} {result.endpoint_name}")

        if result.message:
            print(f"  {result.message}")

        if self.config.verbose and result.differences:
            print(f"  Differences: {json.dumps(result.differences, indent=2)}")

    def test_health_check(self):
        """Test health check endpoint"""
        v1_url = f"{self.config.base_url}/api/v1/health/"
        v2_url = f"{self.config.base_url}/api/v2/health/"

        v1_resp, v1_err = self._make_request("GET", v1_url)
        v2_resp, v2_err = self._make_request("GET", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Health Check",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Health Check",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_list_models(self):
        """Test list AI models endpoint"""
        if not self.config.session_token:
            self._add_result(
                TestResult(
                    endpoint_name="List AI Models",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/get-models/"
        v2_url = f"{self.config.base_url}/api/v2/models/"

        v1_resp, v1_err = self._make_request("GET", v1_url)
        v2_resp, v2_err = self._make_request("GET", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="List AI Models",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="List AI Models",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_get_templates(self):
        """Test get chat templates endpoint"""
        if not self.config.session_token:
            self._add_result(
                TestResult(
                    endpoint_name="Get Chat Templates",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/get-templates/"
        v2_url = f"{self.config.base_url}/api/v2/templates/"

        v1_resp, v1_err = self._make_request("GET", v1_url)
        v2_resp, v2_err = self._make_request("GET", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Get Chat Templates",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Get Chat Templates",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_create_chat(self):
        """Test create chat endpoint"""
        if not self.config.session_token:
            self._add_result(
                TestResult(
                    endpoint_name="Create Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/initialize-chat/"
        v2_url = f"{self.config.base_url}/api/v2/chats/"

        payload = {
            "workspace_in_context": True,
            "is_project_chat": False,
        }

        # Add workspace_id if provided
        if self.config.workspace_id:
            payload["workspace_id"] = self.config.workspace_id

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)
        v2_resp, v2_err = self._make_request("POST", v2_url, json_data=payload)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Create Chat",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        # Store created chat IDs for cleanup
        if v1_data.get("chat_id"):
            self.config.created_resources["v1_chat_id"] = v1_data["chat_id"]
        if v2_data.get("chat_id"):
            self.config.created_resources["v2_chat_id"] = v2_data["chat_id"]
            # Use V2 chat for subsequent tests
            self.config.chat_id = v2_data["chat_id"]

        # Compare responses, ignoring chat_id (will be different)
        are_equal, differences = self._compare_responses(
            v1_data,
            v2_data,
            ignore_keys=["chat_id", "id"],
        )

        # Check status codes
        status_ok = v1_resp.status_code == 200 and v2_resp.status_code == 201

        self._add_result(
            TestResult(
                endpoint_name="Create Chat",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if (are_equal and status_ok) else TestStatus.FAIL,
                message=f"V1: {v1_resp.status_code}, V2: {v2_resp.status_code} (expected 200 → 201)",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_get_chat_history(self):
        """Test get chat history endpoint"""
        if not self.config.session_token or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Get Chat History",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token or chat ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/get-chat-history/"
        v2_url = f"{self.config.base_url}/api/v2/chats/{self.config.chat_id}"

        v1_resp, v1_err = self._make_request("GET", v1_url, params={"chat_id": self.config.chat_id})
        v2_resp, v2_err = self._make_request("GET", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Get Chat History",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Get Chat History",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_rename_chat(self):
        """Test rename chat endpoint"""
        if not self.config.session_token:
            self._add_result(
                TestResult(
                    endpoint_name="Rename Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token provided",
                )
            )
            return

        # Create two chats for this test
        create_url_v1 = f"{self.config.base_url}/api/v1/chat/initialize-chat/"
        create_url_v2 = f"{self.config.base_url}/api/v2/chats/"

        payload = {"workspace_in_context": True, "is_project_chat": False}
        if self.config.workspace_id:
            payload["workspace_id"] = self.config.workspace_id

        v1_create_resp, _ = self._make_request("POST", create_url_v1, json_data=payload)
        v2_create_resp, _ = self._make_request("POST", create_url_v2, json_data=payload)

        if not v1_create_resp or not v2_create_resp:
            self._add_result(
                TestResult(
                    endpoint_name="Rename Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="Could not create test chats",
                )
            )
            return

        v1_chat_id = v1_create_resp.json().get("chat_id")
        v2_chat_id = v2_create_resp.json().get("chat_id")

        # Test rename
        v1_url = f"{self.config.base_url}/api/v1/chat/rename-chat/"
        v2_url = f"{self.config.base_url}/api/v2/chats/{v2_chat_id}"

        new_title = "Test Chat Title"

        v1_payload = {"chat_id": v1_chat_id, "title": new_title}
        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=v1_payload)

        v2_resp, v2_err = self._make_request("PATCH", v2_url, params={"title": new_title})

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Rename Chat",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(
            v1_data,
            v2_data,
            ignore_keys=["chat_id", "id"],
        )

        self._add_result(
            TestResult(
                endpoint_name="Rename Chat",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

        # Cleanup
        self._make_request("DELETE", f"{self.config.base_url}/api/v2/chats/{v1_chat_id}")
        self._make_request("DELETE", f"{self.config.base_url}/api/v2/chats/{v2_chat_id}")

    def test_favorite_chat(self):
        """Test favorite/unfavorite chat endpoints"""
        if not self.config.session_token:
            self._add_result(
                TestResult(
                    endpoint_name="Favorite Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token provided",
                )
            )
            return

        # Create two chats
        create_url_v1 = f"{self.config.base_url}/api/v1/chat/initialize-chat/"
        create_url_v2 = f"{self.config.base_url}/api/v2/chats/"

        payload = {"workspace_in_context": True, "is_project_chat": False}
        if self.config.workspace_id:
            payload["workspace_id"] = self.config.workspace_id

        v1_create_resp, _ = self._make_request("POST", create_url_v1, json_data=payload)
        v2_create_resp, _ = self._make_request("POST", create_url_v2, json_data=payload)

        if not v1_create_resp or not v2_create_resp:
            self._add_result(
                TestResult(
                    endpoint_name="Favorite Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="Could not create test chats",
                )
            )
            return

        v1_chat_id = v1_create_resp.json().get("chat_id")
        v2_chat_id = v2_create_resp.json().get("chat_id")

        # Test favorite
        v1_url = f"{self.config.base_url}/api/v1/chat/favorite-chat/"
        v2_url = f"{self.config.base_url}/api/v2/chats/{v2_chat_id}/favorite"

        v1_payload = {"chat_id": v1_chat_id}
        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=v1_payload)
        v2_resp, v2_err = self._make_request("POST", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Favorite Chat",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(
            v1_data,
            v2_data,
            ignore_keys=["chat_id", "id"],
        )

        self._add_result(
            TestResult(
                endpoint_name="Favorite Chat",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

        # Cleanup
        self._make_request("DELETE", f"{self.config.base_url}/api/v2/chats/{v1_chat_id}")
        self._make_request("DELETE", f"{self.config.base_url}/api/v2/chats/{v2_chat_id}")

    def test_list_conversations(self):
        """Test list conversations endpoint"""
        if not self.config.session_token or not self.config.workspace_id:
            self._add_result(
                TestResult(
                    endpoint_name="List Conversations",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token or workspace ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/get-recent-user-threads/"
        v2_url = f"{self.config.base_url}/api/v2/conversations/"

        params = {"workspace_id": self.config.workspace_id}

        v1_resp, v1_err = self._make_request("GET", v1_url, params=params)
        v2_resp, v2_err = self._make_request("GET", v2_url, params=params)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="List Conversations",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="List Conversations",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_delete_chat(self):
        """Test delete chat endpoint"""
        if not self.config.session_token:
            self._add_result(
                TestResult(
                    endpoint_name="Delete Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token provided",
                )
            )
            return

        # Create two chats to delete
        create_url_v1 = f"{self.config.base_url}/api/v1/chat/initialize-chat/"
        create_url_v2 = f"{self.config.base_url}/api/v2/chats/"

        payload = {"workspace_in_context": True, "is_project_chat": False}
        if self.config.workspace_id:
            payload["workspace_id"] = self.config.workspace_id

        v1_create_resp, _ = self._make_request("POST", create_url_v1, json_data=payload)
        v2_create_resp, _ = self._make_request("POST", create_url_v2, json_data=payload)

        if not v1_create_resp or not v2_create_resp:
            self._add_result(
                TestResult(
                    endpoint_name="Delete Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="Could not create test chats",
                )
            )
            return

        v1_chat_id = v1_create_resp.json().get("chat_id")
        v2_chat_id = v2_create_resp.json().get("chat_id")

        # Test delete
        v1_url = f"{self.config.base_url}/api/v1/chat/delete-chat/"
        v2_url = f"{self.config.base_url}/api/v2/chats/{v2_chat_id}"

        v1_payload = {"chat_id": v1_chat_id}
        v1_resp, v1_err = self._make_request("DELETE", v1_url, json_data=v1_payload)
        v2_resp, v2_err = self._make_request("DELETE", v2_url)
        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Delete Chat",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}
        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Delete Chat",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_unfavorite_chat(self):
        """Test unfavorite chat endpoint"""
        if not self.config.session_token:
            self._add_result(
                TestResult(
                    endpoint_name="Unfavorite Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token provided",
                )
            )
            return

        # Create and favorite a chat first
        v1_create_url = f"{self.config.base_url}/api/v1/chat/initialize-chat/"
        v2_create_url = f"{self.config.base_url}/api/v2/chats/"

        create_payload = {
            "workspace_in_context": True,
            "is_project_chat": False,
        }
        if self.config.workspace_id:
            create_payload["workspace_id"] = self.config.workspace_id

        v1_create_resp, _ = self._make_request("POST", v1_create_url, json_data=create_payload)
        v2_create_resp, _ = self._make_request("POST", v2_create_url, json_data=create_payload)

        if not v1_create_resp or not v2_create_resp:
            self._add_result(
                TestResult(
                    endpoint_name="Unfavorite Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="Could not create test chats",
                )
            )
            return

        v1_chat_id = v1_create_resp.json().get("chat_id")
        v2_chat_id = v2_create_resp.json().get("chat_id")

        # Favorite them first
        v1_fav_url = f"{self.config.base_url}/api/v1/chat/favorite-chat/"
        v2_fav_url = f"{self.config.base_url}/api/v2/chats/{v2_chat_id}/favorite"

        self._make_request("POST", v1_fav_url, json_data={"chat_id": v1_chat_id})
        self._make_request("POST", v2_fav_url)

        # Now unfavorite them
        v1_url = f"{self.config.base_url}/api/v1/chat/unfavorite-chat/"
        v2_url = f"{self.config.base_url}/api/v2/chats/{v2_chat_id}/favorite"

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data={"chat_id": v1_chat_id})
        v2_resp, v2_err = self._make_request("DELETE", v2_url)

        # Cleanup
        self._make_request("DELETE", f"{self.config.base_url}/api/v1/chat/delete-chat/", json_data={"chat_id": v1_chat_id})
        self._make_request("DELETE", f"{self.config.base_url}/api/v2/chats/{v2_chat_id}")

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Unfavorite Chat",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Unfavorite Chat",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_list_favorite_chats(self):
        """Test list favorite chats endpoint"""
        if not self.config.session_token:
            self._add_result(
                TestResult(
                    endpoint_name="List Favorite Chats",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/get-favorite-chats/"
        v2_url = f"{self.config.base_url}/api/v2/chats/favorites/list"

        v1_resp, v1_err = self._make_request("GET", v1_url)
        v2_resp, v2_err = self._make_request("GET", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="List Favorite Chats",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="List Favorite Chats",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_search_chats(self):
        """Test search chats endpoint"""
        if not self.config.session_token or not self.config.workspace_id:
            self._add_result(
                TestResult(
                    endpoint_name="Search Chats",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token or workspace ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/search/"
        v2_url = f"{self.config.base_url}/api/v2/chats/search"

        v1_params = {"query": "test", "workspace_id": self.config.workspace_id}
        v2_params = {"q": "test", "workspace_id": self.config.workspace_id}

        v1_resp, v1_err = self._make_request("GET", v1_url, params=v1_params)
        v2_resp, v2_err = self._make_request("GET", v2_url, params=v2_params)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Search Chats",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Search Chats",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_paginated_conversations(self):
        """Test paginated conversations endpoint"""
        if not self.config.session_token or not self.config.workspace_id:
            self._add_result(
                TestResult(
                    endpoint_name="Paginated Conversations",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token or workspace ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/get-user-threads/"
        v2_url = f"{self.config.base_url}/api/v2/conversations/paginated/"

        params = {"workspace_id": self.config.workspace_id, "per_page": 20}

        v1_resp, v1_err = self._make_request("GET", v1_url, params=params)
        v2_resp, v2_err = self._make_request("GET", v2_url, params=params)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Paginated Conversations",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Paginated Conversations",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_submit_feedback(self):
        """Test submit feedback endpoint"""
        if not self.config.session_token or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Submit Feedback",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token or chat ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/feedback/"
        v2_url = f"{self.config.base_url}/api/v2/feedback/"

        payload = {"chat_id": self.config.chat_id, "message_index": 0, "feedback": {"value": 1}}

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)
        v2_resp, v2_err = self._make_request("POST", v2_url, json_data=payload)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Submit Feedback",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Submit Feedback",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_generate_title(self):
        """Test generate title endpoint"""
        if not self.config.session_token or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Generate Title",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token or chat ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat/generate-title/"
        v2_url = f"{self.config.base_url}/api/v2/titles/"

        payload = {"chat_id": self.config.chat_id}

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)
        v2_resp, v2_err = self._make_request("POST", v2_url, json_data=payload)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Generate Title",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Generate Title",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_search_duplicate_issues(self):
        """Test search duplicate issues endpoint"""
        if not self.config.session_token or not self.config.workspace_id:
            self._add_result(
                TestResult(
                    endpoint_name="Search Duplicate Issues",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token or workspace ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/dupes/issues/"
        v2_url = f"{self.config.base_url}/api/v2/dupes/"

        payload = {"issue_title": "Test bug", "issue_description": "This is a test", "workspace_id": self.config.workspace_id, "top_k": 5}

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)
        v2_resp, v2_err = self._make_request("POST", v2_url, json_data=payload)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Search Duplicate Issues",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="Search Duplicate Issues",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_duplicate_issue_feedback(self):
        """Test duplicate issue feedback endpoint"""
        if not self.config.session_token or not self.config.workspace_id:
            self._add_result(
                TestResult(
                    endpoint_name="Duplicate Issue Feedback",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token or workspace ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/dupes/issues/feedback/"
        v2_url = f"{self.config.base_url}/api/v2/dupes/feedback"

        try:
            import uuid

            payload = {
                "workspace_id": self.config.workspace_id,
                "issue_id": str(uuid.uuid4()),  # Test with dummy issue ID
                "duplicate_issue_id": str(uuid.uuid4()),  # Test with dummy duplicate ID
                "feedback_type": "helpful",
                "relevance_score": 0.8,
            }

            v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)
            v2_resp, v2_err = self._make_request("POST", v2_url, json_data=payload)

            if v1_err or v2_err:
                self._add_result(
                    TestResult(
                        endpoint_name="Duplicate Issue Feedback",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.ERROR,
                        error=v1_err or v2_err,
                    )
                )
                return

            if not v1_resp or not v2_resp:
                self._add_result(
                    TestResult(
                        endpoint_name="Duplicate Issue Feedback",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.ERROR,
                        error="Missing response from one or both endpoints",
                    )
                )
                return

            v1_data = v1_resp.json()
            v2_data = v2_resp.json()

            # Check status codes
            v1_status = v1_resp.status_code
            v2_status = v2_resp.status_code

            # Check for success (V1: 200, V2: 201)
            v1_success = v1_status == 200
            v2_success = v2_status == 201

            # Check for consistent error handling (both return same error status)
            v1_error = v1_status in [404, 422, 500]
            v2_error = v2_status in [404, 422, 500]
            status_match = v1_status == v2_status

            if v1_success and v2_success:
                # Both succeeded - compare responses
                are_equal, differences = self._compare_responses(v1_data, v2_data)

                self._add_result(
                    TestResult(
                        endpoint_name="Duplicate Issue Feedback",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                        message=f"V1: {v1_status}, V2: {v2_status} (expected 200 → 201)",
                        differences=differences,
                        v1_response=v1_data,
                        v2_response=v2_data,
                    )
                )
            elif v1_error and v2_error and status_match:
                # Both failed with same error code - consistent error handling (PASS)
                _, differences = self._compare_responses(v1_data, v2_data)
                has_detail = "detail" in v1_data and "detail" in v2_data
                detail_match = v1_data.get("detail") == v2_data.get("detail")

                self._add_result(
                    TestResult(
                        endpoint_name="Duplicate Issue Feedback",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.PASS if (has_detail and detail_match) else TestStatus.FAIL,
                        message=(f"V1: {v1_status}, V2: {v2_status} - Consistent error handling: {'✓' if detail_match else '✗'}"),
                        differences=differences,
                        v1_response=v1_data,
                        v2_response=v2_data,
                    )
                )
            else:
                # Inconsistent behavior
                self._add_result(
                    TestResult(
                        endpoint_name="Duplicate Issue Feedback",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.FAIL,
                        message=f"Inconsistent behavior: V1: {v1_status}, V2: {v2_status}",
                        differences={"status_mismatch": {"v1": v1_status, "v2": v2_status}},
                        v1_response=v1_data,
                        v2_response=v2_data,
                    )
                )

        except Exception as e:
            self._add_result(
                TestResult(
                    endpoint_name="Duplicate Issue Feedback",
                    v1_url=v1_url if "v1_url" in locals() else "",
                    v2_url=v2_url if "v2_url" in locals() else "",
                    status=TestStatus.ERROR,
                    error=f"Test exception: {str(e)}",
                )
            )

    def test_create_attachment(self):
        """Test create attachment endpoint (negative test - validates security scan)"""
        if not self.config.session_token or not self.config.workspace_id or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Create Attachment",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token, workspace ID, or chat ID provided",
                )
            )
            return

        try:
            # Create test file content (minimal PNG - will be rejected by security scan)
            # This serves as a negative test to verify both endpoints reject invalid files consistently
            test_content = (
                b"\x89PNG\r\n\x1a\n"  # PNG signature
                b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
                b"\x08\x02\x00\x00\x00\x90wS\xde"
                b"\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
                b"\x00\x00\x00\x00IEND\xaeB`\x82"
            )
            test_filename = "test-attachment.png"
            test_content_type = "image/png"

            v1_url = f"{self.config.base_url}/api/v1/attachments/upload-attachment/"
            v2_url = f"{self.config.base_url}/api/v2/attachments/"

            # Both V1 and V2 now accept file uploads with form data
            v1_files = {"file": (test_filename, io.BytesIO(test_content), test_content_type)}
            v1_data_fields = {
                "workspace_id": self.config.workspace_id,
                "chat_id": self.config.chat_id,
            }

            v2_files = {"file": (test_filename, io.BytesIO(test_content), test_content_type)}
            v2_data_fields = {
                "workspace_id": self.config.workspace_id,
                "chat_id": self.config.chat_id,
            }

            v1_resp, v1_err = self._make_request("POST", v1_url, data=v1_data_fields, files=v1_files)
            v2_resp, v2_err = self._make_request("POST", v2_url, data=v2_data_fields, files=v2_files)

            if v1_err or v2_err:
                self._add_result(
                    TestResult(
                        endpoint_name="Create Attachment",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.ERROR,
                        error=v1_err or v2_err,
                    )
                )
                return

            v1_data = v1_resp.json() if v1_resp else {}
            v2_data = v2_resp.json() if v2_resp else {}

            # Check if both rejected the file (negative test - expected behavior)
            v1_rejected = v1_resp.status_code == 400
            v2_rejected = v2_resp.status_code == 400

            if v1_rejected and v2_rejected:
                # Both rejected the invalid file - this is PASS (consistent error handling)
                v1_error_msg = v1_data.get("detail", "")
                v2_error_msg = v2_data.get("detail", "")

                # Check if error messages are similar (both should mention file rejection)
                error_match = v1_error_msg == v2_error_msg

                self._add_result(
                    TestResult(
                        endpoint_name="Create Attachment",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.PASS if error_match else TestStatus.FAIL,
                        message=f"Negative test: Both rejected invalid file(V1: 400, V2: 400) - Error match: {'✓' if error_match else '✗'}",
                        differences=None if error_match else {"error_messages": {"v1": v1_error_msg, "v2": v2_error_msg}},
                        v1_response=v1_data,
                        v2_response=v2_data,
                    )
                )
                return

            # If one accepted and one rejected, that's inconsistent - FAIL
            if v1_rejected != v2_rejected:
                self._add_result(
                    TestResult(
                        endpoint_name="Create Attachment",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.FAIL,
                        message=f"Inconsistent behavior: V1: {v1_resp.status_code}, V2: {v2_resp.status_code}",
                        differences={"status_mismatch": {"v1": v1_resp.status_code, "v2": v2_resp.status_code}},
                        v1_response=v1_data,
                        v2_response=v2_data,
                    )
                )
                return

            # Both accepted - this is unexpected but we'll validate the responses
            # Store attachment IDs for cleanup
            if v1_data.get("id"):
                self.config.created_resources["v1_attachment_id"] = v1_data["id"]
            if v2_data.get("id"):
                self.config.created_resources["v2_attachment_id"] = v2_data["id"]

            # Compare responses, ignoring id and attachment_url (will differ due to signatures)
            are_equal, differences = self._compare_responses(
                v1_data,
                v2_data,
                ignore_keys=["id", "attachment_url"],
            )

            # Check status codes (V1: 200, V2: 201)
            status_ok = v1_resp.status_code == 200 and v2_resp.status_code == 201

            # Check that both have attachment_url field
            has_url = "attachment_url" in v1_data and "attachment_url" in v2_data

            self._add_result(
                TestResult(
                    endpoint_name="Create Attachment",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.PASS if (are_equal and status_ok and has_url) else TestStatus.FAIL,
                    message=f"V1: {v1_resp.status_code}, V2: {v2_resp.status_code} (expected 200 → 201), URLs: {'✓' if has_url else '✗'}",
                    differences=differences,
                    v1_response=v1_data,
                    v2_response=v2_data,
                )
            )

        except Exception as e:
            self._add_result(
                TestResult(
                    endpoint_name="Create Attachment",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.ERROR,
                    error=f"Test exception: {str(e)}",
                )
            )

    def test_get_attachment(self):
        """Test get attachment URLs endpoint"""
        if not self.config.session_token or not self.config.workspace_id or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Get Attachment URLs",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token, workspace ID, or chat ID provided",
                )
            )
            return

        try:
            # Create test file content (minimal PNG - may be rejected by security scan)
            test_content = (
                b"\x89PNG\r\n\x1a\n"  # PNG signature
                b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
                b"\x08\x02\x00\x00\x00\x90wS\xde"
                b"\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
                b"\x00\x00\x00\x00IEND\xaeB`\x82"
            )
            test_filename = "get-url-test.png"
            test_content_type = "image/png"

            # ===== Upload files using V1 and V2 =====
            v1_create_url = f"{self.config.base_url}/api/v1/attachments/upload-attachment/"
            v1_files = {"file": (test_filename, io.BytesIO(test_content), test_content_type)}
            v1_data_fields = {
                "workspace_id": self.config.workspace_id,
                "chat_id": self.config.chat_id,
            }
            v1_create_resp, v1_create_err = self._make_request("POST", v1_create_url, data=v1_data_fields, files=v1_files)

            v2_create_url = f"{self.config.base_url}/api/v2/attachments/"
            v2_files = {"file": (test_filename, io.BytesIO(test_content), test_content_type)}
            v2_data_fields = {
                "workspace_id": self.config.workspace_id,
                "chat_id": self.config.chat_id,
            }
            v2_create_resp, v2_create_err = self._make_request("POST", v2_create_url, data=v2_data_fields, files=v2_files)

            # Check for request errors (network issues, timeouts, etc.)
            if v1_create_err or v2_create_err:
                self._add_result(
                    TestResult(
                        endpoint_name="Get Attachment URLs",
                        v1_url=v1_create_url,
                        v2_url=v2_create_url,
                        status=TestStatus.ERROR,
                        error=f"Request error: {v1_create_err or v2_create_err}",
                    )
                )
                return

            # At this point, both responses exist (no request errors)
            # Check if both rejected the file (negative test - expected behavior)
            v1_rejected = v1_create_resp.status_code == 400
            v2_rejected = v2_create_resp.status_code == 400

            if v1_rejected and v2_rejected:
                # Both rejected the invalid file - this is PASS (consistent error handling)
                v1_create_data = v1_create_resp.json()
                v2_create_data = v2_create_resp.json()

                v1_error_msg = v1_create_data.get("detail", "")
                v2_error_msg = v2_create_data.get("detail", "")

                # Check if error messages are similar (both should mention file rejection)
                error_match = v1_error_msg == v2_error_msg

                self._add_result(
                    TestResult(
                        endpoint_name="Get Attachment URLs",
                        v1_url=v1_create_url,
                        v2_url=v2_create_url,
                        status=TestStatus.PASS if error_match else TestStatus.FAIL,
                        message=f"Negative test: Both rejected invalid file during upload (V1: 400,V2: 400) - Error match: {'✓' if error_match else '✗'}",  # noqa: E501
                        differences=None if error_match else {"error_messages": {"v1": v1_error_msg, "v2": v2_error_msg}},
                        v1_response=v1_create_data,
                        v2_response=v2_create_data,
                    )
                )
                return

            # If one accepted and one rejected, that's inconsistent - FAIL
            if v1_rejected != v2_rejected:
                v1_create_data = v1_create_resp.json()
                v2_create_data = v2_create_resp.json()

                self._add_result(
                    TestResult(
                        endpoint_name="Get Attachment URLs",
                        v1_url=v1_create_url,
                        v2_url=v2_create_url,
                        status=TestStatus.FAIL,
                        message=f"Inconsistent behavior during upload: V1: {v1_create_resp.status_code}, V2: {v2_create_resp.status_code}",  # noqa: E501
                        differences={"status_mismatch": {"v1": v1_create_resp.status_code, "v2": v2_create_resp.status_code}},
                        v1_response=v1_create_data,
                        v2_response=v2_create_data,
                    )
                )
                return

            v1_create_data = v1_create_resp.json()
            v2_create_data = v2_create_resp.json()

            v1_attachment_id = v1_create_data.get("id")
            v2_attachment_id = v2_create_data.get("id")

            if not v1_attachment_id or not v2_attachment_id:
                self._add_result(
                    TestResult(
                        endpoint_name="Get Attachment URLs",
                        v1_url=v1_create_url,
                        v2_url=v2_create_url,
                        status=TestStatus.SKIP,
                        message="No attachment IDs returned - cannot test get URLs",
                    )
                )
                return

            # ===== Now Test Get URLs =====
            v1_url = f"{self.config.base_url}/api/v1/attachments/get-url/"
            v2_url = f"{self.config.base_url}/api/v2/attachments/{v2_attachment_id}"

            v1_resp, v1_err = self._make_request("GET", v1_url, params={"attachment_id": v1_attachment_id, "chat_id": self.config.chat_id})
            v2_resp, v2_err = self._make_request("GET", v2_url, params={"chat_id": self.config.chat_id})

            # Note: Delete endpoint is commented out in both V1 and V2, so we skip cleanup

            if v1_err or v2_err:
                self._add_result(
                    TestResult(
                        endpoint_name="Get Attachment URLs",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.ERROR,
                        error=v1_err or v2_err,
                    )
                )
                return

            v1_data = v1_resp.json() if v1_resp else {}
            v2_data = v2_resp.json() if v2_resp else {}

            # Compare responses (ignore URLs since they have signatures/timestamps)
            are_equal, differences = self._compare_responses(
                v1_data,
                v2_data,
                ignore_keys=["download_url", "preview_url"],
            )

            # Check that both returned download and preview URLs
            v1_has_urls = bool(v1_data.get("download_url")) and bool(v1_data.get("preview_url"))
            v2_has_urls = bool(v2_data.get("download_url")) and bool(v2_data.get("preview_url"))

            if not (v1_has_urls and v2_has_urls):
                are_equal = False
                differences = {"error": "Missing download or preview URLs in response"}

            self._add_result(
                TestResult(
                    endpoint_name="Get Attachment URLs",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.PASS if (are_equal and v1_has_urls and v2_has_urls) else TestStatus.FAIL,
                    message="URLs generated successfully" if are_equal else "Responses differ",
                    differences=differences,
                    v1_response=v1_data,
                    v2_response=v2_data,
                )
            )

        except Exception as e:
            self._add_result(
                TestResult(
                    endpoint_name="Get Attachment URLs",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.ERROR,
                    error=f"Test exception: {str(e)}",
                )
            )

    def test_delete_attachment(self):
        """Test delete attachment endpoint"""
        # Note: Delete endpoint is commented out in both V1 and V2
        self._add_result(
            TestResult(
                endpoint_name="Delete Attachment",
                v1_url="",
                v2_url="",
                status=TestStatus.SKIP,
                message="Delete endpoint is commented out in both V1 and V2",
            )
        )

    def test_list_artifacts(self):
        """Test list artifacts endpoint"""
        if not self.config.session_token or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="List Artifacts",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token or chat ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/artifacts/chat/{self.config.chat_id}/"
        v2_url = f"{self.config.base_url}/api/v2/artifacts/"

        v2_params = {"chat_id": self.config.chat_id}

        v1_resp, v1_err = self._make_request("GET", v1_url)
        v2_resp, v2_err = self._make_request("GET", v2_url, params=v2_params)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="List Artifacts",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        are_equal, differences = self._compare_responses(v1_data, v2_data)

        self._add_result(
            TestResult(
                endpoint_name="List Artifacts",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_transcription(self):
        """Test audio transcription endpoint"""
        if not self.config.session_token or not self.config.workspace_id or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Transcription",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token, workspace ID, or chat ID provided",
                )
            )
            return

        try:
            # Create a minimal valid WAV file (1 second of silence at 8kHz)
            # WAV file structure: RIFF header + fmt chunk + data chunk
            import struct

            # RIFF header
            riff_header = b"RIFF"
            # File size (will be updated)
            file_size = struct.pack("<I", 0)
            wave_header = b"WAVE"

            # fmt chunk
            fmt_chunk = b"fmt "
            fmt_size = struct.pack("<I", 16)  # PCM format chunk size
            audio_format = struct.pack("<H", 1)  # PCM = 1
            num_channels = struct.pack("<H", 1)  # Mono
            sample_rate = struct.pack("<I", 8000)  # 8kHz
            byte_rate = struct.pack("<I", 16000)  # sample_rate * num_channels * bits_per_sample / 8
            block_align = struct.pack("<H", 2)  # num_channels * bits_per_sample / 8
            bits_per_sample = struct.pack("<H", 16)  # 16 bits

            # data chunk (1 second of silence = 8000 samples * 2 bytes = 16000 bytes)
            data_chunk = b"data"
            data_size = struct.pack("<I", 16000)
            audio_data = b"\x00" * 16000  # Silence

            # Combine all parts
            wav_content = (
                riff_header
                + file_size
                + wave_header
                + fmt_chunk
                + fmt_size
                + audio_format
                + num_channels
                + sample_rate
                + byte_rate
                + block_align
                + bits_per_sample
                + data_chunk
                + data_size
                + audio_data
            )

            # Update file size in header
            total_size = len(wav_content) - 8
            wav_content = riff_header + struct.pack("<I", total_size) + wav_content[8:]

            # Test V1 endpoint
            v1_url = f"{self.config.base_url}/api/v1/transcription/transcribe"

            # V1 uses query parameters for workspace_id and chat_id
            v1_files = {"file": ("test_audio.wav", io.BytesIO(wav_content), "audio/wav")}
            v1_params = {
                "workspace_id": self.config.workspace_id,
                "chat_id": self.config.chat_id,
            }

            v1_resp, v1_err = self._make_request("POST", v1_url, params=v1_params, files=v1_files)

            # Test V2 endpoint
            v2_url = f"{self.config.base_url}/api/v2/transcriptions/"

            # V2 uses Form() for all fields including file
            v2_files = {"file": ("test_audio.wav", io.BytesIO(wav_content), "audio/wav")}
            v2_data_fields = {
                "workspace_id": self.config.workspace_id,
                "chat_id": self.config.chat_id,
            }

            v2_resp, v2_err = self._make_request("POST", v2_url, data=v2_data_fields, files=v2_files)

            # Handle errors
            if v1_err or v2_err:
                self._add_result(
                    TestResult(
                        endpoint_name="Transcription",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.ERROR,
                        error=v1_err or v2_err,
                    )
                )
                return

            if not v1_resp or not v2_resp:
                self._add_result(
                    TestResult(
                        endpoint_name="Transcription",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.ERROR,
                        error="Missing response from one or both endpoints",
                    )
                )
                return

            v1_data = v1_resp.json()
            v2_data = v2_resp.json()

            # Both endpoints might fail if transcription service is not configured
            # This is expected, so we check if both fail similarly
            v1_failed = v1_resp.status_code in [500, 503]
            v2_failed = v2_resp.status_code in [500, 503]

            if v1_failed and v2_failed:
                # Both failed (likely transcription service not configured)
                # This is acceptable - they handle errors consistently
                self._add_result(
                    TestResult(
                        endpoint_name="Transcription",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.PASS,
                        message="Both endpoints handle transcription service unavailability consistently",
                        v1_response=v1_data,
                        v2_response=v2_data,
                    )
                )
                return

            # Check status codes (V1: 200, V2: 201)
            v1_success = v1_resp.status_code == 200
            v2_success = v2_resp.status_code == 201

            # Compare responses (ignoring status code difference and V2's extra "status" field)
            are_equal, differences = self._compare_responses(
                v1_data,
                v2_data,
                ignore_keys=["status"],  # V2 has "status" field, V1 doesn't
            )

            # Both should have "detail" field
            has_detail = "detail" in v1_data and "detail" in v2_data

            status_ok = (v1_success and v2_success) or (v1_failed and v2_failed)

            # At this point we know v1_resp and v2_resp are not None
            v1_status = v1_resp.status_code
            v2_status = v2_resp.status_code

            self._add_result(
                TestResult(
                    endpoint_name="Transcription",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.PASS if (are_equal and status_ok and has_detail) else TestStatus.FAIL,
                    message=(f"V1: {v1_status}, V2: {v2_status} (expected 200 → 201 on success)"),
                    differences=differences,
                    v1_response=v1_data,
                    v2_response=v2_data,
                )
            )

        except Exception as e:
            self._add_result(
                TestResult(
                    endpoint_name="Transcription",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.ERROR,
                    error=f"Test exception: {str(e)}",
                )
            )

    def test_execute_actions(self):
        """Test execute actions endpoint"""
        if not self.config.session_token or not self.config.workspace_id or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Execute Actions",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token, workspace ID, or chat ID provided",
                )
            )
            return

        # Note: This test will likely return 404 since we don't have a message with planned actions
        # The test validates that both endpoints handle the same error cases consistently

        v1_url = f"{self.config.base_url}/api/v1/chat/execute-action/"
        v2_url = f"{self.config.base_url}/api/v2/actions/execute"

        # Create a test request payload
        # This will fail with 404 "No planned actions found" which is expected
        import uuid

        test_message_id = str(uuid.uuid4())

        payload = {
            "workspace_id": self.config.workspace_id,
            "chat_id": self.config.chat_id,
            "message_id": test_message_id,
            "artifact_data": [],
        }

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)
        v2_resp, v2_err = self._make_request("POST", v2_url, json_data=payload)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Execute Actions",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        if not v1_resp or not v2_resp:
            self._add_result(
                TestResult(
                    endpoint_name="Execute Actions",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error="Missing response from one or both endpoints",
                )
            )
            return

        v1_data = v1_resp.json()
        v2_data = v2_resp.json()

        # Both should return 404 with "No planned actions found" error
        # This validates consistent error handling
        v1_status = v1_resp.status_code
        v2_status = v2_resp.status_code

        # Both should return 404 for non-existent message
        status_match = v1_status == v2_status == 404

        # Compare error responses
        _, differences = self._compare_responses(v1_data, v2_data)

        # Check if both have "detail" field with error message
        has_detail = "detail" in v1_data and "detail" in v2_data
        detail_match = v1_data.get("detail") == v2_data.get("detail")

        self._add_result(
            TestResult(
                endpoint_name="Execute Actions",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if (status_match and has_detail and detail_match) else TestStatus.FAIL,
                message=(f"V1: {v1_status}, V2: {v2_status} - Error handling: {'consistent' if detail_match else 'differs'}"),
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_save_as_page(self):
        """Test save as page endpoint"""
        if not self.config.session_token or not self.config.workspace_id or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Save as Page",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No session token, workspace ID, or chat ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/chat_ctas/save-as-page/"
        v2_url = f"{self.config.base_url}/api/v2/pages/"

        import uuid

        payload = {
            "workspace_id": self.config.workspace_id,
            "chat_id": self.config.chat_id,
            "message_id": str(uuid.uuid4()),  # Test with dummy message ID
            "page_name": "Test Page from Plane AI Chat",
            "description": "This is a test page created from Plane AI chat",
            "access": 0,  # Private
        }

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)
        v2_resp, v2_err = self._make_request("POST", v2_url, json_data=payload)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Save as Page",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        if not v1_resp or not v2_resp:
            self._add_result(
                TestResult(
                    endpoint_name="Save as Page",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error="Missing response from one or both endpoints",
                )
            )
            return

        try:
            v1_data = v1_resp.json()
            v2_data = v2_resp.json()
        except Exception as e:
            self._add_result(
                TestResult(
                    endpoint_name="Save as Page",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=f"Failed to parse JSON response: {str(e)}",
                )
            )
            return

        # Both endpoints might fail with 404/422 if message doesn't exist
        # This validates consistent error handling
        v1_status = v1_resp.status_code
        v2_status = v2_resp.status_code

        # Check if both succeeded (201) or both failed similarly
        v1_success = v1_status == 201
        v2_success = v2_status == 201
        v1_failed = v1_status in [404, 422, 500]
        v2_failed = v2_status in [404, 422, 500]
        status_match = v1_status == v2_status

        if v1_success and v2_success:
            # Both succeeded - compare responses
            are_equal, differences = self._compare_responses(
                v1_data,
                v2_data,
                ignore_keys=["id", "page_id", "created_at", "updated_at"],
            )

            self._add_result(
                TestResult(
                    endpoint_name="Save as Page",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                    message=f"V1: {v1_status}, V2: {v2_status} (both succeeded)",
                    differences=differences,
                    v1_response=v1_data,
                    v2_response=v2_data,
                )
            )
        elif v1_failed and v2_failed and status_match:
            # Both failed with same error code - consistent error handling (PASS)
            _, differences = self._compare_responses(v1_data, v2_data)
            has_detail = "detail" in v1_data and "detail" in v2_data
            detail_match = v1_data.get("detail") == v2_data.get("detail")

            self._add_result(
                TestResult(
                    endpoint_name="Save as Page",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.PASS if (has_detail and detail_match) else TestStatus.FAIL,
                    message=(f"V1: {v1_status}, V2: {v2_status} - Consistent error handling: {'✓' if detail_match else '✗'}"),
                    differences=differences,
                    v1_response=v1_data,
                    v2_response=v2_data,
                )
            )
        elif v1_failed and v2_failed:
            # Both failed but with different error codes - document the difference
            _, differences = self._compare_responses(v1_data, v2_data)

            self._add_result(
                TestResult(
                    endpoint_name="Save as Page",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.FAIL,
                    message=(
                        f"Different error codes: V1: {v1_status}, V2: {v2_status} "
                        f"(V1: {v1_data.get('detail', 'N/A')}, V2: {v2_data.get('detail', 'N/A')})"
                    ),
                    differences={"status_mismatch": {"v1": v1_status, "v2": v2_status}, "response_diff": differences},
                    v1_response=v1_data,
                    v2_response=v2_data,
                )
            )
        else:
            # One succeeded, one failed - inconsistent behavior
            self._add_result(
                TestResult(
                    endpoint_name="Save as Page",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.FAIL,
                    message=f"Inconsistent behavior: V1: {v1_status}, V2: {v2_status}",
                    differences={"status_mismatch": {"v1": v1_status, "v2": v2_status}},
                    v1_response=v1_data,
                    v2_response=v2_data,
                )
            )

    # def test_list_artifacts_by_ids(self):
    #     """Test list artifacts by IDs endpoint"""
    #     if not self.config.session_token:
    #         self._add_result(TestResult(
    #             endpoint_name="List Artifacts by IDs",
    #             v1_url="",
    #             v2_url="",
    #             status=TestStatus.SKIP,
    #             message="No session token provided",
    #         ))
    #         return

    #     # For this test, we'll use dummy artifact IDs to test the endpoint structure
    #     # In a real scenario, you would create artifacts first
    #     test_artifact_ids = [
    #         "00000000-0000-0000-0000-000000000001",
    #         "00000000-0000-0000-0000-000000000002"
    #     ]

    #     v1_url = f"{self.config.base_url}/api/v1/artifacts/"
    #     v2_url = f"{self.config.base_url}/api/v2/artifacts/"

    #     # V1 uses artifact_ids query param, V2 uses ids
    #     v1_params = {"artifact_ids": test_artifact_ids}
    #     v2_params = {"ids": test_artifact_ids}

    #     v1_resp, v1_err = self._make_request("GET", v1_url, params=v1_params)
    #     v2_resp, v2_err = self._make_request("GET", v2_url, params=v2_params)

    #     if v1_err or v2_err:
    #         self._add_result(TestResult(
    #             endpoint_name="List Artifacts by IDs",
    #             v1_url=v1_url,
    #             v2_url=v2_url,
    #             status=TestStatus.ERROR,
    #             error=v1_err or v2_err,
    #         ))
    #         return

    #     v1_data = v1_resp.json() if v1_resp else {}
    #     v2_data = v2_resp.json() if v2_resp else {}

    #     # Both should return empty artifact lists since these are dummy IDs
    #     are_equal, differences = self._compare_responses(v1_data, v2_data)

    #     self._add_result(TestResult(
    #         endpoint_name="List Artifacts by IDs",
    #         v1_url=v1_url,
    #         v2_url=v2_url,
    #         status=TestStatus.PASS if are_equal else TestStatus.FAIL,
    #         message="Responses match" if are_equal else "Responses differ",
    #         differences=differences,
    #         v1_response=v1_data,
    #         v2_response=v2_data,
    #     ))

    # def test_artifact_followup(self):
    #     """Test artifact followup/update endpoint"""
    #     if not self.config.session_token or not self.config.workspace_id or not self.config.chat_id:
    #         self._add_result(TestResult(
    #             endpoint_name="Artifact Followup",
    #             v1_url="",
    #             v2_url="",
    #             status=TestStatus.SKIP,
    #             message="No session token, workspace ID, or chat ID provided",
    #         ))
    #         return

    #     # Note: This test requires an actual artifact to exist
    #     # For now, we'll test with a dummy artifact ID to verify endpoint structure
    #     # In a real scenario, you would create an artifact first through the batch action flow
    #     test_artifact_id = "00000000-0000-0000-0000-000000000001"

    #     v1_url = f"{self.config.base_url}/api/v1/artifacts/{test_artifact_id}/followup/"
    #     v2_url = f"{self.config.base_url}/api/v2/artifacts/{test_artifact_id}/followup"

    #     payload = {
    #         "query": "Add more details about testing requirements",
    #         "workspace_id": self.config.workspace_id,
    #         "chat_id": self.config.chat_id,
    #         "artifact_id": test_artifact_id,
    #         "entity_type": "issue",
    #         "current_artifact_data": {
    #             "action": "create_issue",
    #             "title": "Test Issue",
    #             "description": "Initial description"
    #         },
    #         "user_message_id": "00000000-0000-0000-0000-000000000001"
    #     }

    #     v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)
    #     v2_resp, v2_err = self._make_request("POST", v2_url, json_data=payload)

    #     # Both endpoints will return 404 or 422 since the artifact doesn't exist
    #     # We're just verifying the endpoint structure is correct
    #     v1_data = v1_resp.json() if v1_resp else {}
    #     v2_data = v2_resp.json() if v2_resp else {}

    #     # Check that both endpoints respond with similar error structure
    #     v1_has_error = v1_resp.status_code in [404, 422] if v1_resp else True
    #     v2_has_error = v2_resp.status_code in [404, 422] if v2_resp else True

    #     status_match = (v1_resp.status_code == v2_resp.status_code) if (v1_resp and v2_resp) else False

    #     self._add_result(TestResult(
    #         endpoint_name="Artifact Followup",
    #         v1_url=v1_url,
    #         v2_url=v2_url,
    #         status=TestStatus.PASS if (v1_has_error and v2_has_error and status_match) else TestStatus.FAIL,
    #         message=(
    #             f"V1: {v1_resp.status_code if v1_resp else 'N/A'}, "
    #             f"V2: {v2_resp.status_code if v2_resp else 'N/A'} (both handle non-existent artifact)"
    #             if status_match else "Status codes differ"
    #         ),
    #         v1_response=v1_data,
    #         v2_response=v2_data,
    #     ))

    # def test_docs_webhook_validation(self):
    #     """Test documentation webhook endpoint validation (without signature)"""
    #     # Note: This is a GitHub webhook endpoint that requires HMAC-SHA256 signature
    #     # This test only verifies the endpoint exists and properly validates requests
    #     # Full webhook flow testing would require mocking GitHub and vector DB

    #     v1_url = f"{self.config.base_url}/api/v1/docs/webhooks/"
    #     v2_url = f"{self.config.base_url}/api/v2/docs/webhooks"

    #     # Send request without signature header (should be rejected with 401)
    #     payload = {
    #         "current_commit_id": "abc123",
    #         "repo_name": "test-repo",
    #         "branch_name": "main"
    #     }

    #     try:
    #         # Use requests directly without session cookies (webhook doesn't use session auth)
    #         v1_resp = requests.post(v1_url, json=payload, timeout=30)
    #         v2_resp = requests.post(v2_url, json=payload, timeout=30)

    #         v1_data = v1_resp.json() if v1_resp else {}
    #         v2_data = v2_resp.json() if v2_resp else {}

    #         # Both should return 401 (missing signature) or 500 (missing webhook secret config)
    #         v1_valid = v1_resp.status_code in [401, 500] if v1_resp else False
    #         v2_valid = v2_resp.status_code in [401, 500] if v2_resp else False

    #         status_match = (v1_resp.status_code == v2_resp.status_code) if (v1_resp and v2_resp) else False

    #         self._add_result(TestResult(
    #             endpoint_name="Docs Webhook Validation",
    #             v1_url=v1_url,
    #             v2_url=v2_url,
    #             status=TestStatus.PASS if (v1_valid and v2_valid and status_match) else TestStatus.FAIL,
    #             message=(
    #                 f"V1: {v1_resp.status_code if v1_resp else 'N/A'}, "
    #                 f"V2: {v2_resp.status_code if v2_resp else 'N/A'} (both require signature)"
    #                 if status_match else "Status codes differ"
    #             ),
    #             v1_response=v1_data,
    #             v2_response=v2_data,
    #         ))
    #     except Exception as e:
    #         self._add_result(TestResult(
    #             endpoint_name="Docs Webhook Validation",
    #             v1_url=v1_url,
    #             v2_url=v2_url,
    #             status=TestStatus.ERROR,
    #             error=f"Request exception: {str(e)}",
    #         ))

    def get_available_tests(self) -> Dict[str, callable]:
        """Get dictionary of available test methods"""
        return {
            "health": self.test_health_check,
            "models": self.test_list_models,
            "templates": self.test_get_templates,
            "create_chat": self.test_create_chat,
            "chat_history": self.test_get_chat_history,
            "rename_chat": self.test_rename_chat,
            "favorite_chat": self.test_favorite_chat,
            "unfavorite_chat": self.test_unfavorite_chat,
            "list_favorites": self.test_list_favorite_chats,
            "search_chats": self.test_search_chats,
            "conversations": self.test_list_conversations,
            "paginated_conversations": self.test_paginated_conversations,
            "submit_feedback": self.test_submit_feedback,
            "generate_title": self.test_generate_title,
            "search_dupes": self.test_search_duplicate_issues,
            "dupes_feedback": self.test_duplicate_issue_feedback,
            "create_attachment": self.test_create_attachment,
            "get_attachment": self.test_get_attachment,
            "delete_attachment": self.test_delete_attachment,
            "list_artifacts": self.test_list_artifacts,
            "transcription": self.test_transcription,
            "execute_actions": self.test_execute_actions,
            "save_as_page": self.test_save_as_page,
            # 'list_artifacts_by_ids': self.test_list_artifacts_by_ids,
            # 'artifact_followup': self.test_artifact_followup,
            # 'docs_webhook': self.test_docs_webhook_validation,
            "delete_chat": self.test_delete_chat,
        }

    def list_available_tests(self):
        """Print list of available tests"""
        tests = self.get_available_tests()

        print(f"\n{Fore.CYAN}{'=' * 70}")
        print("Available Tests")
        print(f"{'=' * 70}{Style.RESET_ALL}\n")

        for test_name, test_func in tests.items():
            doc = test_func.__doc__ or "No description"
            print(f"{Fore.GREEN}{test_name:20}{Style.RESET_ALL} {doc}")

        print(f"\n{Fore.YELLOW}Usage:{Style.RESET_ALL}")
        print("  # Run specific test")
        print("  python test_v1_v2_comparison.py --token <token> --test health")
        print("\n  # Run multiple tests")
        print("  python test_v1_v2_comparison.py --token <token> --test health models")
        print("\n  # Run all tests (default)")
        print("  python test_v1_v2_comparison.py --token <token>")
        print()

    def run_all_tests(self, specific_tests: Optional[List[str]] = None):
        """
        Run comparison tests

        Args:
            specific_tests: List of specific test names to run. If None, runs all tests.
        """
        print(f"\n{Fore.CYAN}{'=' * 70}")
        print("V1 vs V2 API Comparison Test Suite")
        print(f"{'=' * 70}{Style.RESET_ALL}\n")

        print(f"{Fore.YELLOW}Configuration:")
        print(f"  Base URL: {self.config.base_url}")
        print(f"  Session Token: {'✓' if self.config.session_token else '✗'}")
        print(f"  Workspace ID: {self.config.workspace_id or 'Not provided'}")
        print(f"  Skip Streaming: {self.config.skip_streaming}")
        print(f"  Skip OAuth: {self.config.skip_oauth}")
        print(f"  Verbose: {self.config.verbose}{Style.RESET_ALL}\n")

        # Get available tests
        available_tests = self.get_available_tests()

        # Determine which tests to run
        if specific_tests:
            print(f"{Fore.CYAN}Running Specific Tests: {', '.join(specific_tests)}{Style.RESET_ALL}\n")

            # Validate test names
            invalid_tests = [t for t in specific_tests if t not in available_tests]
            if invalid_tests:
                print(f"{Fore.RED}Error: Invalid test names: {', '.join(invalid_tests)}{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}Use --list-tests to see available tests{Style.RESET_ALL}\n")
                return

            tests_to_run = {name: available_tests[name] for name in specific_tests}
        else:
            print(f"{Fore.CYAN}Running All Tests...{Style.RESET_ALL}\n")
            tests_to_run = available_tests

        # Run selected tests
        for test_name, test_func in tests_to_run.items():
            test_func()

        # Print summary
        self._print_summary()

    def _print_summary(self):
        """Print test results summary"""
        print(f"\n{Fore.CYAN}{'=' * 70}")
        print("Test Summary")
        print(f"{'=' * 70}{Style.RESET_ALL}\n")

        total = len(self.results)
        passed = sum(1 for r in self.results if r.status == TestStatus.PASS)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAIL)
        skipped = sum(1 for r in self.results if r.status == TestStatus.SKIP)
        errors = sum(1 for r in self.results if r.status == TestStatus.ERROR)

        print(f"Total Tests: {total}")
        print(f"{Fore.GREEN}✅ Passed: {passed}{Style.RESET_ALL}")
        print(f"{Fore.RED}❌ Failed: {failed}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}⏭️  Skipped: {skipped}{Style.RESET_ALL}")
        print(f"{Fore.MAGENTA}⚠️  Errors: {errors}{Style.RESET_ALL}\n")

        if failed > 0:
            print(f"{Fore.RED}Failed Tests:{Style.RESET_ALL}")
            for result in self.results:
                if result.status == TestStatus.FAIL:
                    print(f"  - {result.endpoint_name}")
                    if result.message:
                        print(f"    {result.message}")
            print()

        if errors > 0:
            print(f"{Fore.MAGENTA}Errors:{Style.RESET_ALL}")
            for result in self.results:
                if result.status == TestStatus.ERROR:
                    print(f"  - {result.endpoint_name}")
                    if result.error:
                        print(f"    {result.error}")
            print()

        # Save detailed results to file
        self._save_results()

    def _save_results(self):
        """Save detailed test results to JSON file"""
        output_file = "test_results.json"

        results_data = []
        for result in self.results:
            results_data.append(
                {
                    "endpoint_name": result.endpoint_name,
                    "v1_url": result.v1_url,
                    "v2_url": result.v2_url,
                    "status": result.status.value,
                    "message": result.message,
                    "differences": result.differences,
                    "error": result.error,
                }
            )

        with open(output_file, "w") as f:
            json.dump(results_data, f, indent=2)

        print(f"{Fore.CYAN}Detailed results saved to: {output_file}{Style.RESET_ALL}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Compare V1 and V2 API endpoints for backward compatibility",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List available tests
  python test_v1_v2_comparison.py --list-tests

  # Run specific test
  python test_v1_v2_comparison.py --token abc123 --test health

  # Run multiple specific tests
  python test_v1_v2_comparison.py --token abc123 --test health models templates

  # Run all tests (default)
  python test_v1_v2_comparison.py --token abc123

  # Run with full configuration
  python test_v1_v2_comparison.py \\
    --token abc123 \\
    --workspace-id def456 \\
    --verbose

  # Run with custom base URL
  python test_v1_v2_comparison.py \\
    --token abc123 \\
    --base-url http://localhost:9000
        """,
    )

    parser.add_argument(
        "--token",
        type=str,
        help="Session token (session_id cookie value)",
    )
    parser.add_argument(
        "--workspace-id",
        type=str,
        help="Workspace UUID for tests that require it",
    )
    parser.add_argument(
        "--chat-id",
        type=str,
        help="Existing chat ID to use for tests (optional)",
    )
    parser.add_argument(
        "--base-url",
        type=str,
        default="http://localhost:8001",
        help="Base URL for API (default: http://localhost:8002)",
    )
    parser.add_argument(
        "--test",
        type=str,
        nargs="+",
        metavar="TEST_NAME",
        help="Run specific test(s). Use --list-tests to see available tests.",
    )
    parser.add_argument(
        "--list-tests",
        action="store_true",
        help="List all available tests and exit",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print detailed response differences",
    )
    parser.add_argument(
        "--skip-streaming",
        action="store_true",
        help="Skip streaming endpoint tests",
    )
    parser.add_argument(
        "--skip-oauth",
        action="store_true",
        help="Skip OAuth endpoint tests",
    )

    args = parser.parse_args()

    # Create configuration
    config = TestConfig(
        base_url=args.base_url,
        session_token=args.token,
        workspace_id=args.workspace_id,
        chat_id=args.chat_id,
        verbose=args.verbose,
        skip_streaming=args.skip_streaming,
        skip_oauth=args.skip_oauth,
    )

    # Create tester
    tester = APITester(config)

    # Handle --list-tests
    if args.list_tests:
        tester.list_available_tests()
        sys.exit(0)

    # Run tests
    try:
        tester.run_all_tests(specific_tests=args.test)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Tests interrupted by user{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}Unexpected error: {e}{Style.RESET_ALL}")
        sys.exit(1)

    # Exit with appropriate code
    failed = sum(1 for r in tester.results if r.status == TestStatus.FAIL)
    errors = sum(1 for r in tester.results if r.status == TestStatus.ERROR)

    sys.exit(1 if (failed > 0 or errors > 0) else 0)


if __name__ == "__main__":
    main()
