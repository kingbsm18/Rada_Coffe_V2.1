from fastapi import APIRouter

from app.api.v1 import business, control
from app.api.v1.edge import events

router = APIRouter(prefix="/v1")
router.include_router(control.router)
router.include_router(business.router)
router.include_router(events.router)
