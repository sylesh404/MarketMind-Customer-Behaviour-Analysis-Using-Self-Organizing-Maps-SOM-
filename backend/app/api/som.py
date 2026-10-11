import json
import uuid
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from app.database.connection import get_db
from app.ml.preprocessing import preprocess_dataset
from app.ml.som_engine import train_som_model
from app.ml.segmentation import cluster_som_grid
from app.ml.insights import calculate_retention_risk, generate_market_insights, generate_recommendations

router = APIRouter(prefix="/api/som", tags=["som"])

class SOMTrainRequest(BaseModel):
    dataset_id: Optional[str] = None
    preprocessed_id: Optional[str] = None
    selected_features: Optional[List[str]] = None
    grid_width: int = 10
    grid_x: Optional[int] = None
    grid_height: int = 10
    grid_y: Optional[int] = None
    learning_rate: float = 0.5
    iterations: int = 10000
    neighborhood_func: str = "gaussian"
    neighborhood_function: Optional[str] = None
    n_clusters: int = 6
    imputation_strategy: str = "mean"

@router.post("/train")
async def train_som(req: SOMTrainRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    # Resolve dataset_id and selected_features from preprocessed_id if provided
    dataset_id = req.dataset_id
    selected_features = req.selected_features
    imputation_strategy = req.imputation_strategy
    
    if req.preprocessed_id and not dataset_id:
        cursor.execute("SELECT * FROM preprocessed_datasets WHERE id = ?", (req.preprocessed_id,))
        p_row = cursor.fetchone()
        if p_row:
            dataset_id = p_row["dataset_id"]
            if not selected_features:
                selected_features = json.loads(p_row["selected_features_json"])
            imputation_strategy = p_row["imputation_strategy"]
            
    if not dataset_id:
        conn.close()
        raise HTTPException(status_code=400, detail="dataset_id or valid preprocessed_id is required")
        
    cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    raw_data = json.loads(row["data_json"])
    df = pd.DataFrame(raw_data)
    
    # Resolve parameter aliases
    grid_w = req.grid_x if req.grid_x is not None else req.grid_width
    grid_h = req.grid_y if req.grid_y is not None else req.grid_height
    neigh_func = req.neighborhood_function if req.neighborhood_function is not None else req.neighborhood_func
    
    if not selected_features:
        # Default to all numeric features except Customer_ID
        selected_features = [c for c in df.select_dtypes(include=[np.number]).columns.tolist() if c != "Customer_ID"]
        
    try:
        # Preprocess & Scale
        df_clean, feat_df, scaled_array, scaler = preprocess_dataset(
            df=df,
            selected_features=selected_features,
            imputation_strategy=imputation_strategy,
            remove_duplicates=True
        )
        
        # Train SOM
        som_res = train_som_model(
            scaled_data=scaled_array,
            grid_width=grid_w,
            grid_height=grid_h,
            learning_rate=req.learning_rate,
            iterations=req.iterations,
            neighborhood_func=neigh_func
        )
        
        # Cluster SOM Codebook Vectors & Assign Segments
        segmentation_res = cluster_som_grid(
            som_weights=som_res["weights"],
            df_customers=df_clean,
            bmu_results=som_res["bmu_results"],
            selected_features=selected_features,
            n_clusters=req.n_clusters
        )
        
        # Behavioral Retention Risk Scoring
        risk_results, risk_summary = calculate_retention_risk(segmentation_res["df_augmented"])
        
        analysis_id = str(uuid.uuid4())
        
        # Save Analysis Record
        cursor.execute(
            """
            INSERT INTO analyses 
            (id, dataset_id, grid_width, grid_height, learning_rate, iterations, neighborhood_func,
             quantization_error, topographic_error, umatrix_json, weights_json, features_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                dataset_id,
                grid_w,
                grid_h,
                req.learning_rate,
                req.iterations,
                neigh_func,
                som_res["quantization_error"],
                som_res["topographic_error"],
                json.dumps(som_res["umatrix"]),
                json.dumps(som_res["weights"]),
                json.dumps(selected_features)
            )
        )
        
        # Save Segments
        df_aug = segmentation_res["df_augmented"]
        for seg in segmentation_res["segments"]:
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
            
        # Save Customer Results with risk_score
        for i, bmu_item in enumerate(som_res["bmu_results"]):
            cust_row = df_aug.iloc[bmu_item["index"]]
            c_id = str(cust_row.get("Customer_ID", bmu_item["index"] + 1001))
            seg_id = int(cust_row["Segment_ID"])
            risk_item = risk_results[i]
            
            cursor.execute(
                """
                INSERT INTO customer_results 
                (analysis_id, customer_id, bmu_x, bmu_y, distance, segment_id, risk_level, risk_score, raw_features_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    analysis_id,
                    c_id,
                    bmu_item["bmu_x"],
                    bmu_item["bmu_y"],
                    bmu_item["distance"],
                    seg_id,
                    risk_item["risk_level"],
                    risk_item.get("risk_score", 0),
                    json.dumps(cust_row.to_dict())
                )
            )
            
        conn.commit()
        conn.close()
        
        # Generate Recommendations & Insights for Response
        market_insights = generate_market_insights(df_aug, segmentation_res["segments"])
        ai_recommendations = generate_recommendations(segmentation_res["segments"])
        
        return {
            "analysis_id": analysis_id,
            "dataset_id": dataset_id,
            "grid_width": grid_w,
            "grid_height": grid_h,
            "learning_rate": req.learning_rate,
            "iterations": req.iterations,
            "neighborhood_func": neigh_func,
            "quantization_error": som_res["quantization_error"],
            "topographic_error": som_res["topographic_error"],
            "metrics": {
                "quantization_error": som_res["quantization_error"],
                "topographic_error": som_res["topographic_error"]
            },
            "umatrix": som_res["umatrix"],
            "node_counts": som_res["node_counts"],
            "node_customer_counts": som_res["node_counts"],
            "node_segment_matrix": segmentation_res["node_segment_matrix"],
            "features": selected_features,
            "mapped_customers_count": len(som_res["bmu_results"]),
            "segments": segmentation_res["segments"],
            "risk_summary": risk_summary,
            "insights": market_insights,
            "recommendations": ai_recommendations
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"SOM Training Failed: {str(e)}")

@router.get("/{analysis_id}")
async def get_som_analysis(analysis_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis session not found")
        
    cursor.execute("SELECT * FROM segments WHERE analysis_id = ? ORDER BY segment_id", (analysis_id,))
    seg_rows = cursor.fetchall()
    
    cursor.execute("SELECT bmu_x, bmu_y, segment_id FROM customer_results WHERE analysis_id = ?", (analysis_id,))
    c_rows = cursor.fetchall()
    conn.close()
    
    gw = row["grid_width"]
    gh = row["grid_height"]
    node_counts = [[0 for _ in range(gh)] for _ in range(gw)]
    node_seg_map: Dict[str, Dict[int, int]] = {}
    
    for cr in c_rows:
        bx, by, sid = cr["bmu_x"], cr["bmu_y"], cr["segment_id"]
        if 0 <= bx < gw and 0 <= by < gh:
            node_counts[bx][by] += 1
            nkey = f"{bx},{by}"
            if nkey not in node_seg_map:
                node_seg_map[nkey] = {}
            node_seg_map[nkey][sid] = node_seg_map[nkey].get(sid, 0) + 1
            
    node_segment_matrix = [[0 for _ in range(gh)] for _ in range(gw)]
    for x in range(gw):
        for y in range(gh):
            nkey = f"{x},{y}"
            if nkey in node_seg_map and node_seg_map[nkey]:
                node_segment_matrix[x][y] = max(node_seg_map[nkey].items(), key=lambda item: item[1])[0]
    
    segments = [json.loads(s["metrics_json"]) for s in seg_rows]
    
    return {
        "analysis_id": row["id"],
        "dataset_id": row["dataset_id"],
        "grid_width": gw,
        "grid_height": gh,
        "learning_rate": row["learning_rate"],
        "iterations": row["iterations"],
        "neighborhood_func": row["neighborhood_func"],
        "quantization_error": row["quantization_error"],
        "topographic_error": row["topographic_error"],
        "metrics": {
            "quantization_error": row["quantization_error"],
            "topographic_error": row["topographic_error"]
        },
        "umatrix": json.loads(row["umatrix_json"]),
        "node_counts": node_counts,
        "node_customer_counts": node_counts,
        "node_segment_matrix": node_segment_matrix,
        "features": json.loads(row["features_json"]),
        "segments": segments,
        "created_at": row["created_at"]
    }

@router.get("/{analysis_id}/umatrix")
async def get_umatrix_data(analysis_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT grid_width, grid_height, umatrix_json FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    gw = row["grid_width"]
    gh = row["grid_height"]
    umatrix = json.loads(row["umatrix_json"])
    
    cursor.execute(
        "SELECT customer_id, bmu_x, bmu_y, distance, segment_id, risk_level, risk_score, raw_features_json FROM customer_results WHERE analysis_id = ?",
        (analysis_id,)
    )
    cust_rows = cursor.fetchall()
    conn.close()
    
    node_customers = {}
    node_counts = [[0 for _ in range(gh)] for _ in range(gw)]
    node_seg_counts = [[{} for _ in range(gh)] for _ in range(gw)]
    
    for r in cust_rows:
        bx = r["bmu_x"]
        by = r["bmu_y"]
        if 0 <= bx < gw and 0 <= by < gh:
            node_counts[bx][by] += 1
            node_seg_counts[bx][by][r["segment_id"]] = node_seg_counts[bx][by].get(r["segment_id"], 0) + 1
            
        key = f"{bx},{by}"
        if key not in node_customers:
            node_customers[key] = []
        cust_dict = json.loads(r["raw_features_json"])
        cust_dict["Customer_ID"] = r["customer_id"]
        cust_dict["bmu_x"] = bx
        cust_dict["bmu_y"] = by
        cust_dict["distance"] = r["distance"]
        cust_dict["segment_id"] = r["segment_id"]
        cust_dict["risk_level"] = r["risk_level"]
        cust_dict["risk_score"] = r["risk_score"] if "risk_score" in r.keys() else 0
        node_customers[key].append(cust_dict)
        
    node_segment_matrix = [[0 for _ in range(gh)] for _ in range(gw)]
    for x in range(gw):
        for y in range(gh):
            counts = node_seg_counts[x][y]
            if counts:
                node_segment_matrix[x][y] = max(counts.items(), key=lambda item: item[1])[0]
        
    return {
        "grid_width": gw,
        "grid_height": gh,
        "umatrix": umatrix,
        "node_counts": node_counts,
        "node_customer_counts": node_counts,
        "node_segment_matrix": node_segment_matrix,
        "node_customers": node_customers
    }
