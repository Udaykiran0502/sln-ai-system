import json
from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/production", tags=["production"])

class PSDNodeStyle(BaseModel):
    text: str = None
    fontSize: int = None
    fontFamily: str = None
    fill: str = None
    shapeType: str = None
    stroke: str = None
    strokeWidth: int = None

class PSDNode(BaseModel):
    id: str
    type: str
    name: str
    x: float
    y: float
    width: float
    height: float
    rotation: float
    visible: bool
    locked: bool
    style: Dict[str, Any]

class PSDCompositionRequest(BaseModel):
    projectId: str
    projectName: str
    width: int
    height: int
    sceneGraph: List[PSDNode]

# ExtendScript Generator for Adobe Photoshop import
def generate_extendscript(req: PSDCompositionRequest) -> str:
    """
    Auto-generates high-grade Adobe Photoshop ExtendScript code.
    When executed inside Photoshop, it reproduces the layout layers dynamically.
    """
    script_lines = [
        "// Adobe Photoshop ExtendScript - SLN Auto Composer",
        "// Auto-generated for project: " + req.projectName,
        "app.preferences.rulerUnits = Units.PIXELS;",
        f"var doc = app.documents.add({req.width}, {req.height}, 300, '{req.projectName}', NewDocumentMode.RGB, DocumentFill.TRANSPARENT);",
        ""
    ]
    
    # Process layers in reverse to draw back-to-front correctly in PSD
    for node in reversed(req.sceneGraph):
        script_lines.append(f"// Layer: {node.name} ({node.type})")
        
        if node.type == "text":
            text_val = node.style.get("text", "").replace("'", "\\'")
            font_fam = node.style.get("fontFamily", "Arial")
            font_size = node.style.get("fontSize", 24)
            fill_color = node.style.get("fill", "#ffffff").replace("#", "")
            
            script_lines.extend([
                "var textLayer = doc.artLayers.add();",
                "textLayer.kind = LayerKind.TEXT;",
                f"textLayer.name = '{node.name}';",
                "var textItem = textLayer.textItem;",
                f"textItem.contents = '{text_val}';",
                f"textItem.size = {font_size};",
                f"textItem.font = '{font_fam}';",
                "var textColor = new SolidColor();",
                f"textColor.rgb.hexValue = '{fill_color}';",
                "textItem.color = textColor;",
                f"textLayer.translate({node.x}, {node.y});",
                ""
            ])
        elif node.type == "shape" and node.style.get("shapeType") == "rect":
            fill_color = node.style.get("fill", "#000000").replace("#", "")
            if fill_color.lower() == "transparent":
                fill_color = "ffffff"
                
            script_lines.extend([
                "var shapeLayer = doc.artLayers.add();",
                "shapeLayer.name = '" + node.name + "';",
                f"var bounds = [{node.x}, {node.y}, {node.x + node.width}, {node.y + node.height}];",
                "doc.selection.select([[bounds[0], bounds[1]], [bounds[2], bounds[1]], [bounds[2], bounds[3]], [bounds[0], bounds[3]]]);",
                "var fillColor = new SolidColor();",
                f"fillColor.rgb.hexValue = '{fill_color}';",
                "doc.selection.fill(fillColor);",
                "doc.selection.deselect();",
                ""
            ])
            
    script_lines.append("alert('SLN Creative Production OS: PSD Layers composed successfully inside Photoshop!');")
    return "\n".join(script_lines)

@router.post("/compose-psd")
async def compose_layered_psd(req: PSDCompositionRequest):
    """
    Parses active Konva coordinates, compiles them to layered PSD structures,
    and returns Adobe ExtendScript automation payloads for native importing.
    """
    extend_script = generate_extendscript(req)
    
    # Estimate file size in PSD structure (layer metadata, vector indices)
    estimated_layers_count = len(req.sceneGraph)
    
    return {
        "status": "SUCCESS",
        "projectId": req.projectId,
        "projectName": req.projectName,
        "layersCount": estimated_layers_count,
        "photoshopExtendScript": extend_script,
        "cmykWarning": "Ensure CMYK color space translation is applied on final print exports."
    }
