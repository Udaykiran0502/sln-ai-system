"""
SLN Design Engine v3 — LangGraph Design Pipeline
StateGraph orchestration for the complete design workflow.
"""

from __future__ import annotations

import json
import logging
import re
import sys
import time
from pathlib import Path
from typing import TypedDict, Optional, List

logger = logging.getLogger(__name__)
PHONE_RE = re.compile(r"^[6-9]\d{9}$")


# ── Pipeline State ───────────────────────────────────────────────


class PipelineState(TypedDict, total=False):
    """Complete pipeline state passed between agents."""
    order_id: str
    raw_input: str
    parsed_order: dict
    research_data: dict
    style_metadata: dict
    workflow_type: str
    selected_template: dict
    copy: dict
    font_config: dict
    layout_plan: dict
    scene_graph: str
    processed_images: list
    composite_path: str
    qa_scores: dict
    qa_passed: bool
    is_print_ready: bool
    fix_attempts: int
    export_paths: dict
    error: Optional[str]
    needs_human_review: bool
    patch_history: list
    _retries: dict


# ── Agent Wrappers (error-safe) ──────────────────────────────────


def _safe_call(agent_fn, state: dict, name: str) -> dict:
    """Call an agent function with error handling and logging using Governance."""
    from backend.agents.governance import _safe_call_with_governance
    return _safe_call_with_governance(agent_fn, state, name)


# ── Node Functions ───────────────────────────────────────────────


def node_input_parser(state: dict) -> dict:
    from backend.agents.input_parser import input_parser
    return _safe_call(input_parser, state, "input_parser")


def node_research(state: dict) -> dict:
    from backend.agents.research import research
    return _safe_call(research, state, "research")


def node_style_analyzer(state: dict) -> dict:
    from backend.agents.style_analyzer import style_analyzer
    return _safe_call(style_analyzer, state, "style_analyzer")


def node_decision_engine(state: dict) -> dict:
    from backend.agents.decision_engine import decision_engine
    return _safe_call(decision_engine, state, "decision_engine")


def node_template_selector(state: dict) -> dict:
    from backend.agents.template_selector import template_selector
    return _safe_call(template_selector, state, "template_selector")


def node_indictrans(state: dict) -> dict:
    from backend.agents.indictrans_agent import indictrans_agent
    return _safe_call(indictrans_agent, state, "indictrans_agent")

def node_copywriter(state: dict) -> dict:
    from backend.agents.copywriter import copywriter
    return _safe_call(copywriter, state, "copywriter")


def node_font_intelligence(state: dict) -> dict:
    from backend.agents.font_intelligence import font_intelligence
    return _safe_call(font_intelligence, state, "font_intelligence")


def node_layout_engine(state: dict) -> dict:
    from backend.agents.layout_engine import layout_engine
    return _safe_call(layout_engine, state, "layout_engine")


def node_image_editor(state: dict) -> dict:
    from backend.agents.image_editor import image_editor
    return _safe_call(image_editor, state, "image_editor")


def node_composition(state: dict) -> dict:
    from backend.agents.composition_sg import agent_fn as composition
    return _safe_call(composition, state, "composition")


def node_qa_engine(state: dict) -> dict:
    from backend.agents.qa_engine import qa_engine
    return _safe_call(qa_engine, state, "qa_engine")


def node_auto_fix(state: dict) -> dict:
    from backend.agents.auto_fix import auto_fix
    return _safe_call(auto_fix, state, "auto_fix")


def node_export(state: dict) -> dict:
    from backend.agents.export_agent import export_agent
    return _safe_call(export_agent, state, "export_agent")


# ── Conditional Edges ────────────────────────────────────────────


def route_after_qa(state: dict) -> str:
    """Route after QA: export if pass, auto-fix if fail, end if max retries."""
    if state.get("error"):
        return "end"

    if state.get("qa_passed", False):
        return "export"

    hard_failures = state.get("qa_scores", {}).get("hard_failures", [])
    if hard_failures:
        logger.warning("[Pipeline] QA hard failures require human review: %s", hard_failures)
        return "end"

    fix_attempts = state.get("fix_attempts", 0)
    from config.settings import settings

    if fix_attempts >= settings.max_fix_attempts:
        return "end"

    return "auto_fix"


def route_after_decision(state: dict) -> str:
    """Route after decision engine based on workflow type."""
    return "template_selector"  # Always select template (may return empty)


# ── Build Graph ──────────────────────────────────────────────────


def build_pipeline():
    """Build the LangGraph StateGraph for the design pipeline."""
    from langgraph.graph import StateGraph, END

    workflow = StateGraph(PipelineState)

    # Add nodes
    workflow.add_node("input_parser", node_input_parser)
    workflow.add_node("research", node_research)
    workflow.add_node("style_analyzer", node_style_analyzer)
    workflow.add_node("decision_engine", node_decision_engine)
    workflow.add_node("template_selector", node_template_selector)
    workflow.add_node("copywriter", node_copywriter)
    workflow.add_node("indictrans_agent", node_indictrans)
    workflow.add_node("font_intelligence", node_font_intelligence)
    workflow.add_node("layout_engine", node_layout_engine)
    workflow.add_node("image_editor", node_image_editor)
    workflow.add_node("composition", node_composition)
    workflow.add_node("qa_engine", node_qa_engine)
    workflow.add_node("auto_fix", node_auto_fix)
    workflow.add_node("export", node_export)

    # Linear chain: parser → research → style → decision
    workflow.set_entry_point("input_parser")
    workflow.add_edge("input_parser", "research")
    workflow.add_edge("research", "style_analyzer")
    workflow.add_edge("style_analyzer", "decision_engine")

    # Decision → template_selector → copywriter
    workflow.add_edge("decision_engine", "template_selector")
    workflow.add_edge("template_selector", "copywriter")
    workflow.add_edge("copywriter", "indictrans_agent")

    # indictrans → font → layout → image → composition → QA
    workflow.add_edge("indictrans_agent", "font_intelligence")
    workflow.add_edge("font_intelligence", "layout_engine")
    workflow.add_edge("layout_engine", "image_editor")
    workflow.add_edge("image_editor", "composition")
    workflow.add_edge("composition", "qa_engine")

    # QA → conditional routing
    workflow.add_conditional_edges("qa_engine", route_after_qa, {
        "export": "export",
        "auto_fix": "auto_fix",
        "end": END,
    })

    # Auto-fix → back to composition (retry loop)
    workflow.add_edge("auto_fix", "composition")

    # Export → END
    workflow.add_edge("export", END)

    return workflow.compile()


# ── Public API ───────────────────────────────────────────────────


def run_pipeline(order_input: str | dict, order_id: str = None) -> dict:
    """Run the full design pipeline for an order.

    Args:
        order_input: Order JSON string, dict, or path to JSON file
        order_id: Optional order ID (auto-generated if not provided)

    Returns:
        Final pipeline state dict
    """
    from backend.memory.state_store import save_state, save_order_input

    # Parse input
    if isinstance(order_input, (str, Path)) and Path(order_input).exists():
        with open(order_input, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        raw_input = json.dumps(raw_data, ensure_ascii=False)
    elif isinstance(order_input, dict):
        raw_data = order_input
        raw_input = json.dumps(order_input, ensure_ascii=False)
    else:
        raw_data = {}
        raw_input = str(order_input)

    # Generate order ID
    if not order_id:
        order_id = raw_data.get("order_id", f"ORD-{int(time.time())}")

    if raw_data:
        _validate_pipeline_input(raw_data)

    # Save input
    if raw_data:
        save_order_input(order_id, raw_data)

    # Initial state
    initial_state: PipelineState = {
        "order_id": order_id,
        "raw_input": raw_input,
        "fix_attempts": 0,
        "qa_passed": False,
        "needs_human_review": False,
        "error": None,
    }

    logger.info(f"[Pipeline] Starting pipeline for order {order_id}")

    # Build and run
    pipeline = build_pipeline()
    final_state = pipeline.invoke(initial_state)

    # Save final state
    save_state(order_id, dict(final_state))

    logger.info(f"[Pipeline] Pipeline complete for {order_id}")

    return dict(final_state)


def _validate_pipeline_input(data: dict) -> None:
    """Validate commercial minimums for direct pipeline calls."""
    client = str(data.get("client_name", "")).strip()
    heading = str(data.get("text_content", {}).get("heading", "")).strip()
    dims = data.get("dimensions", {})
    phone_values = list(data.get("phone_numbers", []) or [])
    phone_values.append(data.get("text_content", {}).get("phone", ""))
    phones = [re.sub(r"\D", "", str(p)) for p in phone_values if str(p).strip()]

    if len(client) < 2:
        raise ValueError("Customer name is required")
    if len(heading) < 2:
        raise ValueError("Main heading is required")
    if data.get("banner_type") not in {"political", "wedding", "business", "religious", "general"}:
        raise ValueError("A valid banner type is required")
    if not isinstance(dims.get("width_inches"), (int, float)) or not isinstance(dims.get("height_inches"), (int, float)):
        raise ValueError("Dimensions must include width_inches and height_inches")
    if not phones or not any(PHONE_RE.fullmatch(p) for p in phones):
        raise ValueError("A valid 10-digit Indian mobile number is required")


# ── CLI Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    if len(sys.argv) > 1:
        input_path = sys.argv[1]
        result = run_pipeline(input_path)
    else:
        # Demo with sample order
        sample = {
            "order_id": "ORD-DEMO-001",
            "client_name": "SLN Digitals Demo",
            "banner_type": "political",
            "event_type": "election_campaign",
            "dimensions": {"width_inches": 48, "height_inches": 24},
            "dpi": 300,
            "language": "telugu",
            "colors": {"primary": "#FF9933", "accent": "#008000"},
            "text_content": {
                "heading": "జై శ్రీరాం",
                "subheading": "మీ సేవలో మేము",
                "phone": "9876543210"
            },
        }
        result = run_pipeline(sample)

    print(f"\n{'='*50}")
    print(f"Order: {result.get('order_id')}")
    print(f"QA Passed: {result.get('qa_passed')}")
    print(f"QA Scores: {json.dumps(result.get('qa_scores', {}), indent=2)}")
    print(f"Exports: {json.dumps(result.get('export_paths', {}), indent=2)}")
    if result.get("error"):
        print(f"Error: {result['error']}")
