from urllib.parse import urlparse

from plane.settings.storage import S3Storage


class RequestStub:
    scheme = "http"

    def get_host(self):
        return "localhost:8000"


def _configure_minio(monkeypatch, *, external_endpoint, internal_endpoint):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "access-key")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "secret-key")
    monkeypatch.setenv("AWS_S3_BUCKET_NAME", "uploads")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("AWS_S3_ENDPOINT_URL", external_endpoint)
    if internal_endpoint:
        monkeypatch.setenv("AWS_S3_INTERNAL_ENDPOINT_URL", internal_endpoint)
    else:
        monkeypatch.delenv("AWS_S3_INTERNAL_ENDPOINT_URL", raising=False)
        monkeypatch.delenv("MINIO_INTERNAL_ENDPOINT_URL", raising=False)
    monkeypatch.setenv("USE_MINIO", "1")
    monkeypatch.setenv("MINIO_ENDPOINT_SSL", "0")


def test_presigned_upload_uses_distinct_external_minio_endpoint(monkeypatch):
    _configure_minio(
        monkeypatch,
        external_endpoint="http://localhost:9100",
        internal_endpoint="http://plane-local-minio:9000",
    )

    storage = S3Storage(request=RequestStub())
    upload = storage.generate_presigned_post("workspace/file.txt", "text/plain", 100)

    target = urlparse(upload["url"])
    assert (target.scheme, target.netloc, target.path) == ("http", "localhost:9100", "/uploads")


def test_presigned_upload_uses_request_host_for_proxied_minio(monkeypatch):
    _configure_minio(
        monkeypatch,
        external_endpoint="http://plane-minio:9000/",
        internal_endpoint="http://plane-minio:9000",
    )

    storage = S3Storage(request=RequestStub())
    upload = storage.generate_presigned_post("workspace/file.txt", "text/plain", 100)

    target = urlparse(upload["url"])
    assert (target.scheme, target.netloc, target.path) == ("http", "localhost:8000", "/uploads")


def test_presigned_upload_uses_request_host_without_internal_endpoint(monkeypatch):
    _configure_minio(
        monkeypatch,
        external_endpoint="http://plane-minio:9000",
        internal_endpoint=None,
    )

    storage = S3Storage(request=RequestStub())
    upload = storage.generate_presigned_post("workspace/file.txt", "text/plain", 100)

    target = urlparse(upload["url"])
    assert (target.scheme, target.netloc, target.path) == ("http", "localhost:8000", "/uploads")
