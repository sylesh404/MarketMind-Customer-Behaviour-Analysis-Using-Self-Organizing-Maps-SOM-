import React from 'react';
import { Sparkles, ArrowRight, Zap, BarChart3, Layers } from 'lucide-react';
import { NetworkAnimation } from '../components/NetworkAnimation';

interface LandingPageProps {
  onStartAnalysis: () => void;
  onLoadDemo: () => void;
  isDemoLoading: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnalysis,
  onLoadDemo,
  isDemoLoading
}) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden bg-black">
      {/* Background Canvas Network Animation in Red/Black */}
      <NetworkAnimation />

      {/* Hero Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-12 text-center space-y-8">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>Next-Gen Unsupervised Customer Intelligence</span>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Discover Hidden Customer Patterns with{' '}
            <span className="bg-gradient-to-r from-white via-red-200 to-red-600 bg-clip-text text-transparent">
              Self-Organizing Maps
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-zinc-300">
            MarketMind transforms high-dimensional customer behavioral data into interactive 2D topological heatmaps (U-Matrix), automatically discovering distinct customer segments and generating AI marketing recommendations.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onStartAnalysis}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/35 flex items-center justify-center space-x-2 transition duration-200"
          >
            <span>Start Customer Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLoadDemo}
            disabled={isDemoLoading}
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel text-zinc-200 hover:text-white hover:border-red-500/40 font-bold text-sm flex items-center justify-center space-x-2 transition duration-200 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>{isDemoLoading ? 'Loading Demo...' : 'Load Demo Dataset (1,000 Customers)'}</span>
          </button>
        </div>
      </div>

      {/* Feature Capabilities Cards */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-red-950/40 hover:border-red-500/30 transition space-y-3 bg-neutral-950/80">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-100 text-base">Real SOM Engine</h3>
            <p className="text-xs text-zinc-400">
              Powered by Python MiniSom. Computes genuine Best Matching Units (BMUs), Quantization Error, and Topographic Error.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-red-950/40 hover:border-red-500/30 transition space-y-3 bg-neutral-950/80">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-100 text-base">Interactive U-Matrix</h3>
            <p className="text-xs text-zinc-400">
              Explore 2D distance heatmaps with cell hover tooltips, mapped customer rosters, and topological scatter overlays.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-red-950/40 hover:border-red-500/30 transition space-y-3 bg-neutral-950/80">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-100 text-base">AI Business Strategy</h3>
            <p className="text-xs text-zinc-400">
              Dynamic segment labeling (VIP, Loyal, At-Risk), retention risk scoring, correlation matrices, and downloadable PDF reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
