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

# Python imports
from dataclasses import dataclass
from enum import Enum
from typing import Optional

# Third party imports
from bs4 import BeautifulSoup

# Module imports
from plane.db.models import User


@dataclass(frozen=True)
class Actor:
    id: str
    name: Optional[str] = None


def construct_comment_content_with_mentions(html_content: str) -> dict:
    soup = BeautifulSoup(html_content, "html.parser")
    user_mentions = {}

    for mention_tag in soup.find_all("mention-component", attrs={"entity_name": "user_mention"}):
        entity_identifier = mention_tag.get("entity_identifier", "")
        user = User.objects.filter(id=entity_identifier).first()
        user_mentions[entity_identifier] = user if user else None
        mention_tag.replace_with(
            user.display_name
            if user.display_name
            else user.first_name
            if user.first_name
            else user.email
            if user
            else ""
        )

    for tag in soup.find_all(True):
        tag.replace_with(tag.text)

    plain_text = soup.get_text()
    return {
        "mention_objects": user_mentions,
        "content": plain_text,
    }


class WorkItemPropertyKeys(str, Enum):
    # Properties
    NAME = "name"
    STATE = "state"
    PRIORITY = "priority"
    ASSIGNEE = "assignees"
    LABELS = "labels"
    START_DATE = "start_date"
    TARGET_DATE = "target_date"
    PARENT = "parent"
    ESTIMATE_POINT = "estimate_points"
    # Links
    LINK = "link"
    # Attachments
    ATTACHMENT = "attachment"
    # Relationships
    RELATES_TO = "relates_to"
    DUPLICATE = "duplicate"
    BLOCKED_BY = "blocked_by"
    BLOCKING = "blocking"
    START_BEFORE = "start_before"
    START_AFTER = "start_after"
    FINISH_BEFORE = "finish_before"
    FINISH_AFTER = "finish_after"
    IMPLEMENTS = "implements"
    IMPLEMENTED_BY = "implemented_by"
    # Comments
    COMMENT = "comment"
    # archived
    ARCHIVED_AT = "archived_at"
    # linking and unlinking pages
    PAGE = "page"
    # adding and removing customer
    CUSTOMER = "customer"


class IssueNotificationBuilder:
    """Builds notification strings for issue property changes."""

    def __init__(
        self,
        sender: Actor | None,
        receiver: Actor | None,
        property_key: str,
        old_value: str | None,
        new_value: str | None,
        old_identifier: str | None,
        new_identifier: str | None,
    ):
        self.sender = sender
        self.receiver = receiver
        self.property_key = property_key
        self.old_value = old_value
        self.new_value = new_value
        self.old_identifier = old_identifier
        self.new_identifier = new_identifier

        # local instance variables
        self._should_send_notification = True

    def _handle_name_change(self) -> str:
        return f"set the name to '{self.new_value}'"

    def _handle_state_change(self) -> str:
        return f"set the state to '{self.new_value}'"

    def _handle_priority_change(self) -> str:
        return f"set the priority to '{self.new_value.capitalize()}'"

    def _handle_assignees_change(self) -> str:
        final_string = ""
        if self.new_identifier:
            if self.new_identifier == self.receiver.id:
                final_string += "added you"
            else:
                final_string += f"added a new assignee '{self.new_value}'"
        else:
            if self.old_identifier == self.receiver.id:
                final_string += "removed you"
            else:
                final_string += f"removed the assignee '{self.old_value}'"

        return final_string

    def _handle_labels_change(self) -> str:
        final_string = ""
        if self.new_value:
            final_string += f"added a new label '{self.new_value}'"
        else:
            final_string += f"removed the label '{self.old_value}'"

        return final_string

    def _handle_start_date_change(self) -> str:
        final_string = ""
        if self.new_value:
            final_string += f"set the start date to '{self.new_value}'"
        else:
            final_string += "removed the start date"

        return final_string

    def _handle_target_date_change(self) -> str:
        final_string = ""
        if self.new_value:
            final_string += f"set the due date to '{self.new_value}'"
        else:
            final_string += "removed the due date"

        return final_string

    def _handle_parent_change(self) -> str:
        final_string = ""
        if self.new_value:
            final_string += f"set the parent to '{self.new_value}'"
        else:
            final_string += "removed the parent"

        return final_string

    def _handle_estimate_point_change(self) -> str:
        final_string = ""
        if self.new_value and self.new_value != "None":
            final_string += f"set the estimate point to '{self.new_value}'"
        else:
            final_string += f"removed the estimate point '{self.old_value}'"

        return final_string

    def _handle_link_change(self) -> str:
        final_string = ""
        if self.new_value:
            final_string += f"added a new link '{self.new_value}'"
        else:
            final_string += f"removed the link '{self.old_value}'"

        return final_string

    def _handle_attachment_change(self) -> str:
        final_string = ""
        if self.new_value and self.new_value != "None":
            final_string += "updated a new attachment"
        else:
            final_string += "removed an attachment"

        return final_string

    # Relationship handlers
    def _handle_relates_to_change(self) -> str:
        action = "marked that this work item relates to" if self.new_value else "removed the relation from"
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_duplicate_change(self) -> str:
        action = (
            "marked that this work item as duplicate of"
            if self.new_value
            else "removed this work item as a duplicate of"
        )
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_blocked_by_change(self) -> str:
        action = (
            "marked this work item is being blocked by" if self.new_value else "removed this work item being blocked by"
        )
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_blocking_change(self) -> str:
        action = "marked this work item is blocking work item" if self.new_value else "removed the blocking work item"
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_start_before_change(self) -> str:
        action = (
            "marked this work item to start before"
            if self.new_value
            else "removed the start before relation from work item"
        )
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_start_after_change(self) -> str:
        action = (
            "marked this work item to start after"
            if self.new_value
            else "removed the start after relation from work item"
        )
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_finish_before_change(self) -> str:
        action = (
            "marked this work item to finish before"
            if self.new_value
            else "removed the finish before relation from work item"
        )
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_finish_after_change(self) -> str:
        action = (
            "marked this work item to finish after"
            if self.new_value
            else "removed the finish after relation from work item"
        )
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_implements_change(self) -> str:
        action = (
            "marked this work item as implements"
            if self.new_value
            else "removed the implementing relation from work item"
        )
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_implemented_by_change(self) -> str:
        action = (
            "marked this work item as implemented by"
            if self.new_value
            else "removed the implemented by relation from work item"
        )
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    # comments
    def _handle_comment_change(self) -> str:
        comment_content = None if self.new_value == "None" and self.old_value == "None" else self.new_value
        constructed_comment = construct_comment_content_with_mentions(comment_content) if comment_content else None

        is_receiver_mentioned = False
        if constructed_comment and constructed_comment["mention_objects"] is not None:
            is_receiver_mentioned = self.receiver.id in constructed_comment["mention_objects"]

        action = ""
        if self.new_value == "None" and self.old_value == "None":
            action = "removed the comment"
        elif self.old_value != "None":
            if is_receiver_mentioned:
                action = "updated the comment and mentioned you"
            else:
                action = "updated the comment"
        else:
            if is_receiver_mentioned:
                action = "mentioned you in a comment"
            else:
                action = "commented"

        content = constructed_comment["content"] if constructed_comment and constructed_comment["content"] else None
        if content:
            return f"{action}" + f"' {content}'" if content else ""
        else:
            if self.new_value == "None" and self.old_value == "None":
                return f"{action}"
            else:
                return "added a comment"

    def _handle_archived_at_change(self) -> str:
        final_string = ""
        if self.new_value == "manual_archive":
            final_string += "archived the work item"
        elif self.new_value == "restore" and self.old_value == "archive":
            final_string += "restored the work item"
        else:
            self._should_send_notification = False

        return final_string

    def _handle_page_change(self) -> str:
        final_string = ""
        if self.new_value:
            final_string += f"added a new page '{self.new_value}'"
        else:
            final_string += f"removed the page '{self.old_value}'"

        return final_string

    def _handle_customer_change(self) -> str:
        final_string = ""
        if self.new_value and self.new_value != "None":
            final_string += f"added this work item to the customer '{self.new_value}'"
        elif self.old_value and self.old_value != "None":
            final_string += f"removed the work item from the customer '{self.old_value}'"

        return final_string

    def build_notification(self) -> tuple[str, bool]:
        """Build and return the notification string and if the notification is required."""

        property_handlers = {
            # Properties
            WorkItemPropertyKeys.NAME: self._handle_name_change,
            WorkItemPropertyKeys.STATE: self._handle_state_change,
            WorkItemPropertyKeys.PRIORITY: self._handle_priority_change,
            WorkItemPropertyKeys.ASSIGNEE: self._handle_assignees_change,
            WorkItemPropertyKeys.LABELS: self._handle_labels_change,
            WorkItemPropertyKeys.START_DATE: self._handle_start_date_change,
            WorkItemPropertyKeys.TARGET_DATE: self._handle_target_date_change,
            WorkItemPropertyKeys.PARENT: self._handle_parent_change,
            WorkItemPropertyKeys.ESTIMATE_POINT: self._handle_estimate_point_change,
            # Links
            WorkItemPropertyKeys.LINK: self._handle_link_change,
            # Attachments
            WorkItemPropertyKeys.ATTACHMENT: self._handle_attachment_change,
            # Relationships
            WorkItemPropertyKeys.RELATES_TO: self._handle_relates_to_change,
            WorkItemPropertyKeys.DUPLICATE: self._handle_duplicate_change,
            WorkItemPropertyKeys.BLOCKED_BY: self._handle_blocked_by_change,
            WorkItemPropertyKeys.BLOCKING: self._handle_blocking_change,
            WorkItemPropertyKeys.START_BEFORE: self._handle_start_before_change,
            WorkItemPropertyKeys.START_AFTER: self._handle_start_after_change,
            WorkItemPropertyKeys.FINISH_BEFORE: self._handle_finish_before_change,
            WorkItemPropertyKeys.FINISH_AFTER: self._handle_finish_after_change,
            WorkItemPropertyKeys.IMPLEMENTS: self._handle_implements_change,
            WorkItemPropertyKeys.IMPLEMENTED_BY: self._handle_implemented_by_change,
            # Comments
            WorkItemPropertyKeys.COMMENT: self._handle_comment_change,
            # archived
            WorkItemPropertyKeys.ARCHIVED_AT: self._handle_archived_at_change,
            # linking and unlinking pages
            WorkItemPropertyKeys.PAGE: self._handle_page_change,
            # adding and removing customer
            WorkItemPropertyKeys.CUSTOMER: self._handle_customer_change,
        }

        handler = property_handlers.get(self.property_key)
        if handler:
            notification_body = f"{self.sender.name} {handler()}"
        else:
            notification_body = f"{self.sender.name} updated {self.property_key}"

        return notification_body, self._should_send_notification
