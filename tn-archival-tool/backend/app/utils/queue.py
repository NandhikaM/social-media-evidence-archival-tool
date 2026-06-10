import os
from redis import Redis
from rq import Queue
from app.config import get_settings

settings = get_settings()

# We connect to Redis using the configured REDIS_URL
redis_conn = Redis.from_url(settings.redis_url, protocol=2)

# Setup the queue name from settings or environment
QUEUE_NAME = os.getenv("ARCHIVE_QUEUE_NAME", "archive_jobs")

# Initialize the RQ Queue
queue = Queue(QUEUE_NAME, connection=redis_conn)

def get_queue() -> Queue:
    return queue
