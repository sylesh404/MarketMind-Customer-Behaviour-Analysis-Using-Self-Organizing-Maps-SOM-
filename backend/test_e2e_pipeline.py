import sys
import os
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_full_pipeline():
    print("[1] Testing Health / API root...")
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print(" -> Root OK:", res.json())

    print("\n[2] Loading Demo Dataset...")
    res = requests.post(f"{BASE_URL}/api/dataset/load-demo")
    assert res.status_code == 200, f"Demo load failed: {res.text}"
    demo_data = res.json()
    dataset_id = demo_data.get("id") or demo_data.get("dataset_id")
    row_count = demo_data["validation"]["row_count"]
    num_cols = demo_data["validation"]["numeric_columns"]
    print(f" -> Dataset ID: {dataset_id}, Rows: {row_count}, Numeric cols: {len(num_cols)}")
    assert row_count == 1000, f"Expected 1000 rows, got {row_count}"

    print("\n[3] Preprocessing Dataset...")
    prep_payload = {
        "dataset_id": dataset_id,
        "imputation_strategy": "median",
        "remove_duplicates": True,
        "selected_features": [c for c in num_cols if c != "Customer_ID"]
    }
    res = requests.post(f"{BASE_URL}/api/preprocess", json=prep_payload)
    assert res.status_code == 200, f"Preprocess failed: {res.text}"
    prep_data = res.json()
    preprocessed_id = prep_data["preprocessed_id"]
    print(f" -> Preprocessed ID: {preprocessed_id}, Clean rows: {prep_data['cleaned_rows']}")

    print("\n[4] Training Self-Organizing Map (SOM)...")
    som_payload = {
        "preprocessed_id": preprocessed_id,
        "grid_x": 10,
        "grid_y": 10,
        "learning_rate": 0.5,
        "iterations": 1000, # fast test
        "neighborhood_function": "gaussian",
        "n_clusters": 6
    }
    res = requests.post(f"{BASE_URL}/api/som/train", json=som_payload)
    assert res.status_code == 200, f"SOM train failed: {res.text}"
    train_data = res.json()
    analysis_id = train_data["analysis_id"]
    metrics = train_data["metrics"]
    print(f" -> Analysis ID: {analysis_id}")
    print(f" -> Quantization Error: {metrics['quantization_error']:.4f}")
    print(f" -> Topographic Error: {metrics['topographic_error']:.4f}")
    print(f" -> Segments Generated: {len(train_data['segments'])}")
    for seg in train_data["segments"]:
        print(f"    - [{seg['segment_id']}] {seg['name']}: {seg['customer_count']} customers ({seg['customer_percentage']}%), Avg Spend: {seg.get('avg_spending', 0)}")

    print("\n[5] Fetching U-Matrix...")
    res = requests.get(f"{BASE_URL}/api/som/{analysis_id}/umatrix")
    assert res.status_code == 200, f"U-Matrix failed: {res.text}"
    umatrix_data = res.json()
    print(f" -> U-Matrix Grid Size: {len(umatrix_data['umatrix'])}x{len(umatrix_data['umatrix'][0])}")
    print(f" -> Node Customer Counts Present: {'node_customer_counts' in umatrix_data}")

    print("\n[6] Testing Reclustering (n_clusters = 5)...")
    recluster_payload = {
        "n_clusters": 5,
        "linkage": "ward"
    }
    res = requests.post(f"{BASE_URL}/api/segments/{analysis_id}/recluster", json=recluster_payload)
    assert res.status_code == 200, f"Reclustering failed: {res.text}"
    recluster_data = res.json()
    print(f" -> Recluster Segments count: {len(recluster_data['segments'])}")
    print(f" -> Node segment matrix returned: {'node_segment_matrix' in recluster_data}")
    print(f" -> Risk summary returned: {'risk_summary' in recluster_data}")
    print(f" -> Dynamic names: {[s['name'] for s in recluster_data['segments']]}")

    print("\n[7] Fetching Customers and Customer Detail...")
    res = requests.get(f"{BASE_URL}/api/customers/{analysis_id}")
    assert res.status_code == 200, f"Customer roster failed: {res.text}"
    customers = res.json()["customers"]
    first_cust_id = customers[0]["Customer_ID"]
    print(f" -> Total customers returned: {len(customers)}, First Customer: {first_cust_id}")

    res = requests.get(f"{BASE_URL}/api/customers/detail/{first_cust_id}?analysis_id={analysis_id}")
    assert res.status_code == 200, f"Customer detail failed: {res.text}"
    detail = res.json()
    print(f" -> Customer {first_cust_id} BMU: ({detail['bmu_x']}, {detail['bmu_y']}), Segment: {detail['segment_name']}, Risk: {detail['risk_level']} ({detail['risk_score']})")

    print("\n[8] Fetching Insights and Recommendations...")
    res = requests.get(f"{BASE_URL}/api/insights/{analysis_id}")
    assert res.status_code == 200, f"Insights failed: {res.text}"
    insights = res.json().get("insights", [])
    print(f" -> Generated Insights: {len(insights)}")
    for ins in insights[:3]:
        desc = ins.get('description', '').replace('₹', 'Rs.')
        print(f"    * [{ins.get('type')}] {ins.get('title')}: {desc}")

    res = requests.get(f"{BASE_URL}/api/recommendations/{analysis_id}")
    assert res.status_code == 200, f"Recommendations failed: {res.text}"
    recs = res.json().get("recommendations", [])
    print(f" -> Generated Segment Recommendations: {len(recs)}")

    print("\n[9] Testing Report Generation (PDF, CSV, JSON)...")
    # PDF
    pdf_res = requests.post(f"{BASE_URL}/api/report/generate-pdf", json={"analysis_id": analysis_id, "include_plots": True})
    assert pdf_res.status_code == 200, f"PDF generation failed: {pdf_res.text}"
    assert len(pdf_res.content) > 1000, "PDF content is too small"
    print(f" -> PDF Generated successfully: {len(pdf_res.content)} bytes (Header: {pdf_res.content[:4]})")

    # CSV
    csv_res = requests.get(f"{BASE_URL}/api/report/export-csv/{analysis_id}")
    assert csv_res.status_code == 200, f"CSV export failed: {csv_res.text}"
    csv_lines = csv_res.text.strip().split("\n")
    print(f" -> CSV Exported successfully: {len(csv_lines)} lines, Header: {csv_lines[0]}")

    # JSON
    json_res = requests.get(f"{BASE_URL}/api/report/export-json/{analysis_id}")
    assert json_res.status_code == 200, f"JSON export failed: {json_res.text}"
    json_obj = json_res.json()
    print(f" -> JSON Exported successfully: keys = {list(json_obj.keys())}")

    print("\n==========================================")
    print("ALL TESTS PASSED! FULL PIPELINE VERIFIED!")
    print("==========================================")

if __name__ == "__main__":
    test_full_pipeline()
