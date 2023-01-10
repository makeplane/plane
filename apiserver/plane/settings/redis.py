import redis
from django.conf import settings
from urllib.parse import urlparse

def redis_instance():
    # Run in local redis url is false
    if not settings.REDIS_URL:
        ri = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
    else:
    # Run in prod redis url is true check with dockerized value
        if settings.DOCKERIZED:
            ri = redis.from_url(settings.REDIS_URL, db=0)
        else:
            url = urlparse(settings.REDIS_URL)
            ri = redis.Redis(
                host=url.hostname,
                port=url.port,
                password=url.password,
                ssl=True,
                ssl_cert_reqs=None,
            )
    
    return ri