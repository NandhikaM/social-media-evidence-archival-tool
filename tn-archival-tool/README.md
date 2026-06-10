# TN Archival Tool

Social Media Archival Tool for the **Tamil Nadu Cybercrime Wing**. Captures, stores, and verifies social media evidence with SHA256 integrity hashing for cybercrime investigations.

## Project structure

```
tn-archival-tool/
├── backend/          # FastAPI + SQLAlchemy (async)
├── frontend/         # React + Vite + Tailwind CSS
├── worker/           # Redis-backed background job worker
├── docker-compose.yml
└── README.md
```

## Tech stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | FastAPI, SQLAlchemy (async), asyncpg |
| Database | PostgreSQL 16                       |
| Queue    | Redis 7 (Week 2)                    |
| Frontend | React 18, Vite, Tailwind CSS        |
| Icons    | Tabler Icons (`@tabler/icons-react`) |
| Fonts    | IBM Plex Sans, IBM Plex Mono        |

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose

## Quick start

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (`localhost:5432`) and Redis (`localhost:6379`).

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs  
Health check: http://localhost:8000/api/v1/health

### Database migrations

```bash
cd backend
alembic upgrade head
python seed.py
```

To create a new migration after model changes:

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: http://localhost:5173

### 4. Worker (stub)

```bash
cd worker
python -m venv .venv
.venv\Scripts\activate   # or source .venv/bin/activate
pip install -r requirements.txt
python worker.py
```

## Development status

This repository is a **scaffold only** — structure and UI are in place; business logic is stubbed.

| Week | Focus                                              | Status   |
|------|----------------------------------------------------|----------|
| 1    | Auth, database migrations, archive request APIs    | Pending  |
| 2    | Playwright capture, Redis queue, evidence storage  | Pending  |
| 3    | Reports, admin, audit logs, deployment             | Pending  |

## API routes (stubbed)

| Prefix              | Description                    |
|---------------------|--------------------------------|
| `/api/v1/health`    | Health check                   |
| `/api/v1/auth`      | Login / logout                 |
| `/api/v1/cases`     | Case management                |
| `/api/v1/requests`  | Archive requests (single/bulk) |
| `/api/v1/records`   | Archived records & remarks     |
| `/api/v1/reports`   | Dashboard stats & reports      |
| `/api/v1/users`     | User management                |
| `/api/v1/settings`  | Org settings & audit log       |

## Environment variables

See `backend/.env.example` and `frontend/.env.example`.

## License

Internal use — Tamil Nadu Cybercrime Wing.
