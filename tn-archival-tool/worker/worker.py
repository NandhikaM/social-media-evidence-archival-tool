"""
Background job worker for TN Archival Tool.

Connects to Redis and processes archival jobs via python-rq.
"""

import logging
import os
import sys

from dotenv import load_dotenv
from redis import Redis
from rq import SimpleWorker

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

patch_redis_hset()


# Add backend directory to sys.path to allow importing from backend app
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.append(backend_path)

load_dotenv(dotenv_path=os.path.join(backend_path, ".env"))

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QUEUE_NAME = os.getenv("ARCHIVE_QUEUE_NAME", "archive_jobs")


def main() -> None:
    logger.info("TN Archival Tool background worker starting...")
    logger.info("Redis URL: %s | Queue: %s", REDIS_URL, QUEUE_NAME)

    try:
        redis_conn = Redis.from_url(REDIS_URL, protocol=2)
        redis_conn.ping()
        logger.info("Connected to Redis successfully.")
    except Exception as exc:
        logger.error("Could not connect to Redis: %s", exc)
        sys.exit(1)

    # Use rq.SimpleWorker on Windows because process forking (os.fork) is not supported.
    worker = SimpleWorker([QUEUE_NAME], connection=redis_conn)
    logger.info("Starting RQ SimpleWorker loop...")
    worker.work()


if __name__ == "__main__":
    main()
