from django.core.management.base import BaseCommand, CommandError
from scans.tasks import initiate_scan
from users.models import Team
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Test the initiate_scan Celery task directly"

    def add_arguments(self, parser):
        parser.add_argument("--team", type=str, required=True, help="Team UUID")
        parser.add_argument("--user", type=str, required=True, help="User UUID")
        parser.add_argument("--url", type=str, required=True, help="Target URL to scan")
        parser.add_argument(
            "--async",
            action="store_true",
            help="Run with Celery async .delay() instead of blocking",
        )

    def handle(self, *args, **options):
        team_id = options["team"]
        user_id = options["user"]
        url = options["url"]

        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            raise CommandError(f"Team {team_id} not found")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise CommandError(f"User {user_id} not found")

        if options["async"]:
            task = initiate_scan.delay(team.id, user.id, url)
            self.stdout.write(self.style.SUCCESS(f"Task enqueued: {task.id}"))
        else:
            result = initiate_scan(team.id, user.id, url)
            self.stdout.write(self.style.SUCCESS(f"Task finished: {result}"))
