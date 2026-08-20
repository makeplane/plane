import logging

from plane.app.views.media_library import _get_upload_trace_fields, _log_media_upload_event


class DummyRequest:
    headers = {
        "X-Upload-ID": " upload-20260818T130800Z-game-clip ",
        "X-Request-ID": " upload-20260818T130800Z-game-clip-try-1 ",
        "Cookie": "session=secret",
        "Authorization": "Bearer secret",
    }


def test_get_upload_trace_fields_preserves_safe_correlation_fields():
    trace = _get_upload_trace_fields(
        DummyRequest(),
        {
            "upload_client": "plane-web",
            "authorization": "Bearer secret",
            "cookie": "session=secret",
        },
    )

    assert trace == {
        "upload_id": "upload-20260818T130800Z-game-clip",
        "request_id": "upload-20260818T130800Z-game-clip-try-1",
        "upload_client": "plane-web",
    }


def test_log_media_upload_event_uses_structured_payload(caplog):
    with caplog.at_level(logging.INFO):
        _log_media_upload_event(
            logging.INFO,
            "request_received",
            {"upload_id": "upload-1", "request_id": "request-1"},
            workspace_slug="workspace",
            secret_token="must-not-log",
            duration_ms=25,
        )

    assert "media_library_upload_request_received" in caplog.text
    assert "upload-1" in caplog.text
    assert "request-1" in caplog.text
    assert "workspace" in caplog.text
    assert "must-not-log" not in caplog.text
