from django.apps import AppConfig

class ScansConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "scans"

    def ready(self):
        from django_celery_beat.models import PeriodicTask, IntervalSchedule
        from django.utils import timezone

        schedule, _ = IntervalSchedule.objects.get_or_create(
            every=1,
            period=IntervalSchedule.MINUTES,
        )

        PeriodicTask.objects.get_or_create(
            interval=schedule,
            name="Mark stale scans as failed",
            task="scans.tasks.mark_stale_scans",
            defaults={"start_time": timezone.now()},
        )
