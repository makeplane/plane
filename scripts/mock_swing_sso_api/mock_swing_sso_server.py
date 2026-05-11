#!/usr/bin/env python3
"""
Mock Swing SSO Server for local development & testing.

Simulates the Swing SSO idpw-authorize API endpoint so Plane can authenticate
users without connecting to the real Swing gateway.

Usage:
    pip install flask
    python mock_swing_sso_server.py

    Then configure in God Mode:
    - SWING_SSO_URL: http://host.docker.internal:9000/cau/v1/idpw-authorize
    - SWING_SSO_CLIENT_ID: TEST_CLIENT_ID
    - SWING_SSO_CLIENT_SECRET: test-secret-123
    - SWING_SSO_COMPANY_CODE: VN

Test users (employee_no / password):
    10000001 / password123
    10000002 / password123
    10000003 / password123
    10000004 / admin@2024
    10000005 / admin@2024
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- Configuration ---
EXPECTED_CLIENT_ID = "TEST_CLIENT_ID"
EXPECTED_CLIENT_SECRET = "test-secret-123"
EXPECTED_COMPANY_CODE = "sh"

# --- Mock Users Database ---
# Passwords are stored as SHA-256 hex (same as what Plane sends)
def sha256_hex(plain: str) -> str:
    return hashlib.sha256(plain.encode("utf-8")).hexdigest()

MOCK_USERS = {
    "10000001": {
        "password_hash": sha256_hex("password123"),
        "companyId": "C300000001",
        "companyName": "ShinhanBank Vietnam",
        "companyCode": "VN",
        "departmentId": "D500000001",
        "departmentNo": "SH001",
        "departmentName": "IT Development",
        "departmentLocation": "C300000001/D650000001/D500000001",
        "userId": "user001",
        "employeeId": "M400000001",
        "employeeNo": "10000001",
        "employeeName": "Nguyen Van A",
        "employeePositionName": "Senior Developer",
        "employeeClass": "정직원",
        "companyEmail": "user001@swork.shinhan.com",
        "email": "nguyenvana@example.com",
        "cellPhone": "0901-111-111",
    },
    "10000002": {
        "password_hash": sha256_hex("password123"),
        "companyId": "C300000001",
        "companyName": "ShinhanBank Vietnam",
        "companyCode": "VN",
        "departmentId": "D500000002",
        "departmentNo": "SH002",
        "departmentName": "QA Team",
        "departmentLocation": "C300000001/D650000001/D500000002",
        "userId": "user002",
        "employeeId": "M400000002",
        "employeeNo": "10000002",
        "employeeName": "Tran Thi B",
        "employeePositionName": "QA Engineer",
        "employeeClass": "정직원",
        "companyEmail": "user002@swork.shinhan.com",
        "email": "tranthib@example.com",
        "cellPhone": "0902-222-222",
    },
    "10000003": {
        "password_hash": sha256_hex("password123"),
        "companyId": "C300000001",
        "companyName": "ShinhanBank Vietnam",
        "companyCode": "VN",
        "departmentId": "D500000003",
        "departmentNo": "SH003",
        "departmentName": "Project Management",
        "departmentLocation": "C300000001/D650000001/D500000003",
        "userId": "user003",
        "employeeId": "M400000003",
        "employeeNo": "10000003",
        "employeeName": "Le Van C",
        "employeePositionName": "Project Manager",
        "employeeClass": "정직원",
        "companyEmail": "user003@swork.shinhan.com",
        "email": "levanc@example.com",
        "cellPhone": "0903-333-333",
    },
    "10000004": {
        "password_hash": sha256_hex("admin@2024"),
        "companyId": "C300000001",
        "companyName": "ShinhanBank Vietnam",
        "companyCode": "VN",
        "departmentId": "D500000001",
        "departmentNo": "SH001",
        "departmentName": "IT Development",
        "departmentLocation": "C300000001/D650000001/D500000001",
        "userId": "admin01",
        "employeeId": "M400000004",
        "employeeNo": "10000004",
        "employeeName": "Pham Admin",
        "employeePositionName": "Tech Lead",
        "employeeClass": "임원",
        "companyEmail": "admin01@swork.shinhan.com",
        "email": "phamadmin@example.com",
        "cellPhone": "0904-444-444",
    },
    "10000005": {
        "password_hash": sha256_hex("admin@2024"),
        "companyId": "C300000001",
        "companyName": "ShinhanBank Vietnam",
        "companyCode": "VN",
        "departmentId": "D500000004",
        "departmentNo": "SH004",
        "departmentName": "Security Team",
        "departmentLocation": "C300000001/D650000001/D500000004",
        "userId": "admin02",
        "employeeId": "M400000005",
        "employeeNo": "10000005",
        "employeeName": "Hoang Security",
        "employeePositionName": "Security Analyst",
        "employeeClass": "정직원",
        "companyEmail": "admin02@swork.shinhan.com",
        "email": "hoangsecurity@example.com",
        "cellPhone": "0905-555-555",
    },
}


def make_success_response(user_data: dict) -> dict:
    """Build successful Swing SSO response."""
    data = {k: v for k, v in user_data.items() if k != "password_hash"}
    data["authResult"] = "SUCCESS"
    data["authResultMessage"] = ""
    data["authEventId"] = uuid.uuid4().hex[:26].upper()
    return {
        "data": data,
        "common": {
            "resultCode": "200",
            "responseDatetime": datetime.now(timezone.utc).isoformat(),
            "transactionId": uuid.uuid4().hex[:16],
        },
    }


def make_error_response(error_code: str, message: str, auth_result: str = "") -> dict:
    """Build error response. Real Swing API always returns HTTP 200 with error in body."""
    return {
        "data": {
            "authResult": auth_result or "LOGIN_FAILED",
            "authResultMessage": message,
        },
        "common": {
            "resultCode": error_code,
            "responseDatetime": datetime.now(timezone.utc).isoformat(),
            "transactionId": uuid.uuid4().hex[:16],
        },
    }


def make_error_json(error_code: str, message: str, auth_result: str = ""):
    """Build error JSON response (HTTP 200, error in body — matches real Swing API)."""
    return jsonify(make_error_response(error_code, message, auth_result))


@app.route("/cau/v1/idpw-authorize", methods=["POST"])
def idpw_authorize():
    """Main authentication endpoint - mimics Swing SSO idpw-authorize API."""
    try:
        body = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    common = body.get("common", {})
    data = body.get("data", {})

    client_id = common.get("clientId", "")
    client_secret = common.get("clientSecret", "")
    company_code = common.get("companyCode", "")
    employee_no = common.get("employeeNo", "")
    login_password = data.get("loginPassword", "")

    # Log request (for debugging)
    print(f"\n{'='*60}")
    print(f"[SSO] Auth request: employeeNo={employee_no}, companyCode={company_code}")
    print(f"[SSO] clientId={client_id[:8]}..., passwordHash={login_password[:16]}...")

    # Validate client credentials
    if client_id != EXPECTED_CLIENT_ID or client_secret != EXPECTED_CLIENT_SECRET:
        print(f"[SSO] REJECTED: Invalid client credentials")
        return make_error_json("401", "Invalid client credentials")

    # Validate company code
    if company_code.lower() != EXPECTED_COMPANY_CODE.lower():
        print(f"[SSO] REJECTED: Unknown company code '{company_code}'")
        return make_error_json("ECCO007", "알 수 없는 그룹사 코드입니다.")

    # Lookup user
    user = MOCK_USERS.get(employee_no)
    if not user:
        print(f"[SSO] REJECTED: User '{employee_no}' not found")
        return make_error_json("ECAU002", "존재하지 않은 사용자입니다.")

    # Validate password (compare SHA-256 hex hashes)
    if login_password != user["password_hash"]:
        print(f"[SSO] REJECTED: Wrong password for '{employee_no}'")
        resp = make_success_response(user)
        resp["data"]["authResult"] = "LOGIN_FAILED"
        resp["data"]["authResultMessage"] = "로그인 정보가 일치하지 않습니다."
        return jsonify(resp)

    # Success
    print(f"[SSO] SUCCESS: {user['employeeName']} ({employee_no})")
    return jsonify(make_success_response(user))


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "Mock Swing SSO Server",
        "users": list(MOCK_USERS.keys()),
    })


if __name__ == "__main__":
    print("=" * 60)
    print("  Mock Swing SSO Server")
    print("=" * 60)
    print(f"\n  Endpoint: http://0.0.0.0:9001/cau/v1/idpw-authorize")
    print(f"  Health:   http://0.0.0.0:9001/health")
    print(f"\n  Expected credentials:")
    print(f"    clientId:     {EXPECTED_CLIENT_ID}")
    print(f"    clientSecret: {EXPECTED_CLIENT_SECRET}")
    print(f"    companyCode:  {EXPECTED_COMPANY_CODE}")
    print(f"\n  Test users:")
    for emp_no, u in MOCK_USERS.items():
        print(f"    {emp_no} - {u['employeeName']} ({u['departmentName']})")
    print(f"\n  Passwords: 10000001-03=password123, 10000004-05=admin@2024")
    print(f"\n  Plane email format: sh{{employeeNo}}@swing.shinhan.com")
    print(f"  Required Plane users:")
    for emp_no in MOCK_USERS:
        print(f"    sh{emp_no}@swing.shinhan.com")
    print("=" * 60)
    app.run(host="0.0.0.0", port=9001, debug=True)
