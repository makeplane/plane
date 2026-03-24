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

from typing import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "h6a8b9c0d1e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "page_utility_embeds",
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("embed_id", sa.Uuid(), nullable=False),
        sa.Column("embed_type", sa.String(length=50), nullable=False),
        sa.Column("sub_type", sa.String(length=100), nullable=True),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Uuid(), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=True),
        sa.Column("chat_id", sa.Uuid(), nullable=False),
        sa.Column("message_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("embed_id"),
    )
    op.create_index(op.f("ix_page_utility_embeds_id"), "page_utility_embeds", ["id"], unique=False)
    op.create_index(op.f("ix_page_utility_embeds_embed_id"), "page_utility_embeds", ["embed_id"], unique=True)
    op.create_index(op.f("ix_page_utility_embeds_workspace_id"), "page_utility_embeds", ["workspace_id"], unique=False)
    op.create_index("ix_page_utility_embeds_entity", "page_utility_embeds", ["entity_type", "entity_id"])
    op.create_index("ix_page_utility_embeds_chat_message", "page_utility_embeds", ["chat_id", "message_id"])


def downgrade() -> None:
    op.drop_index("ix_page_utility_embeds_chat_message", table_name="page_utility_embeds")
    op.drop_index("ix_page_utility_embeds_entity", table_name="page_utility_embeds")
    op.drop_index(op.f("ix_page_utility_embeds_workspace_id"), table_name="page_utility_embeds")
    op.drop_index(op.f("ix_page_utility_embeds_embed_id"), table_name="page_utility_embeds")
    op.drop_index(op.f("ix_page_utility_embeds_id"), table_name="page_utility_embeds")
    op.drop_table("page_utility_embeds")
