# Django imports
from django.core.cache import cache
from django.core.management import BaseCommand


class Command(BaseCommand):
    help = "Clear Cache before starting the server to remove stale values"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument(
            "--key", type=str, nargs="?", help="Key to clear cache"
        )

    def handle(self, *args, **options):
        try:
            if options["key"]:
                cache.delete(options["key"])
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Cache Cleared for key: {options['key']}"
                    )
                )
                return

            cache.clear()
            self.stdout.write(self.style.SUCCESS("Cache Cleared"))
            return
        except Exception:
            # Another ClientError occurred
            self.stdout.write(self.style.ERROR("Failed to clear cache"))
            return
