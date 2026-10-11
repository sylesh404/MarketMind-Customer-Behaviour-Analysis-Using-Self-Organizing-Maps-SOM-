export interface ColumnDetail {
  name: string;
  type: string;
  missing_count: number;
  missing_pct: number;
  unique_count: number;
  is_numeric: boolean;
}

export interface DatasetValidation {
  total_rows: number;
  total_cols: number;
  total_missing: number;
  missing_percentage: number;
  duplicate_rows: number;
  numeric_columns: string[];
  categorical_columns: string[];
  constant_columns: string[];
  column_details: ColumnDetail[];
}

export interface DatasetInfo {
  id: string;
  filename: string;
  upload_date?: string;
  row_count: number;
  column_count: number;
  columns: string[];
  validation: DatasetValidation;
  preview: Record<string, any>[];
}

export interface SOMConfig {
  grid_width: number;
  grid_height: number;
  learning_rate: number;
  iterations: number;
  neighborhood_func: 'gaussian' | 'bubble';
  n_clusters: number;
  imputation_strategy: 'mean' | 'median' | 'mode' | 'drop';
}

export interface Segment {
  segment_id: number;
  name: string;
  badge: string;
  customer_count: number;
  percentage: number;
  average_spending: number;
  average_spending_score?: number;
  average_income: number;
  purchase_frequency: number;
  recency: number;
  average_order_value?: number;
  discount_usage?: number;
  website_visits?: number;
  revenue_contribution: number;
  description: string;
  recommendation: string;
}

export interface RiskSummary {
  low_risk_count: number;
  low_risk_pct: number;
  medium_risk_count: number;
  medium_risk_pct: number;
  high_risk_count: number;
  high_risk_pct: number;
  at_risk_total: number;
  at_risk_pct: number;
}

export interface SOMAnalysisResult {
  analysis_id: string;
  dataset_id: string;
  grid_width: number;
  grid_height: number;
  learning_rate: number;
  iterations: number;
  neighborhood_func: string;
  quantization_error: number;
  topographic_error: number;
  metrics?: {
    quantization_error: number;
    topographic_error: number;
  };
  umatrix: number[][];
  node_counts?: number[][];
  node_customer_counts?: number[][];
  node_segment_matrix?: number[][];
  features: string[];
  mapped_customers_count?: number;
  segments: Segment[];
  risk_summary?: RiskSummary;
  insights?: MarketInsight[];
  recommendations?: Recommendation[];
}

export interface CustomerProfile {
  Customer_ID: string | number;
  Age?: number;
  Gender?: string;
  Annual_Income?: number;
  Spending_Score?: number;
  Purchase_Frequency?: number;
  Total_Spending?: number;
  Average_Order_Value?: number;
  Recency?: number;
  Website_Visits?: number;
  Discount_Usage?: number;
  Number_of_Orders?: number;
  Customer_Lifetime_Value?: number;
  bmu_x?: number;
  bmu_y?: number;
  distance?: number;
  segment_id?: number;
  risk_level?: string;
  risk_score?: number;
}

export interface MarketInsight {
  id: number;
  title: string;
  type: string;
  metric: string;
  description: string;
  impact: string;
  ai_generated?: boolean;
  provider?: string;
}

export interface Recommendation {
  segment_id: number;
  segment_name: string;
  badge: string;
  summary: string;
  business_interpretation: string;
  marketing_recommendation: string;
  suggested_campaign: string;
  target_goal: string;
  ai_generated?: boolean;
  provider?: string;
}

export interface CorrelationMatrixData {
  features: string[];
  matrix: number[][];
}
