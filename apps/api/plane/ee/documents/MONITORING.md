# OpenSearch Queue Monitoring Guide

Comprehensive monitoring options for OpenSearch batch update Redis queues.

## ⚡ Performance Optimizations

The queue system includes several optimizations for high-performance processing:

- **LPOP with Count**: Atomic Redis operations for ~25x performance improvement
- **Compact Elements**: ~113 bytes per queue item using epoch timestamps
- **Minimal Monitoring**: Essential metrics only to reduce processing overhead
- **Chunked Processing**: 1,000 item chunks for memory efficiency

## 🚀 Quick Start

```bash
# Basic queue status
python manage.py monitor_search_queue

# Real-time monitoring
python manage.py monitor_search_queue --watch

# Detailed information
python manage.py monitor_search_queue --detailed

# JSON output for scripting
python manage.py monitor_search_queue --json
```

## 📊 Django Management Command

### Basic Usage

```bash
# Show current queue status
python manage.py monitor_search_queue

# Output:
# OpenSearch Batch Update Queue Status
# ==================================================
# Total queued items: 245
# Active models: 3/9
#
# Issue                   156 items [ACTIVE]
# Project                  89 items [ACTIVE]
# Workspace                 0 items [EMPTY]
# Module                    0 items [EMPTY]
# ...
```

### Advanced Features

```bash
# Real-time monitoring (updates every 5 seconds)
python manage.py monitor_search_queue --watch

# Custom refresh interval
python manage.py monitor_search_queue --watch --interval 10

# Monitor specific models only
python manage.py monitor_search_queue --models Issue Project

# Detailed information with timestamps
python manage.py monitor_search_queue --detailed

# Clean up stale queue entries
python manage.py monitor_search_queue --cleanup

# JSON output for automation
python manage.py monitor_search_queue --json
```

### Watch Mode

Real-time monitoring with automatic refresh:

```bash
python manage.py monitor_search_queue --watch
```

Press `Ctrl+C` to stop monitoring.

### JSON Output

For integration with monitoring tools:

```bash
python manage.py monitor_search_queue --json
```

```json
{
  "Issue": {
    "queue_length": 156,
    "oldest_timestamp": "2024-01-15T10:30:00Z",
    "newest_timestamp": "2024-01-15T10:32:00Z"
  },
  "Project": {
    "queue_length": 89,
    "oldest_timestamp": "2024-01-15T10:31:00Z",
    "newest_timestamp": "2024-01-15T10:32:00Z"
  }
}
```

## 🔧 Direct Redis CLI Monitoring

### Connect to Redis

```bash
redis-cli -h <redis-host> -p <redis-port>
```

### Queue Inspection Commands

```bash
# Check queue lengths for all models
KEYS "opensearch:batch_updates:*"

# Check specific queue length
LLEN "opensearch:batch_updates:Issue"

# View queue contents (first 10 items)
LRANGE "opensearch:batch_updates:Issue" 0 9

# View queue contents (all items - use with caution)
LRANGE "opensearch:batch_updates:Issue" 0 -1

# Check if queue exists
EXISTS "opensearch:batch_updates:Issue"

# Memory usage of a queue
MEMORY USAGE "opensearch:batch_updates:Issue"
```

### Monitoring All Queues

```bash
# Get all queue keys and their lengths
redis-cli --scan --pattern "opensearch:batch_updates:*" | xargs -I {} redis-cli LLEN {}

# One-liner to show all queue lengths
redis-cli --scan --pattern "opensearch:batch_updates:*" | while read key; do echo "$key: $(redis-cli LLEN $key)"; done
```

## 📈 Automated Monitoring Scripts

### Simple Python Monitor

```python
#!/usr/bin/env python3
"""
Simple OpenSearch queue monitor
Usage: python monitor_queue.py
"""

import os
import sys
import time
import json
from datetime import datetime

# Add Django setup
sys.path.append('/path/to/your/plane-ee/apps/api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.production')

import django
django.setup()

from plane.ee.documents import get_batch_queue_stats

def monitor_queues():
    """Monitor queues and print status."""
    while True:
        try:
            stats = get_batch_queue_stats()

            # Clear screen
            os.system('clear')

            print(f"OpenSearch Queue Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 60)

            total_items = sum(s['queue_length'] for s in stats.values())
            active_queues = sum(1 for s in stats.values() if s['queue_length'] > 0)

            print(f"Total items: {total_items}")
            print(f"Active queues: {active_queues}/{len(stats)}")
            print()

            for model, info in sorted(stats.items()):
                length = info['queue_length']
                status = "ACTIVE" if length > 0 else "EMPTY"
                print(f"{model:20} {length:>6} items [{status}]")

            time.sleep(5)

        except KeyboardInterrupt:
            print("\nMonitoring stopped.")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    monitor_queues()
```

### Shell Script Monitor

```bash
#!/bin/bash
# monitor_opensearch_queues.sh

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-}

# Function to get queue length
get_queue_length() {
    local queue_key="$1"
    if [ -n "$REDIS_PASSWORD" ]; then
        redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD LLEN "$queue_key" 2>/dev/null
    else
        redis-cli -h $REDIS_HOST -p $REDIS_PORT LLEN "$queue_key" 2>/dev/null
    fi
}

# Function to monitor queues
monitor_queues() {
    while true; do
        clear
        echo "OpenSearch Queue Monitor - $(date)"
        echo "================================"

        total_items=0
        active_queues=0

        # Get all queue keys
        if [ -n "$REDIS_PASSWORD" ]; then
            keys=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD --scan --pattern "opensearch:batch_updates:*" 2>/dev/null)
        else
            keys=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT --scan --pattern "opensearch:batch_updates:*" 2>/dev/null)
        fi

        for key in $keys; do
            model=$(echo $key | sed 's/opensearch:batch_updates://')
            length=$(get_queue_length "$key")

            if [ "$length" -gt 0 ]; then
                status="ACTIVE"
                active_queues=$((active_queues + 1))
            else
                status="EMPTY"
            fi

            total_items=$((total_items + length))
            printf "%-20s %6s items [%s]\n" "$model" "$length" "$status"
        done

        echo ""
        echo "Total items: $total_items"
        echo "Active queues: $active_queues"

        sleep 5
    done
}

# Run monitor
monitor_queues
```

## 🚨 Health Check Scripts

### Queue Health Check

```python
#!/usr/bin/env python3
"""
Health check for OpenSearch queues
Returns exit code 0 if healthy, 1 if unhealthy
"""

import sys
import os

# Django setup
sys.path.append('/path/to/your/plane-ee/apps/api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.production')

import django
django.setup()

from plane.ee.documents import get_batch_queue_stats

def check_queue_health():
    """Check queue health and return status."""
    try:
        stats = get_batch_queue_stats()

        # Health thresholds
        MAX_QUEUE_SIZE = 1000
        TOTAL_MAX_ITEMS = 5000

        total_items = sum(s['queue_length'] for s in stats.values())
        large_queues = [
            model for model, info in stats.items()
            if info['queue_length'] > MAX_QUEUE_SIZE
        ]

        if total_items > TOTAL_MAX_ITEMS:
            print(f"CRITICAL: Total queue items ({total_items}) exceeds threshold ({TOTAL_MAX_ITEMS})")
            return 1

        if large_queues:
            print(f"WARNING: Large queues detected: {', '.join(large_queues)}")
            return 1

        print("OK: All queues healthy")
        return 0

    except Exception as e:
        print(f"ERROR: Health check failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(check_queue_health())
```

### Nagios/Icinga Check

```bash
#!/bin/bash
# nagios_opensearch_queue_check.sh

REDIS_HOST=${1:-localhost}
REDIS_PORT=${2:-6379}
WARNING_THRESHOLD=${3:-500}
CRITICAL_THRESHOLD=${4:-1000}

# Get total queue items
total_items=0
if command -v redis-cli >/dev/null 2>&1; then
    keys=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT --scan --pattern "opensearch:batch_updates:*" 2>/dev/null)
    for key in $keys; do
        length=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT LLEN "$key" 2>/dev/null)
        total_items=$((total_items + length))
    done
else
    echo "UNKNOWN: redis-cli not found"
    exit 3
fi

# Check thresholds
if [ "$total_items" -ge "$CRITICAL_THRESHOLD" ]; then
    echo "CRITICAL: OpenSearch queue has $total_items items (>= $CRITICAL_THRESHOLD)"
    exit 2
elif [ "$total_items" -ge "$WARNING_THRESHOLD" ]; then
    echo "WARNING: OpenSearch queue has $total_items items (>= $WARNING_THRESHOLD)"
    exit 1
else
    echo "OK: OpenSearch queue has $total_items items"
    exit 0
fi
```

## 📊 Grafana Dashboard Queries

### Prometheus/Grafana Integration

If you're using Prometheus with Redis exporter:

```promql
# Total queue items
sum(redis_list_length{key=~"opensearch:batch_updates:.*"})

# Queue items by model
redis_list_length{key=~"opensearch:batch_updates:.*"}

# Active queues count
count(redis_list_length{key=~"opensearch:batch_updates:.*"} > 0)
```

## 🔍 Troubleshooting

### Common Issues

1. **High queue lengths**: Check if Celery workers are running
2. **Stale items**: Run cleanup command
3. **Memory usage**: Monitor Redis memory consumption
4. **Processing delays**: Check worker logs

### Debug Commands

```bash
# Check Celery worker status
celery -A plane.celery inspect active

# Check Redis memory usage
redis-cli INFO memory

# Check queue processing logs
tail -f /var/log/plane/celery.log | grep "opensearch"
```

## 🚀 Best Practices

1. **Regular Monitoring**: Set up automated monitoring
2. **Alerts**: Configure alerts for queue thresholds
3. **Cleanup**: Run periodic cleanup of stale items
4. **Scaling**: Monitor queue trends for capacity planning
5. **Backup**: Ensure Redis persistence is configured
6. **Redis Version**: Use Redis 6.2+ for optimal LPOP performance

---

**The monitoring setup provides comprehensive visibility into OpenSearch batch update queues for optimal performance and reliability.** 📊
