from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.archive_request import ArchiveRequest
from app.models.record import Record
from app.models.remark import Remark
from app.models.user import User
from app.schemas.record import RecordRead, RemarkCreate, RemarkRead

router = APIRouter(prefix="/records")


@router.get("/", response_model=list[RecordRead])
async def list_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RecordRead]:
    result = await db.execute(
        select(Record)
        .options(
            joinedload(Record.request).joinedload(ArchiveRequest.case),
            joinedload(Record.request).joinedload(ArchiveRequest.submitter),
        )
        .order_by(Record.captured_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{record_id}", response_model=RecordRead)
async def get_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecordRead:
    record = await db.scalar(
        select(Record)
        .options(
            joinedload(Record.request).joinedload(ArchiveRequest.case),
            joinedload(Record.request).joinedload(ArchiveRequest.submitter),
        )
        .where(Record.id == record_id)
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record


@router.get("/{record_id}/remarks", response_model=list[RemarkRead])
async def list_remarks(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RemarkRead]:
    result = await db.execute(
        select(Remark).where(Remark.record_id == record_id).order_by(Remark.created_at.asc())
    )
    return list(result.scalars().all())


@router.post("/{record_id}/remarks", response_model=RemarkRead)
async def create_remark(
    record_id: int,
    payload: RemarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemarkRead:
    # Check if record exists
    record = await db.scalar(select(Record).where(Record.id == record_id))
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    remark = Remark(
        record_id=record_id,
        author_id=current_user.id,
        content=payload.content,
    )
    db.add(remark)
    await db.commit()
    await db.refresh(remark)
    return remark
