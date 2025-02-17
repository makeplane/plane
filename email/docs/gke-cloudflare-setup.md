# Cloudflare DNS Configuration for GKE Email Server

## 1. Get Load Balancer IP

For GKE, we'll get a static IP instead of a hostname (unlike AWS NLB):

```bash
# Get Load Balancer IP
export LB_IP=$(kubectl get svc app-name-nlb -n app-ns \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Load Balancer IP: $LB_IP"
```

## 2. Reserve Static IP in GCP (Recommended)

```bash
# Reserve a static IP address in GCP
gcloud compute addresses create email-server-ip \
    --global \
    --ip-version IPV4

# Get the reserved IP
export STATIC_IP=$(gcloud compute addresses describe email-server-ip \
    --global \
    --format='get(address)')

# Update the service to use the static IP
kubectl patch svc app-name-nlb -n app-ns -p '{
    "spec": {
        "loadBalancerIP": "'$STATIC_IP'"
    }
}'
```

## 3. Configure Cloudflare DNS Records

```bash
#!/bin/bash

# Cloudflare configuration
CF_TOKEN="your-api-token"
CF_ZONE_ID="your-zone-id"
DOMAIN="yourdomain.com"
LB_IP=$(kubectl get svc app-name-nlb -n app-ns -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

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

# Create mail subdomain A record (pointing to Load Balancer IP)
create_or_update_record "A" "mail" "$LB_IP" 0 false

# Create MX record
create_or_update_record "MX" "@" "mail.$DOMAIN" 10 false

# Create SPF record
create_or_update_record "TXT" "@" "v=spf1 ip4:$LB_IP ~all" 0 false
```

## 4. GKE-specific Load Balancer Configuration

```yaml
# Load Balancer Service configuration for GKE
apiVersion: v1
kind: Service
metadata:
  name: app-name-nlb
  namespace: app-ns
  annotations:
    cloud.google.com/load-balancer-type: "External"
    networking.gke.io/load-balancer-type: "External"
    cloud.google.com/network-tier: "PREMIUM"  # Use Premium tier for better network performance
spec:
  type: LoadBalancer
  loadBalancerIP: STATIC_IP  # Your reserved static IP
  externalTrafficPolicy: Local  # Important for email servers
  selector:
    app: app-name
  ports:
  - name: smtp
    port: 25
    targetPort: smtp
    protocol: TCP
  - name: smtps
    port: 465
    targetPort: smtps
    protocol: TCP
  - name: submission
    port: 587
    targetPort: submission
    protocol: TCP
```

## 5. Configure GCP Firewall Rules

```bash
# Create firewall rules for email ports
gcloud compute firewall-rules create allow-email-ports \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:25,tcp:465,tcp:587 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=gke-your-cluster-name

# Verify firewall rules
gcloud compute firewall-rules list | grep allow-email-ports
```

## 6. PTR Record Setup (Reverse DNS)

For GCP, set up PTR record through Google Cloud Console:

1. Go to Cloud Console
2. Navigate to Compute Engine > VM instances
3. Click on the instance
4. Edit the Network Interface
5. Add PTR record for the static IP

Or using gcloud:
```bash
gcloud compute addresses update email-server-ip \
    --ptr-domain=mail.yourdomain.com \
    --global
```

## 7. Verify Configuration

```bash
# Check DNS resolution
for record in A MX TXT; do
    echo "Checking $record record..."
    dig $record mail.yourdomain.com
done

# Check PTR record
dig -x $LB_IP

# Test SMTP ports
for port in 25 465 587; do
    nc -zv mail.yourdomain.com $port
done
```

## 8. GKE-specific Troubleshooting

```bash
# Check Load Balancer health
kubectl describe service app-name-nlb -n app-ns

# Check GCP Load Balancer
gcloud compute forwarding-rules list

# Check backend services
gcloud compute backend-services list

# View service logs
kubectl logs -n app-ns -l app=app-name

# Check GCP firewall rules
gcloud compute firewall-rules list
```

## 9. Health Check Script

```bash
#!/bin/bash

# Configuration
DOMAIN="yourdomain.com"
LB_IP=$(kubectl get svc app-name-nlb -n app-ns -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Check DNS records
echo "Checking DNS records..."
for record in A MX TXT; do
    echo "=== $record record ==="
    dig +short $record mail.$DOMAIN
done

# Check PTR record
echo -e "\nChecking PTR record..."
dig +short -x $LB_IP

# Check SMTP ports
echo -e "\nChecking SMTP ports..."
for port in 25 465 587; do
    echo "Testing port $port..."
    nc -zv mail.$DOMAIN $port 2>&1
done

# Check Load Balancer status
echo -e "\nChecking Load Balancer status..."
kubectl get service app-name-nlb -n app-ns

# Check GCP health
echo -e "\nChecking GCP resources..."
gcloud compute forwarding-rules list --filter="IP_ADDRESS=$LB_IP"
```

Would you like me to:
1. Add monitoring setup specific to GKE?
2. Include Cloud Armor security policies?
3. Add automated backup procedures for DNS configurations?