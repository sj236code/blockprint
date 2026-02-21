from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import blueprint as blueprint_router
from app.routers import build as build_router

app = FastAPI(title="Blockprint API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(blueprint_router.router, prefix="/api", tags=["blueprint"])
app.include_router(build_router.router, prefix="/api", tags=["build"])


@app.get("/")
def root():
    return {"message": "Blockprint API", "docs": "/docs"}
