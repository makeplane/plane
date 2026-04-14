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
V1 vs V2 Mobile API Comparison Test Suite

This script tests **mobile** endpoints and compares V1 and V2 responses
to ensure backward compatibility and correctness for the mobile surface.

Usage:
    python test_mobile_v1_v2_comparison.py --jwt-token <jwt> --workspace-id <uuid> [options]
"""

import argparse
import io
import json
import sys
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import requests
from colorama import Fore
from colorama import Style
from colorama import init
from deepdiff import DeepDiff
from requests.exceptions import RequestException

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
class MobileTestConfig:
    """Configuration for mobile test execution"""

    base_url: str = "http://localhost:8002"
    jwt_token: Optional[str] = None
    workspace_id: Optional[str] = None
    chat_id: Optional[str] = None
    verbose: bool = False
    skip_streaming: bool = False
    created_resources: Dict[str, Any] = field(default_factory=dict)


class MobileAPITester:
    """Main test runner for V1/V2 **mobile** API comparison"""

    def __init__(self, config: MobileTestConfig):
        self.config = config
        self.results: List[TestResult] = []
        self.session = requests.Session()

        # Set default Authorization header for JWT-based mobile endpoints
        if config.jwt_token:
            self.session.headers["Authorization"] = f"Bearer {config.jwt_token}"

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
            # Show Authorization header (masked)
            auth_header = self.session.headers.get("Authorization", "")
            if auth_header:
                print(f"  Auth: Bearer {'*' * 20}...{auth_header[-10:] if len(auth_header) > 30 else auth_header}")
            if headers:
                print(f"  Headers: {json.dumps(headers, indent=2)}")

        try:
            # Merge default session headers with per-request headers
            request_headers = dict(self.session.headers)
            if headers:
                request_headers.update(headers)

            response = self.session.request(
                method=method,
                url=url,
                headers=request_headers,
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

    # -------------------------------------------------------------------------
    # Core mobile chat tests
    # -------------------------------------------------------------------------

    def test_mobile_create_chat(self):
        """Mobile: create chat (initialize-chat vs /mobile/chats)"""
        if not self.config.jwt_token:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Create Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/mobile/chat/initialize-chat/"
        v2_url = f"{self.config.base_url}/api/v2/mobile/chats/"

        payload: Dict[str, Any] = {
            "workspace_in_context": True,
            "is_project_chat": False,
        }
        if self.config.workspace_id:
            payload["workspace_id"] = self.config.workspace_id

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)
        v2_resp, v2_err = self._make_request("POST", v2_url, json_data=payload)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Create Chat",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.ERROR,
                    error=v1_err or v2_err,
                )
            )
            return

        v1_data = v1_resp.json() if v1_resp else {}
        v2_data = v2_resp.json() if v2_resp else {}

        # Store created chat IDs
        if v1_data.get("chat_id"):
            self.config.created_resources["v1_mobile_chat_id"] = v1_data["chat_id"]
        if v2_data.get("chat_id"):
            self.config.created_resources["v2_mobile_chat_id"] = v2_data["chat_id"]
            self.config.chat_id = v2_data["chat_id"]

        are_equal, differences = self._compare_responses(
            v1_data,
            v2_data,
            ignore_keys=["chat_id", "id"],
        )

        # V1: 200 OK, V2: 201 Created
        status_ok = v1_resp.status_code == 200 and v2_resp.status_code == 201

        self._add_result(
            TestResult(
                endpoint_name="Mobile Create Chat",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if (are_equal and status_ok) else TestStatus.FAIL,
                message=f"V1: {v1_resp.status_code}, V2: {v2_resp.status_code} (expected 200 → 201)",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_mobile_get_chat_history(self):
        """Mobile: get chat history (POST get-chat-history vs GET /mobile/chats/{id})"""
        if not self.config.jwt_token or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Get Chat History",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token or chat ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/mobile/chat/get-chat-history/"
        v2_url = f"{self.config.base_url}/api/v2/mobile/chats/{self.config.chat_id}"

        v1_payload = {"chat_id": self.config.chat_id}

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=v1_payload)
        v2_resp, v2_err = self._make_request("GET", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Get Chat History",
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
                endpoint_name="Mobile Get Chat History",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_mobile_get_models(self):
        """Mobile: list AI models (get-models vs /mobile/chats/models)"""
        if not self.config.jwt_token:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile List Models",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/mobile/chat/get-models/"
        v2_url = f"{self.config.base_url}/api/v2/mobile/chats/models"

        v1_resp, v1_err = self._make_request("GET", v1_url)
        v2_resp, v2_err = self._make_request("GET", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile List Models",
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
                endpoint_name="Mobile List Models",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_mobile_get_templates(self):
        """Mobile: get chat templates (get-templates vs /mobile/chats/templates)"""
        if not self.config.jwt_token:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Get Templates",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/mobile/chat/get-templates/"
        v2_url = f"{self.config.base_url}/api/v2/mobile/chats/templates"

        v1_resp, v1_err = self._make_request("GET", v1_url)
        v2_resp, v2_err = self._make_request("GET", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Get Templates",
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
                endpoint_name="Mobile Get Templates",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_mobile_transcription(self):
        """Mobile: transcription (mobile/transcription/transcribe vs /mobile/transcriptions/)"""
        if not self.config.jwt_token or not self.config.workspace_id or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Transcription",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token, workspace ID, or chat ID provided",
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
            v1_url = f"{self.config.base_url}/api/v1/mobile/transcription/transcribe"

            # V1 uses query parameters for workspace_id and chat_id
            v1_files = {
                "file": ("test_audio.wav", io.BytesIO(wav_content), "audio/wav"),
            }
            v1_params = {
                "workspace_id": self.config.workspace_id,
                "chat_id": self.config.chat_id,
            }

            v1_resp, v1_err = self._make_request("POST", v1_url, params=v1_params, files=v1_files)

            # Test V2 endpoint
            v2_url = f"{self.config.base_url}/api/v2/mobile/transcriptions/"

            # V2 uses Form() for all fields including file
            # Create a new BytesIO object for V2 (can't reuse v1_files as the stream was already read)
            v2_files = {
                "file": ("test_audio.wav", io.BytesIO(wav_content), "audio/wav"),
            }
            v2_data_fields = {
                "workspace_id": self.config.workspace_id,
                "chat_id": self.config.chat_id,
            }

            v2_resp, v2_err = self._make_request("POST", v2_url, data=v2_data_fields, files=v2_files)

            if v1_err or v2_err:
                self._add_result(
                    TestResult(
                        endpoint_name="Mobile Transcription",
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
                        endpoint_name="Mobile Transcription",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.ERROR,
                        error="Missing response from one or both endpoints",
                    )
                )
                return

            v1_data = v1_resp.json()
            v2_data = v2_resp.json()

            v1_failed = v1_resp.status_code in [500, 503]
            v2_failed = v2_resp.status_code in [500, 503]

            if v1_failed and v2_failed:
                self._add_result(
                    TestResult(
                        endpoint_name="Mobile Transcription",
                        v1_url=v1_url,
                        v2_url=v2_url,
                        status=TestStatus.PASS,
                        message="Both mobile endpoints handle transcription service unavailability consistently",
                        v1_response=v1_data,
                        v2_response=v2_data,
                    )
                )
                return

            v1_success = v1_resp.status_code == 200
            v2_success = v2_resp.status_code == 201

            are_equal, differences = self._compare_responses(
                v1_data,
                v2_data,
                ignore_keys=["status"],
            )

            has_detail = "detail" in v1_data and "detail" in v2_data
            status_ok = (v1_success and v2_success) or (v1_failed and v2_failed)

            v1_status = v1_resp.status_code
            v2_status = v2_resp.status_code

            self._add_result(
                TestResult(
                    endpoint_name="Mobile Transcription",
                    v1_url=v1_url,
                    v2_url=v2_url,
                    status=TestStatus.PASS if (are_equal and status_ok and has_detail) else TestStatus.FAIL,
                    message=f"V1: {v1_status}, V2: {v2_status} (expected 200 → 201 on success)",
                    differences=differences,
                    v1_response=v1_data,
                    v2_response=v2_data,
                )
            )
        except Exception as e:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Transcription",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.ERROR,
                    error=f"Test exception: {str(e)}",
                )
            )

    def test_mobile_delete_chat(self):
        """Mobile: delete chat (DELETE delete-chat vs DELETE /mobile/chats/{id})"""
        if not self.config.jwt_token:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Delete Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token provided",
                )
            )
            return

        # Create chats for testing
        v1_create_url = f"{self.config.base_url}/api/v1/mobile/chat/initialize-chat/"
        v2_create_url = f"{self.config.base_url}/api/v2/mobile/chats/"

        payload: Dict[str, Any] = {"workspace_in_context": True, "is_project_chat": False}
        if self.config.workspace_id:
            payload["workspace_id"] = self.config.workspace_id

        v1_create_resp, _ = self._make_request("POST", v1_create_url, json_data=payload)
        v2_create_resp, _ = self._make_request("POST", v2_create_url, json_data=payload)

        if not v1_create_resp or not v2_create_resp:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Delete Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="Could not create test chats",
                )
            )
            return

        v1_chat_id = v1_create_resp.json().get("chat_id")
        v2_chat_id = v2_create_resp.json().get("chat_id")

        v1_url = f"{self.config.base_url}/api/v1/mobile/chat/delete-chat/"
        v2_url = f"{self.config.base_url}/api/v2/mobile/chats/{v2_chat_id}"

        v1_payload = {"chat_id": v1_chat_id}
        v1_resp, v1_err = self._make_request("DELETE", v1_url, json_data=v1_payload)
        v2_resp, v2_err = self._make_request("DELETE", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Delete Chat",
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
                endpoint_name="Mobile Delete Chat",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_mobile_threads(self):
        """Mobile: get user threads (POST get-user-threads vs GET /mobile/chats/threads)"""
        if not self.config.jwt_token:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Get Threads",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/mobile/chat/get-user-threads/"
        v2_url = f"{self.config.base_url}/api/v2/mobile/chats/threads"

        payload: Dict[str, Any] = {"is_project_chat": False}
        if self.config.workspace_id:
            payload["workspace_id"] = self.config.workspace_id

        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=payload)

        # V2 uses query params
        v2_params = {"is_project_chat": False}
        if self.config.workspace_id:
            v2_params["workspace_id"] = self.config.workspace_id
        v2_resp, v2_err = self._make_request("GET", v2_url, params=v2_params)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Get Threads",
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
                endpoint_name="Mobile Get Threads",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_mobile_favorite_chat(self):
        """Mobile: favorite chat (POST favorite-chat vs POST /mobile/chats/{id}/favorite)"""
        if not self.config.jwt_token:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Favorite Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token provided",
                )
            )
            return

        # Create chats
        create_url_v1 = f"{self.config.base_url}/api/v1/mobile/chat/initialize-chat/"
        create_url_v2 = f"{self.config.base_url}/api/v2/mobile/chats/"

        payload: Dict[str, Any] = {"workspace_in_context": True, "is_project_chat": False}
        if self.config.workspace_id:
            payload["workspace_id"] = self.config.workspace_id

        v1_create_resp, _ = self._make_request("POST", create_url_v1, json_data=payload)
        v2_create_resp, _ = self._make_request("POST", create_url_v2, json_data=payload)

        if not v1_create_resp or not v2_create_resp:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Favorite Chat",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="Could not create test chats",
                )
            )
            return

        v1_chat_id = v1_create_resp.json().get("chat_id")
        v2_chat_id = v2_create_resp.json().get("chat_id")

        v1_url = f"{self.config.base_url}/api/v1/mobile/chat/favorite-chat/"
        v2_url = f"{self.config.base_url}/api/v2/mobile/chats/{v2_chat_id}/favorite"

        v1_payload = {"chat_id": v1_chat_id}
        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=v1_payload)
        v2_resp, v2_err = self._make_request("POST", v2_url)

        # Cleanup
        self._make_request("DELETE", f"{self.config.base_url}/api/v2/mobile/chats/{v1_chat_id}")
        self._make_request("DELETE", f"{self.config.base_url}/api/v2/mobile/chats/{v2_chat_id}")

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Favorite Chat",
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
                endpoint_name="Mobile Favorite Chat",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_mobile_generate_title(self):
        """Mobile: generate title (POST generate-title vs POST /mobile/chats/{id}/title)"""
        if not self.config.jwt_token or not self.config.chat_id:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Generate Title",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token or chat ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/mobile/chat/generate-title/"
        v2_url = f"{self.config.base_url}/api/v2/mobile/chats/{self.config.chat_id}/title"

        v1_payload = {"chat_id": self.config.chat_id}
        v1_resp, v1_err = self._make_request("POST", v1_url, json_data=v1_payload)
        v2_resp, v2_err = self._make_request("POST", v2_url)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Generate Title",
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
                endpoint_name="Mobile Generate Title",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    def test_mobile_search_chats(self):
        """Mobile: search chats (GET search vs GET /mobile/chats/search)"""
        if not self.config.jwt_token or not self.config.workspace_id:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Search Chats",
                    v1_url="",
                    v2_url="",
                    status=TestStatus.SKIP,
                    message="No JWT token or workspace ID provided",
                )
            )
            return

        v1_url = f"{self.config.base_url}/api/v1/mobile/chat/search/"
        v2_url = f"{self.config.base_url}/api/v2/mobile/chats/search"

        # Both V1 and V2 use GET with query params
        v1_params = {"query": "test", "workspace_id": self.config.workspace_id}
        v1_resp, v1_err = self._make_request("GET", v1_url, params=v1_params)

        v2_params = {"q": "test", "workspace_id": self.config.workspace_id}
        v2_resp, v2_err = self._make_request("GET", v2_url, params=v2_params)

        if v1_err or v2_err:
            self._add_result(
                TestResult(
                    endpoint_name="Mobile Search Chats",
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
                endpoint_name="Mobile Search Chats",
                v1_url=v1_url,
                v2_url=v2_url,
                status=TestStatus.PASS if are_equal else TestStatus.FAIL,
                message="Responses match" if are_equal else "Responses differ",
                differences=differences,
                v1_response=v1_data,
                v2_response=v2_data,
            )
        )

    # -------------------------------------------------------------------------
    # Test registration / runner
    # -------------------------------------------------------------------------

    def get_available_tests(self) -> Dict[str, callable]:
        """Get dictionary of available mobile test methods"""
        return {
            "mobile_create_chat": self.test_mobile_create_chat,
            "mobile_chat_history": self.test_mobile_get_chat_history,
            "mobile_delete_chat": self.test_mobile_delete_chat,
            "mobile_threads": self.test_mobile_threads,
            "mobile_favorite_chat": self.test_mobile_favorite_chat,
            "mobile_generate_title": self.test_mobile_generate_title,
            "mobile_search_chats": self.test_mobile_search_chats,
            "mobile_models": self.test_mobile_get_models,
            "mobile_templates": self.test_mobile_get_templates,
            "mobile_transcription": self.test_mobile_transcription,
        }

    def list_available_tests(self):
        """Print list of available mobile tests"""
        tests = self.get_available_tests()

        print(f"\n{Fore.CYAN}{'=' * 70}")
        print("Available Mobile Tests")
        print(f"{'=' * 70}{Style.RESET_ALL}\n")

        for test_name, test_func in tests.items():
            doc = test_func.__doc__ or "No description"
            print(f"{Fore.GREEN}{test_name:25}{Style.RESET_ALL} {doc}")

        print(f"\n{Fore.YELLOW}Usage:{Style.RESET_ALL}")
        print("  # Run specific mobile test")
        print("  python test_mobile_v1_v2_comparison.py --jwt-token <token> --test mobile_create_chat")
        print("\n  # Run multiple tests")
        print("  python test_mobile_v1_v2_comparison.py --jwt-token <token> --test mobile_create_chat mobile_models")
        print("\n  # Run all mobile tests (default)")
        print("  python test_mobile_v1_v2_comparison.py --jwt-token <token>")
        print()

    def run_all_tests(self, specific_tests: Optional[List[str]] = None):
        """
        Run mobile comparison tests.

        Args:
            specific_tests: List of specific test names to run. If None, runs all tests.
        """
        print(f"\n{Fore.CYAN}{'=' * 70}")
        print("V1 vs V2 Mobile API Comparison Test Suite")
        print(f"{'=' * 70}{Style.RESET_ALL}\n")

        print(f"{Fore.YELLOW}Configuration:")
        print(f"  Base URL: {self.config.base_url}")
        print(f"  JWT Token: {'✓' if self.config.jwt_token else '✗'}")
        print(f"  Workspace ID: {self.config.workspace_id or 'Not provided'}")
        print(f"  Chat ID: {self.config.chat_id or 'Not provided'}")
        print(f"  Skip Streaming: {self.config.skip_streaming}{Style.RESET_ALL}\n")

        available_tests = self.get_available_tests()

        if specific_tests:
            print(f"{Fore.CYAN}Running Specific Mobile Tests: {', '.join(specific_tests)}{Style.RESET_ALL}\n")

            invalid_tests = [t for t in specific_tests if t not in available_tests]
            if invalid_tests:
                print(f"{Fore.RED}Error: Invalid test names: {', '.join(invalid_tests)}{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}Use --list-tests to see available mobile tests{Style.RESET_ALL}\n")
                return

            tests_to_run = {name: available_tests[name] for name in specific_tests}
        else:
            print(f"{Fore.CYAN}Running All Mobile Tests...{Style.RESET_ALL}\n")
            tests_to_run = available_tests

        for _test_name, test_func in tests_to_run.items():
            test_func()

        self._print_summary()

    def _print_summary(self):
        """Print test results summary"""
        print(f"\n{Fore.CYAN}{'=' * 70}")
        print("Mobile Test Summary")
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

        self._save_results()

    def _save_results(self):
        """Save detailed mobile test results to JSON file"""
        output_file = "test_results_mobile.json"

        results_data = []
        for result in self.results:
            # Convert differences to serializable format
            differences_serializable = None
            if result.differences:
                try:
                    differences_serializable = json.loads(json.dumps(str(result.differences)))
                except Exception:
                    differences_serializable = str(result.differences)

            results_data.append(
                {
                    "endpoint_name": result.endpoint_name,
                    "v1_url": result.v1_url,
                    "v2_url": result.v2_url,
                    "status": result.status.value,
                    "message": result.message,
                    "differences": differences_serializable,
                    "error": result.error,
                }
            )

        with open(output_file, "w") as f:
            json.dump(results_data, f, indent=2)

        print(f"{Fore.CYAN}Detailed mobile results saved to: {output_file}{Style.RESET_ALL}")


def main():
    """Main entry point for mobile comparison tests"""
    parser = argparse.ArgumentParser(
        description="Compare V1 and V2 **mobile** API endpoints for backward compatibility",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List available mobile tests
  python test_mobile_v1_v2_comparison.py --list-tests

  # Run specific mobile test
  python test_mobile_v1_v2_comparison.py --jwt-token abc123 --test mobile_create_chat

  # Run multiple specific mobile tests
  python test_mobile_v1_v2_comparison.py --jwt-token abc123 --test mobile_create_chat mobile_models

  # Run all mobile tests (default)
  python test_mobile_v1_v2_comparison.py --jwt-token abc123

  # Run with full configuration
  python test_mobile_v1_v2_comparison.py \\
    --jwt-token abc123 \\
    --workspace-id def456 \\
    --verbose

  # Run with custom base URL
  python test_mobile_v1_v2_comparison.py \\
    --jwt-token abc123 \\
    --base-url http://localhost:9000
        """,
    )

    parser.add_argument(
        "--jwt-token",
        type=str,
        required=True,
        help="JWT token for mobile endpoints (Authorization: Bearer <token>)",
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
        help="Base URL for API (default: http://localhost:8001)",
    )
    parser.add_argument(
        "--test",
        type=str,
        nargs="+",
        metavar="TEST_NAME",
        help="Run specific mobile test(s). Use --list-tests to see available tests.",
    )
    parser.add_argument(
        "--list-tests",
        action="store_true",
        help="List all available mobile tests and exit",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print detailed response differences",
    )
    parser.add_argument(
        "--skip-streaming",
        action="store_true",
        help="Reserved for future streaming mobile tests",
    )

    args = parser.parse_args()

    config = MobileTestConfig(
        base_url=args.base_url,
        jwt_token=args.jwt_token,
        workspace_id=args.workspace_id,
        chat_id=args.chat_id,
        verbose=args.verbose,
        skip_streaming=args.skip_streaming,
    )

    tester = MobileAPITester(config)

    if args.list_tests:
        tester.list_available_tests()
        sys.exit(0)

    try:
        tester.run_all_tests(specific_tests=args.test)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Mobile tests interrupted by user{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as exc:
        print(f"\n{Fore.RED}Unexpected error in mobile tests: {exc}{Style.RESET_ALL}")
        sys.exit(1)

    failed = sum(1 for r in tester.results if r.status == TestStatus.FAIL)
    errors = sum(1 for r in tester.results if r.status == TestStatus.ERROR)

    sys.exit(1 if (failed > 0 or errors > 0) else 0)


if __name__ == "__main__":
    main()
