import logging
import time
from typing import Any, Callable, Dict, List, Tuple
from config.settings import settings
from backend.memory.state_store import append_log
from backend.utils.patch_merger import Patch, apply_patch

logger = logging.getLogger(__name__)

class GovernanceError(Exception):
    pass

def evaluate_patch_permission(agent_name: str, patch: Patch) -> bool:
    """Verify if the agent has permission to modify the target path."""
    # Simplified RBAC:
    # 1. No agent can directly modify `qa_scores` or `qa_passed` except QA Agent
    if patch.target_path.startswith('qa_') and agent_name != 'qa_engine':
        return False
        
    # 2. No agent can directly modify `export_paths` except Export Agent
    if patch.target_path.startswith('export_paths') and agent_name != 'export_agent':
        return False
        
    # 3. Add more rules as needed
    return True

def _safe_call_with_governance(agent_fn: Callable, state: dict, agent_name: str) -> dict:
    """
    Middleware wrapper for agents:
    1. Checks retry budget
    2. Executes agent (which now returns a list of Patches)
    3. Validates patches
    4. Merges approved patches
    5. Audit logs everything
    """
    order_id = state.get("order_id", "unknown")
    start_time = time.time()
    
    # Track retries in state under '_retries' (internal)
    retries = state.get('_retries', {})
    attempts = retries.get(agent_name, 0)
    
    if attempts >= settings.max_agent_retries:
        error_msg = f"Agent {agent_name} exceeded max retry budget ({settings.max_agent_retries})"
        logger.error(error_msg)
        append_log(order_id, agent_name, {
            "action": "vetoed",
            "reason": error_msg
        })
        state["needs_human_review"] = True
        state["error"] = error_msg
        return state

    retries[agent_name] = attempts + 1
    state['_retries'] = retries

    try:
        # Agent should return a list of Patch objects
        patches_or_state = agent_fn(state)
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        # Backward compatibility / flat pipeline support
        if isinstance(patches_or_state, dict):
            # Agent returned state directly
            append_log(order_id, agent_name, {
                "action": "executed",
                "status": "success",
                "timestamp": time.time(),
                "elapsed_ms": elapsed_ms,
                "note": "Legacy state return"
            })
            return patches_or_state
            
        elif isinstance(patches_or_state, list):
            # Agent returned patches
            approved_patches = []
            rejected_patches = []
            
            for patch in patches_or_state:
                if evaluate_patch_permission(agent_name, patch):
                    apply_patch(state, patch)
                    approved_patches.append(patch.model_dump())
                else:
                    rejected_patches.append(patch.model_dump())
                    
            append_log(order_id, agent_name, {
                "action": "executed",
                "status": "success",
                "timestamp": time.time(),
                "elapsed_ms": elapsed_ms,
                "approved_patches": approved_patches,
                "rejected_patches": rejected_patches
            })
            
            # Reset retries on success
            state['_retries'][agent_name] = 0
            
            # Initialize patch history if not present
            if 'patch_history' not in state:
                state['patch_history'] = []
            state['patch_history'].extend([
                {"agent": agent_name, "patch": p, "status": "approved"} for p in approved_patches
            ])
            state['patch_history'].extend([
                {"agent": agent_name, "patch": p, "status": "rejected"} for p in rejected_patches
            ])
            
            return state
            
        else:
            raise ValueError(f"Agent {agent_name} returned invalid type: {type(patches_or_state)}")

    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.exception(f"Error executing agent {agent_name}")
        append_log(order_id, agent_name, {
            "action": "executed",
            "status": "error",
            "error": str(e),
            "timestamp": time.time(),
            "elapsed_ms": elapsed_ms
        })
        state["error"] = str(e)
        return state
