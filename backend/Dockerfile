# ── Base Image ───────────────────────────────────────────────────────────────
FROM python:3.11-slim-bullseye

# ── System dependencies ──────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libfreetype6-dev \
    libharfbuzz-dev \
    libraqm-dev \
    libcairo2-dev \
    pkg-config \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python deps (cached layer — only re-runs when requirements.txt changes) ──
COPY requirements.txt .

# Use BuildKit cache mount so pip cache persists across rebuilds on this machine
# Also bump pip itself first to avoid legacy resolver slowness
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip==26.1.1 && \
    pip install --no-deps sentence-transformers==3.4.1 2>/dev/null || true && \
    pip install -r requirements.txt

# ── Application code ─────────────────────────────────────────────────────────
COPY . .

EXPOSE 8000

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
