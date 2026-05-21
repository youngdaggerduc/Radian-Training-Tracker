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
async def seed_users() -> None:
    """Create the three staff accounts on first run."""
    from app.models import User
    from app.auth import hash_password

    if await User.all().count() > 0:
        return

    staff = [
        {"id": "s1", "username": "aaliyah", "name": "Aaliyah Mohammed", "initials": "AM", "role": "Training Coordinator", "is_admin": True},
        {"id": "s2", "username": "devon",   "name": "Devon Ramcharan",  "initials": "DR", "role": "Training Coordinator", "is_admin": False},
        {"id": "s3", "username": "priya",   "name": "Priya Singh",      "initials": "PS", "role": "Training Coordinator", "is_admin": False},
    ]
    default_pw = hash_password("radian2026")
    for u in staff:
        await User.create(**u, hashed_password=default_pw)


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
