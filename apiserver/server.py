import os
import uvicorn

if __name__ == "__main__":
    os.environ.setdefault(
        "DJANGO_SETTINGS_MODULE", "plane.settings.production"
    )
    uvicorn.run(
        "plane.asgi:application",
        host=os.environ.get("HOST", "0.0.0.0"),
        port=os.environ.get("PORT", 8000),
        ws="auto",
        workers=int(os.environ.get("GUNICORN_WORKERS", 1)),
        log_level=os.environ.get("LOG_LEVEL", "info"),
        lifespan="off",
        access_log="on",
    )
