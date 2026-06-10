from fastapi import APIRouter

from app.schemas.common import MessageResponse

router = APIRouter(prefix="/settings")


@router.get("/")
async def get_settings() -> dict:
    # TODO: implement settings retrieval
    return {
        "state_hq_reporting": True,
        "session_timeout_minutes": 30,
    }


@router.patch("/")
async def update_settings(_payload: dict) -> dict:
    # TODO: implement settings update
    return {"message": "Settings update not yet implemented"}


@router.get("/audit-log/download", response_model=MessageResponse)
async def download_audit_log() -> MessageResponse:
    # TODO: implement audit log export
    return MessageResponse(message="Audit log download not yet implemented")
