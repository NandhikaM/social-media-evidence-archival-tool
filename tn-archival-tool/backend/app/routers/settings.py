from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.credential import Credential
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.credential import CredentialCreate, CredentialRead

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


@router.get("/credentials", response_model=list[CredentialRead])
async def list_credentials(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CredentialRead]:
    result = await db.execute(select(Credential))
    return list(result.scalars().all())


@router.post("/credentials", response_model=CredentialRead)
async def create_or_update_credential(
    payload: CredentialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CredentialRead:
    # Check if credential already exists for this platform
    existing = await db.scalar(
        select(Credential).where(Credential.platform == payload.platform)
    )
    if existing:
        existing.username = payload.username
        existing.password = payload.password
        db_credential = existing
    else:
        db_credential = Credential(
            platform=payload.platform,
            username=payload.username,
            password=payload.password,
        )
        db.add(db_credential)

    await db.commit()
    await db.refresh(db_credential)
    return db_credential

