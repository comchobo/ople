from alembic import context
from sqlmodel import SQLModel

import models  # noqa: F401
from db import engine

with engine.connect() as connection:
    context.configure(connection=connection, target_metadata=SQLModel.metadata)
    with context.begin_transaction():
        context.run_migrations()
