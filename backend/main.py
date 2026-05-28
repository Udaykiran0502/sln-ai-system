"""
SLN AI System — Backend API Server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SLN AI System API",
    description="Backend API for the SLN AI multi-agent system",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": "SLN AI System",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
