import React, { useState } from 'react';
import { Grid, Users } from 'lucide-react';
import { UMatrixGrid } from '../components/UMatrixGrid';
import { CustomerScatter } from '../components/CustomerScatter';
import { CustomerModal } from '../components/CustomerModal';
import { ModelRequiredCard } from '../components/ModelRequiredCard';
import type { SOMAnalysisResult, CustomerProfile } from '../types';
import type { TabType } from '../components/Sidebar';

interface SOMAnalysisPageProps {
  analysis: SOMAnalysisResult | null;
  umatrixData: any;
  customers: CustomerProfile[];
  hasDataset?: boolean;
  datasetName?: string;
  rowCount?: number;
  isTraining?: boolean;
  onTrainSOM?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const SOMAnalysisPage: React.FC<SOMAnalysisPageProps> = ({
  analysis,
  umatrixData,
  customers,
  hasDataset = true,
  datasetName = 'dataset.csv',
  rowCount = 1000,
  isTraining = false,
  onTrainSOM = () => {},
  onNavigateTab = () => {}
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [selectedNodeCustomers, setSelectedNodeCustomers] = useState<CustomerProfile[]>([]);

  if (!analysis) {
    return (
      <ModelRequiredCard
        featureName="Topological U-Matrix Heatmap"
        featureDescription="Project high-dimensional customer vectors onto a 2D neural lattice, visualising natural cluster boundaries, ridges, and customer node density."
        hasDataset={hasDataset}
        datasetName={datasetName}
        rowCount={rowCount}
        isTraining={isTraining}
        onTrainSOM={onTrainSOM}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  const handleSelectNodeCustomers = (nodeKey: string, custs: CustomerProfile[]) => {
    setSelectedNodeKey(nodeKey);
    setSelectedNodeCustomers(custs);
  };

  const getSegmentForCustomer = (cust: CustomerProfile) => {
    return analysis.segments.find(s => s.segment_id === cust.segment_id);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Grid Topology</span>
          <p className="text-lg font-bold text-white font-mono">
            {analysis.grid_width} x {analysis.grid_height} ({analysis.grid_width * analysis.grid_height} Neurons)
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1 border-red-950/40">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Quantization Error</span>
          <p className="text-lg font-bold text-red-400 font-mono">{analysis.quantization_error}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1 border-red-950/40">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Topographic Error</span>
          <p className="text-lg font-bold text-rose-400 font-mono">{analysis.topographic_error}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1 border-red-950/40">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Mapped Customers</span>
          <p className="text-lg font-bold text-red-500 font-mono">{customers.length.toLocaleString()}</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1 border-red-950/40">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Customer Segments</span>
          <p className="text-lg font-bold text-red-300 font-mono">{analysis.segments.length}</p>
        </div>
      </div>

      {/* Main Interactive U-Matrix Heatmap */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white">U-Matrix Distance Heatmap</h2>
          </div>
          <span className="text-xs text-zinc-400">Hover cell to inspect neuron | Click cell to view node customer roster</span>
        </div>

        <UMatrixGrid
          umatrix={umatrixData?.umatrix || analysis.umatrix}
          nodeCounts={analysis.node_counts}
          nodeSegmentMatrix={analysis.node_segment_matrix}
          nodeCustomers={umatrixData?.node_customers}
          segments={analysis.segments}
          onSelectNodeCustomers={handleSelectNodeCustomers}
          onSelectCustomer={(c) => setSelectedCustomer(c)}
        />
      </div>

      {/* Selected Node Customer Roster Modal / Drawer */}
      {selectedNodeKey && (
        <div className="glass-panel p-6 rounded-2xl border border-red-600/30 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-white text-sm">
                Customers Mapped to SOM Node ({selectedNodeKey})
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-300 font-mono border border-red-500/30">
                {selectedNodeCustomers.length} Customers
              </span>
            </div>
            <button
              onClick={() => setSelectedNodeKey(null)}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
            {selectedNodeCustomers.map((c) => (
              <div
                key={c.Customer_ID}
                onClick={() => setSelectedCustomer(c)}
                className="p-3 rounded-xl bg-neutral-950/90 border border-zinc-800 hover:border-red-500/60 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-mono font-bold text-white">#{c.Customer_ID}</p>
                  <p className="text-[11px] text-zinc-400">Spend: ₹{(c.Total_Spending || 0).toLocaleString()}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold border border-red-500/20">
                  View Profile
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2D Topological Customer Scatter Overlay Map */}
      <CustomerScatter
        customers={customers}
        segments={analysis.segments}
        gridWidth={analysis.grid_width}
        gridHeight={analysis.grid_height}
        onSelectCustomer={(c) => setSelectedCustomer(c)}
      />

      {/* Detailed Customer Profile Popup */}
      <CustomerModal
        customer={selectedCustomer}
        segment={selectedCustomer ? getSegmentForCustomer(selectedCustomer) : undefined}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
};
