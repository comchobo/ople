"""Enforce unique planner names per owner."""

from alembic import op

revision = "0005"
down_revision = "0004"


def upgrade():
    op.create_unique_constraint("uq_planner_user_name", "planner", ["user_id", "name"])


def downgrade():
    op.drop_constraint("uq_planner_user_name", "planner", type_="unique")
