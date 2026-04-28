import datetime

import pytest

from plane.bgtasks import service_gateway_sync_helpers as sg


@pytest.mark.unit
class TestServiceGatewaySyncHelpers:
    def test_extract_time_uses_utc_by_default_for_aware_datetimes(self):
        sg._service_gateway_tzinfo.cache_clear()

        event_time = datetime.datetime(
            2026,
            4,
            28,
            12,
            30,
            tzinfo=datetime.timezone.utc,
        )

        assert sg._extract_time({"start_time": event_time}) == 1230
