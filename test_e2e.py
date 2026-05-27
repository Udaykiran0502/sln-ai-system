"""End-to-end pipeline test with sample order."""

import json
from pathlib import Path

from backend.workflows.design_pipeline import run_pipeline


def test_pipeline_blocks_placeholder_based_export():
    with open("data/orders/sample_order.json", "r", encoding="utf-8") as f:
        order = json.load(f)

    result = run_pipeline(order)

    assert result["order_id"] == order["order_id"]
    assert result["workflow_type"] == "template"
    assert result["qa_passed"] is False
    assert result["needs_human_review"] is True
    assert result.get("export_paths") in (None, {})

    hard_codes = {f["code"] for f in result["qa_scores"]["hard_failures"]}
    assert "placeholder_image" in hard_codes
    assert Path(result["composite_path"]).exists()
