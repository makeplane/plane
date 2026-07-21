import json
from datetime import timedelta
from types import SimpleNamespace

import pytest
from django.utils import timezone

from plane.integrations.looper.directory import DirectoryUnavailable, get_directory_snapshot


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, size):
        return self.payload


@pytest.mark.unit
def test_directory_snapshot_uses_heartbeat_and_strict_capability(settings, tmp_path, monkeypatch):
    now = timezone.now()
    credential = tmp_path / "network.json"
    credential.write_text(json.dumps({"nodeToken": "service-token"}))
    credential.chmod(0o600)
    settings.LOOPERNET_BASE_URL = "https://loopernet.example.test"
    settings.LOOPERNET_NETWORK_ID = "network-1"
    settings.LOOPERNET_SERVICE_CREDENTIAL_FILE = str(credential)
    settings.LOOPERNET_PRESENCE_MAX_AGE_SECONDS = 90
    payload = {
        "networkId": "network-1",
        "memberships": [
            {
                "nodeId": "fresh",
                "nodeName": "Fresh node",
                "lastHeartbeatAt": (now - timedelta(seconds=10)).isoformat(),
                "capabilities": {"strictDispatchV1": True},
            },
            {
                "nodeId": "stale",
                "nodeName": "Stale node",
                "lastHeartbeatAt": (now - timedelta(minutes=3)).isoformat(),
                "capabilities": {},
            },
        ],
    }
    opener = SimpleNamespace(open=lambda request, timeout: FakeResponse(payload))
    monkeypatch.setattr("plane.integrations.looper.directory.build_opener", lambda *handlers: opener)
    monkeypatch.setattr("plane.integrations.looper.directory.timezone.now", lambda: now)

    snapshot = get_directory_snapshot()

    assert snapshot.node("fresh").online is True
    assert snapshot.node("fresh").strict_dispatch_v1 is True
    assert snapshot.node("stale").online is False
    assert snapshot.node("stale").strict_dispatch_v1 is False


@pytest.mark.unit
def test_directory_rejects_insecure_remote_url_and_loose_credential(settings, tmp_path):
    credential = tmp_path / "token"
    credential.write_text("service-token")
    credential.chmod(0o600)
    settings.LOOPERNET_BASE_URL = "http://loopernet.example.test"
    settings.LOOPERNET_NETWORK_ID = "network-1"
    settings.LOOPERNET_SERVICE_CREDENTIAL_FILE = str(credential)
    with pytest.raises(DirectoryUnavailable, match="HTTPS"):
        get_directory_snapshot()

    settings.LOOPERNET_BASE_URL = "https://loopernet.example.test"
    credential.chmod(0o644)
    with pytest.raises(DirectoryUnavailable, match="group/world"):
        get_directory_snapshot()
