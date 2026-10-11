import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any, List, Tuple

def validate_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyzes uploaded dataset for missing values, duplicates, empty/constant columns, and data types.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    
    missing_by_col = df.isnull().sum().to_dict()
    total_missing = sum(missing_by_col.values())
    missing_percentage = float(np.round((total_missing / (total_rows * total_cols if total_rows > 0 else 1)) * 100, 2))
    
    duplicate_rows = int(df.duplicated().sum())
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
    
    constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
    
    # Overview column details
    column_details = []
    for col in df.columns:
        null_cnt = int(df[col].isnull().sum())
        column_details.append({
            "name": col,
            "type": str(df[col].dtype),
            "missing_count": null_cnt,
            "missing_pct": float(np.round(null_cnt / total_rows * 100, 2)) if total_rows > 0 else 0,
            "unique_count": int(df[col].nunique()),
            "is_numeric": col in numeric_cols
        })
        
    return {
        "total_rows": total_rows,
        "row_count": total_rows,
        "total_cols": total_cols,
        "total_missing": total_missing,
        "missing_percentage": missing_percentage,
        "duplicate_rows": duplicate_rows,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "constant_columns": constant_cols,
        "column_details": column_details
    }

def preprocess_dataset(
    df: pd.DataFrame,
    selected_features: List[str],
    imputation_strategy: str = "mean", # "mean", "median", "mode", "drop"
    remove_duplicates: bool = True,
    customer_id_col: str = "Customer_ID"
) -> Tuple[pd.DataFrame, pd.DataFrame, np.ndarray, StandardScaler]:
    """
    Cleans dataset and standardizes selected numerical features.
    Returns: (cleaned_full_df, selected_features_df, scaled_feature_array, scaler_object)
    """
    df_clean = df.copy()
    
    if remove_duplicates:
        df_clean = df_clean.drop_duplicates().reset_index(drop=True)
        
    # Handle missing values
    if imputation_strategy == "drop":
        df_clean = df_clean.dropna(subset=selected_features).reset_index(drop=True)
    else:
        for col in selected_features:
            if col in df_clean.columns and df_clean[col].isnull().sum() > 0:
                if imputation_strategy == "mean":
                    fill_val = df_clean[col].mean()
                elif imputation_strategy == "median":
                    fill_val = df_clean[col].median()
                elif imputation_strategy == "mode":
                    fill_val = df_clean[col].mode()[0]
                else:
                    fill_val = 0
                df_clean[col] = df_clean[col].fillna(fill_val)
                
    # Ensure selected features exist and are numeric
    feat_df = df_clean[selected_features].copy()
    for col in selected_features:
        feat_df[col] = pd.to_numeric(feat_df[col], errors='coerce').fillna(0)
        
    # Fit StandardScaler
    scaler = StandardScaler()
    scaled_array = scaler.fit_transform(feat_df)
    
    return df_clean, feat_df, scaled_array, scaler
