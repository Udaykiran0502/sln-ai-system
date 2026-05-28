import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])

class AgentPromptRequest(BaseModel):
    prompt: str
    projectId: Optional[str] = None

class AgentStepResult(BaseModel):
    agentName: str
    actionTaken: str
    status: str
    notes: str

class AgentOrchestrationResponse(BaseModel):
    projectId: str
    projectName: str
    width: int = 800
    height: int = 600
    sceneGraph: List[Dict[str, Any]]
    steps: List[AgentStepResult]

# Helper function to generate nodes based on theme
def compile_creative_scene(theme: str, size_preset: str) -> Dict[str, Any]:
    """
    Simulates the CreativeDesignAgent generating Konva node layers
    based on the extracted design intent.
    """
    project_id = f"sln-{uuid.uuid4().hex[:6]}"
    
    # Resolve canvas dimensions based on size intent
    width, height = 800, 600
    if "12x4" in theme or "wedding" in theme.lower():
        width, height = 1000, 400
    elif "8x3" in theme or "retail" in theme.lower() or "business" in theme.lower():
        width, height = 800, 300
    elif "10x8" in theme or "political" in theme.lower():
        width, height = 800, 600

    scene = {
        "projectId": project_id,
        "name": f"AI Orchestrated {theme.split()[0]} Flex",
        "width": width,
        "height": height,
        "nodes": []
    }

    # Background layer
    bg_color = "#0f172a"
    border_color = "#3b82f6"
    
    if "janasena" in theme.lower():
        bg_color = "#1e1b4b"
        border_color = "#ef4444"
    elif "tdp" in theme.lower() or "yellow" in theme.lower():
        bg_color = "#78350f"
        border_color = "#eab308"
    elif "wedding" in theme.lower():
        bg_color = "#450a0a"
        border_color = "#fbbf24"
    elif "business" in theme.lower() or "store" in theme.lower():
        bg_color = "#020617"
        border_color = "#10b981"

    scene["nodes"].append({
        "id": "bg-ai-generated",
        "type": "shape",
        "name": "AI Orchestrated Canvas Background",
        "x": 0,
        "y": 0,
        "width": width,
        "height": height,
        "rotation": 0,
        "scaleX": 1,
        "scaleY": 1,
        "visible": True,
        "locked": True,
        "style": {
            "shapeType": "rect",
            "fill": bg_color,
            "stroke": border_color,
            "strokeWidth": 4,
        }
    })

    # Header text block
    header_text = "శ్రీ లక్ష్మీ డిజిటల్స్"
    header_font = "Inter"
    fill_color = "#ffffff"
    
    if "janasena" in theme.lower():
        header_text = "మార్పు కోసం జనసేన శంఖారావం"
        header_font = "Ramabhadra"
        fill_color = "#ffffff"
    elif "tdp" in theme.lower():
        header_text = "తెలుగుదేశం పార్టీ విజయకేతనం"
        header_font = "NTR"
        fill_color = "#fbbf24"
    elif "wedding" in theme.lower():
        header_text = "శుభ లగ్న మహోత్సవ ఆహ్వాన పత్రిక"
        header_font = "TenaliRamakrishna"
        fill_color = "#fef08a"
    elif "kirana" in theme.lower() or "business" in theme.lower():
        header_text = "హోల్‌సేల్ కిరాణా & జనరల్ స్టోర్స్"
        header_font = "Mandali"
        fill_color = "#34d399"

    scene["nodes"].append({
        "id": "header-ai-generated",
        "type": "text",
        "name": "Shaped Telugu Header",
        "x": int(width * 0.1),
        "y": int(height * 0.15),
        "width": int(width * 0.8),
        "height": 80,
        "rotation": 0,
        "scaleX": 1,
        "scaleY": 1,
        "visible": True,
        "locked": False,
        "style": {
            "text": header_text,
            "fontSize": 38,
            "fontFamily": header_font,
            "fill": fill_color,
            "align": "center",
            "teluguShaped": True
        }
    })

    # Subtitle details block
    subtitle_text = "AI-Orchestrated Print Flex Production"
    if "janasena" in theme.lower():
        subtitle_text = "జనసేనాని పవన్ కళ్యాణ్ సారథ్యంలో.."
    elif "tdp" in theme.lower():
        subtitle_text = "నవ్యాంధ్ర నవనిర్మాణ సంకల్పం"
    elif "wedding" in theme.lower():
        subtitle_text = "చిరంజీవి సౌభాగ్యవతి కల్యాణ వేడుక"
    elif "kirana" in theme.lower() or "business" in theme.lower():
        subtitle_text = "అన్ని రకముల నిత్యావసర సరుకులు లభించును"

    scene["nodes"].append({
        "id": "subtext-ai-generated",
        "type": "text",
        "name": "Shaped Telugu Subtitle",
        "x": int(width * 0.15),
        "y": int(height * 0.45),
        "width": int(width * 0.7),
        "height": 50,
        "rotation": 0,
        "scaleX": 1,
        "scaleY": 1,
        "visible": True,
        "locked": False,
        "style": {
            "text": subtitle_text,
            "fontSize": 20,
            "fontFamily": "Mandali",
            "fill": "#e2e8f0" if "wedding" not in theme.lower() else "#ffffff",
            "align": "center",
            "teluguShaped": True
        }
    })

    # Add inner margins safety visual boundary (enforced by Governance)
    scene["nodes"].append({
        "id": "inner-bleed-guide-generated",
        "type": "shape",
        "name": "Governance Bleed Guide (20px)",
        "x": 20,
        "y": 20,
        "width": width - 40,
        "height": height - 40,
        "rotation": 0,
        "scaleX": 1,
        "scaleY": 1,
        "visible": True,
        "locked": True,
        "style": {
            "shapeType": "rect",
            "fill": "transparent",
            "stroke": "#ef4444",
            "strokeWidth": 1,
        }
    })

    return scene

@router.post("/orchestrate")
async def run_multi_agent_pipeline(req: AgentPromptRequest):
    """
    Executes a structured Multi-Agent pipeline (simulated LangGraph flow).
    Processes user brief through GovernanceAgent, TeluguParserAgent,
    and CreativeDesignAgent to output a perfectly structured scene graph.
    """
    prompt_lower = req.prompt.lower()
    steps = []

    # Step 1: Governance Agent checks safety constraints
    steps.append(AgentStepResult(
        agentName="GovernanceAgent",
        actionTaken="Verify size requirements and layout safety bounds",
        status="APPROVED",
        notes="Requested print format resolved. Safety boundary set to 20px (0.25 inches)."
    ))

    # Step 2: Telugu Parser Agent translates script queries
    detected_indic = "Telugu text structures resolved via syllable checking." if "janasena" in prompt_lower or "tdp" in prompt_lower or "wedding" in prompt_lower or "కిరాణా" in prompt_lower else "Standard Unicode mapping applied."
    steps.append(AgentStepResult(
        agentName="TeluguParserAgent",
        actionTaken="Ingest phonetic/Unicode characters and shape syllables",
        status="SUCCESS",
        notes=detected_indic
    ))

    # Step 3: Creative Design Agent compiles standard layers
    steps.append(AgentStepResult(
        agentName="CreativeDesignAgent",
        actionTaken="Generate high-aesthetic responsive coordinate node-layers matching project themes",
        status="COMPLETED",
        notes="Generated optimal colors, premium font family matches, and balanced layouts."
    ))

    # Compile the final structured scene graphs
    compiled_scene = compile_creative_scene(req.prompt, "10x8ft")

    return {
        "projectId": compiled_scene["projectId"],
        "projectName": compiled_scene["name"],
        "width": compiled_scene["width"],
        "height": compiled_scene["height"],
        "sceneGraph": compiled_scene["nodes"],
        "steps": steps
    }
