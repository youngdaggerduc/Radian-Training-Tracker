from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import verify_password, hash_password, create_token
from app.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(u: User) -> dict:
    return {"id": u.id, "name": u.name, "initials": u.initials, "role": u.role, "isAdmin": u.is_admin}


class LoginIn(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(body: LoginIn):
    user = await User.get_or_none(username=body.username.strip().lower())
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "access_token": create_token(user.id),
        "token_type": "bearer",
        "user": _user_out(user),
    }


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return _user_out(current_user)


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


@router.patch("/me/password", status_code=204)
async def change_my_password(body: ChangePasswordIn, user: User = Depends(get_current_user)):
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    await user.update_from_dict({"hashed_password": hash_password(body.new_password)}).save()
