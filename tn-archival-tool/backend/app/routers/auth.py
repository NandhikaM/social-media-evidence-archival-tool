from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import TokenResponse, UserMe
from app.schemas.common import MessageResponse
from app.utils.audit import write_audit_log
from app.utils.security import create_access_token, verify_password

router = APIRouter(prefix="/auth")


def _client_ip(request: Request) -> str | None:
    if request.client:
        return request.client.host
    return None


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    user = await db.scalar(select(User).where(User.username == form_data.username))
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    user.last_login = datetime.now(timezone.utc)
    await write_audit_log(
        db,
        user_id=user.id,
        action="login",
        target_type="user",
        target_id=str(user.id),
        ip_address=_client_ip(request),
    )
    await db.commit()

    access_token = create_access_token(user.id)
    return TokenResponse(access_token=access_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await write_audit_log(
        db,
        user_id=current_user.id,
        action="logout",
        target_type="user",
        target_id=str(current_user.id),
        ip_address=_client_ip(request),
    )
    await db.commit()
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserMe)
async def me(current_user: User = Depends(get_current_user)) -> UserMe:
    return current_user
