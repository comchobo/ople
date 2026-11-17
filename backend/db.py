from sqlmodel import Session, create_engine

from utils.config import setting

url = setting("DATABASE_URL", "postgresql://ople:ople@db:5432/ople")
engine = create_engine(url.replace("postgresql://", "postgresql+psycopg://"), pool_pre_ping=True)


def session():
    with Session(engine, expire_on_commit=False) as db:
        yield db
