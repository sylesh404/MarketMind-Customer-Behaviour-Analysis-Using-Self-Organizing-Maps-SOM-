import React from 'react';
import { ModelRequiredCard } from '../components/ModelRequiredCard';
import type { SOMAnalysisResult } from '../types';
import type { TabType } from '../components/Sidebar';

interface EvaluationPageProps {
  analysis: SOMAnalysisResult | null;
  hasDataset?: boolean;
  datasetName?: string;
  rowCount?: number;
  isTraining?: boolean;
  onTrainSOM?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const EvaluationPage: React.FC<EvaluationPageProps> = ({
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
        featureName="SOM Model Evaluation & Convergence Metrics"
        featureDescription="Inspect Quantization Error (QE) measuring vector quantization fidelity, Topographic Error (TE) measuring neighborhood topology preservation, and grid configuration diagnostics."
        hasDataset={hasDataset}
        datasetName={datasetName}
        rowCount={rowCount}
        isTraining={isTraining}
        onTrainSOM={onTrainSOM}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-zinc-100">SOM Model Evaluation & Convergence</h2>
        <p className="text-xs text-zinc-400">Evaluation metrics measuring vector quantization fidelity and topological preservation</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quantization Error Card */}
        <div className="glass-panel p-6 rounded-2xl border border-red-600/35 space-y-3 bg-black/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Fidelity Metric</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold">Lower = Better</span>
          </div>

          <h3 className="font-bold text-white text-lg">Quantization Error (QE)</h3>
          <p className="text-3xl font-extrabold text-red-400 font-mono">{analysis.quantization_error}</p>

          <p className="text-xs text-zinc-400 leading-relaxed pt-2 border-t border-neutral-900">
            Quantization Error measures the average Euclidean distance between each customer input vector and its assigned Best Matching Unit (BMU) neuron weight vector. A lower value indicates higher mapping accuracy.
          </p>
        </div>

        {/* Topographic Error Card */}
        <div className="glass-panel p-6 rounded-2xl border border-neutral-850 hover:border-red-900/40 transition space-y-3 bg-black/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Topology Metric</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 text-zinc-300 font-semibold">Lower = Better</span>
          </div>

          <h3 className="font-bold text-white text-lg">Topographic Error (TE)</h3>
          <p className="text-3xl font-extrabold text-red-400 font-mono">{analysis.topographic_error}</p>

          <p className="text-xs text-zinc-400 leading-relaxed pt-2 border-t border-neutral-900">
            Topographic Error measures the proportion of data samples for which the 1st and 2nd Best Matching Units (BMUs) are not adjacent in the grid topology. Values close to 0 confirm preserved spatial continuity.
          </p>
        </div>
      </div>

      {/* Grid Configuration Diagnostics Table */}
      <div className="glass-panel p-6 rounded-2xl border border-neutral-900 space-y-4 bg-black/90">
        <h3 className="font-semibold text-zinc-100 text-sm">Model Training Parameter Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900">
            <span className="text-zinc-500 font-sans">Grid Shape</span>
            <p className="text-white font-bold">{analysis.grid_width} x {analysis.grid_height}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900">
            <span className="text-zinc-500 font-sans">Total Neurons</span>
            <p className="text-red-400 font-bold">{analysis.grid_width * analysis.grid_height}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900">
            <span className="text-zinc-500 font-sans">Learning Rate</span>
            <p className="text-zinc-200 font-bold">{analysis.learning_rate}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900">
            <span className="text-zinc-500 font-sans">Iterations</span>
            <p className="text-red-400 font-bold">{analysis.iterations.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
