# Security Test Plan (KHKT — Kế hoạch test bảo mật)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** Security team, SRE, QA

> Thiết kế bảo mật gốc: [`../01-system-design/05-security-design.md`](../01-system-design/05-security-design.md). Phối hợp Security team bank — nhiều mục cần bank phê duyệt/thực hiện.

---

## 1. Mục tiêu

Đảm bảo SHWS đạt chuẩn bảo mật ngân hàng trước go-live: không critical vulnerability, auth không bypass được, dữ liệu mã hóa đúng, audit đầy đủ.

## 2. Phạm vi

- **In scope:** container image vulnerability, OWASP Top 10 web, auth/session, TLS config, secret leak, admin panel access control, audit logging.
- **Out of scope:** pen test hạ tầng bank (network/firewall — thuộc bank Security), DDoS (air-gap nội bộ).

## 3. Ràng buộc air-gap

- Scan **offline**: Trivy với DB vulnerability tải sẵn trên build station; OWASP ZAP/Burp chạy trong bank LAN nếu Security cho phép.
- Mọi tool chạy nội bộ — không gửi dữ liệu ra ngoài.

## 4. Test areas + cases

### 4.1 Container / dependency (Trivy — offline)

```bash
# Trên build station (có DB vuln) hoặc trong bank với DB tải sẵn
trivy image --severity CRITICAL,HIGH makeplane/plane-backend:shb_vX
trivy image --severity CRITICAL,HIGH makeplane/plane-frontend:shb_vX
# Lặp cho proxy/admin/space/live + base (postgres, valkey, rabbitmq, minio)
```

- [ ] Không **CRITICAL** CVE trong mọi image deploy
- [ ] HIGH CVE: đánh giá + có kế hoạch vá (accept có lý do hoặc patch)

### 4.2 Auth & session (OWASP A07)

| Case                                                        | Pass |
| ----------------------------------------------------------- | ---- |
| LDAP/SwingSSO **không bypass** được (sai/thiếu token → 401) | ☐    |
| Session cookie có `Secure`, `HttpOnly`, `SameSite`          | ☐    |
| Token hết hạn → buộc re-auth; logout invalidate session     | ☐    |
| Brute-force login bị rate-limit / lockout                   | ☐    |
| **Local user backend TẮT trên PROD** (chỉ UAT bật)          | ☐    |

### 4.3 Web (OWASP ZAP — nếu được phép)

- [ ] A01 Broken Access Control: user không truy cập workspace/project không thuộc về mình (IDOR test)
- [ ] A03 Injection: SQLi/XSS trên input chính (issue title/desc, search)
- [ ] A05 Misconfiguration: security headers (HSTS, CSP, X-Frame-Options)
- [ ] Admin (god-mode) panel **chỉ accessible từ IP allowlist** (xem [`04-network-design.md`](../01-system-design/04-network-design.md))

### 4.4 TLS

```bash
# Kiểm cipher + protocol (nội bộ)
openssl s_client -connect shws.bank.local:443 </dev/null 2>/dev/null | openssl x509 -noout -dates
nmap --script ssl-enum-ciphers -p 443 shws.bank.local   # nếu nmap được phép
```

- [ ] TLS ≥ 1.2, cipher theo policy bank; không SSLv3/TLS1.0/1.1
- [ ] Cert bank internal CA hợp lệ, còn hạn; mTLS PG/replication verify

### 4.5 Secret leak

```bash
# Quét repo/bundle không lẫn secret thật (placeholder OK)
grep -rIEn "(password|secret|api[_-]?key|token)\s*=\s*['\"]?[A-Za-z0-9/+]{16,}" /opt/plane-app/ \
  | grep -v "<.*>"   # bỏ placeholder dạng <...>
```

- [ ] Không secret hardcode trong image/compose/repo
- [ ] Secret ở `.env`/`/opt/shws-secrets` mode 0600, không vào git
- [ ] pgBackRest cipher pass + DB password lưu KeePass

### 4.6 Audit logging

- [ ] pgaudit ghi DDL/DML/role vào log ([`06-database-design.md`](../01-system-design/06-database-design.md) §11)
- [ ] Log forward SIEM bank (514/6514)
- [ ] Retention đúng (local 30d, SIEM 5y — Thông tư 09)

## 5. Pass criteria (gate go-live)

- [ ] 0 CRITICAL CVE; HIGH có kế hoạch xử lý
- [ ] Auth không bypass; session flags đúng; PROD tắt local auth
- [ ] Admin panel IP-restricted
- [ ] TLS đạt policy; secret không leak
- [ ] Audit + SIEM forward hoạt động
- [ ] Security team bank sign-off

## 6. Vai trò

| Vai trò            | Trách nhiệm                                   |
| ------------------ | --------------------------------------------- |
| Security team bank | duyệt scope, chạy/duyệt pen test, sign-off    |
| SRE                | chạy Trivy, cấu hình TLS/headers, fix finding |
| DBA                | verify pgaudit + SIEM forward                 |

## 7. Deliverables

- Report: `plans/reports/security-test-YYYYMMDD.md` (finding theo severity, remediation, retest).
- Sign-off Security team.

## 8. Câu hỏi mở

- [ ] Bank cho phép chạy OWASP ZAP/Burp trong LAN không? Hay chỉ Security team bank thực hiện?
- [ ] Security headers (CSP) do proxy SHWS hay policy bank cấu hình?
- [ ] Có yêu cầu pen test bên thứ 3 (external audit) trước go-live?

## 9. Liên kết

- Security design: [`../01-system-design/05-security-design.md`](../01-system-design/05-security-design.md)
- Network (admin allowlist, SIEM): [`../01-system-design/04-network-design.md`](../01-system-design/04-network-design.md)
- LDAP/SSO troubleshoot: [`../03-operations/runbooks/ldap-sso-troubleshoot.md`](../03-operations/runbooks/ldap-sso-troubleshoot.md)
