# Runbook — Troubleshoot LDAP / SwingSSO auth

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE, Security
**Host:** `shwsap1p` (api container)

> Auth dùng LDAP/SwingSSO bank (xem [`05-security-design.md`](../../01-system-design/05-security-design.md), [`04-network-design.md`](../../01-system-design/04-network-design.md) §5.1). Runbook xử lý sự cố đăng nhập.

---

## 1. Khi nào dùng

- User báo không đăng nhập được (sai/treo) hàng loạt
- Sau khi đổi cert LDAPS, đổi bind account, hoặc thay đổi mạng
- SSO redirect lỗi / vòng lặp

**Phân biệt nhanh:** lỗi 1 user (sai mật khẩu, account khoá) ≠ lỗi hệ thống (mọi user fail → nghi LDAP/network/cert).

---

## 2. Pre-check

```bash
# 2.1 API còn sống
curl -k https://shws.bank.local/api/health        # 200

# 2.2 Kết nối tới LDAP server (từ APP node) — port 636 LDAPS
nc -vz <LDAP_HOST> 636

# 2.3 Test bind LDAP trực tiếp
ldapsearch -H ldaps://<LDAP_HOST>:636 -x \
  -D "<BIND_DN>" -W -b "<BASE_DN>" "(uid=<test_user>)" \
  | head -20

# 2.4 Log auth trong api container
docker logs api 2>&1 | grep -iE "ldap|auth|sso|bind|tls" | tail -40
```

---

## 3. Action — theo triệu chứng

### 3.1 Mọi user fail, `nc` 636 không thông

→ Network: firewall outbound 636 bị chặn / LDAP server down.

```bash
# Kiểm route + firewall outbound (xem 04-network-design §5.1)
ip route get <LDAP_HOST>
# Phối hợp Network team mở/khôi phục 636 outbound từ 10.94.10.10
```

### 3.2 Bind fail / "invalid credentials" cho bind account

→ Bind DN/password sai hoặc account bị khoá/đổi.

```bash
docker exec api sh -lc 'env | grep -iE "LDAP|AUTH"'   # kiểm bind DN, base DN
# Cập nhật secret bind account (KeePass) → cập nhật env → restart api
docker compose ... up -d --force-recreate api worker
```

### 3.3 TLS handshake fail (LDAPS cert)

→ Cert LDAP đổi / CA chain thiếu / hết hạn.

```bash
openssl s_client -connect <LDAP_HOST>:636 -showcerts </dev/null 2>/dev/null \
  | openssl x509 -noout -dates -issuer
# Bổ sung CA bank vào trust store container/app; verify ngày hết hạn
```

### 3.4 Time skew (Kerberos/SSO nhạy thời gian)

```bash
chronyc tracking      # offset phải nhỏ; lệch giờ gây SSO/token fail
```

### 3.5 SwingSSO redirect lỗi

→ Sai callback URL / endpoint SSO / clock skew. Kiểm cấu hình SSO endpoint + `WEB_URL`/`SITE_ADDRESS` khớp `https://shws.bank.local`.

---

## 4. Verification

```bash
# Login thử bằng tài khoản test
# UI: https://shws.bank.local → đăng nhập LDAP → vào dashboard
docker logs api 2>&1 | grep -i "login" | tail
```

- [ ] Tài khoản test đăng nhập thành công
- [ ] Log api không còn lỗi bind/TLS
- [ ] `nc 636` thông, cert còn hạn, chrony offset nhỏ

---

## 5. Rollback

- Nếu vừa đổi cấu hình auth gây hỏng → revert env về giá trị cũ (KeePass lưu lịch sử), `up -d --force-recreate api`.
- Không sửa LDAP server bank (thuộc team Identity) — chỉ phối hợp.

---

## 6. Escalation

| Tình huống                  | Báo ai                     | Khi nào   |
| --------------------------- | -------------------------- | --------- |
| LDAP server bank down       | Identity/AD team + Network | NGAY (P1) |
| Cert LDAPS hết hạn          | Security + Identity team   | NGAY      |
| Mọi user mất đăng nhập (P1) | TL + SRE + Identity + Mgmt | NGAY      |
| Nghi bypass auth / lỗ hổng  | Security team              | NGAY      |

---

## 7. Liên kết

- Security design (auth): [`../../01-system-design/05-security-design.md`](../../01-system-design/05-security-design.md)
- Network outbound (636): [`../../01-system-design/04-network-design.md`](../../01-system-design/04-network-design.md) §5.1
- Incident response: [`../incident-response.md`](../incident-response.md)
