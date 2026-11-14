from collections.abc import Generator

from sqlmodel import Session, create_engine

from utils.settings import setting

url = setting("DATABASE_URL", "postgresql://ople:ople@db:5432/ople")
engine = create_engine(url.replace("postgresql://", "postgresql+psycopg://"), pool_pre_ping=True)


def get_session() -> Generator[Session]:
    with Session(engine) as session:
        yield session
