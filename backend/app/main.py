from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.api.router import api_router
from app.db.session import engine, Base
from app.db.models import DatasetModel  # Ensure models register with Base

from sqlalchemy import inspect, text

# Create database tables if not created
Base.metadata.create_all(bind=engine)

# Migration helper: ensure owner_id column exists on datasets table for legacy databases
try:
    inspector = inspect(engine)
    if "datasets" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("datasets")]
        if "owner_id" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE datasets ADD COLUMN owner_id VARCHAR(255)"))
except Exception:
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered agentic enterprise data profiling, cleaning, validation, information-loss estimation, and rollback platform.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Mount API router under /api/v1 prefix
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
