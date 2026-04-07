# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Plane SDK Adapter for Plane Python SDK v0.2.x

This adapter shields the rest of our codebase from SDK breaking changes by:
- Using the new resource-based PlaneClient (v0.2.x)
- Preserving existing adapter method names and return shapes
- Converting Pydantic models to plain dicts/lists

Only this file should need changes when the SDK evolves.
"""

import logging
from typing import Any
from typing import Dict
from typing import Iterable
from typing import List
from typing import Optional
from typing import Union
from typing import cast

# New SDK (v0.2.x)
from plane.client import PlaneClient  # type: ignore[attr-defined]
from plane.errors import HttpError  # type: ignore[attr-defined]
from plane.models.cycles import CreateCycle  # type: ignore[attr-defined]
from plane.models.cycles import UpdateCycle  # type: ignore[attr-defined]
from plane.models.intake import CreateIntakeWorkItem  # type: ignore[attr-defined]
from plane.models.intake import UpdateIntakeWorkItem  # type: ignore[attr-defined]
from plane.models.labels import CreateLabel  # type: ignore[attr-defined]
from plane.models.labels import UpdateLabel  # type: ignore[attr-defined]
from plane.models.modules import CreateModule as ModulesCreateModule  # type: ignore[attr-defined]
from plane.models.modules import UpdateModule as ModulesUpdateModule  # type: ignore[attr-defined]
from plane.models.pages import CreatePage  # type: ignore[attr-defined]

# Common models we will use immediately; add more as we migrate additional methods
from plane.models.projects import CreateProject  # type: ignore[attr-defined]
from plane.models.projects import UpdateProject  # type: ignore[attr-defined]
from plane.models.query_params import WorkItemQueryParams  # type: ignore[attr-defined]
from plane.models.states import CreateState  # type: ignore[attr-defined]
from plane.models.states import UpdateState  # type: ignore[attr-defined]
from plane.models.work_item_properties import CreateWorkItemProperty  # type: ignore[attr-defined]
from plane.models.work_item_properties import UpdateWorkItemProperty  # type: ignore[attr-defined]
from plane.models.work_item_types import CreateWorkItemType  # type: ignore[attr-defined]
from plane.models.work_item_types import UpdateWorkItemType  # type: ignore[attr-defined]
from plane.models.work_items import CreateWorkItem  # type: ignore[attr-defined]
from plane.models.work_items import CreateWorkItemComment  # type: ignore[attr-defined]
from plane.models.work_items import CreateWorkItemLink  # type: ignore[attr-defined]
from plane.models.work_items import UpdateWorkItem  # type: ignore[attr-defined]
from plane.models.work_items import UpdateWorkItemAttachment  # type: ignore[attr-defined]
from plane.models.work_items import UpdateWorkItemComment  # type: ignore[attr-defined]
from plane.models.work_items import UpdateWorkItemLink  # type: ignore[attr-defined]
from plane.models.work_items import WorkItemAttachmentUploadRequest  # type: ignore[attr-defined]

log = logging.getLogger(__name__)


class PlaneSDKAdapter:
    """
    Adapter that wraps Plane SDK calls and converts v1 models to plain dicts.
    This avoids pydantic version conflicts by never exposing v1 models directly.
    """

    def __init__(self, access_token: Optional[str] = None, api_key: Optional[str] = None, base_url: str = "https://api.plane.so"):
        """Initialize the v0.2 PlaneClient. base_url must not include /api/v1."""
        if not access_token and not api_key:
            raise ValueError("Either access_token or api_key must be provided")

        # The new client enforces exactly one of api_key/access_token. Prefer access_token if provided.
        if access_token and api_key:
            # Choose access_token to avoid ConfigurationError
            api_key = None

        self.client = PlaneClient(base_url=base_url, access_token=access_token, api_key=api_key)

        # Store for raw HTTP fallback when SDK Pydantic validation fails
        self._base_url = base_url
        self._access_token = access_token
        self._api_key = api_key

    def _model_to_dict(self, model: Any) -> Union[Dict[str, Any], List[Any], Any]:
        """
        Convert Pydantic v2 models to plain dictionaries.
        Handles nested models and lists recursively.
        """
        if model is None:
            return None

        # Handle lists
        if isinstance(model, list):
            return [self._model_to_dict(item) for item in model]

        # Handle dictionaries
        if isinstance(model, dict):
            return {k: self._model_to_dict(v) for k, v in model.items()}

        # Handle Pydantic v2 models
        if hasattr(model, "model_dump"):
            # Use Pydantic v2's model_dump method with mode='json' to ensure
            # all types (including enums, dates, UUIDs) are converted to JSON-compatible primitives
            data = model.model_dump(mode="json")
            # Recursively convert any remaining nested models
            return {k: self._model_to_dict(v) for k, v in data.items()}
        elif hasattr(model, "dict"):
            # Fallback for backwards compatibility
            data = model.dict()
            return {k: self._model_to_dict(v) for k, v in data.items()}

        # Return primitive types as-is
        return model

    def _filter_payload(self, data: Dict[str, Any], allowed_keys: Optional[Iterable[str]] = None, remove_none: bool = True) -> Dict[str, Any]:
        """
        Filter dictionary with options to remove None values and restrict to allowed keys.
        """
        return {k: v for k, v in data.items() if (not remove_none or v is not None) and (allowed_keys is None or k in allowed_keys)}

    def _safe_model_to_dict(self, model: Any) -> Union[Dict[str, Any], List[Any], Any]:
        """
        Safely convert Pydantic v2 models to plain dictionaries.
        Handles cases where the model might be a list or single object.
        """
        if model is None:
            return None

        # If it's already a list, handle each item
        if isinstance(model, list):
            return [self._model_to_dict(item) for item in model]

        # Otherwise, use the regular conversion
        return self._model_to_dict(model)

    def _get_current_user_id(self) -> Optional[str]:
        """Best-effort helper to fetch current user's id via v0.2 client."""
        try:
            me = self.client.users.get_me()
            # Prefer attribute access, fallback to dict conversion
            if hasattr(me, "id") and getattr(me, "id"):
                return str(getattr(me, "id"))
            me_dict = self._model_to_dict(me)
            if isinstance(me_dict, dict):
                uid = me_dict.get("id") or me_dict.get("user_id")
                return str(uid) if uid else None
        except Exception:
            pass
        return None

    # ============================================================================
    # WORKITEMS API METHODS
    # ============================================================================

    def create_work_item(
        self,
        workspace_slug: str,
        project_id: str,
        name: str,
        description_html: Optional[str] = None,
        priority: Optional[str] = None,
        state: Optional[str] = None,
        assignees: Optional[List[str]] = None,
        labels: Optional[List[str]] = None,
        start_date: Optional[str] = None,
        target_date: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Create a new work item (issue) and return as plain dict.

        Returns:
            Dict with work item data, safely converted from v1 model
        """
        try:
            data: Dict[str, Any] = {"name": name, "project_id": project_id}
            if description_html is not None:
                data["description_html"] = description_html
            if priority is not None:
                data["priority"] = priority
            # Use 'state' field - CreateWorkItem pydantic model has 'state' field, not 'state_id'
            if state is not None:
                data["state"] = state
            if assignees:
                data["assignees"] = assignees
            if labels:
                data["labels"] = labels
            if start_date:
                data["start_date"] = start_date
            if target_date:
                data["target_date"] = target_date
            # Explicitly add type_id if provided
            if kwargs.get("type_id") is not None:
                data["type_id"] = kwargs.pop("type_id")
            # Allow extra fields to pass-through (SDK DTO uses extra="ignore")

            if kwargs:
                filtered_kwargs = self._filter_payload(kwargs)
                data.update(filtered_kwargs)

            request_model = CreateWorkItem(**data)
            issue = self.client.work_items.create(workspace_slug=workspace_slug, project_id=project_id, data=request_model)

            result = self._model_to_dict(issue)
            if isinstance(result, dict):
                return result
            else:
                # Fallback if conversion didn't return a dict
                return {"data": result}

        except HttpError as e:
            log.error(f"Failed to create work item: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create work item: {str(e)}")
            raise

    def update_work_item(self, workspace_slug: str, project_id: str, issue_id: str, **update_data) -> Dict[str, Any]:
        """
        Update an existing work item and return as plain dict.

        Returns:
            Dict with updated work item data
        """
        try:
            # Map legacy fields
            payload = dict(update_data)
            # if "state" in payload and "state_id" not in payload:
            #     payload["state_id"] = payload.pop("state")

            patched = UpdateWorkItem(**payload)

            if "type_id" in payload and payload["type_id"] == "":
                original_model_dump = patched.model_dump

                def patched_model_dump(*args, **kwargs):
                    data = original_model_dump(*args, **kwargs)
                    data["type_id"] = ""
                    return data

                object.__setattr__(patched, "model_dump", patched_model_dump)

            issue = self.client.work_items.update(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=issue_id,
                data=patched,
            )

            result = self._model_to_dict(issue)
            if isinstance(result, dict):
                return result
            else:
                # Fallback if conversion didn't return a dict
                return {"data": result}

        except HttpError as e:
            log.error(f"Failed to update work item: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update work item: {str(e)}")
            raise

    def retrieve_work_item(self, workspace_slug: str, project_id: str, issue_id: str, **kwargs) -> Dict[str, Any]:
        """Retrieve a work item using v0.2 client; keep return as dict."""
        try:
            # Optional query params
            params = None
            if kwargs:
                # Only include supported params
                expand = kwargs.get("expand") or kwargs.get("fields")
                if expand:
                    from plane.models.query_params import RetrieveQueryParams  # type: ignore[attr-defined]

                    params = RetrieveQueryParams(expand=str(expand))

            wi = self.client.work_items.retrieve(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=issue_id,
                params=params,
            )
            return self._model_to_dict(wi)  # type: ignore[return-value]
        except HttpError as e:
            log.error(f"Failed to retrieve work item: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            # Handle Pydantic validation errors when using selective fields with expand
            error_str = str(e)
            if "validation error" in error_str.lower() and params:
                log.warning(f"SDK validation failed with expand, using raw HTTP fallback: {e}")
                try:
                    import httpx

                    url = f"{self._base_url}/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{issue_id}/"
                    if params and params.expand:
                        url += f"?expand={params.expand}"

                    # Use access_token or api_key for auth
                    if self._access_token:
                        headers = {"Authorization": f"Bearer {self._access_token}"}
                    else:
                        headers = {"X-API-Key": str(self._api_key)}

                    response = httpx.get(url, headers=headers, timeout=30.0)
                    response.raise_for_status()
                    return response.json()
                except Exception as fallback_error:
                    log.error(f"Fallback request failed: {fallback_error}")
                    raise e
            log.error(f"Failed to retrieve work item: {str(e)}")
            raise

    def list_work_items(self, workspace_slug: str, project_id: str, **kwargs) -> Dict[str, Any]:
        """List work items; normalize pagination to existing shape."""
        fields_param = kwargs.get("fields")

        try:
            params = None
            if kwargs:
                # Map common filters and query parameters
                per_page = kwargs.get("per_page")
                order_by = kwargs.get("order_by")
                page = kwargs.get("page")
                cursor = kwargs.get("cursor")
                expand = kwargs.get("expand")
                external_id = kwargs.get("external_id")
                external_source = kwargs.get("external_source")

                params = WorkItemQueryParams(
                    per_page=per_page,
                    page=page,
                    order_by=order_by,
                    cursor=cursor,
                    expand=expand,
                    external_id=external_id,
                    external_source=external_source,
                    fields=fields_param,
                )

            # Try SDK call - this may fail with Pydantic validation error when using sparse fields
            response = self.client.work_items.list(workspace_slug=workspace_slug, project_id=project_id, params=params)

            # Successfully got response, now convert to dict
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []

            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }

        except HttpError as e:
            log.error(f"Failed to list work items (HTTP error): {e} ({getattr(e, 'status_code', None)})")
            raise

        except Exception as e:
            # Check if this is a Pydantic validation error due to sparse fields or expand
            error_msg = str(e)
            expand_param = kwargs.get("expand")
            if "validation error" in error_msg.lower() and (fields_param or expand_param):
                log.debug(f"Pydantic validation failed when using fields='{fields_param}' or expand='{expand_param}', using raw HTTP fallback")

                # Fall back to raw HTTP request to bypass SDK's Pydantic validation
                try:
                    import httpx

                    # Build query params
                    query_params = {}
                    if fields_param:
                        query_params["fields"] = fields_param
                    if expand_param:
                        query_params["expand"] = expand_param
                    if kwargs.get("per_page"):
                        query_params["per_page"] = kwargs["per_page"]
                    if kwargs.get("page"):
                        query_params["page"] = kwargs["page"]
                    if kwargs.get("cursor"):
                        query_params["cursor"] = kwargs["cursor"]
                    if kwargs.get("order_by"):
                        query_params["order_by"] = kwargs["order_by"]

                    # Build URL using stored base_url
                    url = f"{self._base_url}/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/"

                    # Build auth headers using stored credentials
                    headers = {}
                    if self._access_token:
                        headers["Authorization"] = f"Bearer {self._access_token}"
                    elif self._api_key:
                        headers["X-Api-Key"] = self._api_key

                    # Make raw HTTP request
                    http_client = httpx.Client(headers=headers, timeout=30.0)
                    response = http_client.get(url, params=query_params)
                    response.raise_for_status()
                    data = response.json()
                    http_client.close()

                    # Extract results directly from JSON
                    results = data.get("results", [])
                    if not isinstance(results, list):
                        results = []

                    log.info(f"Raw HTTP fallback succeeded, retrieved {len(results)} work items with sparse fields")

                    return {
                        "results": results,
                        "count": len(results),
                        "total_results": data.get("total_count", len(results)),
                        "next_cursor": str(data.get("next_page_number", "")) if data.get("next_page_number") else None,
                        "prev_cursor": str(data.get("prev_page_number", "")) if data.get("prev_page_number") else None,
                    }

                except Exception as fallback_error:
                    log.error(f"Raw HTTP fallback also failed: {fallback_error}")
                    raise e  # Raise original error
            else:
                # Not a validation error or no fields param - raise original error
                log.error(f"Failed to list work items: {str(e)}")
                raise

    def list_epics(self, workspace_slug: str, project_id: str, **kwargs) -> Dict[str, Any]:
        """List epics; normalize pagination to existing shape."""
        # Note: Mimics list_work_items structure
        try:
            params = None
            if kwargs:
                # Use PaginatedQueryParams for common pagination params
                from plane.models.query_params import PaginatedQueryParams  # type: ignore[attr-defined]

                per_page = kwargs.get("per_page")
                cursor = kwargs.get("cursor")
                # expand/fields might be supported depending on SDK version, but basic listing uses PaginatedQueryParams
                # The user provided code snippet suggests it might use PaginatedQueryParams which has expand/fields in BaseQueryParams

                params = PaginatedQueryParams(
                    per_page=per_page,
                    cursor=cursor,
                    # Add other params if supported by the SDK model
                )

                # Hack: if the SDK's PaginatedQueryParams supports expand/fields/order_by via inheritance (BaseQueryParams)
                # we should set them. The user snippet shows PaginatedQueryParams inherits BaseQueryParams.
                if kwargs.get("expand"):
                    params.expand = kwargs.get("expand")
                if kwargs.get("fields"):
                    params.fields = kwargs.get("fields")
                if kwargs.get("order_by"):
                    params.order_by = kwargs.get("order_by")

            # Call SDK method
            # Assuming self.client.epics.list exists as per user request
            response = self.client.epics.list(workspace_slug=workspace_slug, project_id=project_id, params=params)

            # Successfully got response, now convert to dict
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []

            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }

        except HttpError as e:
            log.error(f"Failed to list epics (HTTP error): {e} ({getattr(e, "status_code", None)})")
            raise

        except Exception as e:
            log.error(f"Failed to list epics: {str(e)}")
            raise

    def delete_work_item(self, workspace_slug: str, project_id: str, issue_id: str) -> Dict[str, Any]:
        try:
            self.client.work_items.delete(workspace_slug=workspace_slug, project_id=project_id, work_item_id=issue_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete work item: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete work item: {str(e)}")
            raise

    def create_work_item_relation(
        self,
        workspace_slug: str,
        project_id: str,
        issue_id: str,
        relation_type: str,
        issues: List[str],
    ) -> Dict[str, Any]:
        """Create work item relations (v0.2)."""
        try:
            from plane.models.work_items import CreateWorkItemRelation

            payload = {"relation_type": relation_type, "issues": issues}
            data_model = CreateWorkItemRelation(**payload)
            resp = self.client.work_items.relations.create(workspace_slug, project_id, issue_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create work item relation: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create work item relation: {str(e)}")
            raise

    def advanced_search_work_items(
        self,
        workspace_slug: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 25,
        query: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Search and filter work items using advanced search.

        Supports free-text search by name/description/identifier AND
        AND/OR/NOT logic for complex filtering by metadata fields like
        priority, state_group, assignee_id, project_id, cycle_id, module_id, label_id.

        Args:
            workspace_slug: Workspace slug
            filters: Filter dictionary. Valid field names match IssueFilterSet exactly:
                Scalar: priority, state_group, is_archived, is_draft
                UUID (always use _id suffix): assignee_id, project_id, cycle_id, module_id,
                    label_id, state_id, created_by_id, subscriber_id, mention_id
                Date: start_date, target_date, start_date__range, target_date__range,
                    created_at__range, updated_at__range
                Multi-value: append __in to any scalar or UUID field (e.g. priority__in,
                    assignee_id__in, created_by_id__in)
                Logical: {"and": [...]}, {"or": [...]}, {"not": {...}}
            limit: Maximum number of results (default: 25)
            query: Free-text search string to match name, description, or identifier
            **kwargs: Additional parameters

        Returns:
            Dict with filtered work items
        """
        try:
            from plane.models.work_items import AdvancedSearchWorkItem  # type: ignore[attr-defined]

            params: Dict[str, Any] = {"filters": filters or {}, "limit": limit}
            if query:
                params["query"] = query
            search_params = AdvancedSearchWorkItem(**params)
            results = self.client.work_items.advanced_search(workspace_slug, search_params)

            # Convert results to list of dicts
            results_list = self._safe_model_to_dict(results)
            if not isinstance(results_list, list):
                results_list = [results_list] if results_list else []

            return {
                "results": results_list,
                "count": len(results_list),
                "total_results": len(results_list),
            }
        except HttpError as e:
            log.error(f"Failed to advanced search work items: {e} ({getattr(e, "status_code", None)})")
            raise
        except Exception as e:
            log.error(f"Failed to advanced search work items: {str(e)}")
            raise

    # ============================================================================
    # USERS API METHODS
    # ============================================================================

    def get_current_user(self) -> Dict[str, Any]:
        """Get current authenticated user info (v0.2)."""
        try:
            user = self.client.users.get_me()
            result = self._model_to_dict(user)
            if isinstance(result, dict):
                return result
            else:
                # Fallback if conversion didn't return a dict
                return {"data": result}
        except HttpError as e:
            log.error(f"Failed to get current user: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to get current user: {str(e)}")
            raise

    # ============================================================================
    # PROJECTS API METHODS
    # ============================================================================

    def create_project(
        self,
        workspace_slug: Optional[str] = None,
        name: Optional[str] = None,
        identifier: Optional[str] = None,
        description: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Create a new project and return as plain dict.

        Returns:
            Dict with project data, safely converted from v1 model
        """
        try:
            if not name or not identifier:
                raise ValueError("name and identifier are required")

            data = {
                "name": name,
                "identifier": identifier,
                "description": description or "",
            }

            if kwargs:
                filtered_kwargs = self._filter_payload(kwargs)
                data.update(filtered_kwargs)

            post_create_updates = {}
            for field in ("is_time_tracking_enabled",):
                if field in data and data[field] is not None:
                    post_create_updates[field] = data.pop(field)

            project = self.client.projects.create(workspace_slug=workspace_slug, data=CreateProject(**data))

            result = self._model_to_dict(project)
            if not isinstance(result, dict):
                result = {"data": result}

            if post_create_updates:
                project_id = result.get("id")
                if project_id:
                    try:
                        self.client.projects.update(
                            workspace_slug=workspace_slug,
                            project_id=project_id,
                            data=UpdateProject(**post_create_updates),
                        )
                        log.debug(
                            "Applied post-create updates %s to project %s",
                            list(post_create_updates.keys()),
                            project_id,
                        )
                    except Exception as update_err:
                        log.error(
                            "Failed to apply post-create updates %s to project %s: %s",
                            post_create_updates,
                            project_id,
                            update_err,
                        )
                        raise RuntimeError(
                            f"Project '{name}' was created but post-create updates failed for {list(post_create_updates.keys())}: {update_err}"
                        ) from update_err

            return result

        except HttpError as e:
            log.error(f"Failed to create project: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create project: {str(e)}")
            raise

    def list_projects(
        self, slug: Optional[str] = None, workspace_slug: Optional[str] = None, per_page: Optional[int] = 20, cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List projects and return as plain dict with pagination info.

        Returns:
            Dict containing:
            - results: List of project dicts
            - next_cursor: Cursor for next page
            - prev_cursor: Cursor for previous page
            - count: Number of items
            - total_results: Total count
        """
        try:
            effective_slug = slug or workspace_slug
            if not effective_slug:
                raise ValueError("slug (workspace_slug) is required")

            # v0.2: simple list; we ignore cursor here for now (page-based in v0.2)
            response = self.client.projects.list(workspace_slug=effective_slug)

            results_data = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results_data, list):
                results_data = [results_data] if results_data else []

            # Filter out deleted projects
            filtered_results = []
            for project in results_data:
                if isinstance(project, dict):
                    if project.get("deleted_at") is not None:
                        continue
                    filtered_results.append(project)

            result: Dict[str, Any] = {
                "results": filtered_results,
                "count": len(filtered_results),
                "total_results": getattr(response, "total_count", len(results_data)),
            }

            # v0.2 exposes next_page_number/prev_page_number; we expose as next_cursor/prev_cursor best-effort
            if hasattr(response, "next_page_number") and response.next_page_number is not None:
                result["next_cursor"] = str(response.next_page_number)
            if hasattr(response, "prev_page_number") and response.prev_page_number is not None:
                result["prev_cursor"] = str(response.prev_page_number)

            return result

        except HttpError as e:
            log.error(f"Failed to list projects: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list projects: {str(e)}")
            raise

    def retrieve_project(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        try:
            prj = self.client.projects.retrieve(workspace_slug=workspace_slug, project_id=project_id)
            result = self._model_to_dict(prj)
            if isinstance(result, dict):
                return result
            else:
                # Fallback if conversion didn't return a dict
                return {"data": result}
        except HttpError as e:
            log.error(f"Failed to retrieve project: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve project: {str(e)}")
            raise

    def update_project(self, workspace_slug: str, project_id: str, **update_data) -> Dict[str, Any]:
        try:
            patched = UpdateProject(**update_data)
            prj = self.client.projects.update(workspace_slug=workspace_slug, project_id=project_id, data=patched)
            result = self._model_to_dict(prj)
            if isinstance(result, dict):
                return result
            else:
                # Fallback if conversion didn't return a dict
                return {"data": result}
        except HttpError as e:
            log.error(f"Failed to update project: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update project: {str(e)}")
            raise

    def delete_project(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        try:
            self.client.projects.delete(workspace_slug=workspace_slug, project_id=project_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete project: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete project: {str(e)}")
            raise

    def get_project_features(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        """Get enabled project features (v0.2.1+)."""
        try:
            features = self.client.projects.get_features(workspace_slug=workspace_slug, project_id=project_id)
            result = self._model_to_dict(features)
            if isinstance(result, dict):
                return result
            else:
                return {"data": result}
        except HttpError as e:
            log.error(f"Failed to get project features: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to get project features: {str(e)}")
            raise

    def update_project_features(self, workspace_slug: str, project_id: str, **features) -> Dict[str, Any]:
        """Update project features (v0.2.1+). Enable/disable epics, cycles, modules, etc."""
        try:
            from plane.models.projects import ProjectFeature  # type: ignore[attr-defined]

            # Build feature update payload
            feature_data = {}
            for key in ["epics", "modules", "cycles", "views", "pages", "intakes", "work_item_types"]:
                if key in features and features[key] is not None:
                    feature_data[key] = features[key]

            if not feature_data:
                raise ValueError("At least one feature field must be provided")

            data_model = ProjectFeature(**feature_data)
            result = self.client.projects.update_features(workspace_slug=workspace_slug, project_id=project_id, data=data_model)
            result_dict = self._model_to_dict(result)
            if isinstance(result_dict, dict):
                return result_dict
            else:
                return {"data": result_dict}
        except HttpError as e:
            log.error(f"Failed to update project features: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update project features: {str(e)}")
            raise

    # ============================================================================
    # ASSETS API METHODS
    # ============================================================================

    def create_generic_asset_upload(self, workspace_slug: str, project_id: str, **kwargs) -> Union[Dict[str, Any], List[Any], Any]:
        """Create a generic asset upload."""
        try:
            from plane import GenericAssetUploadRequest  # type: ignore[attr-defined]

            request = GenericAssetUploadRequest(**kwargs)
            response = self.client.assets.create_generic_asset_upload(slug=workspace_slug, generic_asset_upload_request=request)
            return self._model_to_dict(response)
        except Exception as e:
            log.error(f"Failed to create generic asset upload: {str(e)}")
            raise

    def create_user_asset_upload(self, workspace_slug: str, project_id: str, **kwargs) -> Union[Dict[str, Any], List[Any], Any]:
        """Create a user asset upload."""
        try:
            from plane import UserAssetUploadRequest  # type: ignore[attr-defined]

            request = UserAssetUploadRequest(**kwargs)
            response = self.client.assets.create_user_asset_upload(user_asset_upload_request=request)
            return self._model_to_dict(response)
        except Exception as e:
            log.error(f"Failed to create user asset upload: {str(e)}")
            raise

    def get_generic_asset(self, workspace_slug: str, project_id: str, asset_id: str, **kwargs) -> Union[Dict[str, Any], List[Any], Any]:
        """Get a generic asset."""
        try:
            response = self.client.assets.get_generic_asset(asset_id=asset_id, slug=workspace_slug, **kwargs)
            return self._model_to_dict(response)
        except Exception as e:
            log.error(f"Failed to get generic asset: {str(e)}")
            raise

    def update_generic_asset(self, workspace_slug: str, project_id: str, asset_id: str, **kwargs) -> Union[Dict[str, Any], List[Any], Any]:
        """Update a generic asset."""
        try:
            response = self.client.assets.update_generic_asset(asset_id=asset_id, slug=workspace_slug, **kwargs)
            return self._model_to_dict(response)
        except Exception as e:
            log.error(f"Failed to update generic asset: {str(e)}")
            raise

    def update_user_asset(self, workspace_slug: str, project_id: str, asset_id: str, **kwargs) -> Union[Dict[str, Any], List[Any], Any]:
        """Update a user asset."""
        try:
            response = self.client.assets.update_user_asset(asset_id=asset_id, **kwargs)
            return self._model_to_dict(response)
        except Exception as e:
            log.error(f"Failed to update user asset: {str(e)}")
            raise

    def delete_user_asset(self, workspace_slug: str, project_id: str, asset_id: str) -> bool:
        """Delete a user asset."""
        try:
            self.client.assets.delete_user_asset(asset_id=asset_id)
            return True
        except Exception as e:
            log.error(f"Failed to delete user asset: {str(e)}")
            raise

    # ============================================================================
    # LABELS API METHODS
    # ============================================================================

    def list_labels(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        """List labels (v0.2)."""
        try:
            resp = self.client.labels.list(workspace_slug, project_id)
            results = self._model_to_dict(getattr(resp, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(resp, "total_count", len(results)),
                "next_cursor": str(getattr(resp, "next_page_number", "")) if getattr(resp, "next_page_number", None) else None,
                "prev_cursor": str(getattr(resp, "prev_page_number", "")) if getattr(resp, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list labels: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list labels: {str(e)}")
            raise

    def create_label(self, workspace_slug: str, project_id: str, **kwargs) -> Dict[str, Any]:
        """Create a label (v0.2). Requires name."""
        try:
            name = kwargs.get("name")
            if not name:
                raise ValueError("name is required to create a label")

            # Build payload with all supported CreateLabel fields
            payload = {"name": name}

            # Add optional fields if provided
            for field in ["color", "description", "parent", "sort_order", "external_source", "external_id"]:
                if field in kwargs and kwargs[field] is not None:
                    payload[field] = kwargs[field]

            data_model = CreateLabel(**payload)
            resp = self.client.labels.create(workspace_slug, project_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create label: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create label: {str(e)}")
            raise

    def update_label(self, workspace_slug: str, project_id: str, label_id: str, **kwargs) -> Dict[str, Any]:
        """Update a label (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            data_model = UpdateLabel(**payload)
            resp = self.client.labels.update(workspace_slug, project_id, label_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update label: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update label: {str(e)}")
            raise

    def delete_label(self, workspace_slug: str, project_id: str, label_id: str) -> Dict[str, Any]:
        """Delete a label (v0.2)."""
        try:
            self.client.labels.delete(workspace_slug, project_id, label_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete label: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete label: {str(e)}")
            raise

    def retrieve_label(self, workspace_slug: str, project_id: str, label_id: str) -> Dict[str, Any]:
        """Retrieve a label (v0.2)."""
        try:
            resp = self.client.labels.retrieve(workspace_slug, project_id, label_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve label: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve label: {str(e)}")
            raise

    # ============================================================================
    # STATES API METHODS
    # ============================================================================

    def list_states(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        """List states (v0.2)."""
        try:
            resp = self.client.states.list(workspace_slug, project_id)
            results = self._model_to_dict(getattr(resp, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(resp, "total_count", len(results)),
                "next_cursor": str(getattr(resp, "next_page_number", "")) if getattr(resp, "next_page_number", None) else None,
                "prev_cursor": str(getattr(resp, "prev_page_number", "")) if getattr(resp, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list states: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list states: {str(e)}")
            raise

    def create_state(self, workspace_slug: str, project_id: str, **kwargs) -> Dict[str, Any]:
        """Create a state (v0.2). Requires name, color, group."""
        try:
            required = {"name", "color", "group"}
            if not required.issubset(set(kwargs.keys())):
                raise ValueError("name, color, group are required to create a state")
            data_model = CreateState(**self._filter_payload(kwargs))
            resp = self.client.states.create(workspace_slug, project_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create state: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create state: {str(e)}")
            raise

    def update_state(self, workspace_slug: str, project_id: str, state_id: str, **kwargs) -> Dict[str, Any]:
        """Update a state (v0.2)."""
        try:
            data_model = UpdateState(**self._filter_payload(kwargs))
            resp = self.client.states.update(workspace_slug, project_id, state_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update state: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update state: {str(e)}")
            raise

    def retrieve_state(self, workspace_slug: str, project_id: str, state_id: str) -> Dict[str, Any]:
        """Retrieve a state (v0.2)."""
        try:
            resp = self.client.states.retrieve(workspace_slug, project_id, state_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve state: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve state: {str(e)}")
            raise

    def delete_state(self, workspace_slug: str, project_id: str, state_id: str) -> Dict[str, Any]:
        """Delete a state (v0.2)."""
        try:
            self.client.states.delete(workspace_slug, project_id, state_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete state: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete state: {str(e)}")
            raise

    # ============================================================================
    # MODULES API METHODS
    # ============================================================================

    def list_modules(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        """List modules (v0.2) with normalized pagination."""
        try:
            response = self.client.modules.list(workspace_slug, project_id)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list modules: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list modules: {str(e)}")
            raise

    def create_module(self, workspace_slug: str, project_id: str, **kwargs) -> Dict[str, Any]:
        """Create a new module (v0.2). Requires name in kwargs."""
        try:
            name = kwargs.get("name")
            if not name:
                raise ValueError("name is required to create a module")
            payload: Dict[str, Any] = {"name": name}
            for key in [
                "description",
                "start_date",
                "target_date",
                "status",
                "lead",
                "members",
                "external_source",
                "external_id",
            ]:
                if key in kwargs and kwargs[key] is not None:
                    payload[key] = kwargs[key]

            data_model = ModulesCreateModule(**payload)
            resp = self.client.modules.create(workspace_slug, project_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            # Log detailed error information
            error_details = ""
            try:
                if hasattr(e, "response") and e.response:
                    # Generic response object (requests/httpx style)
                    if hasattr(e.response, "text"):
                        error_details = f", response_text={e.response.text}"
                    elif hasattr(e.response, "content"):
                        error_details = f", response_content={e.response.content}"

                    if hasattr(e.response, "status_code"):
                        error_details += f", status={e.response.status_code}"
            except Exception:
                pass

            log.error(f"Failed to create module: {e} (status_code={getattr(e, 'status_code', None)}{error_details})")
            raise
        except Exception as e:
            log.error(f"Failed to create module: {str(e)}")
            raise

    def update_module(self, workspace_slug: str, project_id: str, module_id: str, **kwargs) -> Dict[str, Any]:
        """Update a module (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            data_model = ModulesUpdateModule(**payload)
            resp = self.client.modules.update(workspace_slug, project_id, module_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update module: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update module: {str(e)}")
            raise

    def delete_module(self, workspace_slug: str, project_id: str, module_id: str) -> Dict[str, Any]:
        """Delete a module (v0.2)."""
        try:
            self.client.modules.delete(workspace_slug, project_id, module_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete module: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete module: {str(e)}")
            raise

    def add_module_work_items(self, workspace_slug: str, project_id: str, module_id: str, issues: List[str]) -> Dict[str, Any]:
        """Add work items to a module (v0.2)."""
        try:
            # SDK expects issue_ids as positional argument, not data= keyword
            # Pass issue_ids as keyword argument to match SDK signature
            self.client.modules.add_work_items(workspace_slug, project_id, module_id, issue_ids=issues)
            # SDK method returns None, so return success response
            return {"success": True, "issues_added": len(issues)}
        except HttpError as e:
            log.error(f"Failed to add module work items: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to add module work items: {str(e)}")
            raise

    def retrieve_module(self, workspace_slug: str, project_id: str, module_id: str) -> Dict[str, Any]:
        """Retrieve a module (v0.2)."""
        try:
            resp = self.client.modules.retrieve(workspace_slug, project_id, module_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve module: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve module: {str(e)}")
            raise

    def archive_module(self, workspace_slug: str, project_id: str, module_id: str) -> Dict[str, Any]:
        """Archive a module (v0.2)."""
        try:
            self.client.modules.archive(workspace_slug, project_id, module_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to archive module: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to archive module: {str(e)}")
            raise

    def unarchive_module(self, workspace_slug: str, project_id: str, module_id: str) -> Dict[str, Any]:
        """Unarchive a module (v0.2)."""
        try:
            self.client.modules.unarchive(workspace_slug, project_id, module_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to unarchive module: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to unarchive module: {str(e)}")
            raise

    def list_archived_modules(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        """List archived modules (v0.2)."""
        try:
            response = self.client.modules.list_archived(workspace_slug, project_id)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list archived modules: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list archived modules: {str(e)}")
            raise

    def list_module_work_items(self, workspace_slug: str, project_id: str, module_id: str) -> Dict[str, Any]:
        """List work items in a module (v0.2)."""
        try:
            response = self.client.modules.list_work_items(workspace_slug, project_id, module_id)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list module work items: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list module work items: {str(e)}")
            raise

    def remove_module_work_item(self, workspace_slug: str, project_id: str, module_id: str, issue_id: str) -> Dict[str, Any]:
        """Remove a work item from a module (v0.2 remove_work_item)."""
        try:
            self.client.modules.remove_work_item(workspace_slug, project_id, module_id, issue_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to remove work item from module: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to remove work item from module: {str(e)}")
            raise

    # ============================================================================
    # PAGES API METHODS
    # ============================================================================

    def create_project_page(
        self,
        project_id: str,
        slug: Optional[str] = None,
        workspace_slug: Optional[str] = None,
        page_create_api_request: Optional[Any] = None,
        name: Optional[str] = None,
        description_html: Optional[str] = None,
        access: Optional[int] = None,
        color: Optional[str] = None,
        logo_props: Optional[dict] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a project page (v0.2)."""
        try:
            effective_slug = slug or workspace_slug
            if not effective_slug:
                raise ValueError("slug (workspace_slug) is required")
            if not project_id:
                raise ValueError("project_id is required")

            # Build payload from provided parameters
            if page_create_api_request is not None:
                if hasattr(page_create_api_request, "model_dump"):
                    payload = page_create_api_request.model_dump(exclude_none=True)
                elif hasattr(page_create_api_request, "dict"):
                    payload = page_create_api_request.dict()
                elif isinstance(page_create_api_request, dict):
                    payload = dict(page_create_api_request)
                else:
                    payload = {}
            else:
                payload = {}

            # Override with explicit parameters if provided
            if name is not None:
                payload["name"] = name
            if description_html is not None:
                payload["description_html"] = description_html
            if access is not None:
                payload["access"] = access
            if color is not None:
                payload["color"] = color
            if logo_props is not None:
                payload["logo_props"] = logo_props

            # Add any extra kwargs
            payload.update(self._filter_payload(kwargs))

            # Ensure name is present (required field)
            if "name" not in payload or not payload["name"]:
                raise ValueError("name is required to create a page")

            # Create the DTO
            data_model = CreatePage(**payload)

            # Call the SDK
            resp = self.client.pages.create_project_page(effective_slug, project_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create project page: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create project page: {str(e)}")
            raise

    def create_workspace_page(
        self,
        slug: Optional[str] = None,
        workspace_slug: Optional[str] = None,
        page_create_api_request: Optional[Any] = None,
        name: Optional[str] = None,
        description_html: Optional[str] = None,
        access: Optional[int] = None,
        color: Optional[str] = None,
        logo_props: Optional[dict] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a workspace page (v0.2)."""
        try:
            effective_slug = slug or workspace_slug
            if not effective_slug:
                raise ValueError("slug (workspace_slug) is required")

            # Build payload from provided parameters
            if page_create_api_request is not None:
                if hasattr(page_create_api_request, "model_dump"):
                    payload = page_create_api_request.model_dump(exclude_none=True)
                elif hasattr(page_create_api_request, "dict"):
                    payload = page_create_api_request.dict()
                elif isinstance(page_create_api_request, dict):
                    payload = dict(page_create_api_request)
                else:
                    payload = {}
            else:
                payload = {}

            # Override with explicit parameters if provided
            if name is not None:
                payload["name"] = name
            if description_html is not None:
                payload["description_html"] = description_html
            if access is not None:
                payload["access"] = access
            if color is not None:
                payload["color"] = color
            if logo_props is not None:
                payload["logo_props"] = logo_props

            # Add any extra kwargs
            payload.update(self._filter_payload(kwargs))

            # Ensure name is present (required field)
            if "name" not in payload or not payload["name"]:
                raise ValueError("name is required to create a page")

            # Create the DTO
            data_model = CreatePage(**payload)

            # Call the SDK
            resp = self.client.pages.create_workspace_page(effective_slug, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create workspace page: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create workspace page: {str(e)}")
            raise

    def retrieve_workspace_page(self, workspace_slug: str, page_id: str) -> Dict[str, Any]:
        """Retrieve a workspace page (v0.2)."""
        try:
            resp = self.client.pages.retrieve_workspace_page(workspace_slug, page_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve workspace page: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve workspace page: {str(e)}")
            raise

    def retrieve_project_page(self, workspace_slug: str, project_id: str, page_id: str) -> Dict[str, Any]:
        """Retrieve a project page (v0.2)."""
        try:
            resp = self.client.pages.retrieve_project_page(workspace_slug, project_id, page_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve project page: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve project page: {str(e)}")
            raise

    # ============================================================================
    # CYCLES API METHODS
    # ============================================================================

    def create_cycle(
        self,
        workspace_slug: str,
        project_id: str,
        name: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        description: Optional[str] = None,
        owned_by: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a cycle using PlaneClient v0.2 and return as dict."""
        try:
            # API requires both dates or neither - validate early
            if (start_date is None) != (end_date is None):
                raise ValueError("Both start_date and end_date are required together, or neither should be provided")

            data = {"name": name, "project_id": project_id}
            if start_date:
                data["start_date"] = start_date
            if end_date:
                data["end_date"] = end_date
            if description:
                data["description"] = description
            if not owned_by:
                owned_by = self._get_current_user_id()
            if owned_by:
                data["owned_by"] = owned_by
            else:
                # CreateCycle requires owned_by; fail early with clear message
                raise ValueError("owner could not be determined; please provide owned_by explicitly")

            # Only include kwargs that are not None to avoid sending null values to API
            if kwargs:
                filtered_kwargs = self._filter_payload(kwargs)
                data.update(filtered_kwargs)

            model = CreateCycle(**data)
            cycle = self.client.cycles.create(workspace_slug, project_id, data=model)
            return cast(Dict[str, Any], self._model_to_dict(cycle))
        except HttpError as e:
            # Try to extract detailed error message from response
            error_detail = "No detail available"
            try:
                if hasattr(e, "body") and e.body:
                    error_detail = str(e.body)
                elif hasattr(e, "response") and e.response:
                    if hasattr(e.response, "text"):
                        error_detail = e.response.text
                    elif hasattr(e.response, "content"):
                        error_detail = e.response.content.decode("utf-8") if isinstance(e.response.content, bytes) else str(e.response.content)
                elif hasattr(e, "message"):
                    error_detail = e.message
            except Exception as extract_err:
                log.error(f"Failed to extract error detail: {extract_err}")

            log.error(f"Failed to create cycle: {e} ({getattr(e, 'status_code', None)})")
            log.error(f"Cycle creation data: {data}")
            log.error(f"API error detail: {error_detail}")
            raise
        except Exception as e:
            log.error(f"Failed to create cycle: {str(e)}")
            log.error(f"Cycle creation data: {data}")
            raise

    def list_cycles(
        self,
        workspace_slug: str,
        project_id: str,
        per_page: Optional[int] = None,
        page: Optional[int] = None,
        cursor: Optional[str] = None,
        cycle_view: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List cycles with normalized pagination."""
        try:
            # Build query parameters for SDK
            params: Dict[str, Any] = {}
            if per_page is not None:
                params["per_page"] = per_page
            if page is not None:
                params["page"] = page
            if cursor is not None:
                params["cursor"] = cursor
            if cycle_view is not None:
                params["cycle_view"] = cycle_view

            # Pass params to SDK
            response = self.client.cycles.list(workspace_slug, project_id, params=params or None)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list cycles: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list cycles: {str(e)}")
            raise

    def retrieve_cycle(self, workspace_slug: str, project_id: str, cycle_id: str) -> Dict[str, Any]:
        """Get a specific cycle by ID using v0.2 client."""
        try:
            response = self.client.cycles.retrieve(workspace_slug, project_id, cycle_id)
            return cast(Dict[str, Any], self._model_to_dict(response))
        except HttpError as e:
            log.error(f"Failed to retrieve cycle: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve cycle: {str(e)}")
            raise

    def update_cycle(
        self,
        workspace_slug: str,
        project_id: str,
        cycle_id: str,
        **kwargs,
    ) -> Dict[str, Any]:
        """Update a cycle using PlaneClient v0.2 and return as dict."""
        try:
            # Build payload with only non-None values
            payload = self._filter_payload(kwargs)

            model = UpdateCycle(**payload)
            cycle = self.client.cycles.update(workspace_slug, project_id, cycle_id, data=model)
            return cast(Dict[str, Any], self._model_to_dict(cycle))
        except HttpError as e:
            log.error(f"Failed to update cycle: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update cycle: {str(e)}")
            raise

    def archive_cycle(self, workspace_slug: str, project_id: str, cycle_id: str) -> Dict[str, Any]:
        """Archive a cycle (v0.2)."""
        try:
            self.client.cycles.archive(workspace_slug, project_id, cycle_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to archive cycle: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to archive cycle: {str(e)}")
            raise

    def unarchive_cycle(self, workspace_slug: str, project_id: str, cycle_id: str) -> Dict[str, Any]:
        """Unarchive a cycle (v0.2)."""
        try:
            self.client.cycles.unarchive(workspace_slug, project_id, cycle_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to unarchive cycle: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to unarchive cycle: {str(e)}")
            raise

    def list_archived_cycles(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        """List archived cycles (v0.2)."""
        try:
            response = self.client.cycles.list_archived(workspace_slug, project_id)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list archived cycles: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list archived cycles: {str(e)}")
            raise

    def add_cycle_work_items(self, workspace_slug: str, project_id: str, cycle_id: str, issues: List[str]) -> Dict[str, Any]:
        """Add work items to a cycle (v0.2)."""
        # log all input arguments
        log.debug(f"Adding work items to cycle {workspace_slug}, {project_id}, {cycle_id}, {issues}")
        try:
            # Pass request as positional argument (not data= keyword)
            response = self.client.cycles.add_work_items(workspace_slug, project_id, cycle_id, issue_ids=issues)
            return cast(Dict[str, Any], self._model_to_dict(response))
        except HttpError as e:
            log.error(f"Failed to add work items to cycle: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to add work items to cycle: {str(e)}")
            raise

    def list_cycle_work_items(self, workspace_slug: str, project_id: str, cycle_id: str) -> Dict[str, Any]:
        """List work items in a cycle (v0.2)."""
        try:
            response = self.client.cycles.list_work_items(workspace_slug, project_id, cycle_id)
            items = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(items, list):
                items = [items] if items else []
            return {
                "results": items,
                "count": len(items),
                "total_results": getattr(response, "total_count", len(items)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list cycle work items: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list cycle work items: {str(e)}")
            raise

    def remove_cycle_work_item(self, workspace_slug: str, project_id: str, cycle_id: str, work_item_id: str) -> Dict[str, Any]:
        """Remove a work item from a cycle (v0.2 remove_work_item)."""
        try:
            self.client.cycles.remove_work_item(workspace_slug, project_id, cycle_id, work_item_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to remove work item from cycle: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to remove work item from cycle: {str(e)}")
            raise

    def transfer_cycle_work_items(self, workspace_slug: str, project_id: str, cycle_id: str, new_cycle_id: str) -> Dict[str, Any]:
        """Transfer work items between cycles (v0.2)."""
        try:
            from plane.models.cycles import TransferCycleWorkItemsRequest

            data_model = TransferCycleWorkItemsRequest(new_cycle_id=new_cycle_id)
            resp = self.client.cycles.transfer_work_items(workspace_slug, project_id, cycle_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to transfer cycle work items: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to transfer cycle work items: {str(e)}")
            raise

    def delete_cycle(self, workspace_slug: str, project_id: str, cycle_id: str) -> Dict[str, Any]:
        """Delete a cycle (v0.2)."""
        try:
            self.client.cycles.delete(workspace_slug, project_id, cycle_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete cycle: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete cycle: {str(e)}")
            raise

    # ============================================================================
    # INTAKE API METHODS
    # ============================================================================

    def create_intake_work_item(self, workspace_slug: str, project_id: str, **kwargs) -> Dict[str, Any]:
        """Create a new intake work item (v0.2).

        The SDK expects: CreateIntakeWorkItem(issue=WorkItemForIntakeRequest(name=..., ...))
        We receive flat kwargs like: name, description_html, priority
        """
        from plane.models.work_items import WorkItemForIntakeRequest  # type: ignore[attr-defined]

        try:
            # Extract issue-related fields from kwargs
            issue_fields = {}
            for field in ["name", "description", "description_html", "priority"]:
                if field in kwargs and kwargs[field] is not None:
                    issue_fields[field] = kwargs[field]

            if not issue_fields.get("name"):
                raise ValueError("'name' is required for intake work item creation")

            # Create the nested structure expected by SDK
            issue_request = WorkItemForIntakeRequest(**issue_fields)
            data_model = CreateIntakeWorkItem(issue=issue_request)

            resp = self.client.intake.create(workspace_slug, project_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create intake work item: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create intake work item: {str(e)}")
            raise

    def get_intake_work_items_list(
        self,
        workspace_slug: str,
        project_id: str,
        per_page: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List intake work items (v0.2)."""
        from plane.models.query_params import PaginatedQueryParams

        try:
            # Build query parameters using the proper SDK model
            params = None
            if per_page is not None or cursor is not None:
                params = PaginatedQueryParams(per_page=per_page, cursor=cursor)

            response = self.client.intake.list(workspace_slug, project_id, params=params)

            # Handle both dict and Pydantic model responses
            if isinstance(response, dict):
                raw_results = response.get("results", [])
                total_count = response.get("total_count", len(raw_results) if raw_results else 0)
                next_cursor = response.get("next_page_number")
                prev_cursor = response.get("prev_page_number")
            else:
                raw_results = getattr(response, "results", [])
                total_count = getattr(response, "total_count", len(raw_results) if raw_results else 0)
                next_cursor = getattr(response, "next_page_number", None)
                prev_cursor = getattr(response, "prev_page_number", None)

            results = self._model_to_dict(raw_results)
            if not isinstance(results, list):
                results = [results] if results else []

            return {
                "results": results,
                "count": len(results),
                "total_results": total_count,
                "next_cursor": str(next_cursor) if next_cursor else None,
                "prev_cursor": str(prev_cursor) if prev_cursor else None,
            }
        except HttpError as e:
            log.error(f"Failed to list intake work items: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list intake work items: {str(e)}")
            raise

    def retrieve_intake_work_item(self, workspace_slug: str, project_id: str, intake_issue_id: str) -> Dict[str, Any]:
        """Retrieve a specific intake work item (v0.2).

        Args:
            intake_issue_id: The work item (issue) ID, NOT the intake_issues table primary key.
        """
        try:
            resp = self.client.intake.retrieve(workspace_slug, project_id, intake_issue_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve intake work item: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve intake work item: {str(e)}")
            raise

    def update_intake_work_item(self, workspace_slug: str, project_id: str, intake_issue_id: str, **kwargs) -> Dict[str, Any]:
        """Update an intake work item (v0.2).

        The SDK expects issue fields in: UpdateIntakeWorkItem(issue={...})
        Non-issue fields (status, snoozed_till, duplicate_to, source, source_email) are passed directly.

        Note: WorkItemForIntakeRequest requires 'name'. If updating other issue fields without name,
        we must fetch the current name first to satisfy the SDK model validation.

        Args:
            intake_issue_id: The work item (issue) ID, NOT the intake_issues table primary key.
        """
        try:
            # Separate issue fields from other intake fields
            issue_field_names = {"name", "description", "description_html", "priority"}
            intake_field_names = {"status", "snoozed_till", "duplicate_to", "source", "source_email"}

            issue_fields = {}
            intake_fields = {}

            for k, v in kwargs.items():
                if v is not None:
                    if k in issue_field_names:
                        issue_fields[k] = v
                    elif k in intake_field_names:
                        intake_fields[k] = v

            # Build the update payload
            if issue_fields:
                # If name is missing but we have other issue fields, fetch current name
                if "name" not in issue_fields:
                    try:
                        current_item = self.retrieve_intake_work_item(workspace_slug, project_id, intake_issue_id)
                        # The retrieve response has 'issue_detail' which contains the name
                        issue_name = (current_item or {}).get("issue_detail", {}).get("name")
                        if issue_name:
                            issue_fields["name"] = issue_name
                    except Exception as e:
                        # Fallback or log if retrieval fails, though validation will likely fail next
                        log.warning(f"Failed to fetch current intake name for update: {e}")

                intake_fields["issue"] = issue_fields  # Pass as dict to let Pydantic handle it

            data_model = UpdateIntakeWorkItem(**intake_fields)
            resp = self.client.intake.update(workspace_slug, project_id, intake_issue_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update intake work item: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update intake work item: {str(e)}")
            raise

    def delete_intake_work_item(self, workspace_slug: str, project_id: str, intake_issue_id: str) -> Dict[str, Any]:
        """Delete an intake work item (v0.2).

        Args:
            intake_issue_id: The work item (issue) ID, NOT the intake_issues table primary key.
        """
        try:
            self.client.intake.delete(workspace_slug, project_id, intake_issue_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete intake work item: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete intake work item: {str(e)}")
            raise

    # ============================================================================
    # MEMBERS API METHODS
    # ============================================================================

    def get_workspace_members(self, workspace_slug: str) -> Dict[str, Any]:
        """Get list of all workspace members and their counts.
        Returns user_id, first_name, last_name, email, and display_name of each member.
        Includes bot users."""
        try:
            # SDK returns a list of UserLite objects directly, not a paginated response
            response = self.client.workspaces.get_members(workspace_slug)
            results = self._model_to_dict(response)
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": len(results),
                "next_cursor": None,
                "prev_cursor": None,
            }
        except HttpError as e:
            log.error(f"Failed to get workspace members: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to get workspace members: {str(e)}")
            raise

    def get_project_members(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        """Get list of all project members and their counts.
        Returns user_id, first_name, last_name, email, and display_name of each member.
        Includes bot users."""
        try:
            # SDK returns a list of UserLite objects directly, not a paginated response
            response = self.client.projects.get_members(workspace_slug, project_id)
            results = self._model_to_dict(response)
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": len(results),
                "next_cursor": None,
                "prev_cursor": None,
            }
        except HttpError as e:
            log.error(f"Failed to get project members: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to get project members: {str(e)}")
            raise

    # ============================================================================
    # ACTIVITY API METHODS
    # ============================================================================

    def list_work_item_activities(self, workspace_slug: str, project_id: str, issue_id: str) -> Dict[str, Any]:
        """List work item activities (v0.2). Requires issue_id - activities are work-item-specific."""
        try:
            response = self.client.work_items.activities.list(workspace_slug, project_id, issue_id)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list work item activities: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list work item activities: {str(e)}")
            raise

    def retrieve_work_item_activity(self, workspace_slug: str, project_id: str, issue_id: str, activity_id: str) -> Dict[str, Any]:
        """Retrieve a specific work item activity (v0.2)."""
        try:
            resp = self.client.work_items.activities.retrieve(workspace_slug, project_id, issue_id, activity_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve work item activity: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve work item activity: {str(e)}")
            raise

    # ============================================================================
    # ATTACHMENTS API METHODS
    # ============================================================================

    def create_work_item_attachment(self, workspace_slug: str, project_id: str, issue_id: str, **kwargs) -> Dict[str, Any]:
        """Create a work item attachment (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            data_model = WorkItemAttachmentUploadRequest(**payload)
            resp = self.client.work_items.attachments.create(workspace_slug, project_id, issue_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create work item attachment: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create work item attachment: {str(e)}")
            raise

    def list_work_item_attachments(self, workspace_slug: str, project_id: str, issue_id: Optional[str] = None) -> Dict[str, Any]:
        """List work item attachments (v0.2)."""
        try:
            if issue_id:
                response = self.client.work_items.attachments.list(workspace_slug, project_id, issue_id)
            else:
                # Best-effort: try project-level attachments list (may not be available)
                response = self.client.work_items.attachments.list(workspace_slug, project_id, "")
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list work item attachments: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list work item attachments: {str(e)}")
            raise

    def retrieve_work_item_attachment(self, workspace_slug: str, project_id: str, issue_id: str, attachment_id: str) -> Dict[str, Any]:
        """Retrieve a specific work item attachment (v0.2)."""
        try:
            resp = self.client.work_items.attachments.retrieve(workspace_slug, project_id, issue_id, attachment_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve work item attachment: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve work item attachment: {str(e)}")
            raise

    def update_work_item_attachment(self, workspace_slug: str, project_id: str, issue_id: str, attachment_id: str, **kwargs) -> Dict[str, Any]:
        """Update a work item attachment (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            data_model = UpdateWorkItemAttachment(**payload)
            resp = self.client.work_items.attachments.update(workspace_slug, project_id, issue_id, attachment_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update work item attachment: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update work item attachment: {str(e)}")
            raise

    def delete_work_item_attachment(self, workspace_slug: str, project_id: str, issue_id: str, attachment_id: str) -> Dict[str, Any]:
        """Delete a work item attachment (v0.2)."""
        try:
            self.client.work_items.attachments.delete(workspace_slug, project_id, issue_id, attachment_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete work item attachment: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete work item attachment: {str(e)}")
            raise

    # ============================================================================
    # COMMENTS API METHODS
    # ============================================================================

    def create_work_item_comment(self, workspace_slug: str, project_id: str, issue_id: str, **kwargs) -> Dict[str, Any]:
        """Create a work item comment (v0.2). Requires comment or comment_html."""
        try:
            payload = self._filter_payload(kwargs)
            data_obj = CreateWorkItemComment(**payload)
            resp = self.client.work_items.comments.create(workspace_slug, project_id, issue_id, data=data_obj)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create work item comment: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create work item comment: {str(e)}")
            raise

    def list_work_item_comments(self, workspace_slug: str, project_id: str, issue_id: Optional[str] = None) -> Dict[str, Any]:
        """List work item comments (v0.2). If issue_id is provided, list for that issue only."""
        try:
            if issue_id:
                response = self.client.work_items.comments.list(workspace_slug, project_id, issue_id)
            else:
                # Best-effort: try project-level comments list (may not be available)
                response = self.client.work_items.comments.list(workspace_slug, project_id, "")
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list work item comments: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list work item comments: {str(e)}")
            raise

    def retrieve_work_item_comment(self, workspace_slug: str, project_id: str, issue_id: str, comment_id: str) -> Dict[str, Any]:
        """Retrieve a specific work item comment (v0.2)."""
        try:
            resp = self.client.work_items.comments.retrieve(workspace_slug, project_id, issue_id, comment_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve work item comment: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve work item comment: {str(e)}")
            raise

    def update_work_item_comment(self, workspace_slug: str, project_id: str, issue_id: str, comment_id: str, **kwargs) -> Dict[str, Any]:
        """Update a work item comment (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            data_obj = UpdateWorkItemComment(**payload)
            resp = self.client.work_items.comments.update(workspace_slug, project_id, issue_id, comment_id, data=data_obj)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update work item comment: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update work item comment: {str(e)}")
            raise

    def delete_work_item_comment(self, workspace_slug: str, project_id: str, issue_id: str, comment_id: str) -> Dict[str, Any]:
        """Delete a work item comment (v0.2)."""
        try:
            self.client.work_items.comments.delete(workspace_slug, project_id, issue_id, comment_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete work item comment: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete work item comment: {str(e)}")
            raise

    # ============================================================================
    # LINKS API METHODS
    # ============================================================================

    def create_work_item_link(self, workspace_slug: str, project_id: str, issue_id: str, **kwargs) -> Dict[str, Any]:
        """Create a work item link (v0.2). Requires url.

        Note: The CreateWorkItemLink model only accepts 'url' field. Other fields like 'title'
        and 'metadata' are not supported and will be filtered out.
        """
        try:
            # Filter payload to only include fields that the CreateWorkItemLink model accepts
            # CreateWorkItemLink only has 'url' field
            allowed_fields = {"url"}
            payload = self._filter_payload(kwargs, allowed_fields)

            # Ensure URL has a protocol
            if "url" in payload and payload["url"]:
                url = payload["url"]
                if not url.startswith(("http://", "https://")):
                    payload["url"] = f"https://{url}"

            data_model = CreateWorkItemLink(**payload)
            resp = self.client.work_items.links.create(workspace_slug, project_id, issue_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create work item link: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create work item link: {str(e)}")
            raise

    def list_work_item_links(self, workspace_slug: str, project_id: str, issue_id: Optional[str] = None) -> Dict[str, Any]:
        """List work item links (v0.2)."""
        try:
            if issue_id:
                response = self.client.work_items.links.list(workspace_slug, project_id, issue_id)
            else:
                # Best-effort: try project-level links list (may not be available)
                response = self.client.work_items.links.list(workspace_slug, project_id, "")
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list work item links: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list work item links: {str(e)}")
            raise

    def retrieve_work_item_link(self, workspace_slug: str, project_id: str, issue_id: str, link_id: str) -> Dict[str, Any]:
        """Retrieve a specific work item link (v0.2)."""
        try:
            resp = self.client.work_items.links.retrieve(workspace_slug, project_id, issue_id, link_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve work item link: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve work item link: {str(e)}")
            raise

    def update_issue_link(self, workspace_slug: str, project_id: str, issue_id: str, link_id: str, **kwargs) -> Dict[str, Any]:
        """Update a work item link (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            data_model = UpdateWorkItemLink(**payload)
            resp = self.client.work_items.links.update(workspace_slug, project_id, issue_id, link_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update work item link: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update work item link: {str(e)}")
            raise

    def delete_work_item_link(self, workspace_slug: str, project_id: str, issue_id: str, link_id: str) -> Dict[str, Any]:
        """Delete a work item link (v0.2)."""
        try:
            self.client.work_items.links.delete(workspace_slug, project_id, issue_id, link_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete work item link: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete work item link: {str(e)}")
            raise

    # ============================================================================
    # PROPERTIES API METHODS
    # ============================================================================

    def create_issue_property(self, workspace_slug: str, project_id: str, type_id: str, **kwargs) -> Dict[str, Any]:
        """Create an issue property (v0.2)."""
        from plane.models.work_item_property_configurations import DateAttributeSettings  # type: ignore[attr-defined]
        from plane.models.work_item_property_configurations import TextAttributeSettings  # type: ignore[attr-defined]

        try:
            # Inject default settings if missing or explicitly set to None
            prop_type = kwargs.get("property_type")
            settings = kwargs.get("settings")
            if settings is None:
                if prop_type == "DATETIME":
                    # Use a sensible default format
                    kwargs["settings"] = DateAttributeSettings(display_format="MMM dd, yyyy")
                elif prop_type == "TEXT":
                    # Default to multi-line text
                    kwargs["settings"] = TextAttributeSettings(display_format="multi-line")

            # Use SDK model for validation and serialization
            property_data = CreateWorkItemProperty(**kwargs)
            resp = self.client.work_item_properties.create(workspace_slug, project_id, type_id, data=property_data)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create issue property: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create issue property: {str(e)}")
            raise

    def list_issue_properties(self, workspace_slug: str, project_id: str, type_id: str) -> Dict[str, Any]:
        """List issue properties (v0.2)."""
        try:
            response = self.client.work_item_properties.list(workspace_slug, project_id, type_id)
            # SDK returns list directly, not a paginated response
            results = self._model_to_dict(response)
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": len(results),
                "next_cursor": None,
                "prev_cursor": None,
            }
        except HttpError as e:
            log.error(f"Failed to list issue properties: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list issue properties: {str(e)}")
            raise

    def retrieve_issue_property(self, workspace_slug: str, project_id: str, type_id: str, property_id: str) -> Dict[str, Any]:
        """Retrieve a specific issue property (v0.2)."""
        try:
            resp = self.client.work_item_properties.retrieve(workspace_slug, project_id, type_id, property_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve issue property: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve issue property: {str(e)}")
            raise

    def update_issue_property(self, workspace_slug: str, project_id: str, type_id: str, property_id: str, **kwargs) -> Dict[str, Any]:
        """Update an issue property (v0.2)."""
        try:
            # Use SDK model for validation and serialization
            property_data = UpdateWorkItemProperty(**kwargs)
            resp = self.client.work_item_properties.update(workspace_slug, project_id, type_id, property_id, data=property_data)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update issue property: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update issue property: {str(e)}")
            raise

    def delete_issue_property(self, workspace_slug: str, project_id: str, type_id: str, property_id: str) -> Dict[str, Any]:
        """Delete an issue property (v0.2)."""
        try:
            self.client.work_item_properties.delete(workspace_slug, project_id, type_id, property_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete issue property: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete issue property: {str(e)}")
            raise

    def create_issue_property_option(
        self, workspace_slug: str, project_id: str, property_id: str, type_id: Optional[str] = None, **kwargs
    ) -> Dict[str, Any]:
        """Create an issue property option (v0.2)."""
        from plane.models.work_item_properties import CreateWorkItemPropertyOption  # type: ignore[attr-defined]

        try:
            payload = self._filter_payload(kwargs)
            data_model = CreateWorkItemPropertyOption(**payload)
            resp = self.client.work_item_properties.options.create(workspace_slug, project_id, property_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create issue property option: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create issue property option: {str(e)}")
            raise

    def create_issue_property_value(
        self, workspace_slug: str, project_id: str, property_id: str, type_id: Optional[str] = None, issue_id: Optional[str] = None, **kwargs
    ) -> Dict[str, Any]:
        """Create or update an issue property value (v0.2).

        Note: The SDK's create method acts as an upsert (create or update).
        For multi-value properties, existing values are replaced.

        Args:
            issue_id: Work item ID (required)
            property_id: Property ID (required)
            value: The value to set (passed in kwargs)
        """
        from plane.models.work_item_properties import CreateWorkItemPropertyValue  # type: ignore[attr-defined]

        if not issue_id:
            raise ValueError("issue_id is required to set a property value")

        try:
            # value is passed in kwargs, e.g. from ToolParameter "value"
            # Filter to only allowed fields: 'value', 'external_id', 'external_source'
            allowed_fields = {"value", "external_id", "external_source"}
            payload = self._filter_payload(kwargs, allowed_fields)

            # Ensure value is present
            if "value" not in payload:
                raise ValueError("value is required")

            # Convert value to appropriate type based on string representation
            val = payload["value"]

            # Handle stringified lists (e.g., for multi-select OPTION properties)
            if isinstance(val, str) and val.strip().startswith("[") and val.strip().endswith("]"):
                try:
                    import json

                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        payload["value"] = parsed
                        val = parsed  # Update val for further processing
                except Exception:
                    # Ignore parsing errors, assume it's just a string value starting with [
                    pass

            # Handle boolean conversion (e.g., "true" -> True, "false" -> False)
            if isinstance(val, str) and val.lower() in ("true", "false"):
                payload["value"] = val.lower() == "true"
            # Handle numeric conversion for DECIMAL properties (e.g., "10" -> 10.0)
            elif isinstance(val, str):
                try:
                    # Check if it's a valid number
                    num_val = float(val)
                    # If it's a whole number, keep it as int, otherwise float
                    payload["value"] = int(num_val) if num_val.is_integer() else num_val
                except (ValueError, AttributeError):
                    # Not a number. Check if it looks like a URL missing protocol (heuristic for URL properties)
                    if (
                        "." in val
                        and " " not in val
                        and len(val) > 3
                        and not val.startswith(("http://", "https://", "ftp://"))
                        and not val.startswith("/")
                    ):
                        # Heuristic: prepend https:// if it looks like a domain
                        payload["value"] = f"https://{val}"

            data_model = CreateWorkItemPropertyValue(**payload)

            # Note: type_id is unused for values.create but kept in signature for tool compatibility
            resp = self.client.work_item_properties.values.create(workspace_slug, project_id, issue_id, property_id, data=data_model)

            # Response can be a single object or list (for multi-value)
            results = self._model_to_dict(resp)
            return {"result": results, "success": True}

        except HttpError as e:
            log.error(f"Failed to create issue property value: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create issue property value: {str(e)}")
            raise

    def list_issue_property_options(self, workspace_slug: str, project_id: str, property_id: str, type_id: Optional[str] = None) -> Dict[str, Any]:
        """List issue property options (v0.2)."""
        try:
            response = self.client.work_item_properties.options.list(workspace_slug, project_id, property_id)
            # SDK returns list directly, not paginated
            results = self._model_to_dict(response)
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": len(results),
            }
        except HttpError as e:
            log.error(f"Failed to list issue property options: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list issue property options: {str(e)}")
            raise

    def list_issue_property_values(self, workspace_slug: str, project_id: str, type_id: str, issue_id: str) -> Dict[str, Any]:
        """List issue property values (v0.2 - not yet implemented)."""
        # TODO: Implement when SDK supports property values listing
        raise NotImplementedError("list_issue_property_values not yet available in v0.2")

    def retrieve_issue_property_option(self, workspace_slug: str, project_id: str, property_id: str, type_id: str, option_id: str) -> Dict[str, Any]:
        """Retrieve an issue property option (v0.2)."""
        try:
            resp = self.client.work_item_properties.options.retrieve(workspace_slug, project_id, property_id, option_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve issue property option: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve issue property option: {str(e)}")
            raise

    def update_issue_property_option(
        self, workspace_slug: str, project_id: str, property_id: str, type_id: str, option_id: str, **kwargs
    ) -> Dict[str, Any]:
        """Update an issue property option (v0.2)."""
        from plane.models.work_item_properties import UpdateWorkItemPropertyOption  # type: ignore[attr-defined]

        try:
            payload = self._filter_payload(kwargs)
            data_model = UpdateWorkItemPropertyOption(**payload)
            resp = self.client.work_item_properties.options.update(workspace_slug, project_id, property_id, option_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update issue property option: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update issue property option: {str(e)}")
            raise

    def delete_issue_property_option(self, workspace_slug: str, project_id: str, property_id: str, type_id: str, option_id: str) -> Dict[str, Any]:
        """Delete an issue property option (v0.2)."""
        try:
            self.client.work_item_properties.options.delete(workspace_slug, project_id, property_id, option_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete issue property option: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete issue property option: {str(e)}")
            raise

    # ============================================================================
    # TYPES API METHODS
    # ============================================================================

    def create_issue_type(self, workspace_slug: str, project_id: str, **kwargs) -> Dict[str, Any]:
        """Create an issue type (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            resp = self.client.work_item_types.create(workspace_slug, project_id, data=CreateWorkItemType(**payload))
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to create issue type: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create issue type: {str(e)}")
            raise

    def list_issue_types(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        """List issue types (v0.2)."""
        try:
            response = self.client.work_item_types.list(workspace_slug, project_id)
            results = self._model_to_dict(response)  # response is already a list
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": len(results),
                "next_cursor": None,
                "prev_cursor": None,
            }
        except HttpError as e:
            log.error(f"Failed to list issue types: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list issue types: {str(e)}")
            raise

    def retrieve_issue_type(self, workspace_slug: str, project_id: str, type_id: str) -> Dict[str, Any]:
        """Retrieve a specific issue type (v0.2)."""
        try:
            resp = self.client.work_item_types.retrieve(workspace_slug, project_id, type_id)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to retrieve issue type: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve issue type: {str(e)}")
            raise

    def update_issue_type(self, workspace_slug: str, project_id: str, type_id: str, **kwargs) -> Dict[str, Any]:
        """Update an issue type (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            resp = self.client.work_item_types.update(workspace_slug, project_id, type_id, data=UpdateWorkItemType(**payload))
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update issue type: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update issue type: {str(e)}")
            raise

    def delete_issue_type(self, workspace_slug: str, project_id: str, type_id: str) -> Dict[str, Any]:
        """Delete an issue type (v0.2)."""
        try:
            self.client.work_item_types.delete(workspace_slug, project_id, type_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete issue type: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete issue type: {str(e)}")
            raise

    # ============================================================================
    # WORKLOGS API METHODS
    # ============================================================================

    def create_issue_worklog(self, workspace_slug: str, project_id: str, issue_id: str, **kwargs) -> Dict[str, Any]:
        """Create an issue worklog (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            resp = self.client.work_items.work_logs.create(workspace_slug, project_id, work_item_id=issue_id, data=payload)
            result = cast(Dict[str, Any], self._model_to_dict(resp))
            return result
        except HttpError as e:
            log.error(f"Failed to create issue worklog: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create issue worklog: {str(e)}")
            raise

    def list_issue_worklogs(
        self,
        workspace_slug: str,
        project_id: str,
        issue_id: Optional[str] = None,
        work_item_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List issue worklogs (v0.2)."""
        try:
            effective_issue_id = issue_id or work_item_id
            if effective_issue_id:
                response = self.client.work_items.work_logs.list(workspace_slug, project_id, work_item_id=effective_issue_id)
            else:
                # Best-effort: try project-level worklogs list
                response = self.client.work_items.work_logs.list(workspace_slug, project_id, work_item_id="")

            # The SDK returns a list directly, not a paginated response object
            if isinstance(response, list):
                results = self._model_to_dict(response)
            else:
                # Fallback: try to get results attribute (for future SDK versions)
                results = self._model_to_dict(getattr(response, "results", []))

            if not isinstance(results, list):
                results = [results] if results else []

            # For list responses, we don't have pagination info
            total_count = len(results)
            final_result = {
                "results": results,
                "count": total_count,
                "total_results": total_count,
                "next_cursor": None,
                "prev_cursor": None,
            }
            return final_result
        except HttpError as e:
            log.error(f"Failed to list issue worklogs: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list issue worklogs: {str(e)}")
            raise

    def get_project_worklog_summary(self, workspace_slug: str, project_id: str) -> Dict[str, Any]:
        """Get project worklog summary (v0.2)."""
        try:
            # Prefer SDK method if available; fallback to raw _get path.
            if hasattr(self.client.projects, "get_worklog_summary"):
                response = self.client.projects.get_worklog_summary(workspace_slug=workspace_slug, project_id=project_id)
            else:
                response = self.client.projects._get(f"{workspace_slug}/projects/{project_id}/total-worklogs")

            result = self._model_to_dict(response)
            if isinstance(result, list):
                return {"results": result, "count": len(result)}
            return result
        except Exception as e:
            log.error(f"Failed to get project worklog summary: {str(e)}")
            raise

    def update_issue_worklog(self, workspace_slug: str, project_id: str, issue_id: str, worklog_id: str, **kwargs) -> Dict[str, Any]:
        """Update an issue worklog (v0.2)."""
        try:
            payload = self._filter_payload(kwargs)
            resp = self.client.work_items.work_logs.update(workspace_slug, project_id, work_item_id=issue_id, work_log_id=worklog_id, data=payload)
            return cast(Dict[str, Any], self._model_to_dict(resp))
        except HttpError as e:
            log.error(f"Failed to update issue worklog: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update issue worklog: {str(e)}")
            raise

    def delete_issue_worklog(self, workspace_slug: str, project_id: str, issue_id: str, worklog_id: str) -> Dict[str, Any]:
        """Delete an issue worklog (v0.2)."""
        try:
            self.client.work_items.work_logs.delete(workspace_slug, project_id, work_item_id=issue_id, work_log_id=worklog_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete issue worklog: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete issue worklog: {str(e)}")
            raise

    # ============================================================================
    # WORKSPACES API METHODS
    # ============================================================================

    def get_workspace_features(self, workspace_slug: str) -> Dict[str, Any]:
        """Get enabled workspace features (v0.2.1+)."""
        try:
            features = self.client.workspaces.get_features(workspace_slug=workspace_slug)
            result = self._model_to_dict(features)
            if isinstance(result, dict):
                return result
            else:
                return {"data": result}
        except HttpError as e:
            log.error(f"Failed to get workspace features: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to get workspace features: {str(e)}")
            raise

    def update_workspace_features(self, workspace_slug: str, **features) -> Dict[str, Any]:
        """Update workspace features (v0.2.1+). Enable/disable initiatives, teams, customers, etc."""
        try:
            from plane.models.workspaces import WorkspaceFeature  # type: ignore[attr-defined]

            # Build feature update payload
            feature_data = {}
            for key in ["project_grouping", "initiatives", "teams", "customers", "wiki", "pi"]:
                if key in features and features[key] is not None:
                    feature_data[key] = features[key]

            if not feature_data:
                raise ValueError("At least one feature field must be provided")

            data_model = WorkspaceFeature(**feature_data)
            result = self.client.workspaces.update_features(workspace_slug=workspace_slug, data=data_model)
            result_dict = self._model_to_dict(result)
            if isinstance(result_dict, dict):
                return result_dict
            else:
                return {"data": result_dict}
        except HttpError as e:
            log.error(f"Failed to update workspace features: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update workspace features: {str(e)}")
            raise

    # ============================================================================
    # INITIATIVES API METHODS
    # ============================================================================

    def create_initiative(self, workspace_slug: str, name: str, **kwargs) -> Dict[str, Any]:
        """Create a new initiative (v0.2.1+)."""
        try:
            from plane.models.initiatives import CreateInitiative  # type: ignore[attr-defined]

            payload = {"name": name}
            for key in ["description_html", "start_date", "end_date", "logo_props", "state", "lead"]:
                if key in kwargs and kwargs[key] is not None:
                    payload[key] = kwargs[key]

            data_model = CreateInitiative(**payload)
            # SDK bug workaround: SDK calls data.model_dump(exclude_none=True) but doesn't use mode="json",
            # causing enum objects to leak into json.dumps and crash. We wrap model_dump to fix this.
            original_model_dump = data_model.model_dump
            data_model.model_dump = lambda **kw: original_model_dump(mode="json", exclude_none=True)  # type: ignore[method-assign]
            initiative = self.client.initiatives.create(workspace_slug=workspace_slug, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(initiative))
        except HttpError as e:
            log.error(f"Failed to create initiative: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create initiative: {str(e)}")
            raise

    def list_initiatives(self, workspace_slug: str) -> Dict[str, Any]:
        """List initiatives (v0.2.1+)."""
        try:
            response = self.client.initiatives.list(workspace_slug=workspace_slug)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list initiatives: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list initiatives: {str(e)}")
            raise

    def retrieve_initiative(self, workspace_slug: str, initiative_id: str) -> Dict[str, Any]:
        """Retrieve a single initiative (v0.2.1+)."""
        try:
            initiative = self.client.initiatives.retrieve(workspace_slug=workspace_slug, initiative_id=initiative_id)
            return cast(Dict[str, Any], self._model_to_dict(initiative))
        except HttpError as e:
            log.error(f"Failed to retrieve initiative: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve initiative: {str(e)}")
            raise

    def update_initiative(self, workspace_slug: str, initiative_id: str, **kwargs) -> Dict[str, Any]:
        """Update an initiative (v0.2.1+)."""
        try:
            from plane.models.initiatives import UpdateInitiative  # type: ignore[attr-defined]

            payload = {}
            for k, v in kwargs.items():
                if v is not None:
                    payload[k] = v
            data_model = UpdateInitiative(**payload)
            # SDK bug workaround: SDK calls data.model_dump(exclude_none=True) but doesn't use mode="json"
            original_model_dump = data_model.model_dump
            data_model.model_dump = lambda **kw: original_model_dump(mode="json", exclude_none=True)  # type: ignore[method-assign]
            initiative = self.client.initiatives.update(workspace_slug=workspace_slug, initiative_id=initiative_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(initiative))
        except HttpError as e:
            log.error(f"Failed to update initiative: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update initiative: {str(e)}")
            raise

    def delete_initiative(self, workspace_slug: str, initiative_id: str) -> Dict[str, Any]:
        """Delete an initiative (v0.2.1+)."""
        try:
            self.client.initiatives.delete(workspace_slug=workspace_slug, initiative_id=initiative_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete initiative: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete initiative: {str(e)}")
            raise

    # Initiative Labels
    def create_initiative_label(self, workspace_slug: str, name: str, **kwargs) -> Dict[str, Any]:
        """Create initiative label (v0.2.1+), which are workspace-scoped, not initiative-scoped."""
        try:
            from plane.models.initiatives import CreateInitiativeLabel  # type: ignore[attr-defined]

            payload = {"name": name}
            for key in ["color", "description"]:
                if key in kwargs and kwargs[key] is not None:
                    payload[key] = kwargs[key]

            data_model = CreateInitiativeLabel(**payload)
            label = self.client.initiatives.labels.create(workspace_slug=workspace_slug, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(label))
        except HttpError as e:
            log.error(f"Failed to create initiative label: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create initiative label: {str(e)}")
            raise

    def list_initiative_labels(self, workspace_slug: str) -> Dict[str, Any]:
        """List all initiative labels in workspace (v0.2.1+)."""
        try:
            response = self.client.initiatives.labels.list(workspace_slug=workspace_slug)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
            }
        except HttpError as e:
            log.error(f"Failed to list initiative labels: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list initiative labels: {str(e)}")
            raise

    def retrieve_initiative_label(self, workspace_slug: str, label_id: str) -> Dict[str, Any]:
        """Retrieve initiative label (v0.2.1+)."""
        try:
            label = self.client.initiatives.labels.retrieve(workspace_slug=workspace_slug, label_id=label_id)
            return cast(Dict[str, Any], self._model_to_dict(label))
        except HttpError as e:
            log.error(f"Failed to retrieve initiative label: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve initiative label: {str(e)}")
            raise

    def update_initiative_label(self, workspace_slug: str, label_id: str, **kwargs) -> Dict[str, Any]:
        """Update initiative label (v0.2.1+)."""
        try:
            from plane.models.initiatives import UpdateInitiativeLabel  # type: ignore[attr-defined]

            payload = self._filter_payload(kwargs)
            data_model = UpdateInitiativeLabel(**payload)
            label = self.client.initiatives.labels.update(workspace_slug=workspace_slug, label_id=label_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(label))
        except HttpError as e:
            log.error(f"Failed to update initiative label: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update initiative label: {str(e)}")
            raise

    def delete_initiative_label(self, workspace_slug: str, label_id: str) -> Dict[str, Any]:
        """Delete initiative label (v0.2.1+)."""
        try:
            self.client.initiatives.labels.delete(workspace_slug=workspace_slug, label_id=label_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete initiative label: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete initiative label: {str(e)}")
            raise

    def add_initiative_labels(self, workspace_slug: str, initiative_id: str, label_ids: List[str]) -> Dict[str, Any]:
        """Add labels to an initiative (v0.2.1+)."""
        try:
            labels = self.client.initiatives.labels.add_labels(workspace_slug=workspace_slug, initiative_id=initiative_id, label_ids=label_ids)
            return cast(Dict[str, Any], {"success": True, "labels_added": len(label_ids), "labels": self._model_to_dict(labels)})
        except HttpError as e:
            log.error(f"Failed to add initiative labels: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to add initiative labels: {str(e)}")
            raise

    def remove_initiative_labels(self, workspace_slug: str, initiative_id: str, label_ids: List[str]) -> Dict[str, Any]:
        """Remove labels from an initiative (v0.2.1+)."""
        try:
            self.client.initiatives.labels.remove_labels(workspace_slug=workspace_slug, initiative_id=initiative_id, label_ids=label_ids)
            return {"success": True, "labels_removed": len(label_ids)}
        except HttpError as e:
            log.error(f"Failed to remove initiative labels: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to remove initiative labels: {str(e)}")
            raise

    # Initiative Projects
    def add_initiative_projects(self, workspace_slug: str, initiative_id: str, project_ids: List[str]) -> Dict[str, Any]:
        """Add projects to initiative (v0.2.1+)."""
        try:
            self.client.initiatives.projects.add(workspace_slug=workspace_slug, initiative_id=initiative_id, project_ids=project_ids)
            return {"success": True, "projects_added": len(project_ids)}
        except HttpError as e:
            log.error(f"Failed to add initiative projects: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to add initiative projects: {str(e)}")
            raise

    def list_initiative_projects(self, workspace_slug: str, initiative_id: str) -> Dict[str, Any]:
        """List initiative projects (v0.2.1+)."""
        try:
            response = self.client.initiatives.projects.list(workspace_slug=workspace_slug, initiative_id=initiative_id)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
            }
        except HttpError as e:
            log.error(f"Failed to list initiative projects: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list initiative projects: {str(e)}")
            raise

    def remove_initiative_projects(self, workspace_slug: str, initiative_id: str, project_ids: List[str]) -> Dict[str, Any]:
        """Remove projects from initiative (v0.2.1+)."""
        try:
            self.client.initiatives.projects.remove(workspace_slug=workspace_slug, initiative_id=initiative_id, project_ids=project_ids)
            return {"success": True, "projects_removed": len(project_ids)}
        except HttpError as e:
            log.error(f"Failed to remove initiative projects: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to remove initiative projects: {str(e)}")
            raise

    # Initiative Epics
    def add_initiative_epics(self, workspace_slug: str, initiative_id: str, epic_ids: List[str]) -> Dict[str, Any]:
        """Add epics to initiative (v0.2.1+)."""
        try:
            self.client.initiatives.epics.add(workspace_slug=workspace_slug, initiative_id=initiative_id, epic_ids=epic_ids)
            return {"success": True, "epics_added": len(epic_ids)}
        except HttpError as e:
            log.error(f"Failed to add initiative epics: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to add initiative epics: {str(e)}")
            raise

    def list_initiative_epics(self, workspace_slug: str, initiative_id: str) -> Dict[str, Any]:
        """List initiative epics (v0.2.1+)."""
        try:
            response = self.client.initiatives.epics.list(workspace_slug=workspace_slug, initiative_id=initiative_id)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
            }
        except HttpError as e:
            log.error(f"Failed to list initiative epics: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list initiative epics: {str(e)}")
            raise

    def remove_initiative_epics(self, workspace_slug: str, initiative_id: str, epic_ids: List[str]) -> Dict[str, Any]:
        """Remove epics from initiative (v0.2.1+)."""
        try:
            self.client.initiatives.epics.remove(workspace_slug=workspace_slug, initiative_id=initiative_id, epic_ids=epic_ids)
            return {"success": True, "epics_removed": len(epic_ids)}
        except HttpError as e:
            log.error(f"Failed to remove initiative epics: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to remove initiative epics: {str(e)}")
            raise

    # ============================================================================
    # TEAMSPACES API METHODS
    # ============================================================================

    def create_teamspace(self, workspace_slug: str, name: str, **kwargs) -> Dict[str, Any]:
        """Create a new teamspace (v0.2.1+)."""
        try:
            from plane.models.teamspaces import CreateTeamspace  # type: ignore[attr-defined]

            payload = {"name": name}
            for key in ["description_html", "logo_props", "lead"]:
                if key in kwargs and kwargs[key] is not None:
                    payload[key] = kwargs[key]

            data_model = CreateTeamspace(**payload)
            teamspace = self.client.teamspaces.create(workspace_slug=workspace_slug, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(teamspace))
        except HttpError as e:
            log.error(f"Failed to create teamspace: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create teamspace: {str(e)}")
            raise

    def list_teamspaces(self, workspace_slug: str) -> Dict[str, Any]:
        """List teamspaces (v0.2.1+)."""
        try:
            response = self.client.teamspaces.list(workspace_slug=workspace_slug)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list teamspaces: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list teamspaces: {str(e)}")
            raise

    def retrieve_teamspace(self, workspace_slug: str, teamspace_id: str) -> Dict[str, Any]:
        """Retrieve a single teamspace (v0.2.1+)."""
        try:
            teamspace = self.client.teamspaces.retrieve(workspace_slug=workspace_slug, teamspace_id=teamspace_id)
            return cast(Dict[str, Any], self._model_to_dict(teamspace))
        except HttpError as e:
            log.error(f"Failed to retrieve teamspace: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve teamspace: {str(e)}")
            raise

    def update_teamspace(self, workspace_slug: str, teamspace_id: str, **kwargs) -> Dict[str, Any]:
        """Update a teamspace (v0.2.1+)."""
        try:
            from plane.models.teamspaces import UpdateTeamspace  # type: ignore[attr-defined]

            payload = self._filter_payload(kwargs)
            data_model = UpdateTeamspace(**payload)
            teamspace = self.client.teamspaces.update(workspace_slug=workspace_slug, teamspace_id=teamspace_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(teamspace))
        except HttpError as e:
            log.error(f"Failed to update teamspace: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update teamspace: {str(e)}")
            raise

    def delete_teamspace(self, workspace_slug: str, teamspace_id: str) -> Dict[str, Any]:
        """Delete a teamspace (v0.2.1+)."""
        try:
            self.client.teamspaces.delete(workspace_slug=workspace_slug, teamspace_id=teamspace_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete teamspace: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete teamspace: {str(e)}")
            raise

    # Teamspace Members
    def add_teamspace_members(self, workspace_slug: str, teamspace_id: str, member_ids: List[str]) -> Dict[str, Any]:
        """Add members to teamspace (v0.2.1+)."""
        try:
            self.client.teamspaces.members.add(workspace_slug=workspace_slug, teamspace_id=teamspace_id, member_ids=member_ids)
            return {"success": True, "members_added": len(member_ids)}
        except HttpError as e:
            log.error(f"Failed to add teamspace members: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to add teamspace members: {str(e)}")
            raise

    def list_teamspace_members(self, workspace_slug: str, teamspace_id: str) -> Dict[str, Any]:
        """List teamspace members (v0.2.1+)."""
        try:
            response = self.client.teamspaces.members.list(workspace_slug=workspace_slug, teamspace_id=teamspace_id)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
            }
        except HttpError as e:
            log.error(f"Failed to list teamspace members: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list teamspace members: {str(e)}")
            raise

    def remove_teamspace_members(self, workspace_slug: str, teamspace_id: str, member_ids: List[str]) -> Dict[str, Any]:
        """Remove members from teamspace (v0.2.1+)."""
        try:
            self.client.teamspaces.members.remove(workspace_slug=workspace_slug, teamspace_id=teamspace_id, member_ids=member_ids)
            return {"success": True, "members_removed": len(member_ids)}
        except HttpError as e:
            log.error(f"Failed to remove teamspace members: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to remove teamspace members: {str(e)}")
            raise

    # Teamspace Projects
    def add_teamspace_projects(self, workspace_slug: str, teamspace_id: str, project_ids: List[str]) -> Dict[str, Any]:
        """Add projects to teamspace (v0.2.1+)."""
        try:
            self.client.teamspaces.projects.add(workspace_slug=workspace_slug, teamspace_id=teamspace_id, project_ids=project_ids)
            # Inject teamspace_id so URL construction can use it
            result: Dict[str, Any] = {"success": True, "projects_added": len(project_ids), "id": teamspace_id}
            return result
        except HttpError as e:
            log.error(f"Failed to add teamspace projects: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to add teamspace projects: {str(e)}")
            raise

    def list_teamspace_projects(self, workspace_slug: str, teamspace_id: str) -> Dict[str, Any]:
        """List teamspace projects (v0.2.1+)."""
        try:
            response = self.client.teamspaces.projects.list(workspace_slug=workspace_slug, teamspace_id=teamspace_id)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
            }
        except HttpError as e:
            log.error(f"Failed to list teamspace projects: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list teamspace projects: {str(e)}")
            raise

    def remove_teamspace_projects(self, workspace_slug: str, teamspace_id: str, project_ids: List[str]) -> Dict[str, Any]:
        """Remove projects from teamspace (v0.2.1+)."""
        try:
            self.client.teamspaces.projects.remove(workspace_slug=workspace_slug, teamspace_id=teamspace_id, project_ids=project_ids)
            return {"success": True, "projects_removed": len(project_ids)}
        except HttpError as e:
            log.error(f"Failed to remove teamspace projects: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to remove teamspace projects: {str(e)}")
            raise

    # ============================================================================
    # STICKIES API METHODS
    # ============================================================================

    def create_sticky(self, workspace_slug: str, **kwargs) -> Dict[str, Any]:
        """Create a new sticky note (v0.2.1+)."""
        try:
            from plane.models.stickies import CreateSticky  # type: ignore[attr-defined]

            payload = self._filter_payload(kwargs)
            data_model = CreateSticky(**payload)
            sticky = self.client.stickies.create(workspace_slug=workspace_slug, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(sticky))
        except HttpError as e:
            log.error(f"Failed to create sticky: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create sticky: {str(e)}")
            raise

    def list_stickies(self, workspace_slug: str) -> Dict[str, Any]:
        """List stickies (v0.2.1+)."""
        try:
            response = self.client.stickies.list(workspace_slug=workspace_slug)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list stickies: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list stickies: {str(e)}")
            raise

    def retrieve_sticky(self, workspace_slug: str, sticky_id: str) -> Dict[str, Any]:
        """Retrieve a single sticky (v0.2.1+)."""
        try:
            sticky = self.client.stickies.retrieve(workspace_slug=workspace_slug, sticky_id=sticky_id)
            return cast(Dict[str, Any], self._model_to_dict(sticky))
        except HttpError as e:
            log.error(f"Failed to retrieve sticky: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve sticky: {str(e)}")
            raise

    def update_sticky(self, workspace_slug: str, sticky_id: str, **kwargs) -> Dict[str, Any]:
        """Update a sticky (v0.2.1+)."""
        try:
            from plane.models.stickies import UpdateSticky  # type: ignore[attr-defined]

            payload = self._filter_payload(kwargs)
            data_model = UpdateSticky(**payload)
            sticky = self.client.stickies.update(workspace_slug=workspace_slug, sticky_id=sticky_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(sticky))
        except HttpError as e:
            log.error(f"Failed to update sticky: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update sticky: {str(e)}")
            raise

    def delete_sticky(self, workspace_slug: str, sticky_id: str) -> Dict[str, Any]:
        """Delete a sticky (v0.2.1+)."""
        try:
            self.client.stickies.delete(workspace_slug=workspace_slug, sticky_id=sticky_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete sticky: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete sticky: {str(e)}")
            raise

    # ============================================================================
    # CUSTOMERS API METHODS
    # ============================================================================

    def create_customer(self, workspace_slug: str, **kwargs) -> Dict[str, Any]:
        """Create a new customer (v0.2.1+)."""
        try:
            from plane.models.customers import CreateCustomer  # type: ignore[attr-defined]

            payload = self._filter_payload(kwargs)

            # SDK expects 'revenue' as a string, convert if numeric
            if payload.get("revenue"):
                payload["revenue"] = str(payload["revenue"])

            data_model = CreateCustomer(**payload)
            customer = self.client.customers.create(workspace_slug=workspace_slug, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(customer))
        except HttpError as e:
            log.error(f"Failed to create customer: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create customer: {str(e)}")
            raise

    def list_customers(self, workspace_slug: str) -> Dict[str, Any]:
        """List customers (v0.2.1+)."""
        try:
            response = self.client.customers.list(workspace_slug=workspace_slug)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list customers: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list customers: {str(e)}")
            raise

    def retrieve_customer(self, workspace_slug: str, customer_id: str) -> Dict[str, Any]:
        """Retrieve a single customer (v0.2.1+)."""
        try:
            customer = self.client.customers.retrieve(workspace_slug=workspace_slug, customer_id=customer_id)
            return cast(Dict[str, Any], self._model_to_dict(customer))
        except HttpError as e:
            log.error(f"Failed to retrieve customer: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve customer: {str(e)}")
            raise

    def update_customer(self, workspace_slug: str, customer_id: str, **kwargs) -> Dict[str, Any]:
        """Update a customer (v0.2.1+)."""
        try:
            from plane.models.customers import UpdateCustomer  # type: ignore[attr-defined]

            payload = self._filter_payload(kwargs)

            # SDK expects 'revenue' as a string, convert if numeric
            if payload.get("revenue"):
                payload["revenue"] = str(payload["revenue"])

            data_model = UpdateCustomer(**payload)
            customer = self.client.customers.update(workspace_slug=workspace_slug, customer_id=customer_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(customer))
        except HttpError as e:
            log.error(f"Failed to update customer: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update customer: {str(e)}")
            raise

    def delete_customer(self, workspace_slug: str, customer_id: str) -> Dict[str, Any]:
        """Delete a customer (v0.2.1+)."""
        try:
            self.client.customers.delete(workspace_slug=workspace_slug, customer_id=customer_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete customer: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete customer: {str(e)}")
            raise

    # Customer Properties
    def create_customer_property(self, workspace_slug: str, **kwargs) -> Dict[str, Any]:
        """Create a customer property (v0.2.1+)."""
        try:
            from plane.models.customers import CreateCustomerProperty  # type: ignore[attr-defined]

            filtered_kwargs = self._filter_payload(kwargs)
            data_model = CreateCustomerProperty(**filtered_kwargs)
            prop = self.client.customers.properties.create(workspace_slug=workspace_slug, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(prop))
        except HttpError as e:
            log.error(f"Failed to create customer property: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create customer property: {str(e)}")
            raise

    def list_customer_properties(self, workspace_slug: str) -> Dict[str, Any]:
        """List customer properties (v0.2.1+)."""
        try:
            response = self.client.customers.properties.list(workspace_slug=workspace_slug)
            results = self._model_to_dict(getattr(response, "results", []))
            if not isinstance(results, list):
                results = [results] if results else []
            return {
                "results": results,
                "count": len(results),
                "total_results": getattr(response, "total_count", len(results)),
                "next_cursor": str(getattr(response, "next_page_number", "")) if getattr(response, "next_page_number", None) else None,
                "prev_cursor": str(getattr(response, "prev_page_number", "")) if getattr(response, "prev_page_number", None) else None,
            }
        except HttpError as e:
            log.error(f"Failed to list customer properties: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list customer properties: {str(e)}")
            raise

    def retrieve_customer_property(self, workspace_slug: str, property_id: str) -> Dict[str, Any]:
        """Retrieve a customer property (v0.2.1+)."""
        try:
            prop = self.client.customers.properties.retrieve(workspace_slug=workspace_slug, property_id=property_id)
            return cast(Dict[str, Any], self._model_to_dict(prop))
        except HttpError as e:
            log.error(f"Failed to retrieve customer property: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve customer property: {str(e)}")
            raise

    def update_customer_property(self, workspace_slug: str, property_id: str, **kwargs) -> Dict[str, Any]:
        """Update a customer property (v0.2.1+)."""
        try:
            from plane.models.customers import UpdateCustomerProperty  # type: ignore[attr-defined]

            filtered_kwargs = self._filter_payload(kwargs)
            data_model = UpdateCustomerProperty(**filtered_kwargs)
            prop = self.client.customers.properties.update(workspace_slug=workspace_slug, property_id=property_id, data=data_model)
            return cast(Dict[str, Any], self._model_to_dict(prop))
        except HttpError as e:
            log.error(f"Failed to update customer property: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update customer property: {str(e)}")
            raise

    def delete_customer_property(self, workspace_slug: str, property_id: str) -> Dict[str, Any]:
        """Delete a customer property (v0.2.1+)."""
        try:
            self.client.customers.properties.delete(workspace_slug=workspace_slug, property_id=property_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete customer property: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete customer property: {str(e)}")
            raise

    # Customer Requests
    def create_customer_request(self, workspace_slug: str, customer_id: str, **kwargs) -> Dict[str, Any]:
        """Create a customer request (v0.2.1+)."""
        try:
            from plane.models.customers import CustomerRequest  # type: ignore[attr-defined]

            filtered_kwargs = self._filter_payload(kwargs)
            data_model = CustomerRequest(**filtered_kwargs)
            request = self.client.customers.requests.create(workspace_slug=workspace_slug, customer_id=customer_id, data=data_model)
            result = cast(Dict[str, Any], self._model_to_dict(request))
            # Inject customer_id into the response for URL construction
            result["customer_id"] = customer_id
            return result
        except HttpError as e:
            log.error(f"Failed to create customer request: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to create customer request: {str(e)}")
            raise

    def list_customer_requests(self, workspace_slug: str, customer_id: str) -> Dict[str, Any]:
        """List customer requests (v0.2.1+)."""
        try:
            # Bypass SDK's list method which incorrectly swallows non-list responses
            # The SDK expects a list but the API might return a paginated dict
            response = self.client.customers.requests._get(f"{workspace_slug}/customers/{customer_id}/requests")

            # Handle both paginated response (object with results) and direct list
            if isinstance(response, dict) and "results" in response:
                raw_results = response["results"]
            elif isinstance(response, list):
                raw_results = response
            else:
                raw_results = []

            results = self._model_to_dict(raw_results)
            if not isinstance(results, list):
                results = [results] if results else []

            return {
                "results": results,
                "count": len(results),
            }
        except HttpError as e:
            log.error(f"Failed to list customer requests: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to list customer requests: {str(e)}")
            raise

    def retrieve_customer_request(self, workspace_slug: str, customer_id: str, request_id: str) -> Dict[str, Any]:
        """Retrieve a customer request (v0.2.1+)."""
        try:
            request = self.client.customers.requests.retrieve(workspace_slug=workspace_slug, customer_id=customer_id, request_id=request_id)
            result = cast(Dict[str, Any], self._model_to_dict(request))
            # Inject customer_id into the response for URL construction
            result["customer_id"] = customer_id
            return result
        except HttpError as e:
            log.error(f"Failed to retrieve customer request: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to retrieve customer request: {str(e)}")
            raise

    def update_customer_request(self, workspace_slug: str, customer_id: str, request_id: str, **kwargs) -> Dict[str, Any]:
        """Update a customer request (v0.2.1+)."""
        try:
            from plane.models.customers import UpdateCustomerRequest  # type: ignore[attr-defined]

            filtered_kwargs = self._filter_payload(kwargs)
            data_model = UpdateCustomerRequest(**filtered_kwargs)
            request = self.client.customers.requests.update(
                workspace_slug=workspace_slug, customer_id=customer_id, request_id=request_id, data=data_model
            )
            result = cast(Dict[str, Any], self._model_to_dict(request))
            # Inject customer_id into the response for URL construction
            result["customer_id"] = customer_id
            return result
        except HttpError as e:
            log.error(f"Failed to update customer request: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to update customer request: {str(e)}")
            raise

    def delete_customer_request(self, workspace_slug: str, customer_id: str, request_id: str) -> Dict[str, Any]:
        """Delete a customer request (v0.2.1+)."""
        try:
            self.client.customers.requests.delete(workspace_slug=workspace_slug, customer_id=customer_id, request_id=request_id)
            return {"success": True}
        except HttpError as e:
            log.error(f"Failed to delete customer request: {e} ({getattr(e, 'status_code', None)})")
            raise
        except Exception as e:
            log.error(f"Failed to delete customer request: {str(e)}")
            raise
