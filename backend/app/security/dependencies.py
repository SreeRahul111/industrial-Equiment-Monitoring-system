from typing import List, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.security.jwt import decode_access_token
from backend.app.audit.audit_logger import log_audit_event

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        uid = int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        log_audit_event(
            db=db,
            action="INACTIVE_USER_ACCESS_ATTEMPT",
            target_type="USER",
            target_id=str(user.id),
            actor_user_id=user.id,
            actor_name=user.name,
            actor_role=user.role.value,
            result="DENIED",
            metadata={"ip": request.client.host if request.client else "unknown"}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or disabled"
        )
    
    return user

def require_roles(allowed_roles: List[UserRole]):
    def role_checker(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if current_user.role not in allowed_roles:
            log_audit_event(
                db=db,
                action="AUTHORIZATION_DENIAL",
                target_type="ENDPOINT",
                target_id=request.url.path,
                actor_user_id=current_user.id,
                actor_name=current_user.name,
                actor_role=current_user.role.value,
                result="DENIED",
                metadata={
                    "ip": request.client.host if request.client else "unknown",
                    "required_roles": [r.value for r in allowed_roles],
                    "method": request.method
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

require_admin = require_roles([UserRole.ADMIN])
require_engineer_or_admin = require_roles([UserRole.ADMIN, UserRole.ENGINEER])
require_any_authenticated = require_roles([UserRole.ADMIN, UserRole.ENGINEER, UserRole.VIEWER])
