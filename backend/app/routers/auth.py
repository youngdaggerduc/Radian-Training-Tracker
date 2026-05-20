from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import verify_password, create_token
from app.deps import get_current_user
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(u: User) -> dict:
    return {"id": u.id, "name": u.name, "initials": u.initials, "role": u.role}


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
