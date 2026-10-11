import json
import uuid
import pandas as pd
from pydantic import BaseModel
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from app.database.connection import get_db
from app.ml.preprocessing import preprocess_dataset

router = APIRouter(prefix="/api/preprocess", tags=["preprocess"])

class PreprocessRequest(BaseModel):
    dataset_id: str
    selected_features: List[str]
    imputation_strategy: str = "mean"
    remove_duplicates: bool = True

@router.post("")
async def run_preprocessing(req: PreprocessRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets WHERE id = ?", (req.dataset_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    raw_data = json.loads(row["data_json"])
    df = pd.DataFrame(raw_data)
    
    # Validate selected features
    available_cols = df.columns.tolist()
    missing_feats = [f for f in req.selected_features if f not in available_cols]
    if missing_feats:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Features not found in dataset: {missing_feats}")
        
    try:
        df_clean, feat_df, scaled_array, scaler = preprocess_dataset(
            df=df,
            selected_features=req.selected_features,
            imputation_strategy=req.imputation_strategy,
            remove_duplicates=req.remove_duplicates
        )
        
        preprocessed_id = str(uuid.uuid4())
        clean_json = df_clean.to_json(orient="records")
        removed_dups = len(df) - len(df_clean)
        
        cursor.execute(
            """
            INSERT INTO preprocessed_datasets 
            (id, dataset_id, selected_features_json, imputation_strategy, removed_duplicates, data_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                preprocessed_id,
                req.dataset_id,
                json.dumps(req.selected_features),
                req.imputation_strategy,
                removed_dups,
                clean_json
            )
        )
        conn.commit()
        conn.close()
        
        return {
            "preprocessed_id": preprocessed_id,
            "dataset_id": req.dataset_id,
            "selected_features": req.selected_features,
            "imputation_strategy": req.imputation_strategy,
            "removed_duplicates": removed_dups,
            "cleaned_rows": len(df_clean),
            "status": "ready_for_som"
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {str(e)}")
