import React, { useMemo } from 'react';
import { CheckSquare, Square, ArrowRight, AlertTriangle, AlertCircle, Sparkles, Activity } from 'lucide-react';
import type { DatasetInfo } from '../types';

interface FeatureSelectPageProps {
  dataset: DatasetInfo | null;
  selectedFeatures: string[];
  onToggleFeature: (featureName: string) => void;
  onSelectAll: () => void;
  onNavigateNext: () => void;
}

export const FeatureSelectPage: React.FC<FeatureSelectPageProps> = ({
  dataset,
  selectedFeatures,
  onToggleFeature,
  onSelectAll,
  onNavigateNext
}) => {
  // Compute pairwise Pearson correlations on the available dataset preview rows
  const { correlations, highCorrPairs } = useMemo(() => {
    if (!dataset || !dataset.preview || dataset.preview.length < 5 || selectedFeatures.length < 2) {
      return { correlations: {}, highCorrPairs: [] };
    }

    const n = dataset.preview.length;
    const means: Record<string, number> = {};
    const stds: Record<string, number> = {};

    selectedFeatures.forEach(f => {
      const vals = dataset.preview.map(r => Number(r[f]) || 0);
      const mean = vals.reduce((a, b) => a + b, 0) / n;
      means[f] = mean;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1 || 1);
      stds[f] = Math.sqrt(variance);
    });

    const corrs: Record<string, Record<string, number>> = {};
    const pairs: Array<{ f1: string; f2: string; r: number }> = [];

    for (let i = 0; i < selectedFeatures.length; i++) {
      const f1 = selectedFeatures[i];
      corrs[f1] = {};
      for (let j = 0; j < selectedFeatures.length; j++) {
        const f2 = selectedFeatures[j];
        if (i === j) {
          corrs[f1][f2] = 1.0;
          continue;
        }
        if (stds[f1] === 0 || stds[f2] === 0) {
          corrs[f1][f2] = 0;
          continue;
        }

        let cov = 0;
        for (let k = 0; k < n; k++) {
          cov += ((Number(dataset.preview[k][f1]) || 0) - means[f1]) * ((Number(dataset.preview[k][f2]) || 0) - means[f2]);
        }
        cov /= (n - 1 || 1);
        const r = Number((cov / (stds[f1] * stds[f2])).toFixed(2));
        corrs[f1][f2] = r;

        if (i < j && Math.abs(r) >= 0.85) {
          pairs.push({ f1, f2, r });
        }
      }
    }

    return { correlations: corrs, highCorrPairs: pairs };
  }, [dataset, selectedFeatures]);

  if (!dataset) {
    return <div className="p-8 text-center text-slate-400">Please upload a dataset first.</div>;
  }

  const numericCols = dataset.validation.numeric_columns.filter(c => c !== 'Customer_ID');
  const constantCols = dataset.validation.constant_columns || [];

  const handleSelectRecommended = () => {
    const recommended = [
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
    ].filter(f => numericCols.includes(f));

    recommended.forEach(f => {
      if (!selectedFeatures.includes(f)) {
        onToggleFeature(f);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl space-y-6 border border-slate-800">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Behavioral Feature Selection</h2>
            <p className="text-xs text-slate-400">Select which numerical attributes participate in Self-Organizing Map (SOM) topological mapping</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
              Selected: {selectedFeatures.length} / {numericCols.length}
            </span>
            <button
              onClick={handleSelectRecommended}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended</span>
            </button>
            <button
              onClick={onSelectAll}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline px-1"
            >
              Select All
            </button>
          </div>
        </div>

        {/* Diagnostic Warnings */}
        {selectedFeatures.length < 2 && (
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span><strong>Insufficient Features:</strong> A minimum of 2 numerical features is required to project high-dimensional topology onto the SOM 2D grid.</span>
          </div>
        )}

        {constantCols.length > 0 && (
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span><strong>Constant Features Detected:</strong> Columns [{constantCols.join(', ')}] have zero variance and should be excluded from SOM training.</span>
          </div>
        )}

        {highCorrPairs.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
            <div className="flex items-center space-x-2 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Multicollinearity Warning (|r| &ge; 0.85):</span>
            </div>
            <p className="text-amber-200/90">
              The following pairs exhibit strong linear correlation:
              {' '}{highCorrPairs.map(p => `${p.f1} <-> ${p.f2} (r = ${p.r})`).join(', ')}.
              SOM can handle correlated inputs, but removing redundant proxies can accelerate convergence.
            </p>
          </div>
        )}

        {/* Feature Checkboxes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {numericCols.map((col) => {
            const isSelected = selectedFeatures.includes(col);
            const isConstant = constantCols.includes(col);

            return (
              <div
                key={col}
                onClick={() => !isConstant && onToggleFeature(col)}
                className={`p-4 rounded-xl border transition flex items-center justify-between ${
                  isConstant
                    ? 'opacity-40 bg-neutral-950 border-neutral-900 cursor-not-allowed'
                    : isSelected
                    ? 'bg-red-600/15 border-red-500/60 text-white shadow-md shadow-red-950/30 cursor-pointer'
                    : 'bg-neutral-950/80 border-neutral-850 text-zinc-400 hover:border-neutral-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-xs truncate block">{col.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Normalized numeric</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Correlation Preview for Selected Features */}
        {selectedFeatures.length >= 2 && Object.keys(correlations).length > 0 && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-300">
              <Activity className="w-4 h-4 text-red-400" />
              <span>Selected Feature Correlation Quick Matrix (Pearson r)</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-neutral-900">
              <table className="w-full text-center text-xs">
                <thead className="bg-neutral-950 text-zinc-400 uppercase font-mono">
                  <tr>
                    <th className="p-2 text-left">Feature</th>
                    {selectedFeatures.map(f => (
                      <th key={f} className="p-2 whitespace-nowrap text-[10px]">{f.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 font-mono text-[11px]">
                  {selectedFeatures.map(rowFeat => (
                    <tr key={rowFeat}>
                      <td className="p-2 font-bold text-left text-zinc-200 whitespace-nowrap">{rowFeat.replace(/_/g, ' ')}</td>
                      {selectedFeatures.map(colFeat => {
                        const val = correlations[rowFeat]?.[colFeat] ?? 0;
                        const isSelf = rowFeat === colFeat;
                        const opacity = Math.abs(val);
                        return (
                          <td
                            key={colFeat}
                            style={{
                              backgroundColor: isSelf
                                ? 'rgba(239, 68, 68, 0.25)'
                                : val > 0
                                ? `rgba(239, 68, 68, ${opacity * 0.35})`
                                : `rgba(100, 116, 139, ${opacity * 0.25})`
                            }}
                            className="p-2 text-zinc-200"
                          >
                            {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Proceed */}
        <div className="flex justify-end pt-4 border-t border-neutral-900">
          <button
            onClick={onNavigateNext}
            disabled={selectedFeatures.length < 2}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center space-x-2 disabled:opacity-40"
          >
            <span>Proceed to SOM Hyperparameter Configuration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
