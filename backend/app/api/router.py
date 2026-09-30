from fastapi import APIRouter
from app.api.routes import health_router, dataset_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(dataset_router)
