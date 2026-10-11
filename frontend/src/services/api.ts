import axios from 'axios';
import type {
  DatasetInfo,
  SOMConfig,
  SOMAnalysisResult,
  Segment,
  CustomerProfile,
  MarketInsight,
  Recommendation,
  CorrelationMatrixData
} from '../types';

const API_BASE = '/api';

export const api = {
  // Dataset Endpoints
  loadDemoDataset: async (): Promise<DatasetInfo> => {
    const res = await axios.post(`${API_BASE}/dataset/load-demo`);
    return res.data;
  },

  uploadDataset: async (file: File): Promise<DatasetInfo> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE}/dataset/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getDataset: async (datasetId: string): Promise<DatasetInfo> => {
    const res = await axios.get(`${API_BASE}/dataset/${datasetId}`);
    return res.data;
  },

  // Preprocessing
  preprocessDataset: async (
    datasetId: string,
    selectedFeatures: string[],
    imputationStrategy: string = 'mean'
  ) => {
    const res = await axios.post(`${API_BASE}/preprocess`, {
      dataset_id: datasetId,
      selected_features: selectedFeatures,
      imputation_strategy: imputationStrategy,
      remove_duplicates: true
    });
    return res.data;
  },

  // SOM Endpoints
  trainSOM: async (
    datasetId: string,
    selectedFeatures: string[],
    config: SOMConfig
  ): Promise<SOMAnalysisResult> => {
    const res = await axios.post(`${API_BASE}/som/train`, {
      dataset_id: datasetId,
      selected_features: selectedFeatures,
      grid_width: config.grid_width,
      grid_height: config.grid_height,
      learning_rate: config.learning_rate,
      iterations: config.iterations,
      neighborhood_func: config.neighborhood_func,
      n_clusters: config.n_clusters,
      imputation_strategy: config.imputation_strategy
    });
    return res.data;
  },

  getSOMAnalysis: async (analysisId: string): Promise<SOMAnalysisResult> => {
    const res = await axios.get(`${API_BASE}/som/${analysisId}`);
    return res.data;
  },

  getUMatrix: async (analysisId: string) => {
    const res = await axios.get(`${API_BASE}/som/${analysisId}/umatrix`);
    return res.data;
  },

  // Segments
  getSegments: async (analysisId: string): Promise<{ segments: Segment[] }> => {
    const res = await axios.get(`${API_BASE}/segments/${analysisId}`);
    return res.data;
  },

  reclusterSegments: async (analysisId: string, nClusters: number): Promise<{
    analysis_id: string;
    n_clusters: number;
    segments: Segment[];
    node_segment_matrix?: number[][];
    risk_summary?: any;
    insights?: MarketInsight[];
    recommendations?: Recommendation[];
  }> => {
    const res = await axios.post(`${API_BASE}/segments/${analysisId}/recluster`, { n_clusters: nClusters });
    return res.data;
  },

  // Customers
  getCustomers: async (
    analysisId: string,
    segmentId?: number,
    riskLevel?: string,
    search?: string,
    limit: number = 200,
    offset: number = 0
  ): Promise<{ total_count: number; returned_count: number; customers: CustomerProfile[] }> => {
    const params: any = { limit, offset };
    if (segmentId !== undefined) params.segment_id = segmentId;
    if (riskLevel) params.risk_level = riskLevel;
    if (search) params.search = search;
    const res = await axios.get(`${API_BASE}/customers/${analysisId}`, { params });
    return res.data;
  },

  getCustomerDetail: async (customerId: string, analysisId: string) => {
    const res = await axios.get(`${API_BASE}/customers/detail/${customerId}`, {
      params: { analysis_id: analysisId }
    });
    return res.data;
  },

  // Insights & Recommendations
  getInsights: async (analysisId: string): Promise<{
    correlation: CorrelationMatrixData;
    market_insights: MarketInsight[];
    insights?: MarketInsight[];
    risk_summary: any;
    ai_enhanced?: boolean;
    ai_provider?: string;
    ai_model?: string;
  }> => {
    const res = await axios.get(`${API_BASE}/insights/${analysisId}`);
    return res.data;
  },

  getRecommendations: async (analysisId: string): Promise<{ recommendations: Recommendation[]; ai_enhanced?: boolean }> => {
    const res = await axios.get(`${API_BASE}/recommendations/${analysisId}`);
    return res.data;
  },

  getAIStatus: async (): Promise<{ available: boolean; provider: string; model: string }> => {
    const res = await axios.get(`${API_BASE}/insights/ai-status`);
    return res.data;
  },

  askAIAnalyst: async (analysisId: string, query: string): Promise<{ answer: string; provider: string; model: string }> => {
    const res = await axios.post(`${API_BASE}/insights/${analysisId}/ask`, { query });
    return res.data;
  },

  // Reports Export
  downloadPDFReport: async (analysisId: string) => {
    const res = await axios.post(`${API_BASE}/report/generate-pdf`, { analysis_id: analysisId }, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MarketMind_Report_${analysisId.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadCSVReport: (analysisId: string) => {
    window.open(`${API_BASE}/report/export-csv/${analysisId}`, '_blank');
  },

  downloadJSONReport: async (analysisId: string) => {
    const res = await axios.get(`${API_BASE}/report/export-json/${analysisId}`);
    const jsonStr = JSON.stringify(res.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MarketMind_Analysis_${analysisId.slice(0, 8)}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
