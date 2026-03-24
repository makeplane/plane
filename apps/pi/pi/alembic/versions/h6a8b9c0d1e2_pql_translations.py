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
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "h6a8b9c0d1e2"
down_revision: Union[str, None] = "596458cdd372"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pql_translations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        # Who / where
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=True),
        # Input / output
        sa.Column("query", sa.Text(), nullable=False),
        sa.Column("pql_output", sa.Text(), nullable=True),
        # Status
        sa.Column("success", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("error", sa.Text(), nullable=True),
        # Latency
        sa.Column("latency_ms", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Single-column indexes
    op.create_index(op.f("ix_pql_translations_user_id"), "pql_translations", ["user_id"], unique=False)
    op.create_index(op.f("ix_pql_translations_workspace_id"), "pql_translations", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_pql_translations_created_at"), "pql_translations", ["created_at"], unique=False)

    # Composite index for workspace + time range queries
    op.create_index("ix_pql_translations_workspace_created", "pql_translations", ["workspace_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_pql_translations_workspace_created", table_name="pql_translations")
    op.drop_index(op.f("ix_pql_translations_created_at"), table_name="pql_translations")
    op.drop_index(op.f("ix_pql_translations_workspace_id"), table_name="pql_translations")
    op.drop_index(op.f("ix_pql_translations_user_id"), table_name="pql_translations")
    op.drop_table("pql_translations")
