from datetime import datetime

from pydantic import BaseModel, ConfigDict, HttpUrl

from app.models.archive_request import ArchiveStatus, Platform


class ArchiveRequestBase(BaseModel):
    platform: Platform
    url: HttpUrl | str
    target_handle: str | None = None
    justification: str | None = None


class ArchiveRequestCreate(ArchiveRequestBase):
    case_number: str
    fir_number: str | None = None
    district: str
    priority: str = "normal"


class BulkArchiveRequestCreate(BaseModel):
    case_number: str
    fir_number: str | None = None
    district: str
    priority: str = "normal"
    platform: Platform
    urls: list[str]
    justification: str | None = None


class ArchiveRequestRead(ArchiveRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    status: ArchiveStatus
    submitted_by: int
    submitted_at: datetime
    case_number: str
    submitted_by_username: str
