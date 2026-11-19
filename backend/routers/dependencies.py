from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, Header
from sqlmodel import Session

from db import session
from models.users import User
from services.auth.sessions import current_user

DB = Annotated[Session, Depends(session)]


def user_dependency(db: DB, ople_session: Annotated[str | None, Cookie()] = None) -> User:
    return current_user(db, ople_session)


CurrentUser = Annotated[User, Depends(user_dependency)]


PlannerCopyKey = Annotated[UUID, Header(alias="Idempotency-Key")]
