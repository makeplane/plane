# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Deterministic scripted agent for the planning copilot.

The agent is a pure state machine: `next_step(session)` reads the session's
`script_cursor` and returns the next step; it never touches the database. A
separate module (``engine.py``) applies the returned step to the transcript.

Kept behind `AgentEngine` so a real LLM can replace it without changing views.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from plane.utils.copilot_constants import CopilotToolName


@dataclass(frozen=True)
class ScriptStep:
    """One step of the scripted interview."""

    # The assistant text to stream before the tool (None for a tool-only step).
    text: Optional[str]
    # The tool to call, or None for a text-only step.
    tool: Optional[CopilotToolName] = None
    # Tool args.
    args: Dict[str, Any] = field(default_factory=dict)
    # When True the tool waits for a user response before the turn ends.
    interactive: bool = False
    # When True the tool fails on its first run (used to exercise the failed/retry path).
    fail_once: bool = False


# The scripted interview, in order. Each user reply or tool answer advances the cursor by one step.
SCRIPT: List[ScriptStep] = [
    ScriptStep(
        text="I'll help you turn this into a solid plan. Let me start by understanding the scope.",
    ),
    ScriptStep(
        text="First, a few questions to pin down the goal.",
        tool=CopilotToolName.ASK_USER,
        args={
            "questions": [
                {
                    "id": "goal",
                    "type": "long_text",
                    "label": "What outcome do you want this plan to deliver?",
                    "required": True,
                    "allow_not_sure": False,
                },
                {
                    "id": "audience",
                    "type": "dropdown",
                    "label": "Who is this for?",
                    "required": True,
                    "allow_not_sure": True,
                    "options": [
                        {"value": "internal", "label": "Internal team"},
                        {"value": "customers", "label": "Customers"},
                        {"value": "both", "label": "Both"},
                    ],
                },
                {
                    "id": "deadline",
                    "type": "date",
                    "label": "Target date (optional)",
                    "required": False,
                    "allow_not_sure": True,
                },
            ]
        },
        interactive=True,
    ),
    ScriptStep(
        text="Let me look at the work already in this project.",
        tool=CopilotToolName.SEARCH_TICKETS,
        args={"query": "in-progress", "limit": 5},
    ),
    ScriptStep(
        text="I'll check a couple of external references for prior art.",
        tool=CopilotToolName.WEB_SEARCH,
        args={"queries": ["planning copilot best practices", "adversarial planning interview"]},
    ),
    ScriptStep(
        text="This is a key constraint, so I'll remember it.",
        tool=CopilotToolName.REMEMBER,
        args={"content": "The plan must stay within the current project scope."},
    ),
    ScriptStep(
        text="Based on the above, here is a proposed structure for the page.",
        tool=CopilotToolName.PROPOSE_EDIT,
        args={
            "title": "Proposed outline",
            # The fingerprint is filled in at apply time; the mock proposes a static outline.
            "base_fingerprint": "",
            "hunks": [
                {
                    "id": "h1",
                    "old_start_line": 0,
                    "old_text": "",
                    "new_text": "## Goal\n\n## Scope\n\n## Approach\n",
                }
            ],
        },
        interactive=True,
    ),
    ScriptStep(
        text="I'll simulate a failed lookup to exercise the retry path.",
        tool=CopilotToolName.SEARCH_TICKETS,
        args={"query": "unstable-dependency", "limit": 5},
        fail_once=True,
    ),
    ScriptStep(
        text="Finally, here are the implementation tickets I'd create.",
        tool=CopilotToolName.DRAFT_TICKETS,
        args={
            "drafts": [
                {
                    "id": "t1",
                    "title": "Implement the planning copilot chat panel",
                    "description": "Build the docked chat panel with streaming and the widget framework.",
                    "priority": "high",
                },
                {
                    "id": "t2",
                    "title": "Add the six copilot tools",
                    "description": "ask_user, search_tickets, propose_edit, draft_tickets, remember, web_search.",
                    "priority": "medium",
                },
            ]
        },
        interactive=True,
    ),
    ScriptStep(
        text="That's the plan. You can review the tickets and the outline above.",
    ),
]


class AgentEngine:
    """Advance a session through the script, one step per turn."""

    def next_step(self, session) -> Optional[ScriptStep]:
        """Return the step at the session's cursor, or None when the script is finished."""
        cursor = session.script_cursor
        if cursor >= len(SCRIPT):
            return None
        return SCRIPT[cursor]

    def total_steps(self) -> int:
        return len(SCRIPT)


# The default engine. Views resolve the engine through this so it can be swapped.
def get_agent_engine() -> AgentEngine:
    return AgentEngine()
