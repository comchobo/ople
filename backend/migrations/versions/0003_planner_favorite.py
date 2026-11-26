"""Persist planner favorites, including a default for existing planners."""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"


def upgrade():
    op.add_column(
        "planner", sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade():
    op.drop_column("planner", "is_favorite")
