# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.core.cache import cache
from django.core.management import BaseCommand


class Command(BaseCommand):
    help = "Clear Cache before starting the server to remove stale values"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("--key", type=str, nargs="?", help="Key to clear cache")
        parser.add_argument(
            "--all",
            action="store_true",
            help="Flush the entire cache database (FLUSHDB) instead of only scoped prefix keys",
        )

    def handle(self, *args, **options):
        try:
            if options.get("key"):
                cache.delete(options["key"])
                self.stdout.write(self.style.SUCCESS(f"Cache Cleared for key: {options['key']}"))
                return

            # If user explicitly requests flushing the entire DB
            if options.get("all"):
                cache.clear()
                self.stdout.write(self.style.SUCCESS("Entire cache database cleared (FLUSHDB)"))
                return

            # Scoped cache clear using KEY_PREFIX
            key_prefix = getattr(cache, "key_prefix", None) or getattr(settings, "REDIS_KEY_PREFIX", None)

            if not key_prefix:
                self.stdout.write(
                    self.style.ERROR(
                        "Cannot clear cache: KEY_PREFIX is not configured. "
                        "Use --all if you explicitly wish to flush the entire database."
                    )
                )
                return

            if not hasattr(cache, "delete_pattern"):
                self.stdout.write(
                    self.style.ERROR(
                        "Cannot clear cache: Cache backend does not support delete_pattern(). "
                        "Use --all if you explicitly wish to flush the entire database."
                    )
                )
                return

            pattern = f"{key_prefix}:*"
            cache.delete_pattern(pattern)
            self.stdout.write(self.style.SUCCESS(f"Cache Cleared for pattern: {pattern}"))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to clear cache: {e}"))
            return
