import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests
from celery import shared_task
from django.conf import settings

from plane.bgtasks import service_gateway_sync_helpers as sg
from plane.db.models import Issue
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")

SUPPORTED_EVENTS = {"issue"}
SUPPORTED_VERBS = {"created", "updated", "deleted"}


@dataclass(frozen=True)
class _EventSyncContext:
    event_data: Dict[str, Any]
    contact: Any
    venue: Any
    event_date: Optional[str]
    event_time: Optional[int]


def _build_sync_context(event_data: Dict[str, Any]) -> _EventSyncContext:
    return _EventSyncContext(
        event_data=event_data,
        contact=sg._build_event_contact(event_data),
        venue=sg._build_event_venue(event_data),
        event_date=sg._extract_date(event_data),
        event_time=sg._extract_time(event_data),
    )


def _send_request(
    session: requests.Session,
    method: str,
    url: str,
    payload: Optional[Dict[str, Any]],
    timeout: int,
    params: Optional[Dict[str, str]] = None,
) -> tuple[requests.Response, Dict[str, Any]]:
    response = session.request(method=method, url=url, json=payload, params=params, timeout=timeout)
    response.raise_for_status()

    response_json = sg._safe_response_json(response)
    error_message = sg._gateway_error_message(response_json)
    if error_message is not None:
        raise requests.HTTPError(f"Service-gateway returned error: {error_message}", response=response)

    return response, response_json


def _http_error_text(http_error: requests.HTTPError) -> str:
    response = getattr(http_error, "response", None)
    if response is None:
        return ""
    response_json = sg._safe_response_json(response)
    return sg._gateway_error_message(response_json) or response.text or ""


def _set_issue_sg_event_id(event_data: Dict[str, Any], sg_event_id: Optional[int]) -> None:
    issue_id = event_data.get("id")
    if not issue_id:
        return

    try:
        Issue.all_objects.filter(pk=issue_id).update(sg_event_id=sg_event_id)
    except Exception as exc:
        logger.warning(
            "Could not update sg_event_id for Plane work-item %s to %s: %s",
            issue_id,
            sg_event_id,
            exc,
        )


def _resolve_existing_gateway_rows(
    session: requests.Session,
    scheduled_event_api: str,
    event_data: Dict[str, Any],
    timeout: int,
) -> list[Dict[str, Optional[int]]]:
    issue_pin = sg._build_issue_pin(event_data)
    if not issue_pin or not scheduled_event_api:
        return []

    escaped_pin = issue_pin.replace("'", "''")
    _, response_json = _send_request(
        session=session,
        method="GET",
        url=scheduled_event_api,
        payload=None,
        params={"pin": f"'{escaped_pin}'"},
        timeout=timeout,
    )

    rows: list[Dict[str, Optional[int]]] = []
    seen: set[tuple[Optional[int], Optional[int]]] = set()

    for item in sg._extract_result_rows(response_json):
        scheduled_event_id = sg._int_field(item.get("id"))
        event_id = sg._int_field(item.get("event_id"))
        if event_id is None:
            pin_plus = item.get("pin_plus")
            if isinstance(pin_plus, dict):
                event_id = sg._int_field(pin_plus.get("service_gateway_event_id"))

        key = (scheduled_event_id, event_id)
        if key in seen:
            continue

        seen.add(key)
        rows.append({"scheduled_event_id": scheduled_event_id, "event_id": event_id})

    rows.sort(key=lambda row: row.get("scheduled_event_id") or 0, reverse=True)
    return rows


def _force_upcoming_status(
    session: requests.Session,
    event_api: str,
    service_gateway_event_id: int,
    timeout: int,
) -> None:
    try:
        _send_request(
            session=session,
            method="PUT",
            url=event_api,
            payload=sg._make_force_upcoming_payload(service_gateway_event_id),
            timeout=timeout,
        )
    except Exception as force_exc:
        logger.warning(
            "Could not force status=upcoming for service-gateway event id=%s: %s",
            service_gateway_event_id,
            force_exc,
        )


def _sync_created_event(
    session: requests.Session,
    event_api: str,
    scheduled_event_api: str,
    timeout: int,
    default_team_id: int,
    sync_ctx: _EventSyncContext,
) -> None:
    event_payload = sg._make_event_payload(
        sync_ctx.event_data,
        contact=sync_ctx.contact,
        venue=sync_ctx.venue,
        event_date=sync_ctx.event_date,
        event_time=sync_ctx.event_time,
    )
    event_response, event_response_json = _send_request(
        session=session,
        method="POST",
        url=event_api,
        payload=event_payload,
        timeout=timeout,
    )

    service_gateway_event_id = sg._extract_created_id(event_response_json)
    if not service_gateway_event_id:
        logger.error(
            "Failed to parse event id from service-gateway response status=%s body=%s",
            event_response.status_code,
            event_response.text,
        )
        return

    _force_upcoming_status(session, event_api, service_gateway_event_id, timeout)
    _set_issue_sg_event_id(sync_ctx.event_data, service_gateway_event_id)

    if scheduled_event_api and sync_ctx.event_date is not None and sync_ctx.event_time is not None:
        scheduled_payload = sg._make_scheduled_event_payload(
            sync_ctx.event_data,
            service_gateway_event_id,
            default_team_id=default_team_id,
            contact=sync_ctx.contact,
        )
        _, scheduled_response_json = _send_request(
            session=session,
            method="POST",
            url=scheduled_event_api,
            payload=scheduled_payload,
            timeout=timeout,
        )

        scheduled_event_id = sg._extract_created_id(scheduled_response_json)
        logger.info(
            (
                "Synced Plane work-item %s to service-gateway "
                "/api/event id=%s and /api/scheduled-event id=%s"
            ),
            sync_ctx.event_data.get("id"),
            service_gateway_event_id,
            scheduled_event_id,
        )
        return

    if scheduled_event_api:
        logger.warning(
            (
                "Synced Plane work-item %s to service-gateway /api/event id=%s, "
                "but skipped /api/scheduled-event because dt_event/tm_event is missing"
            ),
            sync_ctx.event_data.get("id"),
            service_gateway_event_id,
        )
        return

    logger.warning(
        (
            "Synced Plane work-item %s to service-gateway /api/event id=%s, "
            "but skipped /api/scheduled-event because endpoint is not configured"
        ),
        sync_ctx.event_data.get("id"),
        service_gateway_event_id,
    )


def _sync_updated_event(
    session: requests.Session,
    event_api: str,
    scheduled_event_api: str,
    timeout: int,
    default_team_id: int,
    sync_ctx: _EventSyncContext,
) -> None:
    linked_rows = _resolve_existing_gateway_rows(
        session=session,
        scheduled_event_api=scheduled_event_api,
        event_data=sync_ctx.event_data,
        timeout=timeout,
    )
    event_ids = sg._unique_positive_ints([row.get("event_id") for row in linked_rows])

    if not event_ids:
        if not scheduled_event_api:
            logger.warning(
                (
                    "Skipped update sync for Plane work-item %s because "
                    "SERVICE_GATEWAY_SCHEDULED_EVENT_API is not configured and no existing mapping was found."
                ),
                sync_ctx.event_data.get("id"),
            )
            return

        logger.warning(
            "No existing service-gateway mapping found for Plane work-item %s. Falling back to create flow.",
            sync_ctx.event_data.get("id"),
        )
        _sync_created_event(
            session=session,
            event_api=event_api,
            scheduled_event_api=scheduled_event_api,
            timeout=timeout,
            default_team_id=default_team_id,
            sync_ctx=sync_ctx,
        )
        return

    base_event_payload = sg._make_event_payload(
        sync_ctx.event_data,
        contact=sync_ctx.contact,
        venue=sync_ctx.venue,
        event_date=sync_ctx.event_date,
        event_time=sync_ctx.event_time,
    )

    for service_gateway_event_id in event_ids:
        _send_request(
            session=session,
            method="PUT",
            url=event_api,
            payload=sg._with_row_id_criteria(base_event_payload, service_gateway_event_id),
            timeout=timeout,
        )
        _force_upcoming_status(session, event_api, service_gateway_event_id, timeout)
    _set_issue_sg_event_id(sync_ctx.event_data, event_ids[0])

    if not scheduled_event_api:
        logger.warning(
            "Updated service-gateway /api/event rows for work-item %s but skipped scheduled-event (endpoint missing)",
            sync_ctx.event_data.get("id"),
        )
        return

    scheduled_event_ids = sg._unique_positive_ints([row.get("scheduled_event_id") for row in linked_rows])

    if sync_ctx.event_date is None or sync_ctx.event_time is None:
        removed_scheduled_count = 0
        if scheduled_event_ids:
            removed_scheduled_count = _delete_scheduled_rows_if_supported(
                session=session,
                scheduled_event_api=scheduled_event_api,
                timeout=timeout,
                scheduled_event_ids=scheduled_event_ids,
            )

        logger.info(
            (
                "Updated service-gateway /api/event rows for work-item %s, "
                "and removed /api/scheduled-event rows=%s because dt_event/tm_event is missing"
            ),
            sync_ctx.event_data.get("id"),
            removed_scheduled_count,
        )
        return

    scheduled_to_event = {
        row.get("scheduled_event_id"): row.get("event_id")
        for row in linked_rows
        if row.get("scheduled_event_id") is not None and row.get("event_id") in event_ids
    }

    updated_scheduled_count = 0
    for scheduled_event_id in scheduled_event_ids:
        target_event_id = scheduled_to_event.get(scheduled_event_id) or event_ids[0]
        scheduled_payload = sg._make_scheduled_event_payload(
            sync_ctx.event_data,
            target_event_id,
            default_team_id=default_team_id,
            contact=sync_ctx.contact,
        )
        _send_request(
            session=session,
            method="PUT",
            url=scheduled_event_api,
            payload=sg._with_row_id_criteria(scheduled_payload, scheduled_event_id),
            timeout=timeout,
        )
        updated_scheduled_count += 1

    if updated_scheduled_count > 0:
        logger.info(
            (
                "Updated service-gateway rows for Plane work-item %s "
                "(event rows=%s, scheduled-event rows=%s)"
            ),
            sync_ctx.event_data.get("id"),
            len(event_ids),
            updated_scheduled_count,
        )
        return

    scheduled_payload = sg._make_scheduled_event_payload(
        sync_ctx.event_data,
        event_ids[0],
        default_team_id=default_team_id,
        contact=sync_ctx.contact,
    )
    _, scheduled_response_json = _send_request(
        session=session,
        method="POST",
        url=scheduled_event_api,
        payload=scheduled_payload,
        timeout=timeout,
    )

    scheduled_event_id = sg._extract_created_id(scheduled_response_json)
    logger.info(
        (
            "Updated service-gateway /api/event rows for Plane work-item %s "
            "and created /api/scheduled-event id=%s"
        ),
        sync_ctx.event_data.get("id"),
        scheduled_event_id,
    )


def _delete_scheduled_rows_if_supported(
    session: requests.Session,
    scheduled_event_api: str,
    timeout: int,
    scheduled_event_ids: list[int],
) -> int:
    deleted_count = 0
    direct_delete_supported = True

    for scheduled_event_id in scheduled_event_ids:
        if direct_delete_supported:
            try:
                _send_request(
                    session=session,
                    method="DELETE",
                    url=scheduled_event_api,
                    payload=sg._make_delete_payload("scheduled_event", scheduled_event_id),
                    timeout=timeout,
                )
                deleted_count += 1
                continue
            except requests.HTTPError as http_error:
                error_text = _http_error_text(http_error)

                if "Handler not found" not in error_text:
                    logger.warning(
                        "Failed deleting /api/scheduled-event id=%s: %s",
                        scheduled_event_id,
                        error_text or http_error,
                    )
                    continue

                direct_delete_supported = False
                logger.warning(
                    (
                        "DELETE /api/scheduled-event is unavailable in service-gateway. "
                        "Falling back to soft-delete via PUT."
                    )
                )

        try:
            _send_request(
                session=session,
                method="PUT",
                url=scheduled_event_api,
                payload=sg._make_scheduled_event_soft_delete_payload(scheduled_event_id),
                timeout=timeout,
            )
            deleted_count += 1
        except requests.HTTPError as http_error:
            logger.warning(
                "Failed soft-deleting /api/scheduled-event id=%s: %s",
                scheduled_event_id,
                _http_error_text(http_error) or http_error,
            )

    return deleted_count


def _sync_deleted_event(
    session: requests.Session,
    event_api: str,
    scheduled_event_api: str,
    timeout: int,
    event_data: Dict[str, Any],
) -> None:
    linked_rows = _resolve_existing_gateway_rows(
        session=session,
        scheduled_event_api=scheduled_event_api,
        event_data=event_data,
        timeout=timeout,
    )
    event_ids = sg._unique_positive_ints([row.get("event_id") for row in linked_rows])
    if not event_ids:
        _set_issue_sg_event_id(event_data, None)
        logger.warning(
            "No service-gateway mapping found for deleted Plane work-item %s; nothing to delete.",
            event_data.get("id"),
        )
        return

    for service_gateway_event_id in event_ids:
        _send_request(
            session=session,
            method="DELETE",
            url=event_api,
            payload=sg._make_delete_payload("event", service_gateway_event_id),
            timeout=timeout,
        )

    scheduled_event_ids = sg._unique_positive_ints([row.get("scheduled_event_id") for row in linked_rows])
    deleted_scheduled_count = 0
    if scheduled_event_api and scheduled_event_ids:
        deleted_scheduled_count = _delete_scheduled_rows_if_supported(
            session=session,
            scheduled_event_api=scheduled_event_api,
            timeout=timeout,
            scheduled_event_ids=scheduled_event_ids,
        )

    logger.info(
        (
            "Deleted service-gateway rows for Plane work-item %s "
            "(event rows=%s, scheduled-event rows=%s)"
        ),
        event_data.get("id"),
        len(event_ids),
        deleted_scheduled_count,
    )
    _set_issue_sg_event_id(event_data, None)


@shared_task
def service_gateway_event_sync(event: str, verb: str, event_data: Optional[Dict[str, Any]]) -> None:
    if not getattr(settings, "SERVICE_GATEWAY_WEBHOOK_ENABLED", False):
        return

    if event not in SUPPORTED_EVENTS or verb not in SUPPORTED_VERBS:
        return

    if not isinstance(event_data, dict):
        logger.warning("Skipping service-gateway sync because event_data is invalid")
        return

    if verb == "created":
        existing_sg_event_id = sg._int_field(event_data.get("sg_event_id"))
        if existing_sg_event_id is not None and existing_sg_event_id > 0:
            logger.info(
                "Skipping service-gateway create sync for work-item %s because sg_event_id=%s already exists",
                event_data.get("id"),
                existing_sg_event_id,
            )
            return

    event_api = getattr(settings, "SERVICE_GATEWAY_EVENT_API", "")
    if not event_api:
        logger.warning("SERVICE_GATEWAY_EVENT_API is empty, skipping service-gateway sync")
        return

    scheduled_event_api = getattr(settings, "SERVICE_GATEWAY_SCHEDULED_EVENT_API", "")
    if not scheduled_event_api:
        scheduled_event_api = sg._derive_scheduled_event_api(event_api)

    timeout = int(getattr(settings, "SERVICE_GATEWAY_WEBHOOK_TIMEOUT", 30))
    default_team_id = sg._int_field(getattr(settings, "SERVICE_GATEWAY_DEFAULT_TEAM_ID", 0)) or 0

    try:
        sync_ctx = _build_sync_context(event_data)

        if verb in {"created", "updated"} and (
            sync_ctx.event_date is None or sync_ctx.event_time is None
        ):
            _set_issue_sg_event_id(sync_ctx.event_data, None)
            logger.info(
                (
                    "Skipping service-gateway %s sync for Plane work-item %s "
                    "because date/time is missing. Keeping work-item in Plane only."
                ),
                verb,
                sync_ctx.event_data.get("id"),
            )
            return

        with requests.Session() as session:
            session.headers.update({"Content-Type": "application/json"})
            handlers = {
                "created": lambda: _sync_created_event(
                    session=session,
                    event_api=event_api,
                    scheduled_event_api=scheduled_event_api,
                    timeout=timeout,
                    default_team_id=default_team_id,
                    sync_ctx=sync_ctx,
                ),
                "updated": lambda: _sync_updated_event(
                    session=session,
                    event_api=event_api,
                    scheduled_event_api=scheduled_event_api,
                    timeout=timeout,
                    default_team_id=default_team_id,
                    sync_ctx=sync_ctx,
                ),
                "deleted": lambda: _sync_deleted_event(
                    session=session,
                    event_api=event_api,
                    scheduled_event_api=scheduled_event_api,
                    timeout=timeout,
                    event_data=sync_ctx.event_data,
                ),
            }
            handlers[verb]()

    except requests.HTTPError as http_error:
        response = getattr(http_error, "response", None)
        if response is not None:
            logger.error(
                "Service-gateway webhook sync failed with HTTP %s body=%s",
                response.status_code,
                response.text,
            )
        else:
            logger.error("Service-gateway webhook sync failed with HTTP error: %s", http_error)
        log_exception(http_error)
    except Exception as exc:
        log_exception(exc)
        logger.error("Service-gateway webhook sync failed: %s", exc)
