from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Record(Base):
    __tablename__ = "records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("archive_requests.id"), unique=True)
    screenshot_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    html_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sha256_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    request: Mapped["ArchiveRequest"] = relationship(back_populates="record")
    remarks: Mapped[list["Remark"]] = relationship(back_populates="record")

    @property
    def case_number(self) -> str:
        return self.request.case.case_number if self.request and self.request.case else ""

    @property
    def submitted_by_username(self) -> str:
        return self.request.submitter.username if self.request and self.request.submitter else ""

    @property
    def url(self) -> str:
        return self.request.url if self.request else ""

    @property
    def platform(self) -> str:
        return self.request.platform if self.request else ""
