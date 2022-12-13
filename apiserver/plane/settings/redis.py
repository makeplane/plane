import redis
import os
from django.conf import settings
from urllib.parse import urlparse


def redis_instance():
    if settings.REDIS_URL:
        ri = redis.from_url(settings.REDIS_URL, db=0)
    else:
        ri = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

    return ri
