import json
import pandas as pd
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.database.connection import get_db
from app.ml.segmentation import cluster_som_grid
from app.ml.insights import generate_market_insights, generate_recommendations, calculate_retention_risk

router = APIRouter(prefix="/api/segments", tags=["segments"])

class ReclusterRequest(BaseModel):
    n_clusters: int = 6
    linkage: Optional[str] = "ward"

@router.get("/{analysis_id}")
async def get_segments(analysis_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM segments WHERE analysis_id = ? ORDER BY segment_id", (analysis_id,))
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="Segments for analysis not found")
        
    segments = [json.loads(r["metrics_json"]) for r in rows]
    return {"analysis_id": analysis_id, "segments": segments}

@router.post("/{analysis_id}/recluster")
async def recluster_segments(analysis_id: str, req: ReclusterRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    an_row = cursor.fetchone()
    
    if not an_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    cursor.execute("SELECT * FROM customer_results WHERE analysis_id = ? ORDER BY id ASC", (analysis_id,))
    cust_rows = cursor.fetchall()
    
    weights = json.loads(an_row["weights_json"])
    features = json.loads(an_row["features_json"])
    
    raw_customers = [json.loads(c["raw_features_json"]) for c in cust_rows]
    df_customers = pd.DataFrame(raw_customers)
    
    bmu_results = [
        {"index": i, "bmu_x": c["bmu_x"], "bmu_y": c["bmu_y"], "distance": c["distance"]}
        for i, c in enumerate(cust_rows)
    ]
    
    seg_res = cluster_som_grid(
        som_weights=weights,
        df_customers=df_customers,
        bmu_results=bmu_results,
        selected_features=features,
        n_clusters=req.n_clusters,
        linkage=req.linkage or "ward"
    )
    
    # Delete old segments and insert new ones
    cursor.execute("DELETE FROM segments WHERE analysis_id = ?", (analysis_id,))
    for seg in seg_res["segments"]:
        cursor.execute(
            """
            INSERT INTO segments 
            (analysis_id, segment_id, name, customer_count, percentage, average_spending,
             average_income, purchase_frequency, recency, revenue_contribution, description, recommendation, metrics_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                seg["segment_id"],
                seg["name"],
                seg["customer_count"],
                seg["percentage"],
                seg["average_spending"],
                seg["average_income"],
                seg["purchase_frequency"],
                seg["recency"],
                seg["revenue_contribution"],
                seg["description"],
                seg["recommendation"],
                json.dumps(seg)
            )
        )
        
    # Update customer segment IDs
    df_aug = seg_res["df_augmented"]
    for i, c_row in enumerate(cust_rows):
        c_id = c_row["customer_id"]
        new_seg_id = int(df_aug.iloc[i]["Segment_ID"])
        cursor.execute("UPDATE customer_results SET segment_id = ? WHERE analysis_id = ? AND customer_id = ?", (new_seg_id, analysis_id, c_id))
        
    conn.commit()
    conn.close()
    
    # Compute updated analytics
    _, risk_summary = calculate_retention_risk(df_aug)
    market_insights = generate_market_insights(df_aug, seg_res["segments"])
    recommendations = generate_recommendations(seg_res["segments"])
    
    return {
        "analysis_id": analysis_id,
        "n_clusters": req.n_clusters,
        "segments": seg_res["segments"],
        "node_segment_matrix": seg_res["node_segment_matrix"],
        "risk_summary": risk_summary,
        "insights": market_insights,
        "recommendations": recommendations
    }
