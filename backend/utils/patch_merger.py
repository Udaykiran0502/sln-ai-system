import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class Patch(BaseModel):
    target_path: str = Field(..., description="Dot-notation path to the target field in state or scene graph")
    operation: str = Field(..., description="Operation: 'set', 'append', or 'remove'")
    value: Any = Field(None, description="Value to set or append. Ignored for 'remove'.")

def get_by_path(root: dict, path: str) -> Any:
    """Get a value from a nested dict using a dot-notation path."""
    keys = path.split('.')
    val = root
    for key in keys:
        if isinstance(val, dict):
            val = val.get(key)
        elif isinstance(val, list) and key.isdigit():
            val = val[int(key)]
        else:
            return None
    return val

def apply_patch(state: dict, patch: Patch) -> bool:
    """Apply a single patch to the state dict. Returns True if successful."""
    keys = patch.target_path.split('.')
    if not keys:
        return False
        
    target = state
    # Navigate to the parent of the target key
    for key in keys[:-1]:
        if isinstance(target, dict):
            if key not in target:
                target[key] = {}
            target = target[key]
        elif isinstance(target, list) and key.isdigit():
            target = target[int(key)]
        else:
            logger.error(f"Cannot navigate to path {patch.target_path}")
            return False

    last_key = keys[-1]
    
    try:
        if patch.operation == 'set':
            if isinstance(target, dict):
                target[last_key] = patch.value
            elif isinstance(target, list) and last_key.isdigit():
                target[int(last_key)] = patch.value
            else:
                return False
                
        elif patch.operation == 'append':
            if isinstance(target, dict):
                if last_key not in target:
                    target[last_key] = []
                if not isinstance(target[last_key], list):
                    return False
                target[last_key].append(patch.value)
            elif isinstance(target, list) and last_key.isdigit():
                idx = int(last_key)
                if not isinstance(target[idx], list):
                    return False
                target[idx].append(patch.value)
            else:
                return False
                
        elif patch.operation == 'remove':
            if isinstance(target, dict) and last_key in target:
                del target[last_key]
            elif isinstance(target, list) and last_key.isdigit():
                idx = int(last_key)
                if 0 <= idx < len(target):
                    del target[idx]
            else:
                return False
        else:
            logger.error(f"Unknown patch operation: {patch.operation}")
            return False
            
        return True
    except Exception as e:
        logger.error(f"Failed to apply patch {patch}: {e}")
        return False

def merge_patches(state: dict, patches: List[Patch]) -> dict:
    """Apply a list of patches to the state."""
    for patch in patches:
        apply_patch(state, patch)
    return state
