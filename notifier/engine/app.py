from fastapi import FastAPI
from .api import home_router
from .settings import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.PROJECT_VERSION,
)

app.include_router(home_router, tags=["home"])
