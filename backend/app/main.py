import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from . import models  # noqa: F401 — ensure models are registered before create_all
from .routes import router

for attempt in range(15):
    try:
        Base.metadata.create_all(bind=engine)
        break
    except Exception as e:
        if attempt == 14:
            raise
        print(f"db not ready (attempt {attempt + 1}/15): {e}")
        time.sleep(3)

app = FastAPI(title="Tweeklike API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
