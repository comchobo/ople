from sqlmodel import Session, create_engine

from utils.env import required

url = required("DATABASE_URL")
engine = create_engine(url.replace("postgresql://", "postgresql+psycopg://"), pool_pre_ping=True)


def session():
    with Session(engine, expire_on_commit=False) as db:
        yield db
