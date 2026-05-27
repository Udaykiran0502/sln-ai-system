import logging
import threading
from typing import List, Dict, Any, Optional
from pathlib import Path
from config.settings import settings

logger = logging.getLogger(__name__)

# Lazy-loaded models
_clip_model = None
_bge_model = None
_chroma_client = None
_model_lock = threading.Lock()

def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        import chromadb
        from chromadb.config import Settings
        
        db_path = settings.chroma_db_dir
        db_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Initializing ChromaDB at {db_path}")
        _chroma_client = chromadb.PersistentClient(
            path=str(db_path),
            settings=Settings(anonymized_telemetry=False)
        )
    return _chroma_client

def get_clip_model():
    global _clip_model
    if _clip_model is None:
        with _model_lock:
            if _clip_model is None:
                logger.info(f"Loading CLIP model: {settings.clip_model_name}")
                from sentence_transformers import SentenceTransformer
                _clip_model = SentenceTransformer(settings.clip_model_name)
    return _clip_model

def get_bge_model():
    global _bge_model
    if _bge_model is None:
        with _model_lock:
            if _bge_model is None:
                logger.info(f"Loading BGE text model: {settings.text_embed_model}")
                from sentence_transformers import SentenceTransformer
                _bge_model = SentenceTransformer(settings.text_embed_model)
    return _bge_model

def get_collection(name: str):
    client = get_chroma_client()
    return client.get_or_create_collection(name=name)

def ensure_collections():
    """Ensure all required collections exist."""
    collections = ['templates', 'approved_designs', 'slogans', 'style_dna']
    for c in collections:
        get_collection(c)

def index_image(collection_name: str, id: str, image_path: str, metadata: dict = None):
    """Generate CLIP embedding for an image and store it."""
    from PIL import Image
    model = get_clip_model()
    try:
        img = Image.open(image_path).convert("RGB")
        embedding = model.encode(img).tolist()
        
        collection = get_collection(collection_name)
        collection.upsert(
            ids=[id],
            embeddings=[embedding],
            metadatas=[metadata or {}]
        )
        return True
    except Exception as e:
        logger.error(f"Failed to index image {image_path}: {e}")
        return False

def index_text(collection_name: str, id: str, text: str, metadata: dict = None):
    """Generate BGE embedding for text and store it."""
    model = get_bge_model()
    try:
        embedding = model.encode(text).tolist()
        
        collection = get_collection(collection_name)
        collection.upsert(
            ids=[id],
            documents=[text],
            embeddings=[embedding],
            metadatas=[metadata or {}]
        )
        return True
    except Exception as e:
        logger.error(f"Failed to index text: {e}")
        return False

def query_images(collection_name: str, query_image_path: str, n_results: int = 5, where: dict = None) -> List[Dict[str, Any]]:
    """Find similar images using CLIP."""
    from PIL import Image
    model = get_clip_model()
    img = Image.open(query_image_path).convert("RGB")
    embedding = model.encode(img).tolist()
    
    collection = get_collection(collection_name)
    results = collection.query(
        query_embeddings=[embedding],
        n_results=n_results,
        where=where
    )
    
    # Format results
    formatted_results = []
    if results and results.get('ids') and results['ids'][0]:
        for i, id in enumerate(results['ids'][0]):
            res = {
                'id': id,
                'distance': results['distances'][0][i] if 'distances' in results else 0,
                'metadata': results['metadatas'][0][i] if 'metadatas' in results and results['metadatas'] else {}
            }
            formatted_results.append(res)
            
    return formatted_results

def query_text(collection_name: str, query_text: str, n_results: int = 5, where: dict = None) -> List[Dict[str, Any]]:
    """Find similar text using BGE."""
    model = get_bge_model()
    embedding = model.encode(query_text).tolist()
    
    collection = get_collection(collection_name)
    results = collection.query(
        query_embeddings=[embedding],
        n_results=n_results,
        where=where
    )
    
    # Format results
    formatted_results = []
    if results and results.get('ids') and results['ids'][0]:
        for i, id in enumerate(results['ids'][0]):
            res = {
                'id': id,
                'text': results['documents'][0][i] if 'documents' in results and results['documents'] else "",
                'distance': results['distances'][0][i] if 'distances' in results else 0,
                'metadata': results['metadatas'][0][i] if 'metadatas' in results and results['metadatas'] else {}
            }
            formatted_results.append(res)
            
    return formatted_results
