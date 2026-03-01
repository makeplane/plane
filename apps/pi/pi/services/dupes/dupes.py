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

import time

from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage

from pi import logger
from pi import settings
from pi.app.schemas.dupes import DupeSearchRequest
from pi.app.schemas.dupes import DuplicateIdentificationResponse
from pi.app.schemas.dupes import NotDuplicateRequest
from pi.core.vectordb import VectorStore
from pi.services.dupes.prompts import dupes_human_prompt
from pi.services.dupes.prompts import dupes_system_prompt
from pi.services.llm.error_handling import llm_error_handler
from pi.services.llm.llms import get_dupes_llm

vector_db = VectorStore()

semantic_cutoff = settings.vector_db.DUPES_EMBED_CUTOFF

log = logger.getChild(__name__)

# dupe_fields = ["issue_id", "type_id", "project_id", "sequence_id", "title", "priority", "state_id", "created_by_id"]


# Custom exceptions
class DuplicateNotFoundError(Exception):
    def __init__(self, message: str):
        """Initializes DuplicateNotFoundError with status code and message."""
        super().__init__(message)
        self.status_code = 400
        self.detail = message


class VectorSearchError(Exception):
    def __init__(self, message: str):
        """Initializes VectorSearchError with status code and message."""
        super().__init__(message)
        self.status_code = 500
        self.detail = message


class NotDuplicateUpdateError(Exception):
    def __init__(self, message: str):
        """Initializes NotDuplicateUpdateError with status code and message."""
        super().__init__(message)
        self.status_code = 400
        self.detail = message


def distill_result(resp_sem: list, resp_text: list):
    """Parses Open Search query response to expected duplicates output with deduplication"""
    duplicates = []
    seen_issue_ids = set()

    # Process all results, keeping track of seen issue IDs to avoid duplicates
    for h in resp_sem + resp_text:
        issue_id = h["id"]
        if issue_id not in seen_issue_ids and not h["is_epic"]:  # Filtering out epic issues
            seen_issue_ids.add(issue_id)
            duplicates.append({
                "id": issue_id,
                "typeId": h["type_id"],
                "project_id": h["project_id"],
                "sequence_id": h["sequence_id"],
                "name": h["name"],
                "priority": h["priority"],
                "state_id": h["state_id"],
                "created_by": h["created_by_id"],
            })
    return duplicates


@llm_error_handler(
    fallback_message="LLM_FAILURE",  # Special marker for failure
    max_retries=1,
    log_context="[DUPES]",
)
async def identify_duplicates_with_llm(query_title: str, query_description: str, candidates: list) -> tuple[list, dict]:
    """Use GPT-4.1 nano to identify actual duplicates from similarity candidates."""
    if not candidates:
        return [], {}

    # Create the dupes LLM with structured output (include_raw=True to preserve token usage)
    dupes_llm = get_dupes_llm()
    dupes_structured_llm = dupes_llm.with_structured_output(DuplicateIdentificationResponse, include_raw=True, method="json_schema")  # type: ignore[arg-type]

    # Format candidates for LLM input as a clean numbered list
    candidates_text = ""
    for i, candidate in enumerate(candidates, 1):
        candidates_text += f"{i}. {candidate["name"]}\n"
        candidates_text += f"   ID: {candidate["id"]}\n"
        if candidate.get("description"):
            candidates_text += f"   {candidate["description"][:2000]}...\n"
        candidates_text += "\n"

    # Create the system prompt for duplicate identification

    human_prompt = dupes_human_prompt.format(query_title=query_title, query_description=query_description, candidates_text=candidates_text)

    messages = [SystemMessage(content=dupes_system_prompt), HumanMessage(content=human_prompt)]

    # Get LLM response
    dupes_llm_start = time.time()
    log.info("Starting dupes LLM call")
    response = dupes_structured_llm.invoke(messages)
    dupes_llm_elapsed = time.time() - dupes_llm_start
    log.info(f"Dupes LLM call completed in {dupes_llm_elapsed:.2f}s (DUPES)")

    if not response:
        log.warning("No response from LLM for duplicate detection")
        return [], {"llm_response": None, "llm_duration_ms": dupes_llm_elapsed * 1000}

    # With include_raw=True, response is dict with "raw" (has tokens) and "parsed" (structured data)
    raw_response = response.get("raw") if isinstance(response, dict) else None
    parsed_response = response.get("parsed") if isinstance(response, dict) else response

    # Handle parsed response as either dict or DuplicateIdentificationResponse object
    if isinstance(parsed_response, dict):
        duplicate_serial_numbers = parsed_response.get("duplicates", [])
    else:
        duplicate_serial_numbers = getattr(parsed_response, "duplicates", [])

    if not duplicate_serial_numbers:
        return [], {"llm_response": raw_response, "llm_duration_ms": dupes_llm_elapsed * 1000}

    # Map serial numbers back to actual candidates
    filtered_duplicates = []
    for serial_num in duplicate_serial_numbers:
        # Convert to 0-based index and validate range
        index = serial_num - 1
        if 0 <= index < len(candidates):
            filtered_duplicates.append(candidates[index])
        else:
            log.warning(f"Invalid serial number {serial_num} returned by LLM (out of range)")

    return filtered_duplicates, {"llm_response": raw_response, "llm_duration_ms": dupes_llm_elapsed * 1000}


async def get_dupes(data: DupeSearchRequest):
    """Searches for potential duplicate issues based on title and description similarity."""
    dupe_output_fields = ["id", "type_id", "project_id", "sequence_id", "name", "priority", "state_id", "created_by_id", "is_epic"]

    # Initialize tracking data (convert UUIDs to strings for Celery JSON serialization)
    total_start = time.time()
    tracking_data = {
        "workspace_id": str(data.workspace_id),  # Convert UUID to string
        "project_id": str(data.project_id) if data.project_id else None,  # Convert UUID to string
        "issue_id": str(data.issue_id) if data.issue_id else None,  # Convert UUID to string
        "user_id": str(data.user_id) if data.user_id else None,  # Convert UUID to string
        "workspace_slug": getattr(data, "workspace_slug", None),
        "query_title": data.title,
        "query_description_length": len(data.description_stripped) if data.description_stripped else None,
        "input_workitems": None,  # Will be populated with candidates_for_llm
        "output_duplicates": None,  # Will be populated with final results
        "vector_candidates_count": 0,
        "vector_search_duration_ms": 0.0,
        "llm_candidates_count": 0,
        "llm_identified_dupes_count": 0,
        "llm_duration_ms": 0.0,
        "llm_success": True,
        "llm_error": None,
        "token_usage": None,  # Will be populated with extracted token usage
        "model_key": None,
        "total_duration_ms": 0.0,
    }

    try:
        workspace_id = str(data.workspace_id)
        project_id = str(data.project_id) if data.project_id else None
        issue_id = str(data.issue_id) if data.issue_id else None
        user_id = str(data.user_id) if data.user_id else None

        query_title = data.title
        query_description = data.description_stripped

        # Get initial candidates from vector similarity search
        vector_start = time.time()
        resp_sem = await vector_db.async_issue_search_semantic(
            query_title,
            query_description,
            workspace_id,
            issue_id,
            user_id,
            project_id=project_id,
            threshold=semantic_cutoff,
            output_fields=dupe_output_fields,
        )
        vector_duration = time.time() - vector_start
        tracking_data["vector_search_duration_ms"] = vector_duration * 1000

        # Process initial results
        initial_candidates = distill_result(resp_sem, [])
        tracking_data["vector_candidates_count"] = len(initial_candidates)

        # Guard: exclude the queried work-item itself if issue_id is provided
        if issue_id:
            initial_candidates = [c for c in initial_candidates if str(c.get("id")) != issue_id]

        # Limit to top 10 candidates for LLM processing as per user requirements
        candidates_for_llm = initial_candidates[:10]
        tracking_data["llm_candidates_count"] = len(candidates_for_llm)
        tracking_data["input_workitems"] = candidates_for_llm  # Store input work items

        if not candidates_for_llm:
            tracking_data["total_duration_ms"] = (time.time() - total_start) * 1000
            tracking_data["output_duplicates"] = []  # Empty result
            # Schedule background tracking
            from pi.celery_app import track_dupes_operation

            track_dupes_operation.delay(tracking_data)
            return {"dupes": []}

        # Use LLM to identify actual duplicates from candidates
        llm_identified_dupes, llm_metadata = await identify_duplicates_with_llm(query_title, query_description or "", candidates_for_llm)

        # Update tracking data with LLM results
        tracking_data["llm_duration_ms"] = llm_metadata.get("llm_duration_ms", 0.0)
        tracking_data["llm_identified_dupes_count"] = len(llm_identified_dupes)

        # Extract token usage in-process (before Celery) to avoid serialization issues
        llm_response = llm_metadata.get("llm_response")
        token_usage = None
        if llm_response:
            try:
                # Import DupesTracker just for token extraction
                from pi.services.dupes.dupes_tracker import DupesTracker

                # Create a temporary tracker to use its extraction method
                temp_tracker = type("TempTracker", (), {"extract_token_usage": DupesTracker.extract_token_usage})()
                token_usage = temp_tracker.extract_token_usage(llm_response)
                log.info(f"Extracted token usage: {token_usage}")
            except Exception as e:
                log.warning(f"Failed to extract token usage from LLM response: {e}")

        tracking_data["token_usage"] = token_usage  # Pass extracted tokens, not the full response

        # Get model key for token tracking
        dupes_llm = get_dupes_llm()
        tracking_data["model_key"] = getattr(dupes_llm, "model_name", "unknown")

        log.info(f"LLM identified {len(llm_identified_dupes)} duplicates from {len(candidates_for_llm)} candidates")

        # Handle error case where decorator returns failure marker
        if llm_identified_dupes == "LLM_FAILURE":
            llm_identified_dupes = candidates_for_llm  # Fall back to all candidates as before
            tracking_data["llm_success"] = False
            tracking_data["llm_error"] = "LLM_FAILURE fallback triggered"
            tracking_data["llm_identified_dupes_count"] = len(llm_identified_dupes)

        tracking_data["output_duplicates"] = llm_identified_dupes  # Store final output
        tracking_data["total_duration_ms"] = (time.time() - total_start) * 1000

        # Schedule background tracking
        from pi.celery_app import track_dupes_operation

        track_dupes_operation.delay(tracking_data)

        return {"dupes": llm_identified_dupes}

    except Exception as e:
        log.error(f"Unexpected error: {e!s}")
        tracking_data["llm_success"] = False
        tracking_data["llm_error"] = str(e)
        tracking_data["output_duplicates"] = []  # Empty result on error
        tracking_data["total_duration_ms"] = (time.time() - total_start) * 1000

        # Schedule background tracking even on error
        from pi.celery_app import track_dupes_operation

        track_dupes_operation.delay(tracking_data)

        # Return empty results on error instead of raising
        return {"dupes": []}


async def set_not_duplicate_issues(data: NotDuplicateRequest) -> dict:
    """Updates issues to mark them as not duplicates of each other."""
    try:
        issue_id_str = str(data.issue_id)
        not_dup_ids_str = [str(uuid) for uuid in data.not_duplicates_with]

        await vector_db.update_bidirectional_not_duplicates("issues-semantic-index", issue_id_str, not_dup_ids_str)

        return {"message": "Not duplicate issues updated successfully"}

    except Exception as e:
        log.error(f"An unexpected error occurred while setting not duplicate issues: {e!s}")
        raise NotDuplicateUpdateError(f"Open Search index update failed: {e!s}")


# if __name__ == "__main__":
#     import asyncio

#     # call get_dupes in an async function and print the result
#     async def main():
#         from uuid import UUID

#         dupe_input = {"title": "h1 and h6", "workspace_id": UUID("cd4ab5a2-1a5f-4516-a6c6-8da1a9fa5be4")}
#         # convert dupe_input to DupeSearchRequest
#         dupe_input = DupeSearchRequest(**dupe_input)
#         # call get_dupes
#         result = await get_dupes(dupe_input)
#         print(result)

#     asyncio.run(main())
