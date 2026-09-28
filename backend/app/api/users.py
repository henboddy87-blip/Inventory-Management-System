from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password
from app.api.deps import get_current_user, require_roles, log_audit_trail
from app.models.user import User, Role, Permission
from app.schemas.auth import UserResponse, UserCreate, UserUpdate, RoleResponse

router = APIRouter(prefix="/users", tags=["Users & Access Control"])

@router.get("/roles", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin"]))
):
    roles = db.query(Role).all()
    return roles

@router.get("", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin"]))
):
    users = db.query(User).all()
    return users

@router.post("", response_model=UserResponse)
def create_user(
    data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin"]))
):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    role = db.query(Role).filter(Role.id == data.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role ID")

    new_user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        phone=data.phone,
        role_id=data.role_id,
        hashed_password=hash_password(data.password),
        is_active=data.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="CREATE",
        entity="User",
        entity_id=str(new_user.id),
        description=f"Created user '{new_user.username}' with role '{role.display_name}'.",
        request=request
    )

    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.email and data.email != user.email:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = data.email

    if data.username and data.username != user.username:
        if db.query(User).filter(User.username == data.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = data.username

    if data.full_name:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.role_id is not None:
        role = db.query(Role).filter(Role.id == data.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role ID")
        user.role_id = data.role_id
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.password:
        user.hashed_password = hash_password(data.password)

    db.commit()
    db.refresh(user)

    log_audit_trail(
        db,
        user_id=current_user.id,
        action="UPDATE",
        entity="User",
        entity_id=str(user.id),
        description=f"Updated user profile for '{user.username}'.",
        request=request
    )

    return user
