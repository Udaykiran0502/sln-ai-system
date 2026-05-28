"""
SLN AI System — Backend API Server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints.websocket import router as ws_router
from app.api.v1.endpoints.typography import router as typography_router
from app.api.v1.endpoints.agents import router as agents_router
from app.api.v1.endpoints.psd_composer import router as psd_router
from app.api.v1.endpoints.qa_validator import router as qa_router
from app.api.v1.endpoints.export_pipeline import router as export_router
from app.api.v1.endpoints.memory_store import router as memory_router

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

# Mount WebSockets and REST endpoints
app.include_router(ws_router)
app.include_router(typography_router)
app.include_router(agents_router)
app.include_router(psd_router)
app.include_router(qa_router)
app.include_router(export_router)
app.include_router(memory_router)


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

