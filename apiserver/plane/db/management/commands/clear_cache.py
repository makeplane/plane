# Django imports
from django.core.cache import cache
from django.core.management import BaseCommand


class Command(BaseCommand):
    help = "Clear Cache before starting the server to remove stale values"

    def handle(self, *args, **options):
        try:
            cache.clear()
            self.stdout.write(self.style.SUCCESS("Cache Cleared"))
            return
        except Exception:
            # Another ClientError occurred
            self.stdout.write(self.style.ERROR("Failed to clear cache"))
            return
