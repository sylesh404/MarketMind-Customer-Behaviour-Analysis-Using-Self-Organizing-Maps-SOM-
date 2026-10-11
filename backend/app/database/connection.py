import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "marketmind.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Datasets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        row_count INTEGER NOT NULL,
        column_count INTEGER NOT NULL,
        columns_json TEXT NOT NULL,
        data_json TEXT NOT NULL
    );
    """)
    
    # Preprocessed Datasets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS preprocessed_datasets (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        selected_features_json TEXT NOT NULL,
        imputation_strategy TEXT NOT NULL,
        removed_duplicates INTEGER NOT NULL,
        data_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(dataset_id) REFERENCES datasets(id)
    );
    """)
    
    # Analyses Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        grid_width INTEGER NOT NULL,
        grid_height INTEGER NOT NULL,
        learning_rate REAL NOT NULL,
        iterations INTEGER NOT NULL,
        neighborhood_func TEXT NOT NULL,
        quantization_error REAL NOT NULL,
        topographic_error REAL NOT NULL,
        umatrix_json TEXT NOT NULL,
        weights_json TEXT NOT NULL,
        features_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(dataset_id) REFERENCES datasets(id)
    );
    """)
    
    # Customer Results Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customer_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        bmu_x INTEGER NOT NULL,
        bmu_y INTEGER NOT NULL,
        distance REAL NOT NULL,
        segment_id INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        risk_score REAL DEFAULT 0,
        raw_features_json TEXT NOT NULL,
        FOREIGN KEY(analysis_id) REFERENCES analyses(id)
    );
    """)

    # Check if risk_score exists in existing customer_results table
    cursor.execute("PRAGMA table_info(customer_results);")
    columns = [col[1] for col in cursor.fetchall()]
    if "risk_score" not in columns:
        try:
            cursor.execute("ALTER TABLE customer_results ADD COLUMN risk_score REAL DEFAULT 0;")
        except Exception:
            pass
    
    # Segments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id TEXT NOT NULL,
        segment_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        customer_count INTEGER NOT NULL,
        percentage REAL NOT NULL,
        average_spending REAL NOT NULL,
        average_income REAL NOT NULL,
        purchase_frequency REAL NOT NULL,
        recency REAL NOT NULL,
        revenue_contribution REAL NOT NULL,
        description TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        metrics_json TEXT NOT NULL,
        FOREIGN KEY(analysis_id) REFERENCES analyses(id)
    );
    """)
    
    # Performance Indexes for handling 50k+ records
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cust_analysis ON customer_results(analysis_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cust_id ON customer_results(analysis_id, customer_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cust_segment ON customer_results(analysis_id, segment_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_seg_analysis ON segments(analysis_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_prep_dataset ON preprocessed_datasets(dataset_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_dataset ON analyses(dataset_id);")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
