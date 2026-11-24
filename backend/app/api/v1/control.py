from fastapi import APIRouter

# Control API surface (A-02). No endpoints yet: identity, tenancy and provisioning await Domain 3.
router = APIRouter(prefix="/control", tags=["control"])
