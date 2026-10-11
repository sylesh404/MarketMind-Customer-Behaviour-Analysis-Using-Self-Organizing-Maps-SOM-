import os
import re
from fpdf import FPDF
from typing import Dict, Any, List, Optional

def sanitize_text(text: Any) -> str:
    """
    Sanitizes string to be safely encoded in standard latin-1 Helvetica font in fpdf2.
    Converts Indian Rupee symbol to INR and strips out non-latin1 unicode characters/emojis.
    """
    if text is None:
        return ""
    text_str = str(text)
    # Replace currency symbols
    text_str = text_str.replace("₹", "INR ").replace("–", "-").replace("—", "-").replace("’", "'").replace("“", '"').replace("”", '"')
    # Remove emoji characters (unicode range > 255)
    clean_chars = []
    for ch in text_str:
        if ord(ch) <= 255:
            clean_chars.append(ch)
        else:
            # Replace common badge indicators
            clean_chars.append(" ")
    cleaned = "".join(clean_chars)
    # Collapse consecutive spaces
    return re.sub(r' +', ' ', cleaned).strip()

class SOMReportPDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 15)
        self.set_text_color(30, 41, 59) # Slate 800
        self.cell(0, 9, 'MarketMind - Customer Behaviour Analysis Report', 0, 1, 'C')
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(100, 116, 139) # Slate 500
        self.cell(0, 5, 'Powered by Self-Organizing Maps (SOM) & Hierarchical Clustering', 0, 1, 'C')
        self.ln(3)
        self.set_draw_color(226, 232, 240)
        self.line(10, 24, 200, 24)
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f'Page {self.page_no()} | MarketMind Analytics Platform', 0, 0, 'C')

def generate_pdf_report(
    analysis_info: Dict[str, Any],
    dataset_info: Dict[str, Any],
    segments: List[Dict[str, Any]],
    insights: List[Dict[str, Any]],
    recommendations: List[Dict[str, Any]],
    risk_summary: Dict[str, Any],
    output_path: str,
    ai_executive_summary: Optional[str] = None
) -> str:
    """
    Generates a structured, multi-section executive PDF report containing all 11 analytical sections.
    """
    pdf = SOMReportPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    filename = sanitize_text(dataset_info.get("filename", "Customer_Dataset.csv"))
    row_count = dataset_info.get("row_count", 0)
    col_count = dataset_info.get("column_count", 0)
    gw = analysis_info.get("grid_width", 10)
    gh = analysis_info.get("grid_height", 10)
    lr = analysis_info.get("learning_rate", 0.5)
    iter_cnt = analysis_info.get("iterations", 10000)
    neigh_fn = analysis_info.get("neighborhood_func", "gaussian")
    qe = analysis_info.get("quantization_error", 0.0)
    te = analysis_info.get("topographic_error", 0.0)
    
    # 1. Executive Summary
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, "1. Executive Summary", 0, 1, "L")
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(51, 65, 85)
    if ai_executive_summary:
        pdf.multi_cell(0, 4.5, sanitize_text(ai_executive_summary))
    else:
        pdf.multi_cell(
            0, 4.5,
            f"This report presents an end-to-end behavioural analysis of customer populations utilizing Kohonen Self-Organizing Maps (SOM) "
            f"and Hierarchical Agglomerative Clustering. From {row_count:,} customer profiles, {len(segments)} distinct behavioural archetypes "
            f"were identified, mapped onto a {gw}x{gh} topological lattice, and assessed for behavioural retention churn risk."
        )
    pdf.ln(3)

    # 2. Dataset Information
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, "2. Dataset Information", 0, 1, "L")
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(
        0, 4.5,
        f"Dataset File: {filename}   |   Customer Records: {row_count:,} rows   |   Raw Columns: {col_count}\n"
        f"Validation Status: Cleaned, deduplicated, and normalized via StandardScaler (Mean=0, Variance=1)."
    )
    pdf.ln(3)

    # 3. Selected Features
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, "3. Selected Features for SOM Projection", 0, 1, "L")
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(51, 65, 85)
    feats = ", ".join([sanitize_text(f).replace("_", " ") for f in analysis_info.get("features", [])])
    pdf.multi_cell(0, 4.5, f"Input Dimensions ({len(analysis_info.get('features', []))} features): {feats}")
    pdf.ln(3)

    # 4. SOM Configuration
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, "4. SOM Neural Network Configuration", 0, 1, "L")
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(
        0, 4.5,
        f"Topology Grid: {gw} x {gh} ({gw * gh} total neurons)   |   Initial Learning Rate (alpha): {lr}\n"
        f"Training Epochs / Iterations: {iter_cnt:,}   |   Neighborhood Kernel: {neigh_fn.capitalize()}   |   Weight Init: PCA"
    )
    pdf.ln(3)

    # 5. Quantization Error & 6. Topographic Error
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, "5. Quantization Error & 6. Topographic Error", 0, 1, "L")
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(
        0, 4.5,
        f"* Section 5 - Quantization Error (QE): {qe:.4f} (Average Euclidean distance between input sample and its BMU codebook vector).\n"
        f"* Section 6 - Topographic Error (TE):  {te:.4f} (Proportion of customer vectors whose 1st and 2nd BMUs are non-adjacent)."
    )
    pdf.ln(3)

    # 7. U-Matrix (Unified Distance Matrix)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, "7. U-Matrix (Unified Distance Matrix Topology)", 0, 1, "L")
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(51, 65, 85)
    umatrix = analysis_info.get("umatrix", [])
    if umatrix:
        flat_u = [val for row in umatrix for val in row]
        min_u = min(flat_u) if flat_u else 0.0
        max_u = max(flat_u) if flat_u else 1.0
        avg_u = sum(flat_u) / len(flat_u) if flat_u else 0.5
        u_summary = (
            f"The {gw}x{gh} U-Matrix computes pairwise Euclidean distances between neighboring codebook vectors.\n"
            f"Distance Range: Min = {min_u:.4f}, Mean = {avg_u:.4f}, Max = {max_u:.4f}. Valleys (low values) represent dense behavioral "
            f"customer clusters; ridges (high values) establish clear natural cluster boundaries."
        )
    else:
        u_summary = f"U-Matrix calculated across {gw}x{gh} grid lattice."
    pdf.multi_cell(0, 4.5, u_summary)
    pdf.ln(3)

    # 8. Customer Segments Breakdown
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, f"8. Customer Segments Breakdown (K = {len(segments)})", 0, 1, "L")
    pdf.ln(1)
    
    # Table Header
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(241, 245, 249) # Slate 100
    pdf.set_text_color(30, 41, 59)
    pdf.cell(48, 6, "Segment Name", 1, 0, "L", True)
    pdf.cell(20, 6, "Count", 1, 0, "C", True)
    pdf.cell(18, 6, "% Base", 1, 0, "C", True)
    pdf.cell(32, 6, "Avg Spend (INR)", 1, 0, "R", True)
    pdf.cell(24, 6, "Freq (yr)", 1, 0, "C", True)
    pdf.cell(24, 6, "Recency (d)", 1, 0, "C", True)
    pdf.cell(24, 6, "Rev Share", 1, 1, "C", True)
    
    pdf.set_font("Helvetica", "", 8)
    for seg in segments:
        clean_name = sanitize_text(seg.get("name", "Segment"))[:25]
        pdf.cell(48, 5.5, clean_name, 1, 0, "L")
        pdf.cell(20, 5.5, f"{seg.get('customer_count', 0):,}", 1, 0, "C")
        pdf.cell(18, 5.5, f"{seg.get('percentage', 0.0)}%", 1, 0, "C")
        pdf.cell(32, 5.5, f"{seg.get('average_spending', 0.0):,.0f}", 1, 0, "R")
        pdf.cell(24, 5.5, f"{seg.get('purchase_frequency', 0.0)}", 1, 0, "C")
        pdf.cell(24, 5.5, f"{seg.get('recency', 0.0):.1f}", 1, 0, "C")
        pdf.cell(24, 5.5, f"{seg.get('revenue_contribution', 0.0)}%", 1, 1, "C")
        
    pdf.ln(4)
    
    # 9. Behavioural Retention Risk Analysis
    if risk_summary:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 6, "9. Behavioural Retention Risk Analysis", 0, 1, "L")
        pdf.ln(1)
        
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(51, 65, 85)
        
        low_c = risk_summary.get("low_risk_count", 0)
        low_p = risk_summary.get("low_risk_pct", 0.0)
        med_c = risk_summary.get("medium_risk_count", 0)
        med_p = risk_summary.get("medium_risk_pct", 0.0)
        high_c = risk_summary.get("high_risk_count", 0)
        high_p = risk_summary.get("high_risk_pct", 0.0)
        
        risk_text = (
            f"* Low Risk Base (Score < 30):      {low_c:,} customers ({low_p}%) - Active purchasers with fresh recency and high engagement.\n"
            f"* Medium Risk Base (30 <= Score < 60): {med_c:,} customers ({med_p}%) - Early lapsing signs (30-60d recency) or low order frequency.\n"
            f"* High Churn Risk (Score >= 60):   {high_c:,} customers ({high_p}%) - Long recency (>90d), dormant accounts requiring immediate retention."
        )
        pdf.multi_cell(0, 4.5, risk_text)
        pdf.ln(3)
    
    # 10. Behaviour Insights
    if insights:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 6, "10. Key Behavioural Insights Derived from Data", 0, 1, "L")
        pdf.ln(1)
        
        for ins in insights:
            pdf.set_font("Helvetica", "B", 8.5)
            pdf.set_text_color(30, 58, 138)
            title = sanitize_text(ins.get("title", ""))
            metric = sanitize_text(ins.get("metric", ""))
            impact = sanitize_text(ins.get("impact", ""))
            pdf.cell(0, 5, f"* {title} [{metric}] - {impact}", 0, 1, "L")
            
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(71, 85, 105)
            desc = sanitize_text(ins.get("description", ""))
            pdf.multi_cell(0, 4, f"    {desc}")
            pdf.ln(1)
            
        pdf.ln(2)

    # 11. Marketing Recommendations
    if recommendations:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 6, "11. Strategic Marketing Recommendations per Segment", 0, 1, "L")
        pdf.ln(1)
        
        for rec in recommendations:
            pdf.set_font("Helvetica", "B", 8.5)
            pdf.set_text_color(15, 23, 42)
            seg_name = sanitize_text(rec.get("segment_name", ""))
            pdf.cell(0, 5, f"> {seg_name}", 0, 1, "L")
            
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(51, 65, 85)
            camp = sanitize_text(rec.get("suggested_campaign", ""))
            goal = sanitize_text(rec.get("target_goal", ""))
            strat = sanitize_text(rec.get("marketing_recommendation", ""))
            
            pdf.multi_cell(0, 4, f"  Strategy: {strat}\n  Campaign: '{camp}' | Target Goal: {goal}")
            pdf.ln(1.5)
        
    pdf.output(output_path)
    return output_path
