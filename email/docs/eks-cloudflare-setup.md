# Cloudflare DNS Configuration for EKS Email Server

## 1. Get NLB Endpoint

First, get your AWS NLB endpoint:

```bash
# Get NLB endpoint
export NLB_ENDPOINT=$(kubectl get svc app-name-nlb -n app-ns \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "NLB Endpoint: $NLB_ENDPOINT"
```

## 2. Configure Cloudflare DNS Records

### Using Cloudflare API Script

```bash
#!/bin/bash

# Cloudflare configuration
CF_TOKEN="your-api-token"
CF_ZONE_ID="your-zone-id"
DOMAIN="yourdomain.com"
NLB_ENDPOINT=$(kubectl get svc app-name-nlb -n app-ns -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Function to create/update DNS record
create_or_update_record() {
    local type=$1
    local name=$2
    local content=$3
    local priority=$4
    local proxied=${5:-false}

    # Check if record exists
    RECORD_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=$type&name=$name.$DOMAIN" \
        -H "Authorization: Bearer $CF_TOKEN" \
        -H "Content-Type: application/json" | jq -r '.result[0].id')

    if [ "$RECORD_ID" != "null" ]; then
        # Update existing record
        echo "Updating $type record for $name.$DOMAIN"
        RESULT=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$RECORD_ID" \
            -H "Authorization: Bearer $CF_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "'$type'",
                "name": "'$name'",
                "content": "'$content'",
                "proxied": '$proxied',
                "priority": '$priority'
            }')
    else
        # Create new record
        echo "Creating $type record for $name.$DOMAIN"
        RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CF_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "'$type'",
                "name": "'$name'",
                "content": "'$content'",
                "proxied": '$proxied',
                "priority": '$priority'
            }')
    fi

    if echo "$RESULT" | jq -e '.success' >/dev/null; then
        echo "$type record for $name.$DOMAIN configured successfully"
    else
        echo "Failed to configure $type record for $name.$DOMAIN"
        echo "$RESULT" | jq '.errors'
    fi
}

# Create mail subdomain CNAME record (pointing to NLB)
create_or_update_record "CNAME" "mail" "$NLB_ENDPOINT" 0 false

# Create MX record
create_or_update_record "MX" "@" "mail.$DOMAIN" 10 false

# Create SPF record
create_or_update_record "TXT" "@" "v=spf1 include:mail.$DOMAIN ~all" 0 false
```

## 3. Important Cloudflare Settings

### Email Security Settings:
1. Log into Cloudflare Dashboard
2. Go to your domain
3. Navigate to Email > Settings
4. Set the following:
   - Email Security Mode: `DNS Only`
   - Remove any existing email rules that might conflict

### SSL/TLS Settings:
1. Go to SSL/TLS section
2. Set SSL/TLS encryption mode to `Full`
3. Under Edge Certificates:
   - Disable "Always Use HTTPS" for mail subdomain
   - Disable "Automatic HTTPS Rewrites"

### Network Settings:
1. Go to Network section
2. Disable proxying for mail records:
   - CNAME record should have proxy status "DNS only"
   - MX record should have proxy status "DNS only"
   - TXT record should have proxy status "DNS only"

## 4. Verify DNS Configuration

```bash
# Check CNAME record
dig CNAME mail.yourdomain.com

# Check MX record
dig MX yourdomain.com

# Check SPF record
dig TXT yourdomain.com

# Test SMTP ports
for port in 25 465 587; do
    nc -zv mail.yourdomain.com $port
done
```

## 5. PTR Record Setup

For AWS NLB, request PTR record setup through AWS Support:

```text
Subject: PTR Record Setup for Email Server NLB

Please configure PTR records for:
NLB Endpoint: [Your NLB Endpoint]
Desired PTR: mail.yourdomain.com

This is for our email server running behind an NLB in EKS.
```

## 6. Troubleshooting

### Common Issues and Solutions:

1. NLB Connection Issues:
```bash
# Check NLB health
kubectl get endpointslices -n app-ns
kubectl describe service app-name-nlb -n app-ns
```

2. DNS Propagation:
```bash
# Clear local DNS cache
sudo systemd-resolve --flush-caches

# Check DNS propagation from different locations
curl -s https://check-host.net/check-dns?host=mail.yourdomain.com
```

3. Verify Cloudflare Records:
```bash
# Get all DNS records
curl -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
     -H "Authorization: Bearer $CF_TOKEN" \
     -H "Content-Type: application/json" | jq '.'
```

## 7. Maintenance

### Regular Checks:
```bash
# Script to verify DNS health
#!/bin/bash
check_dns() {
    local domain=$1
    local record_type=$2
    echo "Checking $record_type record for $domain"
    dig +short $record_type $domain
}

domain="yourdomain.com"
check_dns "mail.$domain" "CNAME"
check_dns "$domain" "MX"
check_dns "$domain" "TXT"
```

Would you like me to:
1. Add monitoring setup for DNS health?
2. Show how to automate DNS updates with Kubernetes CRDs?
3. Add more detailed troubleshooting scenarios?