import asyncio
from fastapi import FastAPI
from .api import home_router
from .tasks import issue_activity_consumer
from .settings import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.PROJECT_VERSION,
)

app.include_router(home_router, tags=["home"])


@app.on_event("startup")
async def startup_event():
    print("Starting up")
    asyncio.create_task(issue_activity_consumer())
