from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CredentialBase(BaseModel):
    platform: str
    username: str


class CredentialCreate(CredentialBase):
    password: str


class CredentialRead(CredentialBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    password: str
    updated_at: datetime
