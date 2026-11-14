from alembic import context
from sqlmodel import SQLModel

from db import engine
from models import entities  # noqa: F401

with engine.connect() as connection:
    context.configure(connection=connection, target_metadata=SQLModel.metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()
