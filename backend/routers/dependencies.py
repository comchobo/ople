from typing import Annotated

from fastapi import Cookie, Depends
from sqlmodel import Session

from db import session
from models.users import User
from services.auth.sessions import current_user

DB = Annotated[Session, Depends(session)]


def user_dependency(db: DB, ople_session: Annotated[str | None, Cookie()] = None) -> User:
    return current_user(db, ople_session)


CurrentUser = Annotated[User, Depends(user_dependency)]
