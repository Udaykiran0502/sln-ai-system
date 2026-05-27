"""
SLN Design Engine v3 — Central Configuration
Loads settings from .env file with sensible defaults for local Windows workstation.
"""

import os
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


# Project root: sln_ai_system/
PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Central configuration for SLN Design Engine."""

    # ── AI Provider ──────────────────────────────────────────────
    google_api_key: str = Field(default="", description="Google Gemini API key")
    default_llm_provider: str = Field(default="gemini", description="Default LLM provider")
    gemini_model: str = Field(default="gemini-2.0-flash", description="Gemini model name")
    gemini_vision_model: str = Field(default="gemini-2.0-flash", description="Gemini vision model")

    # ── Paths ────────────────────────────────────────────────────
    project_root: Path = Field(default=PROJECT_ROOT)
    template_dir: Path = Field(default=PROJECT_ROOT / "backend" / "templates")
    font_dir: Path = Field(default=PROJECT_ROOT / "assets" / "fonts")
    logo_dir: Path = Field(default=PROJECT_ROOT / "assets" / "logos")
    output_dir: Path = Field(default=PROJECT_ROOT / "outputs")
    preview_dir: Path = Field(default=PROJECT_ROOT / "outputs" / "previews")
    final_dir: Path = Field(default=PROJECT_ROOT / "outputs" / "final")
    orders_dir: Path = Field(default=PROJECT_ROOT / "data" / "orders")
    logs_dir: Path = Field(default=PROJECT_ROOT / "data" / "logs")
    db_path: Path = Field(default=PROJECT_ROOT / "data" / "db" / "sln.db")
    chroma_db_dir: Path = Field(default=PROJECT_ROOT / "data" / "chromadb")

    # ── Rendering ────────────────────────────────────────────────
    default_dpi: int = Field(default=300, description="Production DPI")
    preview_dpi: int = Field(default=72, description="Preview DPI")
    max_image_px: int = Field(default=4000, description="Max image dimension during processing")
    jpeg_quality: int = Field(default=85, description="JPEG preview quality")

    # ── QA ────────────────────────────────────────────────────────
    qa_threshold: int = Field(default=70, description="Minimum QA score to pass")
    max_fix_attempts: int = Field(default=2, description="Max auto-fix iterations")

    # ── Governance (Paperclip AI) ────────────────────────────────
    max_agent_retries: int = Field(default=3, description="Max retries per agent node")
    require_human_approval: bool = Field(default=False, description="Require human approval for final export")

    # ── RAG Models ───────────────────────────────────────────────
    clip_model_name: str = Field(default="sentence-transformers/clip-ViT-B-32", description="CLIP image model")
    text_embed_model: str = Field(default="BAAI/bge-small-en-v1.5", description="Text embedding model")
    indictrans_model: str = Field(default="ai4bharat/indictrans2-en-indic-dist-200M", description="Telugu translation model")

    # ── System ───────────────────────────────────────────────────
    max_memory_mb: int = Field(default=12000, description="Memory budget in MB")
    api_host: str = Field(default="127.0.0.1", description="FastAPI host")
    api_port: int = Field(default=8000, description="FastAPI port")
    app_env: str = Field(default="dev", validation_alias="APP_ENV", description="Runtime environment")
    debug: bool = Field(default=True, validation_alias="APP_DEBUG", description="Debug mode")

    # ── Font Defaults ────────────────────────────────────────────
    telugu_heading_font: str = Field(default="Ramabhadra-Regular.ttf")
    telugu_body_font: str = Field(default="Gautami.ttf")
    telugu_decorative_font: str = Field(default="NTR-Regular.ttf")
    english_heading_font: str = Field(default="Oswald-Bold.ttf")
    english_body_font: str = Field(default="Roboto-Regular.ttf")
    english_accent_font: str = Field(default="Montserrat-SemiBold.ttf")

    model_config = {
        "env_file": str(PROJECT_ROOT / "config" / ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }

    @field_validator("app_env", mode="before")
    @classmethod
    def normalize_app_env(cls, value):
        if value is None or value == "":
            return "dev"
        value = str(value).strip().lower()
        aliases = {
            "development": "dev",
            "prod": "production",
            "live": "production",
        }
        return aliases.get(value, value)

    @field_validator("debug", mode="before")
    @classmethod
    def parse_app_debug(cls, value):
        if isinstance(value, bool):
            return value
        if value is None or value == "":
            return True
        value = str(value).strip().lower()
        if value in {"1", "true", "yes", "on", "dev", "development"}:
            return True
        if value in {"0", "false", "no", "off", "release", "production", "prod"}:
            return False
        raise ValueError("APP_DEBUG must be true/false, dev, release, or production")

    def ensure_dirs(self):
        """Create all required directories if they don't exist."""
        dirs = [
            self.template_dir, self.font_dir, self.logo_dir,
            self.output_dir, self.preview_dir, self.final_dir,
            self.orders_dir, self.logs_dir, self.db_path.parent,
        ]
        for d in dirs:
            d.mkdir(parents=True, exist_ok=True)

    def get_font_path(self, font_filename: str) -> Path:
        """Resolve a font filename to its full path."""
        path = self.font_dir / font_filename
        if not path.exists():
            # Try system fonts as fallback on Windows
            system_font_dir = Path(os.environ.get("WINDIR", "C:\\Windows")) / "Fonts"
            system_path = system_font_dir / font_filename
            if system_path.exists():
                return system_path
        return path


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings singleton."""
    s = Settings()
    s.ensure_dirs()
    return s


# Convenience alias
settings = get_settings()
