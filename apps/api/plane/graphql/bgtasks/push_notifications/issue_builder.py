# Python imports
from typing import TypedDict
from uuid import uuid4

# Third party imports
from bs4 import BeautifulSoup

# Module imports
from plane.db.models import User


class Actor(TypedDict):
    id: uuid4
    name: str | None


def construct_comment_content_with_mentions(html_content: str) -> dict:
    soup = BeautifulSoup(html_content, "html.parser")
    user_mentions = {}

    for mention_tag in soup.find_all(
        "mention-component", attrs={"entity_name": "user_mention"}
    ):
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

    def _handle_name_change(self) -> str:
        return f"set the name to '{self.new_value}'"

    def _handle_state_change(self) -> str:
        return f"set the state to '{self.new_value}'"

    def _handle_priority_change(self) -> str:
        return f"set the priority to '{self.new_value}'"

    def _handle_assignees_change(self) -> str:
        final_string = ""
        if self.new_identifier:
            if self.new_identifier == self.receiver["id"]:
                final_string += "added you"
            else:
                final_string += f"added a new assignee '{self.new_value}'"
        else:
            if self.old_identifier == self.receiver["id"]:
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

    def _handle_link_change(self) -> str:
        final_string = ""
        if self.new_value:
            final_string += f"added a new link '{self.new_value}'"
        else:
            final_string += f"removed the link '{self.old_value}'"

        return final_string

    def _handle_attachment_change(self) -> str:
        final_string = ""
        if self.new_value:
            final_string += "updated a new attachment"
        else:
            final_string += "removed an attachment"

        return final_string

    # Relationship handlers
    def _handle_relates_to_change(self) -> str:
        action = (
            "marked that this work item relates to"
            if self.new_value
            else "removed the relation from"
        )
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
            "marked this work item is being blocked by"
            if self.new_value
            else "removed this work item being blocked by"
        )
        return f"{action} {f'{self.new_value}' if self.new_value else self.old_value}"

    def _handle_blocking_change(self) -> str:
        action = (
            "marked this work item is blocking work item"
            if self.new_value
            else "removed the blocking work item"
        )
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

    def _handle_comment_change(self) -> str:
        comment_content = (
            None
            if self.new_value == "None" and self.old_value == "None"
            else self.new_value
        )
        constructed_comment = (
            construct_comment_content_with_mentions(comment_content)
            if comment_content
            else None
        )

        is_receiver_mentioned = False
        if constructed_comment and constructed_comment["mention_objects"] is not None:
            is_receiver_mentioned = (
                self.receiver["id"] in constructed_comment["mention_objects"]
            )

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

        return f"{action} '{constructed_comment['content']}'"

    def build_notification(self) -> str:
        """Build and return the notification string for the property change."""

        property_handlers = {
            # Properties
            "name": self._handle_name_change,
            "state": self._handle_state_change,
            "priority": self._handle_priority_change,
            "assignees": self._handle_assignees_change,
            "labels": self._handle_labels_change,
            "start_date": self._handle_start_date_change,
            "target_date": self._handle_target_date_change,
            "parent": self._handle_parent_change,
            # Links
            "link": self._handle_link_change,
            # Attachments
            "attachment": self._handle_attachment_change,
            # Relationships
            "relates_to": self._handle_relates_to_change,
            "duplicate": self._handle_duplicate_change,
            "blocked_by": self._handle_blocked_by_change,
            "blocking": self._handle_blocking_change,
            "start_before": self._handle_start_before_change,
            "start_after": self._handle_start_after_change,
            "finish_before": self._handle_finish_before_change,
            "finish_after": self._handle_finish_after_change,
            # Comments
            "comment": self._handle_comment_change,
        }

        handler = property_handlers.get(self.property_key)
        if handler:
            return f"{self.sender['name']} {handler()}"
        else:
            return f"{self.actor['name']} updated {self.property_key}"
