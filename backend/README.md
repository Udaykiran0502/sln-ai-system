# Backend

API server, business logic, and core services for the SLN AI System.

## Tech Stack

- **Runtime**: Python 3.11+ / Node.js 20+
- **Framework**: FastAPI / Express
- **Database**: PostgreSQL / Supabase
- **ORM**: SQLAlchemy / Prisma
- **Testing**: Pytest / Jest

## Getting Started

```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

## Structure

```
backend/
├── app/
│   ├── api/           # Route handlers
│   ├── core/          # Core configuration
│   ├── models/        # Database models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   └── utils/         # Utilities
├── tests/             # Test suite
├── main.py            # Entry point
└── requirements.txt
```
