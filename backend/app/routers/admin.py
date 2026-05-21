from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.auth import hash_password
from app.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _user_out(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "name": u.name,
        "initials": u.initials,
        "role": u.role,
        "isAdmin": u.is_admin,
    }


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def next_user_id() -> str:
    ids = await User.all().values_list("id", flat=True)
    nums = [int(i[1:]) for i in ids if i.startswith("s") and i[1:].isdigit()]
    return f"s{max(nums) + 1}" if nums else "s4"


# ── Models ────────────────────────────────────────────────────────────────────

class UserIn(BaseModel):
    name: str
    username: str
    initials: str
    role: str = "Training Coordinator"
    isAdmin: bool = False
    password: str


class ResetPasswordIn(BaseModel):
    password: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(admin: User = Depends(require_admin)):
    users = await User.all().order_by("id")
    return [_user_out(u) for u in users]


@router.post("/users", status_code=201)
async def create_user(body: UserIn, admin: User = Depends(require_admin)):
    existing = await User.get_or_none(username=body.username.strip().lower())
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")
    new_id = await next_user_id()
    user = await User.create(
        id=new_id,
        username=body.username.strip().lower(),
        name=body.name.strip(),
        initials=body.initials.strip().upper(),
        role=body.role,
        is_admin=body.isAdmin,
        hashed_password=hash_password(body.password),
    )
    return _user_out(user)


@router.patch("/users/{user_id}/password", status_code=204)
async def reset_password(user_id: str, body: ResetPasswordIn, admin: User = Depends(require_admin)):
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user.update_from_dict({"hashed_password": hash_password(body.password)}).save()


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: str, admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot remove your own account")
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user.delete()
