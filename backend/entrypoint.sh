#!/bin/bash
set -e

# Apply migrations
echo "Running makemigrations..."
python3 manage.py makemigrations --noinput

echo "Running migrate..."
python3 manage.py migrate --noinput

echo "Initializing Celery Beat schedules..."
python3 manage.py init_celery_beat || true

# Start supervisord
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf