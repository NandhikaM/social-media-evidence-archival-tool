import logging
import os
from contextlib import asynccontextmanager

def patch_redis_hset():
    import redis
    def rewrite_hset_args(args):
        if args and len(args) > 0:
            cmd = args[0]
            if isinstance(cmd, bytes):
                cmd_upper = cmd.upper()
            elif isinstance(cmd, str):
                cmd_upper = cmd.upper()
            else:
                cmd_upper = None
            if cmd_upper in (b'HSET', 'HSET') and len(args) > 4:
                new_cmd = b'HMSET' if isinstance(cmd, bytes) else 'HMSET'
                return (new_cmd,) + args[1:]
        return args
    orig_execute_command = redis.Redis.execute_command
    def custom_execute_command(self, *args, **options):
        new_args = rewrite_hset_args(args)
        return orig_execute_command(self, *new_args, **options)
    redis.Redis.execute_command = custom_execute_command
    orig_pipeline_execute_command = redis.client.Pipeline.execute_command
    def custom_pipeline_execute_command(self, *args, **options):
        new_args = rewrite_hset_args(args)
        return orig_pipeline_execute_command(self, *new_args, **options)
    redis.client.Pipeline.execute_command = custom_pipeline_execute_command

try:
    patch_redis_hset()
except Exception as e:
    pass


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import check_database_connection, engine
from app.routers import auth, cases, health, records, reports, requests, settings as settings_router, users

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await check_database_connection()
        logger.info("Database connected")
    except Exception as exc:
        logger.error("Database connection failed: %s", exc)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="Social Media Archival Tool for Tamil Nadu Cybercrime Wing",
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

evidence_path = os.path.abspath(settings.evidence_storage_path)
os.makedirs(evidence_path, exist_ok=True)
app.mount("/evidence", StaticFiles(directory=evidence_path), name="evidence")

api = settings.api_prefix

app.include_router(health.router, prefix=api, tags=["health"])
app.include_router(auth.router, prefix=api, tags=["auth"])
app.include_router(cases.router, prefix=api, tags=["cases"])
app.include_router(requests.router, prefix=api, tags=["requests"])
app.include_router(records.router, prefix=api, tags=["records"])
app.include_router(reports.router, prefix=api, tags=["reports"])
app.include_router(users.router, prefix=api, tags=["users"])
app.include_router(settings_router.router, prefix=api, tags=["settings"])


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "TN Archival Tool API", "docs": "/docs"}
