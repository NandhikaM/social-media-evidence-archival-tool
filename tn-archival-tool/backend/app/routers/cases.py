from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.case import Case
from app.models.user import User
from app.schemas.case import CaseCreate, CaseRead

router = APIRouter(prefix="/cases")


@router.get("/", response_model=list[CaseRead])
async def list_cases(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CaseRead]:
    result = await db.execute(select(Case).order_by(Case.created_at.desc()))
    return list(result.scalars().all())


@router.post("/", response_model=CaseRead)
async def create_case(
    payload: CaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CaseRead:
    # Check if case number already exists
    existing = await db.scalar(select(Case).where(Case.case_number == payload.case_number))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Case number {payload.case_number} already exists"
        )
    
    db_case = Case(
        case_number=payload.case_number,
        fir_number=payload.fir_number,
        district=payload.district,
        priority=payload.priority,
        created_by=current_user.id,
    )
    db.add(db_case)
    await db.commit()
    await db.refresh(db_case)
    return db_case
