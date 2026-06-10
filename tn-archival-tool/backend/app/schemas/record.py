from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: int
    screenshot_path: str | None = None
    html_path: str | None = None
    sha256_hash: str | None = None
    metadata: dict | None = Field(None, validation_alias="metadata_")
    captured_at: datetime
    is_verified: bool
    case_number: str
    submitted_by_username: str
    url: str
    platform: str


class RemarkCreate(BaseModel):
    content: str


class RemarkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    record_id: int
    author_id: int
    content: str
    created_at: datetime
