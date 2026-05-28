import os
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/memory", tags=["memory"])

# Local persistence file path in workspace appData directory
DB_PATH = "C:\\Users\\udayk\\.gemini\\antigravity\\brain\\design_memory.json"

class MemoryItem(BaseModel):
    id: str
    projectName: str
    category: str  # 'political' | 'wedding' | 'business'
    dominantColors: List[str]
    typographyPairing: List[str]
    layoutScore: float
    description: str

class MemorySearchResponse(BaseModel):
    query: str
    results: List[MemoryItem]

# Core memory database storage preloaded with high-grade local templates
DEFAULT_MEMORY = [
    {
        "id": "mem-01",
        "projectName": "Janasena General Slogan",
        "category": "political",
        "dominantColors": ["#1e1b4b", "#ef4444", "#ffffff"],
        "typographyPairing": ["Ramabhadra", "Mandali"],
        "layoutScore": 9.8,
        "description": "Janasena themed banner with navy background, thick red frame bounds, and clear shaped Telugu titles."
    },
    {
        "id": "mem-02",
        "projectName": "TDP Campaign Billboard",
        "category": "political",
        "dominantColors": ["#78350f", "#eab308", "#fbbf24"],
        "typographyPairing": ["NTR", "Mandali"],
        "layoutScore": 9.4,
        "description": "TDP party theme featuring bright gold borders and Ramabhadra sub-headers."
    },
    {
        "id": "mem-03",
        "projectName": "Golden Mandap Wedding Mandap",
        "category": "wedding",
        "dominantColors": ["#450a0a", "#eab308", "#fef08a"],
        "typographyPairing": ["TenaliRamakrishna", "NTR"],
        "layoutScore": 9.9,
        "description": "Traditional wedding banner with maroon background, yellow details, and classic Tenali fonts."
    }
]

def load_memory() -> List[dict]:
    if not os.path.exists(DB_PATH):
        # Create directory and file if missing
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        with open(DB_PATH, 'w') as f:
            json.dump(DEFAULT_MEMORY, f, indent=2)
        return DEFAULT_MEMORY
    
    try:
        with open(DB_PATH, 'r') as f:
            return json.load(f)
    except Exception:
        return DEFAULT_MEMORY

def save_memory(data: List[dict]):
    try:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        with open(DB_PATH, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error persisting memory file: {e}")

@router.get("/list", response_model=List[MemoryItem])
async def list_design_memories():
    """
    Returns complete database index of historic structured designs.
    """
    return load_memory()

@router.post("/index", response_model=MemoryItem)
async def index_design_pairings(item: MemoryItem):
    """
    Saves a completed layout pair's dominant style guidelines
    into the semantic search index.
    """
    memories = load_memory()
    
    # Check for duplicate
    memories = [m for m in memories if m["id"] != item.id]
    memories.append(item.model_dump())
    
    save_memory(memories)
    return item

@router.get("/search", response_model=MemorySearchResponse)
async def search_layout_trends(query: str, category: Optional[str] = None):
    """
    Finds historical layout composition pairings by semantic tag query.
    Allows style matching recommendations instantly.
    """
    memories = load_memory()
    results = []
    
    query_words = query.lower().split()
    for mem in memories:
        # Category filter match
        if category and mem["category"] != category:
            continue
            
        # Match word vectors in project details or typography
        matches_query = False
        text_corpus = (mem["projectName"] + " " + mem["description"] + " " + " ".join(mem["typographyPairing"]) + " " + mem["category"]).lower()
        
        for word in query_words:
            if word in text_corpus:
                matches_query = True
                break
                
        if matches_query:
            results.append(MemoryItem(**mem))
            
    # Fallback to general category search if no word matches
    if not results and category:
        results = [MemoryItem(**mem) for mem in memories if mem["category"] == category]
        
    # Return top entries sorted by layout scores
    results = sorted(results, key=lambda x: x.layoutScore, reverse=True)
    
    return MemorySearchResponse(
        query=query,
        results=results
    )
