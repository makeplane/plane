# Documentation Vectorization

This module handles fetching, processing, and vectorizing documentation from GitHub repositories to opensearch.

## Overview

The documentation system automatically syncs MDX and TXT files from configured GitHub repositories, processes them, and indexes them into a vector database for semantic search.

## Module Structure

### Core Modules

- **`github_fetcher.py`** - Fetches documentation files and commit information from GitHub
- **`document_processor.py`** - Processes and prepares documents for vectorization
- **`mdx_processor.py`** - Handles MDX file parsing and cleaning
- **`api_code_generator.py`** - Generates code examples in multiple languages for API docs
- **`mdx_to_code.py`** - Code converters (Python, Java, JS, cURL, Go, PHP)
- **`initial_feed.py`** - Legacy feed functions
- **`create_index.py`** - OpenSearch index setup

## How It Works

### 1. Initial Feed
Fetches all documentation files from configured repositories and indexes them.

```bash
# Run initial feed
python manage.py feed-docs
```

### 2. Automatic Sync
Celery Beat runs periodic sync (default: every 24 hours) to check for changes:
- Compares current commit with last processed commit
- Fetches only changed files (added/modified/removed)
- Updates vector database incrementally

### 3. Document Processing Pipeline

```
Raw MDX File
    ↓
Remove image frames
    ↓
API reference? → Generate code examples (Python, Java, JS, etc.)
    ↓
Extract section/subsection from path
    ↓
Clean control characters
    ↓
Index to vector database
```

## Configuration

Set these environment variables:

```bash
# Repository Configuration
DOCS_REPO_OWNER=makeplane
DOCS_REPO_NAME=docs,developer-docs
DOCS_BRANCH=master

# Sync Schedule
CELERY_DOCS_SYNC_ENABLED=1
CELERY_DOCS_SYNC_INTERVAL=86400  # 24 hours in seconds
```

## Usage

### Manual Feed

```bash
# Feed all documentation
python manage.py feed-docs
```

Output:
```
Starting full documentation feed for 2 repository(ies)...
Repositories: docs, developer-docs
Branch: master

[1/2] Processing repository: docs
Found 94 documentation files
Fetching and processing 94 files...
Processed: 94 documents ready for indexing
Indexing 94 documents to vector database...
✓ Indexed 94/94 documents successfully

============================================================
Summary:
  Total indexed: 188 documents
============================================================
```

### Automatic Sync

Celery Beat automatically runs the sync task based on the configured interval

## Supported File Types

- **`.mdx`** - MDX documentation files (Markdown with JSX)
- **`.txt`** - Plain text documentation files

## Features

### Incremental Sync
- Tracks last processed commit in database
- Only processes changed files on subsequent runs
- Handles added, modified, and removed files

### API Code Generation
Files in `api-reference/` paths automatically get code examples in:
- Python (requests)
- Java (Unirest)
- JavaScript (fetch)
- cURL
- Go (net/http)
- PHP (cURL)

### Error Handling
- Failed files are tracked and logged
- Sync status stored in `github_webhooks` table
- Error messages saved for debugging

## Architecture

```
GitHub Repository
       ↓
  Fetch Files
       ↓
  Process MDX
       ↓
Generate API Examples (if api-reference)
       ↓
  Clean & Parse
       ↓
Vector Database (OpenSearch)
```