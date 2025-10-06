from django.db import models
import uuid


class Scan(models.Model):
    STATUS_CHOICES = [
        ("processing", "Processing"),
        ("complete", "Complete"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey("users.Team", on_delete=models.CASCADE, related_name="scans")
    requested_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="processing")

    url = models.URLField()
    final_url = models.URLField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    task_arn = models.CharField(max_length=500, blank=True, null=True)
    capacity_provider = models.CharField(max_length=50, blank=True, null=True)
    public_ip = models.GenericIPAddressField(blank=True, null=True)
    private_ip = models.GenericIPAddressField(blank=True, null=True)

    screenshot = models.CharField(max_length=500, blank=True, null=True)  # S3 key
    full_code = models.CharField(max_length=500, blank=True, null=True)  # S3 key
    network_log = models.CharField(max_length=500, blank=True, null=True)

    title = models.CharField(max_length=500, blank=True, null=True)
    h1 = models.CharField(max_length=500, blank=True, null=True)

    http_meta = models.JSONField(default=dict, blank=True)
    requests = models.JSONField(default=list, blank=True)
    responses = models.JSONField(default=list, blank=True)
    links = models.JSONField(default=list, blank=True)
    downloads = models.JSONField(default=list, blank=True)
    intelligence = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    def duration_seconds(self) -> float | None:
        if self.status == "complete" and self.created_at and self.last_updated:
            return (self.last_updated - self.created_at).total_seconds()
        return None

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Scan {self.id} [{self.status}] ({self.url})"
