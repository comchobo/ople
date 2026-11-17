"""Store timezone-aware UTC timestamps, matching SQLModel's UTCDateTime."""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"

FIELDS = {
    "loginsession": ["expires_at"],
    "signup": ["sent_at", "expires_at"],
    "oauthattempt": ["expires_at"],
    "recording": ["created_at"],
    "planner": ["created_at", "updated_at"],
    "generation": ["created_at", "updated_at"],
}


def upgrade():
    for table, columns in FIELDS.items():
        for column in columns:
            op.alter_column(
                table,
                column,
                type_=sa.DateTime(timezone=True),
                postgresql_using=f"{column} AT TIME ZONE 'UTC'",
            )


def downgrade():
    for table, columns in FIELDS.items():
        for column in columns:
            op.alter_column(
                table, column, type_=sa.DateTime(), postgresql_using=f"{column} AT TIME ZONE 'UTC'"
            )
