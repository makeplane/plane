#!/bin/bash
set -e

if [ "$(id -u)" = "0" ]; then
  exec su-exec plane "$0" "$@"
fi

echo "Starting Plane AI Vector Database Feeder..."

# Display configuration
echo "Workspace ID: ${DEV_WORKSPACE_ID:-<not set>}"
echo "Feed Issues: ${FEED_ISSUES_DATA:-0}"
echo "Feed Pages: ${FEED_PAGES_DATA:-0}"
echo "Feed Docs: ${FEED_DOCS_DATA:-0}"
echo "Batch Size: ${BATCH_SIZE:-64}"

# Start the vectorization process
exec python3 -m pi.vectorizer.vectorize