from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.archive_request import ArchiveRequest, ArchiveStatus
from app.models.case import Case, CasePriority
from app.models.user import User
from app.schemas.archive_request import ArchiveRequestCreate, ArchiveRequestRead, BulkArchiveRequestCreate
from app.utils.queue import get_queue

router = APIRouter(prefix="/requests")


async def get_or_create_case(db: AsyncSession, case_number: str, district: str, priority_str: str, fir_number: str | None, user_id: int) -> Case:
    case = await db.scalar(select(Case).where(Case.case_number == case_number))
    if not case:
        priority = CasePriority.NORMAL
        if priority_str.lower() == "urgent":
            priority = CasePriority.URGENT
        elif priority_str.lower() == "critical":
            priority = CasePriority.CRITICAL

        case = Case(
            case_number=case_number,
            fir_number=fir_number,
            district=district,
            priority=priority,
            created_by=user_id,
        )
        db.add(case)
        await db.flush()  # Get case.id
    return case


@router.get("/", response_model=list[ArchiveRequestRead])
async def list_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ArchiveRequestRead]:
    result = await db.execute(
        select(ArchiveRequest)
        .options(selectinload(ArchiveRequest.case), selectinload(ArchiveRequest.submitter))
        .order_by(ArchiveRequest.submitted_at.desc())
    )
    return list(result.scalars().all())


@router.post("/", response_model=ArchiveRequestRead)
async def create_request(
    payload: ArchiveRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArchiveRequestRead:
    # Ensure case exists or create it
    case = await get_or_create_case(
        db,
        case_number=payload.case_number,
        district=payload.district,
        priority_str=payload.priority,
        fir_number=payload.fir_number,
        user_id=current_user.id,
    )

    db_request = ArchiveRequest(
        case_id=case.id,
        url=str(payload.url),
        platform=payload.platform,
        target_handle=payload.target_handle,
        justification=payload.justification,
        status=ArchiveStatus.PENDING,
        submitted_by=current_user.id,
    )
    db.add(db_request)
    await db.commit()

    # Queue background task in RQ
    rq_queue = get_queue()
    rq_queue.enqueue("tasks.archive.process_archive_request", db_request.id)

    # Fetch request with loaded relations to populate response model properties
    stmt = (
        select(ArchiveRequest)
        .options(selectinload(ArchiveRequest.case), selectinload(ArchiveRequest.submitter))
        .where(ArchiveRequest.id == db_request.id)
    )
    res_request = await db.scalar(stmt)
    return res_request


@router.post("/bulk", response_model=list[ArchiveRequestRead])
async def create_bulk_requests(
    payload: BulkArchiveRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ArchiveRequestRead]:
    case = await get_or_create_case(
        db,
        case_number=payload.case_number,
        district=payload.district,
        priority_str=payload.priority,
        fir_number=payload.fir_number,
        user_id=current_user.id,
    )

    rq_queue = get_queue()
    created_requests = []

    for url in payload.urls:
        if not url.strip():
            continue
        db_request = ArchiveRequest(
            case_id=case.id,
            url=url.strip(),
            platform=payload.platform,
            justification=payload.justification,
            status=ArchiveStatus.PENDING,
            submitted_by=current_user.id,
        )
        db.add(db_request)
        created_requests.append(db_request)

    await db.commit()

    # Enqueue all
    for req in created_requests:
        rq_queue.enqueue("tasks.archive.process_archive_request", req.id)

    # Fetch them with loaded relations to populate response model properties
    req_ids = [r.id for r in created_requests]
    stmt = (
        select(ArchiveRequest)
        .options(selectinload(ArchiveRequest.case), selectinload(ArchiveRequest.submitter))
        .where(ArchiveRequest.id.in_(req_ids))
        .order_by(ArchiveRequest.submitted_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
