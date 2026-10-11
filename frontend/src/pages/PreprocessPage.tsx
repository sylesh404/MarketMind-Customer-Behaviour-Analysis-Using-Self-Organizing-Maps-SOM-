import React, { useState } from 'react';
import { Filter, CheckCircle2, Sliders } from 'lucide-react';
import type { DatasetInfo } from '../types';

interface PreprocessPageProps {
  dataset: DatasetInfo | null;
  onRunPreprocess: (strategy: 'mean' | 'median' | 'mode' | 'drop') => void;
  onNavigateNext: () => void;
  isProcessing: boolean;
  preprocessedResult?: any;
}

export const PreprocessPage: React.FC<PreprocessPageProps> = ({
  dataset,
  onRunPreprocess,
  isProcessing
}) => {
  const [strategy, setStrategy] = useState<'mean' | 'median' | 'mode' | 'drop'>('mean');

  if (!dataset) {
    return <div className="p-8 text-center text-zinc-400">Please upload a dataset first.</div>;
  }

  const validation = dataset.validation;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl space-y-4 bg-black border border-neutral-900">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Data Preprocessing & Validation</h2>
          <p className="text-xs text-zinc-400">Configure missing value imputation strategies and feature standardization before SOM training</p>
        </div>

        {/* Validation Status Message */}
        {validation.total_missing === 0 ? (
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-300 text-xs">
            <CheckCircle2 className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">Dataset successfully validated!</p>
              <p className="text-zinc-300">No missing values detected across {validation.numeric_columns.length} numerical columns.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-neutral-950 border border-red-900/40 text-red-300 text-xs">
            <Filter className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">{validation.missing_percentage}% missing values detected.</p>
              <p className="text-zinc-300">Select an imputation strategy below to handle null entries prior to normalization.</p>
            </div>
          </div>
        )}

        {/* Imputation Strategy Selector */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-zinc-300">Choose Missing Value Imputation Strategy:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'mean', label: 'Mean Imputation', desc: 'Replace missing values with feature mean' },
              { id: 'median', label: 'Median Imputation', desc: 'Replace missing with median (robust)' },
              { id: 'mode', label: 'Mode Imputation', desc: 'Replace missing with most frequent value' },
              { id: 'drop', label: 'Remove Rows', desc: 'Drop any customer rows containing nulls' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setStrategy(item.id as any)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                  strategy === item.id
                    ? 'bg-red-600/20 border-red-500 text-red-300 shadow-md shadow-red-950/30'
                    : 'bg-neutral-950 border-neutral-850 text-zinc-400 hover:border-neutral-700'
                }`}
              >
                <span className="font-bold text-xs text-white">{item.label}</span>
                <span className="text-[10px] text-zinc-400 leading-tight">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preprocessing Transparency Checklist & Action */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 space-y-2 text-xs">
          <p className="font-semibold text-zinc-200">Preprocessing Transparency Pipeline Status:</p>
          <div className="space-y-2 text-zinc-300">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>✓ Dataset loaded: <strong className="text-white">{dataset.filename}</strong> ({dataset.row_count.toLocaleString()} rows, {dataset.column_count} columns)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>✓ Missing values analyzed: <strong className="text-red-300">{validation.total_missing} missing values</strong> ({validation.missing_percentage}%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>✓ Duplicates detected: <strong className="text-rose-400">{validation.duplicate_rows} duplicate rows</strong> identified for deduplication</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>✓ Missing values handled: Using chosen <strong className="text-red-400">{strategy.toUpperCase()}</strong> imputation strategy</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>✓ Features standardized: <strong className="text-red-300">StandardScaler</strong> (Zero mean, unit variance) applied to all selected dimensions</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>✓ Dataset ready: Validated schema ready for Self-Organizing Map neural lattice projection</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-900">
          <button
            onClick={() => onRunPreprocess(strategy)}
            disabled={isProcessing}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center space-x-2"
          >
            <Sliders className="w-4 h-4" />
            <span>{isProcessing ? 'Processing Data...' : 'Apply Preprocessing & Proceed to Feature Selection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
