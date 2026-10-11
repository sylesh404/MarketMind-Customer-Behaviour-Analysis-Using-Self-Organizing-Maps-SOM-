import json
import pandas as pd
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.database.connection import get_db
from app.ml.insights import generate_correlation_matrix, generate_market_insights, calculate_retention_risk
from app.services.groq_service import (
    is_groq_available,
    generate_ai_market_insights,
    ask_ai_analyst,
    PRIMARY_MODEL
)

router = APIRouter(prefix="/api/insights", tags=["insights"])

class AskAIRequest(BaseModel):
    query: str

@router.get("/ai-status")
async def get_ai_status():
    return {
        "available": is_groq_available(),
        "provider": "Groq",
        "model": PRIMARY_MODEL if is_groq_available() else "None"
    }

@router.get("/{analysis_id}")
async def get_insights(analysis_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT features_json FROM analyses WHERE id = ?", (analysis_id,))
    an_row = cursor.fetchone()
    
    if not an_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    features = json.loads(an_row["features_json"])
    
    cursor.execute("SELECT metrics_json FROM segments WHERE analysis_id = ?", (analysis_id,))
    seg_rows = cursor.fetchall()
    segments = [json.loads(s["metrics_json"]) for s in seg_rows]
    
    cursor.execute("SELECT raw_features_json FROM customer_results WHERE analysis_id = ?", (analysis_id,))
    cust_rows = cursor.fetchall()
    conn.close()
    
    raw_customers = [json.loads(c["raw_features_json"]) for c in cust_rows]
    df_customers = pd.DataFrame(raw_customers)
    
    correlation = generate_correlation_matrix(df_customers, features)
    statistical_insights = generate_market_insights(df_customers, segments)
    _, risk_summary = calculate_retention_risk(df_customers)
    
    # Attempt Groq AI generation for deeper behavioral synthesis
    final_insights = statistical_insights
    ai_enhanced = False
    
    if is_groq_available():
        try:
            # Flatten top correlation pairs for prompt
            corr_pairs = []
            feats = correlation.get("features", [])
            mat = correlation.get("matrix", [])
            for i in range(len(feats)):
                for j in range(i + 1, len(feats)):
                    val = mat[i][j]
                    if abs(val) > 0.15:
                        corr_pairs.append({"feature_1": feats[i], "feature_2": feats[j], "correlation": val})
                        
            dataset_summary = {"row_count": len(df_customers)}
            ai_insights = generate_ai_market_insights(dataset_summary, segments, corr_pairs, risk_summary)
            if ai_insights and len(ai_insights) > 0:
                final_insights = ai_insights
                ai_enhanced = True
        except Exception as e:
            pass

    return {
        "analysis_id": analysis_id,
        "correlation": correlation,
        "market_insights": final_insights,
        "insights": final_insights,
        "risk_summary": risk_summary,
        "ai_enhanced": ai_enhanced,
        "ai_provider": "Groq" if ai_enhanced else None,
        "ai_model": PRIMARY_MODEL if ai_enhanced else None
    }

@router.post("/{analysis_id}/ask")
async def query_ai_analyst(analysis_id: str, req: AskAIRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    an_row = cursor.fetchone()
    
    if not an_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    cursor.execute("SELECT metrics_json FROM segments WHERE analysis_id = ?", (analysis_id,))
    seg_rows = cursor.fetchall()
    segments = [json.loads(s["metrics_json"]) for s in seg_rows]
    
    cursor.execute("SELECT raw_features_json FROM customer_results WHERE analysis_id = ?", (analysis_id,))
    cust_rows = cursor.fetchall()
    conn.close()
    
    raw_customers = [json.loads(c["raw_features_json"]) for c in cust_rows]
    df_customers = pd.DataFrame(raw_customers)
    _, risk_summary = calculate_retention_risk(df_customers)
    
    context = {
        "analysis_id": analysis_id,
        "grid_width": an_row["grid_width"],
        "grid_height": an_row["grid_height"],
        "quantization_error": an_row["quantization_error"],
        "topographic_error": an_row["topographic_error"],
        "customer_count": len(df_customers),
        "risk_summary": risk_summary,
        "segments": [{
            "id": s.get("segment_id"),
            "name": s.get("name"),
            "percentage": s.get("percentage"),
            "avg_spend": s.get("average_spending"),
            "revenue_contribution": s.get("revenue_contribution"),
            "recency": s.get("recency"),
            "frequency": s.get("purchase_frequency")
        } for s in segments]
    }
    
    result = ask_ai_analyst(req.query, context)
    return result
