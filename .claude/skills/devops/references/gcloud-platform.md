# Google Cloud Platform with gcloud CLI

Comprehensive guide for gcloud CLI - command-line interface for Google Cloud Platform.

## Installation

### Linux
```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
tar -xf google-cloud-cli-linux-x86_64.tar.gz
./google-cloud-sdk/install.sh
./google-cloud-sdk/bin/gcloud init
```

### Debian/Ubuntu
```bash
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
sudo apt-get update && sudo apt-get install google-cloud-cli
```

### macOS
```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-darwin-arm.tar.gz
tar -xf google-cloud-cli-darwin-arm.tar.gz
./google-cloud-sdk/install.sh
```

## Authentication

### User Account
```bash
# Login with browser
gcloud auth login

# Login without browser (remote/headless)
gcloud auth login --no-browser

# List accounts
gcloud auth list

# Switch account
gcloud config set account user@example.com
```

### Service Account
```bash
# Activate with key file
gcloud auth activate-service-account SA_EMAIL --key-file=key.json

# Create service account
gcloud iam service-accounts create SA_NAME \
  --display-name="Service Account"

# Create key
gcloud iam service-accounts keys create key.json \
  --iam-account=SA_EMAIL

# Grant role
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/compute.admin"
```

### Service Account Impersonation (Recommended)
```bash
# Impersonate for single command
gcloud compute instances list \
  --impersonate-service-account=SA_EMAIL

# Set default impersonation
gcloud config set auth/impersonate_service_account SA_EMAIL

# Clear impersonation
gcloud config unset auth/impersonate_service_account
```

Why impersonation? Short-lived credentials, no key files, centralized management.

## Configuration Management

### Named Configurations
```bash
# Create configuration
gcloud config configurations create dev

# List configurations
gcloud config configurations list

# Activate configuration
gcloud config configurations activate dev

# Set properties
gcloud config set project my-project-dev
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a

# View properties
gcloud config list

# Delete configuration
gcloud config configurations delete dev
```

### Multi-Environment Pattern
```bash
# Development
gcloud config configurations create dev
gcloud config set project my-project-dev
gcloud config set account dev@example.com

# Staging
gcloud config configurations create staging
gcloud config set project my-project-staging
gcloud config set auth/impersonate_service_account staging-sa@project.iam.gserviceaccount.com

# Production
gcloud config configurations create prod
gcloud config set project my-project-prod
gcloud config set auth/impersonate_service_account prod-sa@project.iam.gserviceaccount.com
```

## Project Management

```bash
# List projects
gcloud projects list

# Create project
gcloud projects create PROJECT_ID --name="Project Name"

# Set active project
gcloud config set project PROJECT_ID

# Get current project
gcloud config get-value project

# Enable API
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com

# List enabled APIs
gcloud services list
```

## Output Formats

```bash
# JSON (recommended for scripting)
gcloud compute instances list --format=json

# YAML
gcloud compute instances list --format=yaml

# CSV
gcloud compute instances list --format="csv(name,zone,status)"

# Value (single field)
gcloud config get-value project --format="value()"

# Custom table
gcloud compute instances list \
  --format="table(name,zone,machineType,status)"
```

## Filtering

```bash
# Server-side filtering (efficient)
gcloud compute instances list --filter="zone:us-central1-a"
gcloud compute instances list --filter="status=RUNNING"
gcloud compute instances list --filter="name~^web-.*"

# Multiple conditions
gcloud compute instances list \
  --filter="zone:us-central1 AND status=RUNNING"

# Negation
gcloud compute instances list --filter="NOT status=TERMINATED"
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Deploy
        run: |
          gcloud run deploy my-service \
            --image=gcr.io/${{ secrets.GCP_PROJECT_ID }}/my-image \
            --region=us-central1
```

### GitLab CI
```yaml
deploy:
  image: google/cloud-sdk:alpine
  script:
    - echo $GCP_SA_KEY | base64 -d > key.json
    - gcloud auth activate-service-account --key-file=key.json
    - gcloud config set project $GCP_PROJECT_ID
    - gcloud app deploy
  only:
    - main
```

## Best Practices

### Security
- Never commit credentials
- Use service account impersonation
- Grant minimal IAM permissions
- Rotate keys regularly

### Performance
- Use server-side filtering: `--filter`
- Limit output: `--limit=10`
- Project only needed fields: `--format="value(name)"`
- Batch operations with `--async`

### Maintainability
- Use named configurations for environments
- Document commands
- Use environment variables
- Implement error handling and retries

## Troubleshooting

```bash
# Check authentication
gcloud auth list

# Re-authenticate
gcloud auth login
gcloud auth application-default login

# Check IAM permissions
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user@example.com"

# View configuration
gcloud config list

# Reset configuration
gcloud config configurations delete default
gcloud init
```

## Quick Reference

| Task | Command |
|------|---------|
| Initialize | `gcloud init` |
| Login | `gcloud auth login` |
| Set project | `gcloud config set project PROJECT_ID` |
| List resources | `gcloud [SERVICE] list` |
| Create resource | `gcloud [SERVICE] create RESOURCE` |
| Delete resource | `gcloud [SERVICE] delete RESOURCE` |
| Get help | `gcloud [SERVICE] --help` |

## Global Flags

| Flag | Purpose |
|------|---------|
| `--project` | Override project |
| `--format` | Output format (json, yaml, csv) |
| `--filter` | Server-side filter |
| `--limit` | Limit results |
| `--quiet` | Suppress prompts |
| `--verbosity` | Log level (debug, info, warning, error) |
| `--async` | Don't wait for operation |

## Resources

- gcloud Reference: https://cloud.google.com/sdk/gcloud/reference
- Installation: https://cloud.google.com/sdk/docs/install
- Authentication: https://cloud.google.com/docs/authentication
- Cheatsheet: https://cloud.google.com/sdk/docs/cheatsheet
