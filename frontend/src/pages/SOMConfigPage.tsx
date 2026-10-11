import React from 'react';
import { Play, Info } from 'lucide-react';
import type { SOMConfig } from '../types';

interface SOMConfigPageProps {
  config: SOMConfig;
  onChangeConfig: (newConfig: SOMConfig) => void;
  onTrainSOM: () => void;
  isTraining: boolean;
  selectedFeaturesCount: number;
}

export const SOMConfigPage: React.FC<SOMConfigPageProps> = ({
  config,
  onChangeConfig,
  onTrainSOM,
  isTraining,
  selectedFeaturesCount
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl space-y-6 bg-black border border-neutral-900">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Self-Organizing Map (SOM) Configuration</h2>
          <p className="text-xs text-zinc-400">Configure neural network grid dimensions, learning rate, and iteration parameters for customer mapping</p>
        </div>

        {/* Algorithm Intuition Explanation Box */}
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-300 space-y-2">
          <div className="flex items-center space-x-2 font-semibold text-white">
            <Info className="w-4 h-4 text-red-400" />
            <span>Mathematical Intuition & SOM Architecture</span>
          </div>
          <p className="leading-relaxed">
            A Self-Organizing Map (Kohonen Map) is an unsupervised artificial neural network that projects high-dimensional customer feature vectors ({selectedFeaturesCount} features) onto a 2D topological lattice ({config.grid_width}x{config.grid_height} = {config.grid_width * config.grid_height} neurons) while preserving topological relationships.
          </p>
        </div>

        {/* Configuration Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Grid Dimensions */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Grid Dimensions (Width x Height):</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-zinc-400">Width (X)</span>
                <input
                  type="number"
                  min="4"
                  max="25"
                  value={config.grid_width}
                  onChange={(e) => onChangeConfig({ ...config, grid_width: parseInt(e.target.value) || 10 })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-white focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400">Height (Y)</span>
                <input
                  type="number"
                  min="4"
                  max="25"
                  value={config.grid_height}
                  onChange={(e) => onChangeConfig({ ...config, grid_height: parseInt(e.target.value) || 10 })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-white focus:border-red-500 outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">Total Neurons: {config.grid_width * config.grid_height}</p>
          </div>

          {/* Learning Rate & Iterations */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Learning Rate & Iterations:</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-zinc-400">Initial Learning Rate (alpha)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="1.0"
                  value={config.learning_rate}
                  onChange={(e) => onChangeConfig({ ...config, learning_rate: parseFloat(e.target.value) || 0.5 })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-white focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400">Training Iterations</span>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  max="50000"
                  value={config.iterations}
                  onChange={(e) => onChangeConfig({ ...config, iterations: parseInt(e.target.value) || 10000 })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-white focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Neighborhood Function */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Neighborhood Function:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, neighborhood_func: 'gaussian' })}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  config.neighborhood_func === 'gaussian'
                    ? 'bg-red-600/20 border-red-500 text-red-300'
                    : 'bg-neutral-950 border-neutral-800 text-zinc-400 hover:border-neutral-700'
                }`}
              >
                Gaussian Function
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, neighborhood_func: 'bubble' })}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  config.neighborhood_func === 'bubble'
                    ? 'bg-red-600/20 border-red-500 text-red-300'
                    : 'bg-neutral-950 border-neutral-800 text-zinc-400 hover:border-neutral-700'
                }`}
              >
                Bubble Function
              </button>
            </div>
          </div>

          {/* Number of Customer Clusters */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Target Segments (K):</label>
            <input
              type="number"
              min="2"
              max="12"
              value={config.n_clusters}
              onChange={(e) => onChangeConfig({ ...config, n_clusters: parseInt(e.target.value) || 6 })}
              className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-white focus:border-red-500 outline-none"
            />
            <p className="text-[10px] text-zinc-500">Clusters codebook vectors into interpretable customer segments</p>
          </div>
        </div>

        {/* Train SOM Trigger Button */}
        <div className="flex justify-end pt-4 border-t border-neutral-900">
          <button
            onClick={onTrainSOM}
            disabled={isTraining}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/35 flex items-center justify-center space-x-2 transition duration-200 disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{isTraining ? 'Training SOM Engine...' : 'Train SOM & Generate U-Matrix'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
