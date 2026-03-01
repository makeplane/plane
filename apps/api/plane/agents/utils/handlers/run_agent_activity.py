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

# python imports
from plane.agents.models import AgentRunActivity
from plane.db.models import IssueComment


def create_comment_from_activity(activity: AgentRunActivity):
    """
    Create a new comment.
    """
    return IssueComment.objects.create(
        comment_html=f"<p>{activity.content['body']}</p>",
        actor=activity.actor,
        issue=activity.agent_run.issue,
        project=activity.agent_run.project,
        workspace=activity.agent_run.workspace,
        parent=activity.agent_run.comment if activity.agent_run.comment else None,
    )


# Needs to trigger this method when a new activity is created for an agent run
def handle_agent_run_activity(activity: AgentRunActivity):
    """
    Handle the agent activity for the associated run.
    Check if the activity is created by an agent.
    If it's not ephemeral, create a new comment in the thread.
    If no comment attached to the run, create a new one and attach it to the run.
    """

    activity_run = activity.agent_run
    # return if the activity is ephemeral
    if activity.ephemeral:
        return

    # create a new comment
    # if run has a comment attached, use it as the parent
    comment = create_comment_from_activity(activity)

    # attach the comment to the activity
    activity.comment = comment
    activity.save()

    # if no comment attached to the run attach this one
    if not activity_run.comment:
        activity_run.comment = comment
        activity_run.source_comment = comment
        activity_run.save()
        return
