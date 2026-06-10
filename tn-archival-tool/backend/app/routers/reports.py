from datetime import datetime, time, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.archive_request import ArchiveRequest, ArchiveStatus
from app.models.case import Case
from app.models.record import Record
from app.models.user import User
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/reports")


@router.get("/dashboard-stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    total_cases = await db.scalar(select(func.count(Case.id)))
    urls_archived = await db.scalar(select(func.count(Record.id)))
    
    # captured today
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)
    captured_today = await db.scalar(
        select(func.count(Record.id)).where(Record.captured_at >= today_start)
    )
    
    pending_requests = await db.scalar(
        select(func.count(ArchiveRequest.id)).where(
            ArchiveRequest.status.in_([ArchiveStatus.PENDING, ArchiveStatus.PROCESSING])
        )
    )
    
    completed = await db.scalar(
        select(func.count(ArchiveRequest.id)).where(ArchiveRequest.status == ArchiveStatus.COMPLETED)
    )
    
    return {
        "total_cases": total_cases or 0,
        "urls_archived": urls_archived or 0,
        "captured_today": captured_today or 0,
        "pending_requests": pending_requests or 0,
        "completed": completed or 0,
    }


@router.post("/generate", response_model=MessageResponse)
async def generate_report(
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    return MessageResponse(message="Report generation not yet implemented")
