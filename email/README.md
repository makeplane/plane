


# Required DNS Records for Receiving Mail Server

## 1. MX Record (Essential)
```
Type: MX
Host: yourdomain.com
Value: mail.yourdomain.com
Priority: 10
TTL: 3600
```

## 2. A Record (Essential)
```
Type: A
Host: mail.yourdomain.com
Value: YOUR_SERVER_IP
TTL: 3600
```

## 3. rDNS/PTR Record (Important)
```
# Set this through your hosting provider/server provider
YOUR_SERVER_IP.in-addr.arpa. IN PTR mail.yourdomain.com.
```

## 4. SPF Record (Recommended)
```
Type: TXT
Host: yourdomain.com
Value: v=spf1 ip4:YOUR_SERVER_IP -all
TTL: 3600
```

## Verification Commands
```bash
# Verify MX record
dig MX yourdomain.com

# Verify A record
dig A mail.yourdomain.com

# Verify PTR record
dig -x YOUR_SERVER_IP

# Verify SPF record
dig TXT yourdomain.com
```

## Common Issues and Solutions

1. MX Record Issues:
   - Ensure proper dot at end of domain
   - Check priority number (lower = higher priority)
   - Allow 24-48 hours for propagation

2. A Record Issues:
   - Verify IP address is correct
   - Ensure mail subdomain matches MX record

3. PTR Record Issues:
   - Must match your mail server hostname
   - Set through hosting provider
   - Essential for preventing spam classification

4. Testing Mail Server Setup:
```bash
# Test SMTP connection
telnet mail.yourdomain.com 25

# Test with real email
swaks --to test@yourdomain.com --server mail.yourdomain.com
```
