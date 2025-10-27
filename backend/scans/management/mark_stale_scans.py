from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from scans.models import Scan

class Command(BaseCommand):
    help = "Mark scans that have been processing for more than 2 minutes as failed."

    def handle(self, *args, **options):
        threshold = timezone.now() - timedelta(minutes=2)
        stale_scans = Scan.objects.filter(status="processing", created_at__lt=threshold)

        count = stale_scans.update(status="failed")
        if count > 0:
            self.stdout.write(self.style.WARNING(f"{count} stale scan(s) marked as failed."))
        else:
            self.stdout.write(self.style.SUCCESS("No stale scans found."))
