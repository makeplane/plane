# Google Cloud Services

## Compute Engine (VMs)

```bash
# List instances
gcloud compute instances list

# Create instance
gcloud compute instances create my-instance \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --boot-disk-size=10GB

# SSH into instance
gcloud compute ssh my-instance --zone=us-central1-a

# Copy files
gcloud compute scp local-file.txt my-instance:~/remote-file.txt \
  --zone=us-central1-a

# Stop instance
gcloud compute instances stop my-instance --zone=us-central1-a

# Delete instance
gcloud compute instances delete my-instance --zone=us-central1-a
```

## Google Kubernetes Engine (GKE)

```bash
# Create cluster
gcloud container clusters create my-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-medium

# Get credentials
gcloud container clusters get-credentials my-cluster --zone=us-central1-a

# List clusters
gcloud container clusters list

# Resize cluster
gcloud container clusters resize my-cluster \
  --num-nodes=5 \
  --zone=us-central1-a

# Delete cluster
gcloud container clusters delete my-cluster --zone=us-central1-a
```

## Cloud Run (Serverless Containers)

```bash
# Deploy container
gcloud run deploy my-service \
  --image=gcr.io/PROJECT_ID/my-image:tag \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated

# List services
gcloud run services list

# Describe service
gcloud run services describe my-service --region=us-central1

# Delete service
gcloud run services delete my-service --region=us-central1
```

## App Engine

```bash
# Deploy application
gcloud app deploy app.yaml

# View application
gcloud app browse

# View logs
gcloud app logs tail

# List versions
gcloud app versions list

# Delete version
gcloud app versions delete VERSION_ID

# Set traffic split
gcloud app services set-traffic SERVICE \
  --splits v1=0.5,v2=0.5
```

## Cloud Storage

```bash
# Create bucket
gsutil mb gs://my-bucket-name

# Upload file
gsutil cp local-file.txt gs://my-bucket-name/

# Download file
gsutil cp gs://my-bucket-name/file.txt ./

# List contents
gsutil ls gs://my-bucket-name/

# Sync directory
gsutil rsync -r ./local-dir gs://my-bucket-name/remote-dir

# Set permissions
gsutil iam ch user:user@example.com:objectViewer gs://my-bucket-name

# Delete bucket
gsutil rm -r gs://my-bucket-name
```

## Cloud SQL

```bash
# Create instance
gcloud sql instances create my-instance \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create my-database \
  --instance=my-instance

# Create user
gcloud sql users create my-user \
  --instance=my-instance \
  --password=PASSWORD

# Connect
gcloud sql connect my-instance --user=my-user

# Delete instance
gcloud sql instances delete my-instance
```

## Cloud Functions

```bash
# Deploy function
gcloud functions deploy my-function \
  --runtime=python39 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=main

# List functions
gcloud functions list

# Describe function
gcloud functions describe my-function

# Call function
gcloud functions call my-function

# Delete function
gcloud functions delete my-function
```

## BigQuery

```bash
# List datasets
bq ls

# Create dataset
bq mk my_dataset

# Load data
bq load --source_format=CSV my_dataset.my_table \
  gs://my-bucket/data.csv \
  schema.json

# Query
bq query --use_legacy_sql=false \
  'SELECT * FROM `my_dataset.my_table` LIMIT 10'

# Delete dataset
bq rm -r -f my_dataset
```

## Cloud Build

```bash
# Submit build
gcloud builds submit --tag=gcr.io/PROJECT_ID/my-image

# List builds
gcloud builds list

# Describe build
gcloud builds describe BUILD_ID

# Cancel build
gcloud builds cancel BUILD_ID
```

## Artifact Registry

```bash
# Create repository
gcloud artifacts repositories create my-repo \
  --repository-format=docker \
  --location=us-central1

# Configure Docker
gcloud auth configure-docker us-central1-docker.pkg.dev

# Push image
docker tag my-image us-central1-docker.pkg.dev/PROJECT_ID/my-repo/my-image
docker push us-central1-docker.pkg.dev/PROJECT_ID/my-repo/my-image

# List repositories
gcloud artifacts repositories list
```

## Networking

```bash
# Create VPC network
gcloud compute networks create my-network \
  --subnet-mode=auto

# Create firewall rule
gcloud compute firewall-rules create allow-http \
  --network=my-network \
  --allow=tcp:80

# List networks
gcloud compute networks list

# List firewall rules
gcloud compute firewall-rules list
```

## IAM

```bash
# List IAM policy
gcloud projects get-iam-policy PROJECT_ID

# Add IAM binding
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:user@example.com" \
  --role="roles/viewer"

# Remove IAM binding
gcloud projects remove-iam-policy-binding PROJECT_ID \
  --member="user:user@example.com" \
  --role="roles/viewer"

# List service accounts
gcloud iam service-accounts list
```

## Monitoring & Logging

```bash
# View logs
gcloud logging read "resource.type=gce_instance" \
  --limit=10 \
  --format=json

# Create log sink
gcloud logging sinks create my-sink \
  storage.googleapis.com/my-bucket \
  --log-filter="resource.type=gce_instance"

# List metrics
gcloud monitoring metrics-descriptors list
```

## Quick Reference

| Service | Command Prefix |
|---------|----------------|
| Compute Engine | `gcloud compute` |
| GKE | `gcloud container` |
| Cloud Run | `gcloud run` |
| App Engine | `gcloud app` |
| Cloud Storage | `gsutil` |
| BigQuery | `bq` |
| Cloud SQL | `gcloud sql` |
| Cloud Functions | `gcloud functions` |
| IAM | `gcloud iam` |

## Resources

- Compute Engine: https://cloud.google.com/compute/docs
- GKE: https://cloud.google.com/kubernetes-engine/docs
- Cloud Run: https://cloud.google.com/run/docs
- App Engine: https://cloud.google.com/appengine/docs
- Cloud Storage: https://cloud.google.com/storage/docs
