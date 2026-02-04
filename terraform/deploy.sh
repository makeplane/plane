#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Extract config from terraform.tfvars
PROJECT_ID=$(grep 'project_id' terraform.tfvars | cut -d '"' -f 2)
REGION=$(grep 'region' terraform.tfvars | cut -d '"' -f 2)
DOMAIN=$(grep 'domain' terraform.tfvars | cut -d '"' -f 2 2>/dev/null || echo "")

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Plane GCP Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Project: $PROJECT_ID"
echo "Region:  $REGION"
echo "Domain:  $DOMAIN"
echo ""

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}ERROR: 'domain' variable not set in terraform.tfvars${NC}"
    echo "Add: domain = \"plane.yourdomain.com\""
    exit 1
fi

# 1. Initialize Terraform
echo -e "\n${YELLOW}[1/7] Initializing Terraform...${NC}"
terraform init -upgrade

# 2. Create Artifact Registry first
echo -e "\n${YELLOW}[2/7] Creating Artifact Registry...${NC}"
terraform apply -target=google_artifact_registry_repository.plane_repo -auto-approve

# 3. Configure Docker Auth
echo -e "\n${YELLOW}[3/7] Configuring Docker authentication...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# 4. Build and Push Images
REPO="${REGION}-docker.pkg.dev/${PROJECT_ID}/plane-repo"

echo -e "\n${YELLOW}[4/7] Building and pushing Docker images...${NC}"

# Build arguments for frontend apps (baked in at build time for Vite)
# Empty strings = relative paths, matching docker-compose behavior with proxy
# The GCP Load Balancer routes /api/*, /god-mode/*, /spaces/*, /live/* to the correct backends
VITE_API_BASE_URL=""
VITE_ADMIN_BASE_URL=""
VITE_SPACE_BASE_URL=""
VITE_LIVE_BASE_URL=""
VITE_WEB_BASE_URL=""

echo "  Frontend URLs configured for relative paths (empty = proxy routing)"
echo ""

# API
echo "  Building API image..."
(cd .. && docker build --platform linux/amd64 -f apps/api/Dockerfile.api -t ${REPO}/api:latest apps/api)
docker push ${REPO}/api:latest

# Web
echo "  Building Web image..."
(cd .. && docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
  --build-arg VITE_ADMIN_BASE_URL="${VITE_ADMIN_BASE_URL}" \
  --build-arg VITE_SPACE_BASE_URL="${VITE_SPACE_BASE_URL}" \
  --build-arg VITE_LIVE_BASE_URL="${VITE_LIVE_BASE_URL}" \
  --build-arg VITE_WEB_BASE_URL="${VITE_WEB_BASE_URL}" \
  -f apps/web/Dockerfile.web -t ${REPO}/web:latest .)
docker push ${REPO}/web:latest

# Admin
echo "  Building Admin image..."
(cd .. && docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
  --build-arg VITE_ADMIN_BASE_URL="${VITE_ADMIN_BASE_URL}" \
  --build-arg VITE_SPACE_BASE_URL="${VITE_SPACE_BASE_URL}" \
  --build-arg VITE_LIVE_BASE_URL="${VITE_LIVE_BASE_URL}" \
  --build-arg VITE_WEB_BASE_URL="${VITE_WEB_BASE_URL}" \
  -f apps/admin/Dockerfile.admin -t ${REPO}/admin:latest .)
docker push ${REPO}/admin:latest

# Space
echo "  Building Space image..."
(cd .. && docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
  --build-arg VITE_ADMIN_BASE_URL="${VITE_ADMIN_BASE_URL}" \
  --build-arg VITE_SPACE_BASE_URL="${VITE_SPACE_BASE_URL}" \
  --build-arg VITE_LIVE_BASE_URL="${VITE_LIVE_BASE_URL}" \
  --build-arg VITE_WEB_BASE_URL="${VITE_WEB_BASE_URL}" \
  -f apps/space/Dockerfile.space -t ${REPO}/space:latest .)
docker push ${REPO}/space:latest

# Live
echo "  Building Live image..."
(cd .. && docker build --platform linux/amd64 -f apps/live/Dockerfile.live -t ${REPO}/live:latest .)
docker push ${REPO}/live:latest

# 5. Apply Full Terraform Infrastructure
echo -e "\n${YELLOW}[5/7] Applying Terraform infrastructure...${NC}"
terraform apply -auto-approve

# 6. Run Database Migrations
echo -e "\n${YELLOW}[6/7] Running database migrations...${NC}"
gcloud run jobs execute plane-migrator --region ${REGION} --wait

# 7. Output Results
echo -e "\n${YELLOW}[7/7] Deployment complete!${NC}"
echo ""
terraform output

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}NEXT STEPS${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "1. Configure DNS:"
LB_IP=$(terraform output -raw load_balancer_ip)
echo "   Create an A record: ${DOMAIN} → ${LB_IP}"
echo ""
echo "2. Wait for SSL certificate provisioning (15-60 minutes after DNS):"
echo "   gcloud compute ssl-certificates describe plane-ssl-cert --global"
echo ""
echo "3. Access your Plane instance:"
echo "   Main app: https://${DOMAIN}"
echo "   Admin:    https://${DOMAIN}/god-mode"
echo ""
if grep -q 'enable_iap.*true' terraform.tfvars 2>/dev/null; then
    echo "4. Configure IAP access (admin panel is protected):"
    echo "   - Go to: https://console.cloud.google.com/security/iap"
    echo "   - Add users/groups who should access /god-mode"
fi
echo ""
