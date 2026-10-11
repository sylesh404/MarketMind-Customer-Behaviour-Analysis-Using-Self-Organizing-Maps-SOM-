import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.connection import get_db

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.get("/{analysis_id}")
async def get_customers(
    analysis_id: str,
    segment_id: Optional[int] = Query(None),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(200, le=1000),
    offset: int = Query(0)
):
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM customer_results WHERE analysis_id = ?"
    params = [analysis_id]
    
    if segment_id is not None:
        query += " AND segment_id = ?"
        params.append(segment_id)
        
    if risk_level:
        query += " AND risk_level = ?"
        params.append(risk_level)
        
    if search:
        query += " AND customer_id LIKE ?"
        params.append(f"%{search}%")
        
    query += f" LIMIT {limit} OFFSET {offset}"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    # Get total count
    count_query = "SELECT COUNT(*) as total FROM customer_results WHERE analysis_id = ?"
    cursor.execute(count_query, [analysis_id])
    total_count = cursor.fetchone()["total"]
    
    conn.close()
    
    results = []
    for r in rows:
        feat_dict = json.loads(r["raw_features_json"])
        feat_dict["Customer_ID"] = r["customer_id"]
        feat_dict["bmu_x"] = r["bmu_x"]
        feat_dict["bmu_y"] = r["bmu_y"]
        feat_dict["distance"] = r["distance"]
        feat_dict["segment_id"] = r["segment_id"]
        feat_dict["risk_level"] = r["risk_level"]
        feat_dict["risk_score"] = r["risk_score"] if "risk_score" in r.keys() else 0
        results.append(feat_dict)
        
    return {
        "analysis_id": analysis_id,
        "total_count": total_count,
        "returned_count": len(results),
        "customers": results
    }

@router.get("/detail/{customer_id}")
async def get_customer_detail(customer_id: str, analysis_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customer_results WHERE analysis_id = ? AND customer_id = ?", (analysis_id, customer_id))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Customer #{customer_id} not found in analysis")
        
    cursor.execute("SELECT * FROM segments WHERE analysis_id = ? AND segment_id = ?", (analysis_id, row["segment_id"]))
    seg_row = cursor.fetchone()
    conn.close()
    
    feat_dict = json.loads(row["raw_features_json"])
    feat_dict["Customer_ID"] = customer_id
    feat_dict["bmu_x"] = row["bmu_x"]
    feat_dict["bmu_y"] = row["bmu_y"]
    feat_dict["distance"] = row["distance"]
    feat_dict["segment_id"] = row["segment_id"]
    feat_dict["risk_level"] = row["risk_level"]
    risk_sc = row["risk_score"] if "risk_score" in row.keys() else 0
    feat_dict["risk_score"] = risk_sc
    
    seg_info = json.loads(seg_row["metrics_json"]) if seg_row else {}
    
    return {
        "customer_id": customer_id,
        "analysis_id": analysis_id,
        "bmu_x": row["bmu_x"],
        "bmu_y": row["bmu_y"],
        "distance": row["distance"],
        "segment_id": row["segment_id"],
        "segment_name": seg_info.get("name", f"Segment {row['segment_id']}"),
        "risk_level": row["risk_level"],
        "risk_score": risk_sc,
        "profile": feat_dict,
        "segment_info": seg_info
    }
