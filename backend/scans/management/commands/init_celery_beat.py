from django.core.management.base import BaseCommand
from django_celery_beat.models import PeriodicTask, IntervalSchedule
from django.utils import timezone

class Command(BaseCommand):
    help = "Initialize Celery Beat schedules for scans"

    def handle(self, *args, **options):
        schedule, _ = IntervalSchedule.objects.get_or_create(
            every=1,
            period=IntervalSchedule.MINUTES,
        )

        PeriodicTask.objects.get_or_create(
            name="Mark stale scans as failed",
            defaults={
                "interval": schedule,
                "task": "scans.tasks.mark_stale_scans",
                "start_time": timezone.now(),
                "enabled": True,
            },
        )

        self.stdout.write(
            self.style.SUCCESS("Celery Beat scan schedules initialized")
        )
