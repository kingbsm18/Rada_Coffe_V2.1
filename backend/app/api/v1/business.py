from fastapi import APIRouter

# Business API surface (A-02). No endpoints yet: identity, tenancy and findings await Domain 3.
router = APIRouter(prefix="/business", tags=["business"])
