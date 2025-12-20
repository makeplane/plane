#!/bin/bash
# Initialize LocalStack S3 bucket for local development
# This script runs automatically when LocalStack starts

set -e

echo "Creating S3 bucket for Plane uploads..."
awslocal s3 mb s3://uploads || true

echo "LocalStack S3 bucket 'uploads' ready"
