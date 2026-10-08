from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from backend.app.models.user import UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.ENGINEER

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserStatusUpdateRequest(BaseModel):
    is_active: bool

TokenResponse.model_rebuild()
