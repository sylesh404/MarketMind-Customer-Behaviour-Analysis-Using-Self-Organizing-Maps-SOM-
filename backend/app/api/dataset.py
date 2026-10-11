import os
import json
import uuid
import numpy as np
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.database.connection import get_db
from app.ml.preprocessing import validate_dataset

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

DEMO_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "sample_customers.csv"))

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        raw_name = file.filename or "uploaded_dataset.csv"
        # Sanitize filename against directory traversal
        filename = os.path.basename(raw_name)
        ext = os.path.splitext(filename)[1].lower()
        
        if ext not in [".csv", ".xlsx", ".xls"]:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV (.csv) or Excel (.xlsx, .xls) file.")
            
        contents = await file.read()
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")
            
        # 50MB file size limit
        if len(contents) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds the 50MB limit.")
        
        if ext == ".csv":
            df = pd.read_csv(pd.io.common.BytesIO(contents))
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(pd.io.common.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")
            
        if len(df) < 5:
            raise HTTPException(status_code=400, detail="Dataset must contain at least 5 rows for statistical analysis.")
            
        if len(df.columns) < 2:
            raise HTTPException(status_code=400, detail="Dataset must contain at least 2 columns.")
            
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            raise HTTPException(status_code=400, detail="Dataset contains no numerical features. SOM requires numeric attributes for spatial projection.")
            
        return save_and_respond_dataset(df, filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.post("/load-demo")
async def load_demo_dataset():
    try:
        if not os.path.exists(DEMO_PATH):
            raise HTTPException(status_code=404, detail="Demo dataset not found on server.")
        df = pd.read_csv(DEMO_PATH)
        return save_and_respond_dataset(df, "sample_customers.csv")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading demo dataset: {str(e)}")

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    data = json.loads(row["data_json"])
    df = pd.DataFrame(data)
    validation = validate_dataset(df)
    
    return {
        "id": row["id"],
        "filename": row["filename"],
        "upload_date": row["upload_date"],
        "row_count": row["row_count"],
        "column_count": row["column_count"],
        "columns": json.loads(row["columns_json"]),
        "validation": validation,
        "preview": data[:100] # return first 100 rows preview
    }

def save_and_respond_dataset(df: pd.DataFrame, filename: str):
    dataset_id = str(uuid.uuid4())
    row_count = len(df)
    col_count = len(df.columns)
    columns = df.columns.tolist()
    data_json = df.to_json(orient="records")
    
    validation = validate_dataset(df)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO datasets (id, filename, row_count, column_count, columns_json, data_json) VALUES (?, ?, ?, ?, ?, ?)",
        (dataset_id, filename, row_count, col_count, json.dumps(columns), data_json)
    )
    conn.commit()
    conn.close()
    
    return {
        "id": dataset_id,
        "dataset_id": dataset_id,
        "filename": filename,
        "row_count": row_count,
        "column_count": col_count,
        "columns": columns,
        "validation": validation,
        "preview": df.head(100).to_dict(orient="records")
    }
