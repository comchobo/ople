import os
import subprocess
import sys
from uuid import uuid4

from sqlalchemy import inspect, text
from sqlmodel import Session, create_engine, select

from db import engine
from models.auth import LoginSession, OAuthAttempt, Signup
from models.generations import Generation
from models.planners import Planner
from models.recordings import Recording
from models.users import User
from utils.clock import now


def test_migrated_postgres_supports_all_split_models_and_foreign_keys(plans_data):
    schema = "test_" + uuid4().hex
    with engine.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    url = engine.url.update_query_dict({"options": f"-csearch_path={schema}"})
    migrated = create_engine(url)
    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            env={**os.environ, "DATABASE_URL": url.render_as_string(hide_password=False)},
            text=True,
            capture_output=True,
        )
        assert result.returncode == 0, result.stdout + result.stderr
        inspector = inspect(migrated)
        assert set(inspector.get_table_names()) == {
            "alembic_version",
            "user",
            "signup",
            "oauthattempt",
            "loginsession",
            "recording",
            "planner",
            "generation",
        }
        with Session(migrated) as db:
            user = User(email="hello@example.com", name="이름", google_sub="google")
            db.add(user)
            db.commit()
            db.add_all(
                [
                    Signup(
                        email=user.email,
                        password_hash="hash",
                        code_hash="code",
                        sent_at=now(),
                        expires_at=now(),
                    ),
                    OAuthAttempt(
                        state_hash="state", nonce="nonce", verifier="verifier", expires_at=now()
                    ),
                    LoginSession(token_hash="token", user_id=user.id, expires_at=now()),
                    Recording(
                        user_id=user.id,
                        interview_id="i",
                        question_index=0,
                        filename="0.webm",
                        content_type="audio/webm",
                    ),
                    Planner(user_id=user.id, name="계획", plans=plans_data["plans"]),
                    Generation(user_id=user.id, payload={"summary": "나의 이야기"}),
                ]
            )
            db.commit()
            for model in (User, Signup, OAuthAttempt, LoginSession, Recording, Planner, Generation):
                item = db.exec(select(model)).one()
                if isinstance(item, (Signup, OAuthAttempt, LoginSession)):
                    assert item.expires_at.tzinfo is not None
            assert db.exec(select(Planner)).one().plans == plans_data["plans"]
            assert db.exec(select(Generation)).one().payload == {"summary": "나의 이야기"}
        for table in ("loginsession", "recording", "planner", "generation"):
            assert any(
                key["referred_table"] == "user" and key["constrained_columns"] == ["user_id"]
                for key in inspector.get_foreign_keys(table)
            )
        assert any(
            constraint["column_names"] == ["google_sub"]
            for constraint in inspector.get_unique_constraints("user")
        )
        assert any(
            index["column_names"] == ["interview_id"]
            for index in inspector.get_indexes("recording")
        )
    finally:
        migrated.dispose()
        with engine.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
