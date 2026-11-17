"""Authentication, recordings, planners and API generation jobs."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0001"
down_revision = None


def upgrade():
    op.create_table(
        "user",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String()),
        sa.Column("google_sub", sa.String(), unique=True),
    )
    op.create_table(
        "loginsession",
        sa.Column("token_hash", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "signup",
        sa.Column("email", sa.String(), primary_key=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=False),
        sa.Column("sent_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "oauthattempt",
        sa.Column("state_hash", sa.String(), primary_key=True),
        sa.Column("nonce", sa.String(), nullable=False),
        sa.Column("verifier", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "recording",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("interview_id", sa.String(), nullable=False),
        sa.Column("question_index", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "planner",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("plans", JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "generation",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("payload", JSONB(), nullable=False),
        sa.Column("planner_id", sa.String()),
        sa.Column("error", sa.String()),
        sa.Column("attempt", sa.String()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    for table in ("loginsession", "recording", "planner", "generation"):
        op.create_index(f"ix_{table}_user_id", table, ["user_id"])
    op.create_index("ix_recording_interview_id", "recording", ["interview_id"])


def downgrade():
    for table in (
        "generation",
        "planner",
        "recording",
        "oauthattempt",
        "signup",
        "loginsession",
        "user",
    ):
        op.drop_table(table)
