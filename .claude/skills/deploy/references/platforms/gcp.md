# GCP Cloud Run

## CLI
```bash
curl https://sdk.cloud.google.com | bash
gcloud auth login
gcloud config set project PROJECT_ID

gcloud run deploy SERVICE_NAME \
  --image gcr.io/PROJECT/image \
  --region us-central1 \
  --allow-unauthenticated
```

## Config: cloudbuild.yaml
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/my-app', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/my-app']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'my-app',
           '--image', 'gcr.io/$PROJECT_ID/my-app',
           '--region', 'us-central1',
           '--allow-unauthenticated']
```

## Detection
- `cloudbuild.yaml`, `app.yaml` (GAE format), Dockerfile

## Free Tier (Permanent)
- 2M requests/mo, 180K vCPU-seconds/mo, 360K GiB-seconds/mo

## Cost Optimize
- `--min-instances=0` for scale-to-zero
- Use Artifact Registry instead of GCR

## Rollback
```bash
gcloud run services update-traffic SERVICE --to-revisions=REVISION=100
```

## Best For
Containerized microservices, pay-per-request serverless, burst traffic
