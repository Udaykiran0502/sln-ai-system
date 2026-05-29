"""
SLN Design Engine v3 — Selective Regeneration & Dependency Orchestrator
Executes selective parts of the layout/composition/QA pipeline based on edit patches,
bypassing full LangGraph runs.
"""

from __future__ import annotations
import logging
import time
from typing import Dict, List, Any
from backend.memory.state_store import load_state, save_state
from backend.utils.patch_merger import Patch, merge_patches
from backend.app import ws_manager

logger = logging.getLogger(__name__)

async def run_selective_pipeline(order_id: str, patch_data: dict) -> dict:
    """Run selective components of the pipeline based on changed properties."""
    start_time = time.time()
    
    # 1. Load existing state
    max_retries = 3
    for attempt in range(max_retries):
        state = load_state(order_id)
        if not state:
            raise ValueError(f"Order {order_id} not found")
            
        expected_version = state.get("_version", 0)
            
        # 2. Determine changes and affected agents
        new_scene_graph = patch_data.get("scene_graph")
        dirty_agents = []
        
        metadata_changed = False
        metadata_keys = ["client_name", "banner_type", "event_type", "dimensions", "dpi", "language", "colors", "text_content", "phone_numbers", "images"]
        for key in metadata_keys:
            if key in patch_data:
                state[key] = patch_data[key]
                metadata_changed = True
        
        if new_scene_graph:
            state["scene_graph"] = new_scene_graph
            is_geom_only = patch_data.get("is_geometry_only", True)
            if is_geom_only and not metadata_changed:
                dirty_agents = ["composition", "qa_engine"]
            else:
                dirty_agents = ["font_intelligence", "layout_engine", "composition", "qa_engine"]
        elif metadata_changed:
            dirty_agents = ["font_intelligence", "layout_engine", "composition", "qa_engine"]
        else:
            dirty_agents = ["composition", "qa_engine"]
            
        logger.info(f"[SelectiveOrchestrator] Running pipeline for {order_id}. Nodes: {dirty_agents} (Attempt {attempt+1})")
        
        # 3. Sequentially execute affected nodes
        for agent_name in dirty_agents:
            await ws_manager.broadcast(order_id, {
                "type": "agent_start",
                "node": agent_name,
                "progress": int(dirty_agents.index(agent_name) / len(dirty_agents) * 100)
            })
            
            step_start = time.time()
            
            if agent_name == "composition":
                from backend.agents.composition_sg import agent_fn as composition
                patches = composition(state)
                merge_patches(state, patches)
            elif agent_name == "qa_engine":
                from backend.agents.qa_engine import qa_engine
                patches = qa_engine(state)
                merge_patches(state, patches)
            elif agent_name == "layout_engine":
                from backend.agents.layout_engine import layout_engine
                patches = layout_engine(state)
                merge_patches(state, patches)
            elif agent_name == "font_intelligence":
                from backend.agents.font_intelligence import font_intelligence
                patches = font_intelligence(state)
                merge_patches(state, patches)
                
            duration_ms = int((time.time() - step_start) * 1000)
            await ws_manager.broadcast(order_id, {
                "type": "agent_end",
                "node": agent_name,
                "duration_ms": duration_ms
            })
            
        # 4. Save state with optimistic concurrency check
        try:
            save_state(order_id, state, expected_version=expected_version)
            break # Success
        except ValueError as e:
            if "version conflict" in str(e) and attempt < max_retries - 1:
                logger.warning(f"[SelectiveOrchestrator] Optimistic concurrency conflict for {order_id}. Retrying...")
                time.sleep(0.1) # Small backoff
                continue
            else:
                raise e
        
    # Broadcast pipeline complete
    await ws_manager.broadcast(order_id, {
        "type": "pipeline_complete",
        "qa_passed": state.get("qa_passed", False),
        "scores": state.get("qa_scores", {})
    })
    
    logger.info(f"[SelectiveOrchestrator] Complete in {int((time.time() - start_time) * 1000)}ms")
    return state
