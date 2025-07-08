
# Required DNS Records for Receiving Mail Server


## 1. A Record 
> `HOST-DOMAIN` points to the server running the email service  (e.g `plane.example.com`).  
This can also be replaced with CNAME record of cloud load balancer. 
```
Type: A
Host: <host-domain>
Value: <public-ip-address>
TTL: Auto | 3600
```

## 2. MX Record
> `MAIL-DOMAIN` refers to incoming email domain e.g. `intake.example.com`
```
Type: MX
Host: <mail-domain>
Value: <host-domain>
Priority: 10
TTL: Auto | 3600
```

## 3. SPF Record
```
Type: TXT
Host: <mail-domain>
Value: "v=spf1 ip4:<A-record-ip-host-domain> -all"
TTL: Auto | 3600
```

## 4. DMARC Record
```
Type: TXT
Host: _dmarc.<mail-domain>
Value: "v=DMARC1; p=reject; rua=mailto:<valid-email-addr>"
TTL: Auto | 3600
```



## Verification Commands
```bash
# Verify A record
dig A <mail-domain>

# Verify MX record
dig MX <mail-domain>

# Verify SPF record
dig TXT <mail-domain>

# Verify DMARC record
dig TXT _dmarc.<mail-domain>
```

You can also visit `https://mxtoolbox.com/` to know the issues with your DNS records configuration. 

## Common Issues and Solutions

1. MX Record Issues:
   - Ensure proper dot at end of domain
   - Check priority number (lower = higher priority)
   - Allow 24-48 hours for propagation

2. A Record Issues:
   - Verify IP address is correct
   - Ensure mail subdomain matches MX record


## Testing Mail Server Setup:
```bash
# Test SMTP connection
telnet <host-domain> 25
telnet <host-domain> 465
telnet <host-domain> 587


```
