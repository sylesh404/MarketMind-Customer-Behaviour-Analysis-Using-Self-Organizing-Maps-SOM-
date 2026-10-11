import React from 'react';
import { Brain, Database, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import type { DatasetInfo, SOMAnalysisResult } from '../types';

interface NavbarProps {
  activeDataset: DatasetInfo | null;
  activeAnalysis: SOMAnalysisResult | null;
  onLoadDemo: () => void;
  isDemoLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeDataset,
  activeAnalysis,
  onLoadDemo,
  isDemoLoading
}) => {
  return (
    <header className="h-16 border-b border-neutral-900 bg-black/95 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-950 p-0.5 flex items-center justify-center shadow-lg shadow-red-600/25">
          <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
            <Brain className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg bg-gradient-to-r from-white via-zinc-200 to-red-400 bg-clip-text text-transparent">
              MarketMind
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              SOM ML Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400">Customer Behaviour Analytics</p>
        </div>
      </div>

      {/* Dataset Status & Actions */}
      <div className="flex items-center space-x-4">
        {activeDataset ? (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
            <Database className="w-4 h-4 text-red-400" />
            <span className="text-zinc-300 font-medium">{activeDataset.filename}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-red-400 font-semibold">{activeDataset.row_count.toLocaleString()} rows</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-red-400 ml-1" />
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-950 border border-red-900/40 text-xs text-red-400">
            <Database className="w-4 h-4" />
            <span>No Dataset Loaded</span>
          </div>
        )}

        {activeAnalysis && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-600/30 text-xs text-red-300">
            <Cpu className="w-4 h-4 text-red-400" />
            <span>SOM {activeAnalysis.grid_width}x{activeAnalysis.grid_height} Trained</span>
            <span className="text-xs font-mono text-red-400">(QE: {activeAnalysis.quantization_error})</span>
          </div>
        )}

        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-850 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-zinc-300">Groq AI</span>
          <span className="text-zinc-500 font-mono text-[10px]">gpt-oss-120b</span>
        </div>

        <button
          onClick={onLoadDemo}
          disabled={isDemoLoading}
          className="flex items-center space-x-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-600/25 transition duration-200 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isDemoLoading ? 'Loading Demo...' : 'Load Demo Dataset'}</span>
        </button>
      </div>
    </header>
  );
};
