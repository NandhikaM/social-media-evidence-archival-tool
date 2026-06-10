from fastapi import APIRouter

from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users")


@router.get("/", response_model=list[UserRead])
async def list_users() -> list[UserRead]:
    # TODO: implement user listing
    return []


@router.post("/", response_model=UserRead)
async def create_user(_payload: UserCreate) -> UserRead:
    # TODO: implement user creation
    raise NotImplementedError("User creation not yet implemented")


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(user_id: int, _payload: UserUpdate) -> UserRead:
    # TODO: implement user update
    raise NotImplementedError(f"User {user_id} update not yet implemented")
