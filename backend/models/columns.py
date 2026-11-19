from sqlalchemy import JSON, Column
from sqlalchemy.dialects.postgresql import JSONB


def json_column() -> Column:
    return Column(JSON().with_variant(JSONB(), "postgresql"), nullable=False)
