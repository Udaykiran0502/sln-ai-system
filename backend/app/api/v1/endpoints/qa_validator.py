from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/qa", tags=["qa"])

class QANode(BaseModel):
    id: str
    type: str
    name: str
    x: float
    y: float
    width: float
    height: float
    style: Dict[str, Any]

class QAValidationRequest(BaseModel):
    projectId: str
    width: int
    height: int
    sceneGraph: List[QANode]

class QAViolationDetail(BaseModel):
    id: str
    nodeId: str
    nodeName: str
    type: str  # 'clipping' | 'bleed' | 'dpi' | 'overlap'
    severity: str  # 'warning' | 'critical'
    message: str

class QAValidationResponse(BaseModel):
    projectId: str
    violations: List[QAViolationDetail]
    passed: bool

@router.post("/validate", response_model=QAValidationResponse)
async def perform_layout_qa_audit(req: QAValidationRequest):
    """
    Performs server-side print-readiness validation checks.
    Evaluates layout layers against rigid bleed-safety and canvas-boundary thresholds.
    """
    violations = []
    bleed_margin = 20  # 20px / 0.25-inch safe bleed margin zone

    for node in req.sceneGraph:
        # Ignore main canvas background layers from violations
        if "bg" in node.id.lower() or "background" in node.name.lower():
            continue

        right_edge = node.x + node.width
        bottom_edge = node.y + node.height

        # 1. Boundary Clipping Checks (Element extending past canvas stage)
        if node.x < 0 or right_edge > req.width or node.y < 0 or bottom_edge > req.height:
            violations.append(QAViolationDetail(
                id=f"server-clip-{node.id}",
                nodeId=node.id,
                nodeName=node.name,
                type="clipping",
                severity="critical",
                message=f"Critical boundary clip: Layer '{node.name}' extends past printable stage dimensions ({req.width}x{req.height}px)."
            ))

        # 2. Bleed Safety Margins (Within the danger cut boundary region)
        elif (
            (node.x < bleed_margin and node.x >= 0) or
            (right_edge > (req.width - bleed_margin) and right_edge <= req.width) or
            (node.y < bleed_margin and node.y >= 0) or
            (bottom_edge > (req.height - bleed_margin) and bottom_edge <= req.height)
        ):
            violations.append(QAViolationDetail(
                id=f"server-bleed-{node.id}",
                nodeId=node.id,
                nodeName=node.name,
                type="bleed",
                severity="warning",
                message=f"Bleed Alert: '{node.name}' is too close to the cut edge. Keep design elements 20px clear of the border."
            ))

        # 3. Image DPI scaling check
        if node.type == "image":
            # Simulate a DPI audit. Large physical banners stretched past native resolution flag Warnings.
            scale_x = node.style.get("scaleX", 1.0)
            if scale_x > 2.2:
                violations.append(QAViolationDetail(
                    id=f"server-dpi-{node.id}",
                    nodeId=node.id,
                    nodeName=node.name,
                    type="dpi",
                    severity="warning",
                    message=f"Low Resolution Warning: '{node.name}' has been stretched past its 300 DPI limits. Result may print blurry."
                ))

    return QAValidationResponse(
        projectId=req.projectId,
        violations=violations,
        passed=len(violations) == 0
    )
