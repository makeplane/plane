import os


class PostgresSettings:
    PG_HOST: str = os.environ.get("POSTGRES_HOST", "localhost")
    PG_PORT: int = os.environ.get("POSTGRES_PORT", 5432)
    PG_USER: str = os.environ.get("POSTGRES_USER", "postgres")
    PG_PASSWORD: str = os.environ.get("POSTGRES_PASSWORD", "postgres")
    PG_NAME: str = os.environ.get("POSTGRES_DB", "notification")
