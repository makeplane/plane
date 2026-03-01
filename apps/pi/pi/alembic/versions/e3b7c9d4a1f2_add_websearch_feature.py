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

"""add websearch feature - toggle columns and pricing

Revision ID: e3b7c9d4a1f2
Revises: f15f14eb119d
Create Date: 2026-01-19
"""

from typing import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e3b7c9d4a1f2"
down_revision: Union[str, None] = "f15f14eb119d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add websearch toggle to chats table
    op.add_column(
        "chats",
        sa.Column("is_websearch_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    # Add websearch toggle to user preferences table
    op.add_column(
        "user_chat_preferences",
        sa.Column("is_websearch_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    # Add web search call price to pricing table
    op.add_column("llm_model_pricing", sa.Column("web_search_call_price", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("llm_model_pricing", "web_search_call_price")
    op.drop_column("user_chat_preferences", "is_websearch_enabled")
    op.drop_column("chats", "is_websearch_enabled")
