# REST API Reference & Endpoint Specification

The **MarketMind** backend exposes a structured, asynchronous REST API via FastAPI at `http://localhost:8000/api`. Interactive OpenAPI (Swagger) documentation is accessible at `http://localhost:8000/docs`.

---

## 1. Global Specifications

- **Base URL**: `http://localhost:8000/api`
- **Content Type**: `application/json` (except file upload endpoints which use `multipart/form-data`, and report downloads which use `application/pdf` or `text/csv`)
- **CORS Policy**: Configured to accept all origins (`allow_origins=["*"]`) for local frontend development.
- **Error Format**:
  ```json
  {
    "detail": "Descriptive error message"
  }
  ```

---

## 2. Dataset Endpoints (`/api/dataset`)

### 2.1 Load Demo Dataset
Provisions a 1,000-sample synthetic customer dataset featuring 6 pre-configured behavioral archetypes.

- **Method**: `POST`
- **Endpoint**: `/api/dataset/load-demo`
- **Request Body**: None
- **Response**: `200 OK`
  ```json
  {
    "id": "e3b0c442-98fc-1c14-9afb-4c7fae937367",
    "filename": "sample_customers.csv",
    "row_count": 1000,
    "column_count": 14,
    "columns": [
      "Customer_ID", "Age", "Gender", "Annual_Income",
      "Spending_Score", "Purchase_Frequency", "Total_Spending",
      "Average_Order_Value", "Recency", "Website_Visits",
      "Discount_Usage", "Number_of_Orders", "Customer_Lifetime_Value", "Archetype"
    ],
    "validation": {
      "total_rows": 1000,
      "total_cols": 14,
      "total_missing": 0,
      "missing_percentage": 0.0,
      "duplicate_rows": 0,
      "numeric_columns": ["Age", "Annual_Income", "Spending_Score", "..."],
      "categorical_columns": ["Gender", "Archetype"],
      "constant_columns": [],
      "column_details": [
        {
          "name": "Age",
          "type": "int64",
          "missing_count": 0,
          "missing_pct": 0.0,
          "unique_count": 48,
          "is_numeric": true
        }
      ]
    },
    "preview": [
      {
        "Customer_ID": 1001,
        "Age": 45,
        "Gender": "Female",
        "Annual_Income": 1850000,
        "Spending_Score": 88
      }
    ]
  }
  ```

---

### 2.2 Upload Custom Dataset
Uploads a custom CSV or Excel file for analysis.

- **Method**: `POST`
- **Endpoint**: `/api/dataset/upload`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: Binary file (`.csv`, `.xlsx`, or `.xls`)
- **Response**: `200 OK` (Same schema as `/load-demo`)
- **Errors**:
  - `400 Bad Request`: Unsupported file type.

---

### 2.3 Get Dataset Details
Retrieves metadata and validation stats for a previously uploaded dataset.

- **Method**: `GET`
- **Endpoint**: `/api/dataset/{dataset_id}`
- **Path Parameters**:
  - `dataset_id` (string, required): Unique UUID of the dataset.
- **Response**: `200 OK` (Dataset object)
- **Errors**:
  - `404 Not Found`: Dataset ID does not exist in SQLite.

---

## 3. Preprocessing Endpoints (`/api/preprocess`)

### 3.1 Preprocess Dataset
Applies missing value imputation and removes duplicate rows.

- **Method**: `POST`
- **Endpoint**: `/api/preprocess`
- **Request Body**:
  ```json
  {
    "dataset_id": "e3b0c442-98fc-1c14-9afb-4c7fae937367",
    "selected_features": [
      "Age", "Annual_Income", "Spending_Score", "Purchase_Frequency",
      "Total_Spending", "Average_Order_Value", "Recency", "Website_Visits"
    ],
    "imputation_strategy": "mean",
    "remove_duplicates": true
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "preprocessed_id": "8f8b3c9a-4c21-4f10-b9cb-31295b9d2331",
    "dataset_id": "e3b0c442-98fc-1c14-9afb-4c7fae937367",
    "cleaned_rows": 1000,
    "removed_duplicates": 0,
    "imputation_strategy": "mean",
    "status": "success"
  }
  ```

---

## 4. SOM Training & Visualization Endpoints (`/api/som`)

### 4.1 Train Self-Organizing Map
Executes feature scaling, PCA initialization, batch SOM training, codebook clustering, and customer BMU mapping.

- **Method**: `POST`
- **Endpoint**: `/api/som/train`
- **Request Body**:
  ```json
  {
    "dataset_id": "e3b0c442-98fc-1c14-9afb-4c7fae937367",
    "selected_features": [
      "Age", "Annual_Income", "Spending_Score", "Purchase_Frequency",
      "Total_Spending", "Average_Order_Value", "Recency", "Website_Visits",
      "Discount_Usage", "Customer_Lifetime_Value"
    ],
    "grid_width": 10,
    "grid_height": 10,
    "learning_rate": 0.5,
    "iterations": 10000,
    "neighborhood_func": "gaussian",
    "n_clusters": 6,
    "imputation_strategy": "mean"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "analysis_id": "fa4512b9-399c-4c6e-8e81-cf5e0f76901a",
    "dataset_id": "e3b0c442-98fc-1c14-9afb-4c7fae937367",
    "grid_width": 10,
    "grid_height": 10,
    "learning_rate": 0.5,
    "iterations": 10000,
    "neighborhood_func": "gaussian",
    "quantization_error": 0.4128,
    "topographic_error": 0.0210,
    "umatrix": [
      [0.12, 0.34, 0.56, 0.41, 0.22, 0.15, 0.19, 0.32, 0.45, 0.28],
      ["..."]
    ],
    "features": ["Age", "Annual_Income", "..."],
    "segments": [
      {
        "segment_id": 0,
        "name": "VIP High Spenders",
        "badge": "👑 VIP",
        "customer_count": 150,
        "percentage": 15.0,
        "average_spending": 245000.0,
        "average_income": 1950000.0,
        "purchase_frequency": 22.4,
        "recency": 8.2,
        "revenue_contribution": 38.5,
        "description": "High-income, highly active buyers contributing significantly to top-line revenue.",
        "recommendation": "Provide exclusive white-glove support, early product access, and VIP rewards."
      }
    ]
  }
  ```

---

### 4.2 Get SOM Analysis Results
Retrieves saved metrics and parameters of an existing analysis run.

- **Method**: `GET`
- **Endpoint**: `/api/som/{analysis_id}`
- **Path Parameters**:
  - `analysis_id` (string, required): Unique UUID of the analysis.
- **Response**: `200 OK` (Analysis result object)

---

### 4.3 Get U-Matrix Data
Fetches the 2D inter-neuron distance matrix, customer counts per node, and cluster assignments.

- **Method**: `GET`
- **Endpoint**: `/api/som/{analysis_id}/umatrix`
- **Response**: `200 OK`
  ```json
  {
    "grid_width": 10,
    "grid_height": 10,
    "umatrix": [[0.12, 0.34, "..."]],
    "node_counts": [[12, 5, 0, "..."]],
    "node_segment_matrix": [[0, 0, 1, "..."]]
  }
  ```

---

## 5. Segments Endpoints (`/api/segments`)

### 5.1 Get Segments
Fetches summary statistics, revenue contributions, and recommendations for all clusters in an analysis.

- **Method**: `GET`
- **Endpoint**: `/api/segments/{analysis_id}`
- **Response**: `200 OK`
  ```json
  {
    "analysis_id": "fa4512b9-399c-4c6e-8e81-cf5e0f76901a",
    "segments": [
      {
        "segment_id": 0,
        "name": "VIP High Spenders",
        "badge": "👑 VIP",
        "customer_count": 150,
        "percentage": 15.0,
        "average_spending": 245000.0,
        "revenue_contribution": 38.5
      }
    ]
  }
  ```

---

### 5.2 Dynamic Reclustering
Re-clusters the existing SOM codebook weight vectors into a new number of clusters ($k$) without needing to re-run the 10,000 SOM training iterations.

- **Method**: `POST`
- **Endpoint**: `/api/segments/{analysis_id}/recluster`
- **Request Body**:
  ```json
  {
    "n_clusters": 5
  }
  ```
- **Response**: `200 OK` (Updated segments array and reassigned customer counts)

---

## 6. Customers Endpoints (`/api/customers`)

### 6.1 Query Customers
Fetches a paginated, filterable list of customers for a given analysis.

- **Method**: `GET`
- **Endpoint**: `/api/customers/{analysis_id}`
- **Query Parameters**:
  - `segment_id` (integer, optional): Filter by cluster ID.
  - `risk_level` (string, optional): Filter by `"Low Risk"`, `"Medium Risk"`, or `"High Risk"`.
  - `search` (string, optional): Search by Customer ID substring.
  - `limit` (integer, default: `200`): Maximum records to return.
  - `offset` (integer, default: `0`): Pagination offset.
- **Response**: `200 OK`
  ```json
  {
    "total_count": 1000,
    "returned_count": 200,
    "customers": [
      {
        "Customer_ID": 1001,
        "Age": 45,
        "Annual_Income": 1850000,
        "Spending_Score": 88,
        "Total_Spending": 210000,
        "Recency": 12,
        "bmu_x": 3,
        "bmu_y": 7,
        "distance": 0.2841,
        "segment_id": 0,
        "risk_level": "Low Risk"
      }
    ]
  }
  ```

---

### 6.2 Customer Detail
Fetches full attributes and BMU placement for a single customer.

- **Method**: `GET`
- **Endpoint**: `/api/customers/detail/{customer_id}?analysis_id={analysis_id}`
- **Response**: `200 OK` (Detailed Customer Profile Object)

---

## 7. Insights & Recommendations Endpoints

### 7.1 Get Market Insights & Correlation Matrix
Returns dynamic revenue drivers, churn threats, margin insights, and the Pearson correlation matrix.

- **Method**: `GET`
- **Endpoint**: `/api/insights/{analysis_id}`
- **Response**: `200 OK`
  ```json
  {
    "correlation": {
      "features": ["Age", "Annual_Income", "Spending_Score", "..."],
      "matrix": [
        [1.0, 0.04, -0.12],
        [0.04, 1.0, 0.35],
        ["..."]
      ]
    },
    "market_insights": [
      {
        "id": 1,
        "title": "Primary Revenue Driver: VIP High Spenders",
        "type": "revenue",
        "metric": "38.5% Revenue Contribution",
        "description": "The VIP High Spenders segment accounts for 38.5% of total revenue...",
        "impact": "High Positive Impact"
      }
    ],
    "risk_summary": {
      "low_risk_count": 680,
      "low_risk_pct": 68.0,
      "medium_risk_count": 210,
      "medium_risk_pct": 21.0,
      "high_risk_count": 110,
      "high_risk_pct": 11.0,
      "at_risk_total": 320,
      "at_risk_pct": 32.0
    }
  }
  ```

---

### 7.2 Get Marketing Recommendations
Fetches segment-specific business interpretations, suggested campaigns, and target KPIs.

- **Method**: `GET`
- **Endpoint**: `/api/recommendations/{analysis_id}`
- **Response**: `200 OK`
  ```json
  {
    "recommendations": [
      {
        "segment_id": 0,
        "segment_name": "VIP High Spenders",
        "badge": "👑 VIP",
        "summary": "Top 15.0% high-value tier driving maximum profitability.",
        "business_interpretation": "These customers possess high disposable income and strong brand affinity.",
        "marketing_recommendation": "Launch an invite-only VIP Club with concierge service, early drop access, and surprise milestone gifts.",
        "suggested_campaign": "Black Diamond Member Exclusives",
        "target_goal": "Maintain 95%+ annual retention rate and increase basket size by 15%."
      }
    ]
  }
  ```

---

## 8. Reports & Export Endpoints (`/api/report`)

### 8.1 Download Executive PDF Report
Generates a multi-page, formatted business PDF report compiling analysis parameters, error metrics, segment tables, and recommendations.

- **Method**: `POST`
- **Endpoint**: `/api/report/generate-pdf`
- **Request Body**:
  ```json
  {
    "analysis_id": "fa4512b9-399c-4c6e-8e81-cf5e0f76901a"
  }
  ```
- **Response**: `200 OK`
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="MarketMind_Report.pdf"`

---

### 8.2 Export Enriched Customers CSV
Streams a CSV file containing all customer records with their assigned segment, BMU coordinates, and churn risk level.

- **Method**: `GET`
- **Endpoint**: `/api/report/export-csv/{analysis_id}`
- **Response**: `200 OK`
- **Content-Type**: `text/csv`
- **Content-Disposition**: `attachment; filename="marketmind_customers_analysis.csv"`

---

### 8.3 Export Complete Analysis JSON
Dumps the complete raw analysis schema as a JSON file for integration into external data pipelines.

- **Method**: `GET`
- **Endpoint**: `/api/report/export-json/{analysis_id}`
- **Response**: `200 OK`
- **Content-Type**: `application/json`
