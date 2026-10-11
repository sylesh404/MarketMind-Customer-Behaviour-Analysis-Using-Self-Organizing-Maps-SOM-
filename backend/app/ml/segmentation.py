import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering
from typing import Dict, Any, List, Tuple

def cluster_som_grid(
    som_weights: List[List[List[float]]],
    df_customers: pd.DataFrame,
    bmu_results: List[Dict[str, Any]],
    selected_features: List[str],
    n_clusters: int = 6,
    linkage: str = "ward"
) -> Dict[str, Any]:
    """
    Clusters SOM node codebook vectors into n_clusters segments using Agglomerative Clustering.
    Maps customers to segments and computes statistical properties + dynamic names.
    """
    weights_arr = np.array(som_weights) # (grid_w, grid_h, num_features)
    grid_w, grid_h, n_feats = weights_arr.shape
    
    # Flatten grid to (grid_w * grid_h, n_feats)
    flat_weights = weights_arr.reshape(-1, n_feats)
    
    # Cluster neurons
    clustering = AgglomerativeClustering(
        n_clusters=min(n_clusters, grid_w * grid_h),
        linkage=linkage if linkage in ["ward", "complete", "average", "single"] else "ward"
    )
    flat_labels = clustering.fit_predict(flat_weights)
    
    # Reshape node labels back to 2D grid matrix
    node_segment_matrix = flat_labels.reshape(grid_w, grid_h).tolist()
    
    # Assign segment ID to each customer
    df_augmented = df_customers.copy()
    segment_ids_col = []
    
    for item in bmu_results:
        bmu_x = item["bmu_x"]
        bmu_y = item["bmu_y"]
        seg_id = int(node_segment_matrix[bmu_x][bmu_y])
        segment_ids_col.append(seg_id)
        
    df_augmented["Segment_ID"] = segment_ids_col
    
    # Overall Dataset Averages for relative scoring
    avg_income_global = float(df_augmented["Annual_Income"].mean()) if "Annual_Income" in df_augmented else 1.0
    avg_spend_global = float(df_augmented["Total_Spending"].mean()) if "Total_Spending" in df_augmented else 1.0
    avg_freq_global = float(df_augmented["Purchase_Frequency"].mean()) if "Purchase_Frequency" in df_augmented else 1.0
    avg_recency_global = float(df_augmented["Recency"].mean()) if "Recency" in df_augmented else 1.0
    avg_disc_global = float(df_augmented["Discount_Usage"].mean()) if "Discount_Usage" in df_augmented else 0.2
    avg_visits_global = float(df_augmented["Website_Visits"].mean()) if "Website_Visits" in df_augmented else 20.0
    total_rev_global = float(df_augmented["Total_Spending"].sum()) if "Total_Spending" in df_augmented else 1.0
    
    total_customers = len(df_augmented)
    
    segments_summary = []
    
    for seg_id in range(n_clusters):
        seg_df = df_augmented[df_augmented["Segment_ID"] == seg_id]
        c_count = len(seg_df)
        if c_count == 0:
            continue
            
        c_pct = float(np.round((c_count / total_customers) * 100, 1))
        
        # Calculate Segment Averages
        avg_income = float(np.round(seg_df["Annual_Income"].mean(), 0)) if "Annual_Income" in seg_df else 0.0
        avg_total_spend = float(np.round(seg_df["Total_Spending"].mean(), 0)) if "Total_Spending" in seg_df else 0.0
        avg_spend_score = float(np.round(seg_df["Spending_Score"].mean(), 1)) if "Spending_Score" in seg_df else 0.0
        avg_freq = float(np.round(seg_df["Purchase_Frequency"].mean(), 1)) if "Purchase_Frequency" in seg_df else 0.0
        avg_recency = float(np.round(seg_df["Recency"].mean(), 1)) if "Recency" in seg_df else 0.0
        avg_aov = float(np.round(seg_df["Average_Order_Value"].mean(), 0)) if "Average_Order_Value" in seg_df else 0.0
        avg_disc = float(np.round(seg_df["Discount_Usage"].mean(), 2)) if "Discount_Usage" in seg_df else 0.0
        avg_visits = float(np.round(seg_df["Website_Visits"].mean(), 1)) if "Website_Visits" in seg_df else 0.0
        
        seg_rev_sum = float(seg_df["Total_Spending"].sum()) if "Total_Spending" in seg_df else 0.0
        rev_contrib = float(np.round((seg_rev_sum / (total_rev_global if total_rev_global > 0 else 1.0)) * 100, 1))
        
        # Dynamic Behavioral Segment Naming
        spend_ratio = avg_total_spend / (avg_spend_global if avg_spend_global > 0 else 1.0)
        freq_ratio = avg_freq / (avg_freq_global if avg_freq_global > 0 else 1.0)
        income_ratio = avg_income / (avg_income_global if avg_income_global > 0 else 1.0)
        recency_ratio = avg_recency / (avg_recency_global if avg_recency_global > 0 else 1.0)
        disc_ratio = avg_disc / (avg_disc_global if avg_disc_global > 0 else 1.0)
        visits_ratio = avg_visits / (avg_visits_global if avg_visits_global > 0 else 1.0)
        
        # Hierarchical archetype determination
        if spend_ratio >= 1.2 and freq_ratio >= 1.15:
            base_name = "VIP High Spenders"
            base_badge = "👑 VIP"
            desc = "High-spending, high-frequency customers generating top-tier customer lifetime value."
            rec = "Premium loyalty rewards, early product access, and dedicated concierge support."
        elif freq_ratio >= 1.1 and recency_ratio <= 0.88:
            base_name = "Loyal Steady Buyers"
            base_badge = "🎯 Loyal"
            desc = "Consistent repeat purchasers with low recency and high brand dependability."
            rec = "Automated replenishment reminders, points multiplier events, and cross-category discovery."
        elif (income_ratio >= 1.1 or visits_ratio >= 1.2) and spend_ratio < 1.05:
            base_name = "Potential Growth"
            base_badge = "⚡ Growth"
            desc = "High purchasing power or strong digital engagement with room for basket expansion."
            rec = "Personalized upselling, exclusive trial upgrades, and premium recommendations."
        elif disc_ratio >= 1.25 or avg_disc >= 0.45:
            base_name = "Discount Hunters"
            base_badge = "🏷️ Bargain"
            desc = "Price-sensitive buyers whose purchase volume is heavily motivated by promotions."
            rec = "Bundle offers, minimum-spend thresholds, and clearance event incentives to protect margins."
        elif recency_ratio >= 1.3 or avg_recency >= 90:
            base_name = "At-Risk / Lapsing"
            base_badge = "⚠️ At-Risk"
            desc = "Customers with extended purchase recency and declining interaction frequency."
            rec = "Win-back sequences, feedback surveys, and targeted reactivation incentives."
        elif spend_ratio <= 0.85 and freq_ratio <= 0.85:
            base_name = "Occasional Low Spenders"
            base_badge = "📦 Occasional"
            desc = "Infrequent purchasers with modest transaction amounts and low baseline engagement."
            rec = "Low-friction introductory offers, seasonal highlights, and popular category retargeting."
        else:
            base_name = f"Segment {seg_id + 1}"
            base_badge = f"📊 S{seg_id + 1}"
            desc = "Balanced customer cohort exhibiting moderate engagement and purchasing behavior."
            rec = "Standard marketing communications and ongoing transactional monitoring."

        # Prevent duplicate identical segment names across clusters
        existing_matches = [s["name"] for s in segments_summary if s["name"].startswith(base_name)]
        if existing_matches:
            name = f"{base_name} (Tier {len(existing_matches) + 1})"
            badge = base_badge
        else:
            name = base_name
            badge = base_badge
            
        segments_summary.append({
            "segment_id": seg_id,
            "name": name,
            "badge": badge,
            "customer_count": c_count,
            "percentage": c_pct,
            "customer_percentage": c_pct,
            "average_spending": avg_total_spend,
            "avg_spending": avg_total_spend,
            "average_spending_score": avg_spend_score,
            "average_income": avg_income,
            "purchase_frequency": avg_freq,
            "recency": avg_recency,
            "average_order_value": avg_aov,
            "discount_usage": avg_disc,
            "website_visits": avg_visits,
            "revenue_contribution": rev_contrib,
            "description": desc,
            "recommendation": rec
        })
        
    return {
        "node_segment_matrix": node_segment_matrix,
        "segments": segments_summary,
        "df_augmented": df_augmented
    }
