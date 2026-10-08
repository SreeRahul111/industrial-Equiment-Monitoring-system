from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.schemas.auth import UserResponse, UserCreateRequest, UserUpdateRequest, UserStatusUpdateRequest
from backend.app.security.hashing import get_password_hash
from backend.app.security.dependencies import require_admin
from backend.app.audit.audit_logger import log_audit_event

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    users = db.query(User).order_by(User.id.asc()).all()
    return [UserResponse.model_validate(u) for u in users]

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters long")

    new_user = User(
        email=body.email.lower().strip(),
        password_hash=get_password_hash(body.password),
        name=body.name.strip(),
        role=body.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db=db,
        action="USER_CREATED",
        target_type="USER",
        target_id=str(new_user.id),
        actor_user_id=admin_user.id,
        actor_name=admin_user.name,
        actor_role=admin_user.role.value,
        result="ALLOWED",
        metadata={"created_email": new_user.email, "role": new_user.role.value}
    )

    return UserResponse.model_validate(new_user)

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = target.role.value
    if body.name is not None:
        target.name = body.name.strip()
    if body.role is not None:
        target.role = body.role
    if body.is_active is not None:
        target.is_active = body.is_active

    target.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(target)

    log_audit_event(
        db=db,
        action="USER_UPDATED",
        target_type="USER",
        target_id=str(target.id),
        actor_user_id=admin_user.id,
        actor_name=admin_user.name,
        actor_role=admin_user.role.value,
        result="ALLOWED",
        metadata={"email": target.email, "old_role": old_role, "new_role": target.role.value}
    )

    return UserResponse.model_validate(target)

@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    body: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deactivating themselves
    if target.id == admin_user.id and not body.is_active:
        raise HTTPException(status_code=400, detail="Administrator cannot disable their own account")

    target.is_active = body.is_active
    target.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(target)

    log_audit_event(
        db=db,
        action="USER_STATUS_CHANGED",
        target_type="USER",
        target_id=str(target.id),
        actor_user_id=admin_user.id,
        actor_name=admin_user.name,
        actor_role=admin_user.role.value,
        result="ALLOWED",
        metadata={"email": target.email, "is_active": target.is_active}
    )

    return UserResponse.model_validate(target)
