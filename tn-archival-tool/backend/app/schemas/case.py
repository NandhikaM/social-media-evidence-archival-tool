from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.case import CasePriority


class CaseBase(BaseModel):
    case_number: str = Field(..., pattern=r"^CYB-\d{4}-\d{3}$")
    fir_number: str | None = None
    district: str
    priority: CasePriority = CasePriority.NORMAL


class CaseCreate(CaseBase):
    pass


class CaseRead(CaseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_by: int
    created_at: datetime
