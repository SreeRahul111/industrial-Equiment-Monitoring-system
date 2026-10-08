from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from backend.app.security.hashing import verify_password
from backend.app.security.jwt import create_access_token
from backend.app.security.dependencies import get_current_user
from backend.app.audit.audit_logger import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()

    if not user or not verify_password(body.password, user.password_hash):
        log_audit_event(
            db=db,
            action="LOGIN_FAILURE",
            target_type="USER_AUTH",
            target_id=body.email,
            actor_name=body.email,
            actor_role="UNKNOWN",
            result="DENIED",
            metadata={"ip": client_ip, "reason": "Invalid credentials"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        log_audit_event(
            db=db,
            action="LOGIN_INACTIVE_DENIED",
            target_type="USER_AUTH",
            target_id=str(user.id),
            actor_user_id=user.id,
            actor_name=user.name,
            actor_role=user.role.value,
            result="DENIED",
            metadata={"ip": client_ip, "reason": "Account disabled"}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact your system administrator."
        )

    user.last_login_at = datetime.utcnow()
    db.commit()

    token = create_access_token(subject=user.id, role=user.role.value)

    log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        target_type="USER_AUTH",
        target_id=str(user.id),
        actor_user_id=user.id,
        actor_name=user.name,
        actor_role=user.role.value,
        result="ALLOWED",
        metadata={"ip": client_ip}
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="LOGOUT",
        target_type="USER_AUTH",
        target_id=str(current_user.id),
        actor_user_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value,
        result="ALLOWED",
        metadata={"ip": client_ip}
    )
    return {"message": "Successfully logged out"}
