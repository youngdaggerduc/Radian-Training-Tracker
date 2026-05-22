from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.auth import hash_password
from app.deps import get_current_user
from app.models import Course, Lead, Trainee, User

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.delete("/wipe-demo", dependencies=[Depends(get_current_user)])
async def wipe_demo(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    lead_count = await Lead.all().count()
    trainee_count = await Trainee.all().count()
    await Lead.all().delete()
    await Trainee.all().delete()
    return {"deleted_leads": lead_count, "deleted_trainees": trainee_count}


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


# ── Course catalog ────────────────────────────────────────────────────────────

def _course_out(c: Course) -> dict:
    return {"id": c.id, "provider": c.provider, "name": c.name, "price": c.price, "days": c.days, "active": c.active}


async def _next_course_id() -> str:
    ids = await Course.all().values_list("id", flat=True)
    nums = [int(i[2:]) for i in ids if i.startswith("c-") and i[2:].isdigit()]
    return f"c-{max(nums) + 1}" if nums else "c-1001"


class CourseIn(BaseModel):
    provider: str
    name: str
    price: float = 0
    days: int = 1


class CoursePatch(BaseModel):
    provider: Optional[str] = None
    name: Optional[str] = None
    price: Optional[float] = None
    days: Optional[int] = None
    active: Optional[bool] = None


@router.get("/courses")
async def list_courses(current_user: User = Depends(get_current_user)):
    courses = await Course.all().order_by("provider", "name")
    return [_course_out(c) for c in courses]


@router.post("/courses", status_code=201)
async def create_course(body: CourseIn, admin: User = Depends(require_admin)):
    new_id = await _next_course_id()
    course = await Course.create(
        id=new_id,
        provider=body.provider.strip(),
        name=body.name.strip(),
        price=body.price,
        days=body.days,
    )
    return _course_out(course)


@router.patch("/courses/{course_id}")
async def update_course(course_id: str, body: CoursePatch, admin: User = Depends(require_admin)):
    course = await Course.get_or_none(id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    updates = {}
    if body.provider is not None: updates["provider"] = body.provider.strip()
    if body.name     is not None: updates["name"]     = body.name.strip()
    if body.price    is not None: updates["price"]    = body.price
    if body.days     is not None: updates["days"]     = body.days
    if body.active   is not None: updates["active"]   = body.active
    if updates:
        await course.update_from_dict(updates).save()
    return _course_out(course)


@router.delete("/courses/{course_id}", status_code=204)
async def delete_course(course_id: str, admin: User = Depends(require_admin)):
    course = await Course.get_or_none(id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await course.delete()
