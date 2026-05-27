# ── Base Image with Python 3.11 Slim Bullseye ──
FROM python:3.11-slim-bullseye

# Install standard C compiler and libraries required for HarfBuzz shaper, Cairo/Pillow vectors, and database netcats
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

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and assets
COPY . .

# Expose port for FastAPI backend
EXPOSE 8000

# Start backend using Uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
