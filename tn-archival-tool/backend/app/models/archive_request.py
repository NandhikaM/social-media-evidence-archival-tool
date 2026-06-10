import enum
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import pg_enum


class Platform(str, enum.Enum):
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    TELEGRAM = "telegram"
    YOUTUBE = "youtube"
    OTHER = "other"


class ArchiveStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ArchiveRequest(Base):
    __tablename__ = "archive_requests"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"))
    url: Mapped[str] = mapped_column(Text)
    platform: Mapped[Platform] = mapped_column(pg_enum(Platform, "platform"))
    target_handle: Mapped[str | None] = mapped_column(String(200), nullable=True)
    justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ArchiveStatus] = mapped_column(
        pg_enum(ArchiveStatus, "archive_status"),
        default=ArchiveStatus.PENDING,
    )
    submitted_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    case: Mapped["Case"] = relationship(back_populates="archive_requests")
    submitter: Mapped["User"] = relationship(back_populates="archive_requests")
    record: Mapped["Record | None"] = relationship(back_populates="request", uselist=False)

    @property
    def case_number(self) -> str:
        return self.case.case_number if self.case else ""

    @property
    def submitted_by_username(self) -> str:
        return self.submitter.username if self.submitter else ""
