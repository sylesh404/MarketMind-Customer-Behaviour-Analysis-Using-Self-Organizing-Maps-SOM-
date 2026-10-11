import requests
import json
import os
import sys

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api"

print("==================================================")
print("  MARKETMIND END-TO-END GROQ AI INTEGRATION TEST  ")
print("==================================================")

# Step 1: Verify AI Status
print("\n[STEP 1] Testing /insights/ai-status...")
res = requests.get(f"{BASE_URL}/insights/ai-status")
assert res.status_code == 200, f"Failed status: {res.status_code}"
ai_status = res.json()
print("AI Status:", json.dumps(ai_status, indent=2))
assert ai_status.get("available") is True
assert ai_status.get("provider") == "Groq"

# Step 2: Upload Dataset
print("\n[STEP 2] Testing /dataset/upload...")
dataset_path = r"c:\Users\Sakthi sylesh\Downloads\Market Customer Behaviour Analysis using SOM\data\sample_customers.csv"
with open(dataset_path, "rb") as f:
    files = {"file": ("sample_customers.csv", f, "text/csv")}
    res = requests.post(f"{BASE_URL}/dataset/upload", files=files)
assert res.status_code == 200, f"Upload failed: {res.status_code}, {res.text}"
ds_data = res.json()
dataset_id = ds_data["id"]
print(f"Dataset uploaded successfully! ID: {dataset_id}, Rows: {ds_data['row_count']}")

# Step 3: Train SOM Model
print("\n[STEP 3] Testing /som/train...")
numeric_features = [c for c in ds_data["validation"]["numeric_columns"] if c != "Customer_ID"]
train_payload = {
    "dataset_id": dataset_id,
    "features": numeric_features,
    "config": {
        "grid_width": 6,
        "grid_height": 6,
        "learning_rate": 0.5,
        "iterations": 1000,
        "neighborhood_func": "gaussian",
        "n_clusters": 4,
        "imputation_strategy": "mean"
    }
}
res = requests.post(f"{BASE_URL}/som/train", json=train_payload)
assert res.status_code == 200, f"SOM training failed: {res.status_code}, {res.text}"
som_result = res.json()
analysis_id = som_result["analysis_id"]
print(f"SOM Model Trained! Analysis ID: {analysis_id}")
print(f"Quantization Error: {som_result.get('quantization_error')}, Topographic Error: {som_result.get('topographic_error')}")

# Step 4: Test Insights with Groq AI Enhancement
print("\n[STEP 4] Testing /insights/{analysis_id} (Groq AI synthesis)...")
res = requests.get(f"{BASE_URL}/insights/{analysis_id}")
assert res.status_code == 200, f"Insights failed: {res.status_code}"
insights_data = res.json()
print("AI Enhanced:", insights_data.get("ai_enhanced"))
print("AI Provider:", insights_data.get("ai_provider"))
print("AI Model:", insights_data.get("ai_model"))
insights_list = insights_data.get("market_insights", [])
print(f"Total Market Insights: {len(insights_list)}")
for idx, ins in enumerate(insights_list[:2]):
    print(f"  Insight {idx+1}: [{ins.get('impact')}] {ins.get('title')} -> {ins.get('metric')}")
    print(f"    AI Generated: {ins.get('ai_generated', False)}")

# Step 5: Test Groq AI Analyst Copilot Query
print("\n[STEP 5] Testing /insights/{analysis_id}/ask (Groq AI Copilot)...")
ask_payload = {
    "query": "Which customer segment represents the highest margin opportunity and what 2 retention tactics should we apply?"
}
res = requests.post(f"{BASE_URL}/insights/{analysis_id}/ask", json=ask_payload)
assert res.status_code == 200, f"Ask AI failed: {res.status_code}"
copilot_res = res.json()
print("Copilot Model:", copilot_res.get("model"))
print("Copilot Provider:", copilot_res.get("provider"))
print("Copilot Answer Snippet:")
print(copilot_res.get("answer")[:350] + "...\n")

# Step 6: Test Recommendations with Groq AI
print("\n[STEP 6] Testing /recommendations/{analysis_id} (Groq AI marketing playbooks)...")
res = requests.get(f"{BASE_URL}/recommendations/{analysis_id}")
assert res.status_code == 200, f"Recommendations failed: {res.status_code}"
recs_data = res.json()
recs_list = recs_data.get("recommendations", [])
print(f"Total Segment Recommendations: {len(recs_list)}")
print("AI Enhanced:", recs_data.get("ai_enhanced"))
for rec in recs_list[:2]:
    print(f"  Segment: {rec.get('segment_name')} (Badge: {rec.get('badge')})")
    print(f"  Campaign: {rec.get('suggested_campaign')} | Target: {rec.get('target_goal')}")
    print(f"  AI Generated: {rec.get('ai_generated', False)}")

# Step 7: Test PDF Report Generation with AI Executive Summary
print("\n[STEP 7] Testing /report/generate-pdf (PDF with Groq AI Summary)...")
pdf_payload = {"analysis_id": analysis_id, "include_plots": True}
res = requests.post(f"{BASE_URL}/report/generate-pdf", json=pdf_payload)
assert res.status_code == 200, f"PDF generation failed: {res.status_code}"
pdf_bytes = len(res.content)
print(f"PDF Report generated successfully! Size: {pdf_bytes:,} bytes")

print("\n==================================================")
print("  ALL 7 TESTS PASSED SUCCESSFULLY! GROQ AI FULLY ACTIVE ")
print("==================================================")
