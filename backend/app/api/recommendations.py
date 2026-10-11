import json
import logging
import pandas as pd
from fastapi import APIRouter, HTTPException
from app.database.connection import get_db
from app.ml.insights import generate_recommendations, calculate_retention_risk
from app.services.groq_service import is_groq_available, generate_ai_recommendations

logger = logging.getLogger("marketmind.recommendations")
router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.get("/{analysis_id}")
async def get_recommendations(analysis_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT metrics_json FROM segments WHERE analysis_id = ?", (analysis_id,))
    seg_rows = cursor.fetchall()
    
    if not seg_rows:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    segments = [json.loads(s["metrics_json"]) for s in seg_rows]
    recommendations = generate_recommendations(segments)
    ai_enhanced = False
    
    if is_groq_available():
        try:
            cursor.execute("SELECT raw_features_json FROM customer_results WHERE analysis_id = ?", (analysis_id,))
            cust_rows = cursor.fetchall()
            raw_customers = [json.loads(c["raw_features_json"]) for c in cust_rows]
            df_customers = pd.DataFrame(raw_customers)
            _, risk_summary = calculate_retention_risk(df_customers)
            ai_recs = generate_ai_recommendations(segments, risk_summary)
            if ai_recs and len(ai_recs) > 0:
                recommendations = ai_recs
                ai_enhanced = True
        except Exception as e:
            logger.warning(f"Groq AI recommendations fallback triggered: {e}")
            
    conn.close()
    
    return {
        "analysis_id": analysis_id,
        "recommendations": recommendations,
        "ai_enhanced": ai_enhanced
    }
