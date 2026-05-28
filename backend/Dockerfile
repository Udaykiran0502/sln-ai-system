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

# ── Python deps ──────────────────────────────────────────────────────────────
# Cache mount: pip cache persists across rebuilds — no re-downloads after first build
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install -r requirements.txt

# ── Application code ─────────────────────────────────────────────────────────
COPY . .

EXPOSE 8000

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
