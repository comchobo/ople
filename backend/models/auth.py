from datetime import datetime

from sqlmodel import Field, SQLModel


class LoginSession(SQLModel, table=True):
    token_hash: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    expires_at: datetime


class Signup(SQLModel, table=True):
    email: str = Field(primary_key=True)
    password_hash: str
    code_hash: str
    sent_at: datetime
    expires_at: datetime


class OAuthAttempt(SQLModel, table=True):
    state_hash: str = Field(primary_key=True)
    nonce: str
    verifier: str
    expires_at: datetime
