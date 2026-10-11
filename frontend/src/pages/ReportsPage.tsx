import React from 'react';
import { FileText, Download, FileSpreadsheet, Code } from 'lucide-react';
import { ModelRequiredCard } from '../components/ModelRequiredCard';
import type { SOMAnalysisResult } from '../types';
import type { TabType } from '../components/Sidebar';
import { api } from '../services/api';

interface ReportsPageProps {
  analysis: SOMAnalysisResult | null;
  hasDataset?: boolean;
  datasetName?: string;
  rowCount?: number;
  isTraining?: boolean;
  onTrainSOM?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  analysis,
  hasDataset = true,
  datasetName = 'dataset.csv',
  rowCount = 1000,
  isTraining = false,
  onTrainSOM = () => {},
  onNavigateTab = () => {}
}) => {
  if (!analysis) {
    return (
      <ModelRequiredCard
        featureName="Reports & Multi-Format Data Export"
        featureDescription="Generate and download executive PDF reports, enriched customer segmentation CSV spreadsheets (with BMU coordinates and risk flags), and comprehensive JSON dumps."
        hasDataset={hasDataset}
        datasetName={datasetName}
        rowCount={rowCount}
        isTraining={isTraining}
        onTrainSOM={onTrainSOM}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  const handleDownloadPDF = async () => {
    await api.downloadPDFReport(analysis.analysis_id);
  };

  const handleDownloadCSV = () => {
    api.downloadCSVReport(analysis.analysis_id);
  };

  const handleDownloadJSON = async () => {
    await api.downloadJSONReport(analysis.analysis_id);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-zinc-100">Reports & Data Export</h2>
        <p className="text-xs text-zinc-400">Export SOM customer segmentation results, U-Matrix metrics, and recommendations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Executive Report Card */}
        <div className="glass-panel p-6 rounded-2xl border border-red-600/40 space-y-4 flex flex-col justify-between bg-black/90">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">PDF Executive Report</h3>
            <p className="text-xs text-zinc-400">
              Full formatted analytical document featuring dataset summaries, SOM parameters, segment metrics, and AI recommendations.
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>

        {/* CSV Mapped Dataset Card */}
        <div className="glass-panel p-6 rounded-2xl border border-neutral-850 hover:border-red-900/40 transition space-y-4 flex flex-col justify-between bg-black/90">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">CSV Segmentation Export</h3>
            <p className="text-xs text-zinc-400">
              Complete customer dataset augmented with Best Matching Unit coordinates (BMU_X, BMU_Y), assigned Segment Name, and Risk Level.
            </p>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs border border-neutral-800 flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4 text-red-400" />
            <span>Export CSV Dataset</span>
          </button>
        </div>

        {/* JSON Dump Card */}
        <div className="glass-panel p-6 rounded-2xl border border-neutral-850 hover:border-red-900/40 transition space-y-4 flex flex-col justify-between bg-black/90">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">JSON Analysis Dump</h3>
            <p className="text-xs text-zinc-400">
              Raw JSON structured object containing full U-Matrix arrays, codebook weights, segment details, and customer mappings.
            </p>
          </div>

          <button
            onClick={handleDownloadJSON}
            className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs border border-neutral-800 flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4 text-red-400" />
            <span>Export Raw JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
