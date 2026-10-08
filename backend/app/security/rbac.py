from typing import List
from fastapi import HTTPException, status
from backend.app.models.user import UserRole, User

ROLE_HIERARCHY = {
    UserRole.ADMIN: 3,
    UserRole.ENGINEER: 2,
    UserRole.VIEWER: 1,
}

def check_permission(user_role: UserRole, allowed_roles: List[UserRole]) -> bool:
    return user_role in allowed_roles
