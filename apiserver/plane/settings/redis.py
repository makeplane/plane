import redis
import os
from django.conf import settings
from urllib.parse import urlparse


def redis_instance():
    if settings.REDIS_URL:
        tls_url = os.environ.get("REDIS_TLS_URL", False)
        url = urlparse(settings.REDIS_URL)
        if tls_url:
            url = urlparse(tls_url)
        ri = redis.Redis(
            host=url.hostname,
            port=url.port,
            password=url.password,
            ssl=True,
            ssl_cert_reqs=None,
        )
    else:
        ri = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

    return ri
