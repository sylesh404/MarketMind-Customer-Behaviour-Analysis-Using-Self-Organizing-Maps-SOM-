import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import { LoadingOverlay } from './components/LoadingOverlay';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

// Pages
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { DatasetPage } from './pages/DatasetPage';
import { PreprocessPage } from './pages/PreprocessPage';
import { FeatureSelectPage } from './pages/FeatureSelectPage';
import { SOMConfigPage } from './pages/SOMConfigPage';
import { SOMAnalysisPage } from './pages/SOMAnalysisPage';
import { SegmentsPage } from './pages/SegmentsPage';
import { InsightsPage } from './pages/InsightsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { EvaluationPage } from './pages/EvaluationPage';

// Types & Services
import type {
  DatasetInfo,
  SOMConfig,
  SOMAnalysisResult,
  CustomerProfile,
  MarketInsight,
  Recommendation,
  CorrelationMatrixData,
  RiskSummary
} from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Application Data States
  const [activeDataset, setActiveDataset] = useState<DatasetInfo | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Age',
    'Annual_Income',
    'Spending_Score',
    'Purchase_Frequency',
    'Total_Spending',
    'Average_Order_Value',
    'Recency',
    'Website_Visits',
    'Discount_Usage',
    'Customer_Lifetime_Value'
  ]);
  const [somConfig, setSomConfig] = useState<SOMConfig>({
    grid_width: 10,
    grid_height: 10,
    learning_rate: 0.5,
    iterations: 10000,
    neighborhood_func: 'gaussian',
    n_clusters: 6,
    imputation_strategy: 'mean'
  });

  const [activeAnalysis, setActiveAnalysis] = useState<SOMAnalysisResult | null>(null);
  const [umatrixData, setUmatrixData] = useState<any>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [correlation, setCorrelation] = useState<CorrelationMatrixData | null>(null);
  const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);

  // Loading States
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isReclustering, setIsReclustering] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLoadDemo = async () => {
    setIsDemoLoading(true);
    try {
      const dataset = await api.loadDemoDataset();
      setActiveDataset(dataset);
      // Auto-filter features present in dataset
      const valid = dataset.validation.numeric_columns.filter(c => c !== 'Customer_ID');
      setSelectedFeatures(valid);

      // Auto-train SOM so all 12 tabs are instantly populated and functional
      const initialConfig: SOMConfig = {
        grid_width: 10,
        grid_height: 10,
        learning_rate: 0.5,
        iterations: 5000,
        neighborhood_func: 'gaussian',
        n_clusters: 6,
        imputation_strategy: 'mean'
      };
      setSomConfig(initialConfig);

      const result = await api.trainSOM(dataset.id, valid, initialConfig);
      setActiveAnalysis(result);

      // Fetch all supplementary analysis data in parallel
      const [uRes, custRes, insRes, recRes] = await Promise.all([
        api.getUMatrix(result.analysis_id),
        api.getCustomers(result.analysis_id, undefined, undefined, undefined, 1000),
        api.getInsights(result.analysis_id),
        api.getRecommendations(result.analysis_id)
      ]);

      setUmatrixData(uRes);
      setCustomers(custRes.customers);
      setInsights(insRes.market_insights || insRes.insights || result.insights || []);
      setCorrelation(insRes.correlation || null);
      setRiskSummary(insRes.risk_summary || result.risk_summary || null);
      setRecommendations(recRes.recommendations || result.recommendations || []);

      setToast({ type: 'success', message: 'Demo dataset & SOM model loaded! All 12 analytics tabs are ready.' });
    } catch (err: any) {
      console.error('Failed to load demo dataset:', err);
      setToast({ type: 'error', message: err?.response?.data?.detail || err?.message || 'Failed to load demo dataset' });
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Auto load demo dataset on initial start for quick demonstration
  useEffect(() => {
    handleLoadDemo();
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const dataset = await api.uploadDataset(file);
      setActiveDataset(dataset);
      const valid = dataset.validation.numeric_columns.filter(c => c !== 'Customer_ID');
      setSelectedFeatures(valid);
      // Reset prior analysis when new dataset is uploaded
      setActiveAnalysis(null);
      setUmatrixData(null);
      setCustomers([]);
      setInsights([]);
      setCorrelation(null);
      setRiskSummary(null);
      setRecommendations([]);
      setCurrentTab('dataset');
      setToast({ type: 'success', message: `Dataset '${dataset.filename}' uploaded and validated (${dataset.row_count} rows).` });
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      setToast({ type: 'error', message: err?.response?.data?.detail || err?.message || 'File upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunPreprocess = async (strategy: 'mean' | 'median' | 'mode' | 'drop') => {
    if (!activeDataset) return;
    setIsProcessing(true);
    try {
      setSomConfig(prev => ({ ...prev, imputation_strategy: strategy }));
      await api.preprocessDataset(activeDataset.id, selectedFeatures, strategy);
      setCurrentTab('features');
      setToast({ type: 'success', message: `Preprocessing completed with '${strategy}' imputation strategy.` });
    } catch (err: any) {
      console.error('Failed to preprocess dataset:', err);
      setToast({ type: 'error', message: err?.response?.data?.detail || err?.message || 'Preprocessing error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTrainSOM = async () => {
    if (!activeDataset) return;
    setIsTraining(true);
    try {
      const result = await api.trainSOM(activeDataset.id, selectedFeatures, somConfig);
      setActiveAnalysis(result);

      // Fetch supplementary analysis data
      const [uRes, custRes, insRes, recRes] = await Promise.all([
        api.getUMatrix(result.analysis_id),
        api.getCustomers(result.analysis_id, undefined, undefined, undefined, 1000),
        api.getInsights(result.analysis_id),
        api.getRecommendations(result.analysis_id)
      ]);

      setUmatrixData(uRes);
      setCustomers(custRes.customers);
      setInsights(insRes.market_insights || insRes.insights || result.insights || []);
      setCorrelation(insRes.correlation || null);
      setRiskSummary(insRes.risk_summary || result.risk_summary || null);
      setRecommendations(recRes.recommendations || result.recommendations || []);

      setCurrentTab(prev => {
        const analysisTabs: TabType[] = ['som-analysis', 'segments', 'insights', 'recommendations', 'reports', 'evaluation', 'overview'];
        return analysisTabs.includes(prev) ? prev : 'som-analysis';
      });
      setToast({
        type: 'success',
        message: `SOM trained successfully! Quantization Error: ${result.quantization_error}, Topographic Error: ${result.topographic_error}.`
      });
    } catch (err: any) {
      console.error('Failed to train SOM model:', err);
      setToast({ type: 'error', message: err?.response?.data?.detail || err?.message || 'SOM training failed' });
    } finally {
      setIsTraining(false);
    }
  };

  const handleRecluster = async (nClusters: number) => {
    if (!activeAnalysis) return;
    setIsReclustering(true);
    try {
      const res = await api.reclusterSegments(activeAnalysis.analysis_id, nClusters);
      setActiveAnalysis(prev => prev ? {
        ...prev,
        segments: res.segments,
        node_segment_matrix: res.node_segment_matrix || prev.node_segment_matrix
      } : null);

      if (res.risk_summary) setRiskSummary(res.risk_summary);
      if (res.insights) setInsights(res.insights);
      if (res.recommendations) setRecommendations(res.recommendations);

      // Refresh customers
      const custRes = await api.getCustomers(activeAnalysis.analysis_id, undefined, undefined, undefined, 1000);
      setCustomers(custRes.customers);
      setToast({ type: 'success', message: `SOM codebook vectors successfully reclustered into ${nClusters} segments.` });
    } catch (err: any) {
      console.error('Failed to recluster segments:', err);
      setToast({ type: 'error', message: err?.response?.data?.detail || err?.message || 'Reclustering failed' });
    } finally {
      setIsReclustering(false);
    }
  };

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeDataset={activeDataset}
        activeAnalysis={activeAnalysis}
        onLoadDemo={handleLoadDemo}
        isDemoLoading={isDemoLoading}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isTrained={!!activeAnalysis}
          hasDataset={!!activeDataset}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-black">
          {currentTab === 'landing' && (
            <LandingPage
              onStartAnalysis={() => setCurrentTab('dataset')}
              onLoadDemo={async () => {
                await handleLoadDemo();
                setCurrentTab('overview');
              }}
              isDemoLoading={isDemoLoading}
            />
          )}

          {currentTab === 'overview' && (
            <OverviewPage
              dataset={activeDataset}
              analysis={activeAnalysis}
              customers={customers}
              riskSummary={riskSummary}
              insights={insights}
              onNavigateTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'dataset' && (
            <DatasetPage
              dataset={activeDataset}
              onFileUpload={handleFileUpload}
              onLoadDemo={handleLoadDemo}
              onNavigateNext={() => setCurrentTab('preprocess')}
              isUploading={isUploading}
            />
          )}

          {currentTab === 'preprocess' && (
            <PreprocessPage
              dataset={activeDataset}
              onRunPreprocess={handleRunPreprocess}
              onNavigateNext={() => setCurrentTab('features')}
              isProcessing={isProcessing}
            />
          )}

          {currentTab === 'features' && (
            <FeatureSelectPage
              dataset={activeDataset}
              selectedFeatures={selectedFeatures}
              onToggleFeature={toggleFeature}
              onSelectAll={() => {
                if (activeDataset) {
                  setSelectedFeatures(activeDataset.validation.numeric_columns.filter(c => c !== 'Customer_ID'));
                }
              }}
              onNavigateNext={() => setCurrentTab('som-config')}
            />
          )}

          {currentTab === 'som-config' && (
            <SOMConfigPage
              config={somConfig}
              onChangeConfig={(c) => setSomConfig(c)}
              onTrainSOM={handleTrainSOM}
              isTraining={isTraining}
              selectedFeaturesCount={selectedFeatures.length}
            />
          )}

          {currentTab === 'som-analysis' && (
            <SOMAnalysisPage
              analysis={activeAnalysis}
              umatrixData={umatrixData}
              customers={customers}
              hasDataset={!!activeDataset}
              datasetName={activeDataset?.filename}
              rowCount={activeDataset?.row_count}
              isTraining={isTraining}
              onTrainSOM={handleTrainSOM}
              onNavigateTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'segments' && (
            <SegmentsPage
              analysis={activeAnalysis}
              customers={customers}
              onRecluster={handleRecluster}
              isReclustering={isReclustering}
              hasDataset={!!activeDataset}
              datasetName={activeDataset?.filename}
              rowCount={activeDataset?.row_count}
              isTraining={isTraining}
              onTrainSOM={handleTrainSOM}
              onNavigateTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'insights' && (
            <InsightsPage
              analysisId={activeAnalysis?.analysis_id}
              insights={insights}
              correlation={correlation}
              riskSummary={riskSummary}
              hasDataset={!!activeDataset}
              datasetName={activeDataset?.filename}
              rowCount={activeDataset?.row_count}
              isTraining={isTraining}
              onTrainSOM={handleTrainSOM}
              onNavigateTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'recommendations' && (
            <RecommendationsPage
              recommendations={recommendations}
              onDownloadReport={async () => {
                if (activeAnalysis) await api.downloadPDFReport(activeAnalysis.analysis_id);
              }}
              hasDataset={!!activeDataset}
              datasetName={activeDataset?.filename}
              rowCount={activeDataset?.row_count}
              isTraining={isTraining}
              onTrainSOM={handleTrainSOM}
              onNavigateTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsPage
              analysis={activeAnalysis}
              hasDataset={!!activeDataset}
              datasetName={activeDataset?.filename}
              rowCount={activeDataset?.row_count}
              isTraining={isTraining}
              onTrainSOM={handleTrainSOM}
              onNavigateTab={(t) => setCurrentTab(t)}
            />
          )}

          {currentTab === 'evaluation' && (
            <EvaluationPage
              analysis={activeAnalysis}
              hasDataset={!!activeDataset}
              datasetName={activeDataset?.filename}
              rowCount={activeDataset?.row_count}
              isTraining={isTraining}
              onTrainSOM={handleTrainSOM}
              onNavigateTab={(t) => setCurrentTab(t)}
            />
          )}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl bg-neutral-950/95 border border-red-500/30 shadow-2xl shadow-red-950/40 backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
          <span className="text-zinc-200">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SOM Training Overlay Progress Modal */}
      <LoadingOverlay
        isOpen={isTraining}
        iterations={somConfig.iterations}
        gridWidth={somConfig.grid_width}
        gridHeight={somConfig.grid_height}
      />
    </div>
  );
}

export default App;
