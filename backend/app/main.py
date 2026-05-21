from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from tortoise.contrib.fastapi import register_tortoise

from app.config import TORTOISE_ORM
from app.routers import admin as admin_router, api, auth as auth_router

app = FastAPI(title="Radian Training API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(api.router)

register_tortoise(
    app,
    config=TORTOISE_ORM,
    generate_schemas=True,
    add_exception_handlers=True,
)


@app.on_event("startup")
async def seed_on_startup() -> None:
    """Seed staff accounts and course catalog on first run."""
    from app.models import Course, User
    from app.auth import hash_password

    # ── Staff accounts ────────────────────────────────────────────────────────
    if await User.all().count() == 0:
        staff = [
            {"id": "s1", "username": "pierce",  "name": "Pierce Doman",        "initials": "PD", "role": "Business Process Analyst", "is_admin": True},
            {"id": "s2", "username": "shanice", "name": "Shanice Rattan",      "initials": "SR", "role": "Training Coordinator",      "is_admin": False},
            {"id": "s3", "username": "kelsey",  "name": "Kelsey Ramkhelawan",  "initials": "KR", "role": "Training / Marketing",       "is_admin": False},
            {"id": "s4", "username": "ameer",   "name": "Ameer Mohammed",      "initials": "AM", "role": "Training Assistant",         "is_admin": False},
        ]
        default_pw = hash_password("radian2026")
        for u in staff:
            await User.create(**u, hashed_password=default_pw)

    # ── Course catalog ────────────────────────────────────────────────────────
    if await Course.all().count() == 0:
        courses = [
            {"id": "cisrs-l1",        "provider": "CISRS",        "name": "CISRS OSTS Scaffolder Level 1",                    "price": 8437.50, "days": 5},
            {"id": "cisrs-l2a",       "provider": "CISRS",        "name": "CISRS OSTS Scaffolder Level 2",                    "price": 8437.50, "days": 5},
            {"id": "cisrs-l2b",       "provider": "CISRS",        "name": "CISRS OSTS Scaffolder Level 2 (Advanced Cohort)",  "price": 9000.00, "days": 5},
            {"id": "cisrs-basic-insp","provider": "CISRS",        "name": "CISRS OSTS Basic Scaffolder Inspection",           "price": 6750.00, "days": 3},
            {"id": "cisrs-adv-insp",  "provider": "CISRS",        "name": "CISRS OSTS Advanced Scaffolder Inspection",        "price": 6500.00, "days": 2},
            {"id": "cisrs-supv",      "provider": "CISRS",        "name": "CISRS OSTS Scaffolder Supervisor",                 "price": 7875.00, "days": 3},
            {"id": "gms-wah",         "provider": "GetmieSafe",   "name": "Getmie Safe Working at Height",                   "price":  675.00, "days": 1},
            {"id": "gms-basic-r",     "provider": "GetmieSafe",   "name": "Basic GetmieSafe Rescue Training",                "price": 1687.50, "days": 1},
            {"id": "gms-adv-r",       "provider": "GetmieSafe",   "name": "Advanced GetmieSafe Rescue Training",             "price": 3375.00, "days": 2},
            {"id": "gms-refresh",     "provider": "GetmieSafe",   "name": "GetmieSafe Rescue Refresher",                    "price": 1687.50, "days": 1},
        ]
        for c in courses:
            await Course.create(**c)


# ── Production static file serving ───────────────────────────────────────────
_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"

if _dist.exists():
    _assets = _dist / "assets"
    if _assets.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets)), name="assets")

    @app.get("/", include_in_schema=False)
    async def root():
        return FileResponse(str(_dist / "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        if not full_path.startswith("api"):
            return FileResponse(str(_dist / "index.html"))
