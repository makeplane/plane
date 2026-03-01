#!/bin/bash
set -e

echo "Starting Plane AI Migrator..."

# Bootstrap database (wait for DB, apply migrations, sync LLMs)
python -m pi.manage bootstrap-db

# Check and ensure embedding model is configured
echo "Initializing embedding model..."
python -m pi.manage init-embedding-model

# Initialize OpenSearch pipelines
echo "Initializing OpenSearch pipelines..."
python -m pi.manage init-vector-pipelines

# Check and ensure OpenSearch indices are created
echo "Initializing AI OpenSearch indices..."
python -m pi.manage init-vector-indexes

echo "Migrator completed successfully!"