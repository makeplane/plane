# OpenSearch Management Commands

This folder contains OpenSearch Dev Tools commands for setting up and managing the vector database infrastructure.

## Overview

The management commands are organized into separate files for different aspects of the setup:

- **`ml_setup.md`** - Commands for setting up ML Commons, connectors, and models
- **`index_setup.md`** - Commands for creating indices with ingest pipelines

## Usage

1. **First-time Setup**: Run the commands in `ml_setup.md` to set up the ML infrastructure
2. **Index Creation**: Run the commands in `index_setup.md` to create the required indices
3. **Update Environment**: Update your environment variables with the generated IDs

## Automated Setup

The application includes management commands to automate this setup:

- **`init-embedding-model`**: Checks for and creates the embedding model if missing.
- **`init-vector-indexes`**: Checks for and creates required OpenSearch indices.

These are automatically run during the migration process.

## Important Notes

- These commands should be run in OpenSearch Dev Tools (Kibana/OpenSearch Dashboards)
- Replace placeholder values (like `YOUR_ML_MODEL_ID`) with actual values from previous steps
- The ML model must be deployed and ready before creating indices
- Index creation commands include ingest pipelines that automatically generate embeddings

## Environment Variables

After running the setup commands, make sure to update these environment variables:

```bash
ML_MODEL_ID=your_actual_model_id_from_ml_setup
```