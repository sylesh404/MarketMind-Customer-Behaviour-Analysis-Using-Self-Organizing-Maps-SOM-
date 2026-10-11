import os
import json
import tempfile
from typing import Optional, List, Dict, Any
import pandas as pd
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from app.database.connection import get_db
from app.services.report_service import generate_pdf_report
from app.ml.insights import generate_market_insights, generate_recommendations, calculate_retention_risk
from app.services.groq_service import (
    is_groq_available,
    generate_ai_market_insights,
    generate_ai_recommendations,
    generate_ai_executive_summary
)

router = APIRouter(prefix="/api/report", tags=["report"])

class ReportRequest(BaseModel):
    analysis_id: str
    include_plots: Optional[bool] = True

@router.post("/generate-pdf")
async def export_pdf_report(req: ReportRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (req.analysis_id,))
    an_row = cursor.fetchone()
    
    if not an_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis session not found")
        
    cursor.execute("SELECT * FROM datasets WHERE id = ?", (an_row["dataset_id"],))
    ds_row = cursor.fetchone()
    
    cursor.execute("SELECT metrics_json FROM segments WHERE analysis_id = ?", (req.analysis_id,))
    seg_rows = cursor.fetchall()
    
    cursor.execute("SELECT raw_features_json FROM customer_results WHERE analysis_id = ?", (req.analysis_id,))
    cust_rows = cursor.fetchall()
    conn.close()
    
    analysis_info = {
        "grid_width": an_row["grid_width"],
        "grid_height": an_row["grid_height"],
        "learning_rate": an_row["learning_rate"],
        "iterations": an_row["iterations"],
        "neighborhood_func": an_row["neighborhood_func"],
        "quantization_error": an_row["quantization_error"],
        "topographic_error": an_row["topographic_error"],
        "umatrix": json.loads(an_row["umatrix_json"]),
        "features": json.loads(an_row["features_json"])
    }
    
    dataset_info = {
        "filename": ds_row["filename"] if ds_row else "dataset.csv",
        "row_count": ds_row["row_count"] if ds_row else 0,
        "column_count": ds_row["column_count"] if ds_row else 0
    }
    
    segments = [json.loads(s["metrics_json"]) for s in seg_rows]
    raw_customers = [json.loads(c["raw_features_json"]) for c in cust_rows]
    df_cust = pd.DataFrame(raw_customers)
    
    insights = generate_market_insights(df_cust, segments)
    recommendations = generate_recommendations(segments)
    _, risk_summary = calculate_retention_risk(df_cust)
    
    ai_summary = None
    if is_groq_available():
        try:
            ai_insights = generate_ai_market_insights({"row_count": len(df_cust)}, segments, [], risk_summary)
            if ai_insights and len(ai_insights) > 0:
                insights = ai_insights
            ai_recs = generate_ai_recommendations(segments, risk_summary)
            if ai_recs and len(ai_recs) > 0:
                recommendations = ai_recs
            ai_summary = generate_ai_executive_summary(analysis_info, dataset_info, segments, risk_summary)
        except Exception:
            pass
    
    temp_dir = tempfile.gettempdir()
    pdf_filename = f"MarketMind_Report_{req.analysis_id[:8]}.pdf"
    pdf_path = os.path.join(temp_dir, pdf_filename)
    
    try:
        generate_pdf_report(
            analysis_info=analysis_info,
            dataset_info=dataset_info,
            segments=segments,
            insights=insights,
            recommendations=recommendations,
            risk_summary=risk_summary,
            output_path=pdf_path,
            ai_executive_summary=ai_summary
        )
        return FileResponse(
            path=pdf_path,
            filename=pdf_filename,
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.get("/export-csv/{analysis_id}")
async def export_csv_report(analysis_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT cr.*, s.name as segment_name FROM customer_results cr LEFT JOIN segments s ON cr.analysis_id = s.analysis_id AND cr.segment_id = s.segment_id WHERE cr.analysis_id = ? ORDER BY cr.id ASC",
        (analysis_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No customer results found")
        
    records = []
    for r in rows:
        item = json.loads(r["raw_features_json"])
        # Ensure standard columns specified in requirements
        item["Customer_ID"] = r["customer_id"]
        item["BMU_X"] = r["bmu_x"]
        item["BMU_Y"] = r["bmu_y"]
        item["BMU_Distance"] = r["distance"]
        item["Segment"] = r["segment_name"] or f"Segment {r['segment_id']}"
        item["Segment_ID"] = r["segment_id"]
        item["Risk_Level"] = r["risk_level"]
        item["Risk_Score"] = r["risk_score"] if "risk_score" in r.keys() else 0
        records.append(item)
        
    df = pd.DataFrame(records)
    
    temp_dir = tempfile.gettempdir()
    csv_filename = f"MarketMind_Segmentation_{analysis_id[:8]}.csv"
    csv_path = os.path.join(temp_dir, csv_filename)
    df.to_csv(csv_path, index=False)
    
    return FileResponse(
        path=csv_path,
        filename=csv_filename,
        media_type="text/csv"
    )

@router.get("/export-json/{analysis_id}")
async def export_json_report(analysis_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    an_row = cursor.fetchone()
    
    if not an_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    cursor.execute("SELECT metrics_json FROM segments WHERE analysis_id = ? ORDER BY segment_id ASC", (analysis_id,))
    seg_rows = cursor.fetchall()
    
    cursor.execute(
        "SELECT customer_id, bmu_x, bmu_y, distance, segment_id, risk_level, risk_score, raw_features_json FROM customer_results WHERE analysis_id = ? ORDER BY id ASC",
        (analysis_id,)
    )
    cust_rows = cursor.fetchall()
    conn.close()
    
    segments = [json.loads(s["metrics_json"]) for s in seg_rows]
    customers = []
    raw_customers = []
    for c in cust_rows:
        item = json.loads(c["raw_features_json"])
        raw_customers.append(item)
        item["Customer_ID"] = c["customer_id"]
        item["bmu_x"] = c["bmu_x"]
        item["bmu_y"] = c["bmu_y"]
        item["distance"] = c["distance"]
        item["segment_id"] = c["segment_id"]
        item["risk_level"] = c["risk_level"]
        item["risk_score"] = c["risk_score"] if "risk_score" in c.keys() else 0
        customers.append(item)
        
    df_cust = pd.DataFrame(raw_customers)
    insights = generate_market_insights(df_cust, segments)
    recommendations = generate_recommendations(segments)
    _, risk_summary = calculate_retention_risk(df_cust)
        
    return {
        "analysis_id": analysis_id,
        "dataset_id": an_row["dataset_id"],
        "grid_width": an_row["grid_width"],
        "grid_height": an_row["grid_height"],
        "learning_rate": an_row["learning_rate"],
        "iterations": an_row["iterations"],
        "neighborhood_func": an_row["neighborhood_func"],
        "quantization_error": an_row["quantization_error"],
        "topographic_error": an_row["topographic_error"],
        "metrics": {
            "quantization_error": an_row["quantization_error"],
            "topographic_error": an_row["topographic_error"]
        },
        "umatrix": json.loads(an_row["umatrix_json"]),
        "features": json.loads(an_row["features_json"]),
        "segments": segments,
        "risk_summary": risk_summary,
        "insights": insights,
        "recommendations": recommendations,
        "customers": customers
    }
