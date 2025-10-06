from django.contrib import admin
from .models import Scan


@admin.register(Scan)
class ScanAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "team",
        "requested_by",
        "url",
        "status",
        "task_arn_short",
        "capacity_provider",
        "public_ip",
        "created_at",
        "last_updated",
    )
    list_filter = ("status", "capacity_provider", "created_at", "last_updated", "team")
    search_fields = ("id", "url", "task_arn", "team__name", "requested_by__email")
    readonly_fields = ("id", "created_at", "last_updated")

    fieldsets = (
        ("Scan Info", {
            "fields": (
                "team",
                "requested_by",
                "url",
                "final_url",
                "ip_address",
                "status",
            )
        }),
        ("ECS Metadata", {
            "fields": (
                "task_arn",
                "capacity_provider",
                "public_ip",
                "private_ip",
            )
        }),
        ("Results", {
            "fields": (
                "screenshot",
                "full_code",
                "network_log",
                "title",
                "h1",
            )
        }),
        ("Raw Data", {
            "fields": (
                "http_meta",
                "requests",
                "responses",
                "links",
                "downloads",
                "intelligence",
            )
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "last_updated"),
        }),
    )

    def task_arn_short(self, obj):
        return obj.task_arn.split("/")[-1] if obj.task_arn else None
    task_arn_short.short_description = "Task ARN"
