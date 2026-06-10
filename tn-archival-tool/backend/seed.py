"""
Seed development data for TN Archival Tool.

Usage:
    python seed.py
"""

import asyncio
import sys

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import (
    ArchiveRequest,
    ArchiveStatus,
    Case,
    CasePriority,
    Platform,
    Record,
    User,
    UserRole,
)
from app.utils.security import hash_password

SAMPLE_DISTRICTS = ["Chennai", "Coimbatore", "Salem"]
DEFAULT_PASSWORD = "password123"


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(select(User).where(User.username == "User_1"))
        if existing:
            print("Seed data already exists — skipping.")
            return

        user_1 = User(
            username="User_1",
            full_name="User_1",
            hashed_password=hash_password(DEFAULT_PASSWORD),
            role=UserRole.INVESTIGATING_OFFICER,
            district="Chennai South",
            is_active=True,
        )
        admin = User(
            username="Admin_Super",
            full_name="Admin_Super",
            hashed_password=hash_password(DEFAULT_PASSWORD),
            role=UserRole.SYSTEM_ADMIN,
            district="State HQ",
            is_active=True,
        )
        session.add_all([user_1, admin])
        await session.flush()

        cases = [
            Case(
                case_number="CYB-2026-047",
                fir_number="12/2026",
                district=SAMPLE_DISTRICTS[0],
                priority=CasePriority.NORMAL,
                created_by=user_1.id,
            ),
            Case(
                case_number="CYB-2026-046",
                fir_number=None,
                district=SAMPLE_DISTRICTS[1],
                priority=CasePriority.URGENT,
                created_by=user_1.id,
            ),
            Case(
                case_number="CYB-2026-045",
                fir_number="08/2026",
                district=SAMPLE_DISTRICTS[2],
                priority=CasePriority.NORMAL,
                created_by=user_1.id,
            ),
        ]
        session.add_all(cases)
        await session.flush()

        completed_request = ArchiveRequest(
            case_id=cases[0].id,
            url="https://www.instagram.com/p/Ab12Cd3/",
            platform=Platform.INSTAGRAM,
            target_handle="@handle_021",
            justification="Evidence preservation for cybercrime investigation.",
            status=ArchiveStatus.COMPLETED,
            submitted_by=user_1.id,
        )
        pending_request = ArchiveRequest(
            case_id=cases[1].id,
            url="https://t.me/channel_098/21",
            platform=Platform.TELEGRAM,
            target_handle="@chan_098",
            justification="Pending archival of Telegram channel post.",
            status=ArchiveStatus.PENDING,
            submitted_by=user_1.id,
        )
        session.add_all([completed_request, pending_request])
        await session.flush()

        record = Record(
            request_id=completed_request.id,
            screenshot_path="evidence/CYB-2026-047/screenshot_001.png",
            html_path="evidence/CYB-2026-047/page_001.html",
            sha256_hash="4f2ca192e212f6723b7b80e7960753b00394623485669b369170ef565985501",
            metadata_={
                "likes": 4122,
                "shares": 89,
                "comments": 214,
                "hashtags": ["#cybercrime", "#tnpolice"],
                "location": "Chennai, TN",
            },
            is_verified=True,
        )
        session.add(record)

        await session.commit()

        print("Seed completed successfully.")
        print(f"  Users: User_1, Admin_Super (password: {DEFAULT_PASSWORD})")
        print(f"  Districts used on cases: {', '.join(SAMPLE_DISTRICTS)}")
        print("  Archive requests: 1 completed, 1 pending")


def main() -> None:
    try:
        asyncio.run(seed())
    except Exception as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
