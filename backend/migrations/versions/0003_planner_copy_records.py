"""Remember successful planner copy requests per user."""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"


def upgrade():
    op.create_table(
        "plannercopyrecord",
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("request_key", sa.Uuid(), primary_key=True),
        sa.Column("source_planner_id", sa.String(), nullable=False),
        sa.Column("requested_name", sa.String(length=100)),
        sa.Column("copy_planner_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade():
    op.drop_table("plannercopyrecord")
