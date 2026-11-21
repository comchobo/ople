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

    def upgrade(target):
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", target],
            env={**os.environ, "DATABASE_URL": url.render_as_string(hide_password=False)},
            text=True,
            capture_output=True,
        )
        assert result.returncode == 0, result.stdout + result.stderr

    try:
        upgrade("0002")
        with migrated.begin() as connection:
            connection.execute(
                text("""INSERT INTO "user" (id,email,name) VALUES ('u','old@example.com','기존')""")
            )
            connection.execute(
                text("""INSERT INTO planner (id,user_id,name,plans,created_at,updated_at)
                VALUES ('p','u','이전 계획','[]',now(),now())""")
            )
        upgrade("head")
        with migrated.begin() as connection:
            assert (
                connection.execute(
                    text("SELECT is_favorite FROM planner WHERE id='p'")
                ).scalar_one()
                is False
            )
            connection.execute(text("DELETE FROM planner WHERE id='p'"))
            connection.execute(text("""DELETE FROM "user" WHERE id='u'"""))
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
