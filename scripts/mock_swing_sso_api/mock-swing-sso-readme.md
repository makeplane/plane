# Mock Swing SSO Server - Test Guide

## Quick Start

```bash
cd /Volumes/Data/SHBVN/plane.so/Temp
.venv/bin/python mock_swing_sso_server.py
```

Server chạy tại: `http://0.0.0.0:9001`

## Endpoints

| Endpoint                 | Method | Mô tả               |
| ------------------------ | ------ | ------------------- |
| `/cau/v1/idpw-authorize` | POST   | Xác thực SSO (main) |
| `/health`                | GET    | Health check        |

## God Mode Config

Cấu hình tại `http://localhost:3001/god-mode/authentication/swing-sso/`

| Key                     | Value                                                    |
| ----------------------- | -------------------------------------------------------- |
| SWING_SSO_URL           | `http://host.docker.internal:9001/cau/v1/idpw-authorize` |
| SWING_SSO_CLIENT_ID     | `TEST_CLIENT_ID`                                         |
| SWING_SSO_CLIENT_SECRET | `test-secret-123`                                        |
| SWING_SSO_COMPANY_CODE  | `sh`                                                     |

> **Lưu ý:** Dùng `host.docker.internal` vì Plane API chạy trong Docker, cần truy cập host machine.

## Test Users

| Staff ID | Password    | Plane Email                  | Tên            |
| -------- | ----------- | ---------------------------- | -------------- |
| 10000001 | password123 | sh10000001@swing.shinhan.com | Nguyen Van A   |
| 10000002 | password123 | sh10000002@swing.shinhan.com | Tran Thi B     |
| 10000003 | password123 | sh10000003@swing.shinhan.com | Le Van C       |
| 10000004 | admin@2024  | sh10000004@swing.shinhan.com | Pham Admin     |
| 10000005 | admin@2024  | sh10000005@swing.shinhan.com | Hoang Security |

## Test bằng curl

```bash
# Health check
curl -s http://0.0.0.0:9001/health | python3 -m json.tool

# Auth thành công
PASS_HASH=$(python3 -c "import hashlib; print(hashlib.sha256(b'password123').hexdigest())")
curl -s -X POST http://0.0.0.0:9001/cau/v1/idpw-authorize \
  -H "Content-Type: application/json" \
  -d "{\"common\":{\"companyCode\":\"sh\",\"clientId\":\"TEST_CLIENT_ID\",\"clientSecret\":\"test-secret-123\",\"employeeNo\":\"10000001\"},\"data\":{\"loginPassword\":\"$PASS_HASH\"}}" | python3 -m json.tool

# Auth sai password
curl -s -X POST http://0.0.0.0:9001/cau/v1/idpw-authorize \
  -H "Content-Type: application/json" \
  -d "{\"common\":{\"companyCode\":\"sh\",\"clientId\":\"TEST_CLIENT_ID\",\"clientSecret\":\"test-secret-123\",\"employeeNo\":\"10000001\"},\"data\":{\"loginPassword\":\"wrong\"}}" | python3 -m json.tool
```

## Test trên Plane UI

1. Mở `http://localhost:3000` → trang login
2. Chọn **Swing SSO**
3. Nhập Staff ID: `10000001`, Password: `password123`
4. Đăng nhập thành công → redirect vào workspace

## Tạo thêm user trong Plane DB

```bash
docker exec -i planeso-api-1 python manage.py shell <<'EOF'
from plane.db.models import User
email = "sh99999999@swing.shinhan.com"
user, created = User.objects.get_or_create(
    email=email,
    defaults={"username": email, "first_name": "New", "last_name": "User", "display_name": "New User", "is_active": True, "is_password_autoset": True}
)
print(f"{'CREATED' if created else 'EXISTS'}: {email}")
EOF
```

Sau đó thêm user tương ứng vào `MOCK_USERS` trong `mock_swing_sso_server.py` và restart server.

## Cấu hình lại DB (nếu cần reset)

```bash
docker exec planeso-api-1 python -c "
import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.local')
import django; django.setup()
from plane.license.models import InstanceConfiguration
configs = {
    'SWING_SSO_URL': 'http://host.docker.internal:9001/cau/v1/idpw-authorize',
    'SWING_SSO_CLIENT_ID': 'TEST_CLIENT_ID',
    'SWING_SSO_CLIENT_SECRET': 'test-secret-123',
    'SWING_SSO_COMPANY_CODE': 'VN',
    'IS_SWING_SSO_ENABLED': '1',
}
for k, v in configs.items():
    InstanceConfiguration.objects.update_or_create(key=k, defaults={'value': v, 'is_encrypted': False})
    print(f'  {k} = {v}')
print('Done!')
"
```

## Files

| File                       | Mô tả                           |
| -------------------------- | ------------------------------- |
| `mock_swing_sso_server.py` | Mock SSO server (Flask)         |
| `setup_mock_sso_users.py`  | Script tạo users trong Plane DB |
| `sso_json_sample.md`       | Spec gốc từ Swing API docs      |
| `.venv/`                   | Python venv có Flask            |
