import React from 'react';
import { Cpu, Play, Sliders, Sparkles, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import type { TabType } from './Sidebar';

interface ModelRequiredCardProps {
  featureName: string;
  featureDescription: string;
  hasDataset: boolean;
  datasetName?: string;
  rowCount?: number;
  isTraining: boolean;
  onTrainSOM: () => void;
  onNavigateTab: (tab: TabType) => void;
  onLoadDemo?: () => void;
  isDemoLoading?: boolean;
}

export const ModelRequiredCard: React.FC<ModelRequiredCardProps> = ({
  featureName,
  featureDescription,
  hasDataset,
  datasetName,
  rowCount,
  isTraining,
  onTrainSOM,
  onNavigateTab,
  onLoadDemo,
  isDemoLoading
}) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-red-600/25 text-center space-y-6 shadow-2xl relative overflow-hidden bg-black/90">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
          <Cpu className="w-4 h-4 text-red-400" />
          <span>SOM Model Training Required</span>
        </div>

        {/* Feature Title & Description */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Unlock {featureName}
          </h2>
          <p className="text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
            {featureDescription}
          </p>
        </div>

        {/* Dataset Status Banner */}
        <div className="max-w-lg mx-auto p-3.5 rounded-2xl bg-neutral-950 border border-neutral-850 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {hasDataset ? (
              <CheckCircle2 className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <span className="text-zinc-300">
              {hasDataset ? (
                <>
                  Dataset ready: <strong className="text-white font-mono">{datasetName}</strong> ({rowCount?.toLocaleString()} customers)
                </>
              ) : (
                'No dataset loaded yet'
              )}
            </span>
          </div>

          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
            {hasDataset ? 'Ready to Train' : 'Action Needed'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {hasDataset ? (
            <>
              <button
                onClick={onTrainSOM}
                disabled={isTraining}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-xl shadow-red-600/35 flex items-center justify-center space-x-2 transition duration-200 disabled:opacity-50"
              >
                <Play className={`w-4 h-4 fill-current ${isTraining ? 'animate-spin' : ''}`} />
                <span>{isTraining ? 'Training SOM Engine...' : '⚡ Train SOM Model Now (1-Click)'}</span>
              </button>

              <button
                onClick={() => onNavigateTab('som-config')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-zinc-200 hover:text-white font-semibold text-xs border border-neutral-800 flex items-center justify-center space-x-2 transition"
              >
                <Sliders className="w-4 h-4 text-red-400" />
                <span>Configure Parameters</span>
              </button>
            </>
          ) : (
            <>
              {onLoadDemo && (
                <button
                  onClick={onLoadDemo}
                  disabled={isDemoLoading}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-xl shadow-red-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>{isDemoLoading ? 'Loading Demo...' : 'Load Demo & Auto-Train'}</span>
                </button>
              )}

              <button
                onClick={() => onNavigateTab('dataset')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-zinc-200 hover:text-white font-semibold text-xs border border-neutral-800 flex items-center justify-center space-x-2 transition"
              >
                <Database className="w-4 h-4 text-red-400" />
                <span>Upload Custom Dataset</span>
              </button>
            </>
          )}
        </div>

        {/* Feature Preview Badges */}
        <div className="pt-4 border-t border-neutral-900 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-400">
          <div className="p-2 rounded-lg bg-neutral-950/80 border border-neutral-900">✓ 10x10 Kohonen Lattice</div>
          <div className="p-2 rounded-lg bg-neutral-950/80 border border-neutral-900">✓ Topological U-Matrix</div>
          <div className="p-2 rounded-lg bg-neutral-950/80 border border-neutral-900">✓ 6 Customer Archetypes</div>
          <div className="p-2 rounded-lg bg-neutral-950/80 border border-neutral-900">✓ AI Campaign Strategies</div>
        </div>
      </div>
    </div>
  );
};
