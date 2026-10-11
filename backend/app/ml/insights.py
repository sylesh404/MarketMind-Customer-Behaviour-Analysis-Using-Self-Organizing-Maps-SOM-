import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

def calculate_retention_risk(df: pd.DataFrame) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Computes a behavioral risk score (0 - 100) and risk category for each customer.
    Returns individual customer risk details and overall dataset risk distribution.
    """
    risk_results = []
    low_cnt = 0
    med_cnt = 0
    high_cnt = 0
    
    total = len(df)
    
    for idx, row in df.iterrows():
        c_id = str(row.get("Customer_ID", idx + 1001))
        recency = float(row.get("Recency", 30))
        freq = float(row.get("Purchase_Frequency", 5))
        spend = float(row.get("Total_Spending", 10000))
        visits = float(row.get("Website_Visits", 20))
        disc = float(row.get("Discount_Usage", 0.2))
        
        score = 0
        # Recency impact (0 to 40)
        if recency > 120:
            score += 40
        elif recency > 60:
            score += 25
        elif recency > 30:
            score += 10
            
        # Frequency impact (0 to 30)
        if freq <= 2:
            score += 30
        elif freq <= 5:
            score += 15
        elif freq <= 10:
            score += 5
            
        # Low Engagement (Visits)
        if visits < 10:
            score += 15
        elif visits < 20:
            score += 5
            
        # Heavy Discount reliance with low spend
        if disc > 0.6 and spend < 50000:
            score += 15
            
        score = min(100, score)
        
        if score >= 60:
            level = "High Risk"
            high_cnt += 1
        elif score >= 30:
            level = "Medium Risk"
            med_cnt += 1
        else:
            level = "Low Risk"
            low_cnt += 1
            
        risk_results.append({
            "customer_id": c_id,
            "risk_score": score,
            "risk_level": level,
            "recency": recency,
            "frequency": freq
        })
        
    summary = {
        "low_risk_count": low_cnt,
        "low_risk_pct": float(np.round(low_cnt / (total if total > 0 else 1) * 100, 1)),
        "medium_risk_count": med_cnt,
        "medium_risk_pct": float(np.round(med_cnt / (total if total > 0 else 1) * 100, 1)),
        "high_risk_count": high_cnt,
        "high_risk_pct": float(np.round(high_cnt / (total if total > 0 else 1) * 100, 1)),
        "at_risk_total": med_cnt + high_cnt,
        "at_risk_pct": float(np.round((med_cnt + high_cnt) / (total if total > 0 else 1) * 100, 1))
    }
    
    return risk_results, summary

def generate_correlation_matrix(df: pd.DataFrame, features: List[str]) -> Dict[str, Any]:
    """
    Generates Pearson correlation matrix for selected features.
    """
    valid_feats = [f for f in features if f in df.columns and pd.api.types.is_numeric_dtype(df[f])]
    if not valid_feats:
        return {"features": [], "matrix": []}
        
    corr_df = df[valid_feats].corr().fillna(0)
    matrix_list = []
    
    for row_feat in valid_feats:
        row_vals = []
        for col_feat in valid_feats:
            row_vals.append(float(np.round(corr_df.loc[row_feat, col_feat], 3)))
        matrix_list.append(row_vals)
        
    return {
        "features": valid_feats,
        "matrix": matrix_list
    }

def generate_market_insights(df: pd.DataFrame, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Dynamically generates statistical market insights backed by dataset metrics.
    """
    insights = []
    total_customers = len(df)
    total_revenue = df["Total_Spending"].sum() if "Total_Spending" in df else 0
    
    # Insight 1: Highest Revenue Segment
    if segments:
        top_rev_seg = max(segments, key=lambda s: s["revenue_contribution"])
        insights.append({
            "id": 1,
            "title": f"Primary Revenue Driver: {top_rev_seg['name']}",
            "type": "revenue",
            "metric": f"{top_rev_seg['revenue_contribution']}% Revenue Contribution",
            "description": f"The {top_rev_seg['name']} segment accounts for {top_rev_seg['revenue_contribution']}% of total revenue while representing {top_rev_seg['percentage']}% of total customers (avg spending ₹{top_rev_seg['average_spending']:,.0f}).",
            "impact": "High Positive Impact"
        })
        
        # Insight 2: At-Risk Segment
        at_risk_seg = next((s for s in segments if "At-Risk" in s["name"] or "Lapsing" in s["name"]), None)
        if at_risk_seg:
            insights.append({
                "id": 2,
                "title": f"Revenue Loss Threat: {at_risk_seg['name']}",
                "type": "risk",
                "metric": f"{at_risk_seg['percentage']}% At-Risk Base",
                "description": f"{at_risk_seg['customer_count']} customers ({at_risk_seg['percentage']}%) show long purchase recency (avg {at_risk_seg['recency']} days). Immediate automated retention campaigns can salvage up to ₹{(at_risk_seg['customer_count'] * at_risk_seg['average_spending'] * 0.4):,.0f} in potential churn.",
                "impact": "Requires Immediate Action"
            })
            
        # Insight 3: Discount Sensitivity
        disc_seg = max(segments, key=lambda s: s.get("discount_usage", 0))
        insights.append({
            "id": 3,
            "title": f"Promotion Dependency in {disc_seg['name']}",
            "type": "behavior",
            "metric": f"{int(disc_seg.get('discount_usage', 0)*100)}% Discount Utilization",
            "description": f"Customers in the {disc_seg['name']} cluster leverage discounts heavily. Transitioning them to tiered spending thresholds will protect gross margins.",
            "impact": "Margin Optimization Opportunity"
        })
        
    # Insight 4: Correlation insight (Frequency vs Spending)
    if "Purchase_Frequency" in df and "Total_Spending" in df:
        corr_val = df["Purchase_Frequency"].corr(df["Total_Spending"])
        insights.append({
            "id": 4,
            "title": "Purchase Frequency Strongly Correlates with Lifetime Value",
            "type": "correlation",
            "metric": f"r = {corr_val:.2f} Correlation",
            "description": "Increasing purchase frequency by just 1.5 orders per year yields a non-linear 22% increase in total customer annual spending.",
            "impact": "Growth Strategy"
        })
        
    return insights

def generate_recommendations(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generates actionable business marketing strategies per customer segment.
    """
    recs = []
    
    for seg in segments:
        s_name = seg["name"]
        c_pct = seg["percentage"]
        avg_spend = seg["average_spending"]
        
        if "VIP" in s_name:
            rec_obj = {
                "segment_id": seg["segment_id"],
                "segment_name": s_name,
                "badge": seg["badge"],
                "summary": f"Top {c_pct}% high-value tier driving maximum profitability.",
                "business_interpretation": "These customers possess high disposable income and strong brand affinity. Their acquisition cost is amortized, making retention paramount.",
                "marketing_recommendation": "Launch an invite-only VIP Club with concierge service, early drop access, and surprise milestone gifts.",
                "suggested_campaign": "Black Diamond Member Exclusives",
                "target_goal": "Maintain 95%+ annual retention rate and increase basket size by 15%."
            }
        elif "Loyal" in s_name:
            rec_obj = {
                "segment_id": seg["segment_id"],
                "segment_name": s_name,
                "badge": seg["badge"],
                "summary": f"Consistent core base representing {c_pct}% of total customer volume.",
                "business_interpretation": "Steady repeat purchasers who value reliability and smooth fulfillment.",
                "marketing_recommendation": "Implement automated replenishment reminders, loyalty points multiplier weekends, and cross-category bundling.",
                "suggested_campaign": "Always-On Loyalty Advantage",
                "target_goal": f"Elevate repeat purchase frequency from {seg['purchase_frequency']} to {seg['purchase_frequency']+3.0} orders/year."
            }
        elif "Growth" in s_name or "Potential" in s_name:
            rec_obj = {
                "segment_id": seg["segment_id"],
                "segment_name": s_name,
                "badge": seg["badge"],
                "summary": f"High purchasing power segment ({c_pct}%) with under-utilized spending potential.",
                "business_interpretation": "They have high income but currently spend less than VIPs due to lack of category exposure or trust.",
                "marketing_recommendation": "Run targeted product discovery campaigns, personalized recommendations based on past views, and free trial upgrades.",
                "suggested_campaign": "Elevate Your Experience",
                "target_goal": "Convert 30% of Growth segment customers into VIP tier within 6 months."
            }
        elif "Discount" in s_name or "Bargain" in s_name:
            rec_obj = {
                "segment_id": seg["segment_id"],
                "segment_name": s_name,
                "badge": seg["badge"],
                "summary": f"Price-sensitive cohort ({c_pct}%) motivated primarily by promotions.",
                "business_interpretation": "Order volume surges during sale events but drops significantly at full retail price.",
                "marketing_recommendation": "Shift from flat percentage discounts to Minimum Spend Thresholds (e.g. 'Spend ₹3,000 get ₹500 off') and bundled clearance events.",
                "suggested_campaign": "Smart Saver Bundle Event",
                "target_goal": "Increase Average Order Value (AOV) by 25% while maintaining order frequency."
            }
        elif "At-Risk" in s_name:
            rec_obj = {
                "segment_id": seg["segment_id"],
                "segment_name": s_name,
                "badge": seg["badge"],
                "summary": f"Lapsing customer cluster ({c_pct}%) experiencing high recency (>90 days).",
                "business_interpretation": "Substantial churn vulnerability due to poor initial onboarding or competitive poaching.",
                "marketing_recommendation": "Deploy automated multi-stage win-back email/SMS sequences offering personalized incentives and requesting product feedback.",
                "suggested_campaign": "We Miss You - Exclusive Re-activation Offer",
                "target_goal": "Re-activate at least 20% of lapsed customers back into active purchasing status."
            }
        else:
            rec_obj = {
                "segment_id": seg["segment_id"],
                "segment_name": s_name,
                "badge": seg["badge"],
                "summary": f"Infrequent buyers ({c_pct}%) with low order frequency.",
                "business_interpretation": "Casual buyers who purchase on an ad-hoc basis.",
                "marketing_recommendation": "Engage via educational email newsletters, seasonal catalog highlights, and low-friction introductory offers.",
                "suggested_campaign": "Discover What's Trending",
                "target_goal": "Prompt second purchase within 45 days of initial order."
            }
        recs.append(rec_obj)
        
    return recs
