import React, { useState } from 'react';
import { Crosshair, HelpCircle, ZoomIn, ZoomOut, RotateCcw, Filter, Search, User } from 'lucide-react';
import type { CustomerProfile, Segment } from '../types';

interface UMatrixGridProps {
  umatrix: number[][];
  nodeCounts?: number[][];
  nodeSegmentMatrix?: number[][];
  nodeCustomers?: Record<string, CustomerProfile[]>;
  segments?: Segment[];
  onSelectNodeCustomers?: (nodeKey: string, customers: CustomerProfile[]) => void;
  onSelectCustomer?: (customer: CustomerProfile) => void;
}

const SEGMENT_PALETTE = ['#ef4444', '#dc2626', '#b91c1c', '#f87171', '#991b1b', '#fca5a5', '#e11d48', '#fda4af'];

export const UMatrixGrid: React.FC<UMatrixGridProps> = ({
  umatrix,
  nodeCounts,
  nodeSegmentMatrix,
  nodeCustomers,
  segments,
  onSelectNodeCustomers,
  onSelectCustomer
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [filterSegmentId, setFilterSegmentId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState<string>('');

  if (!umatrix || umatrix.length === 0) {
    return <div className="p-8 text-center text-zinc-500">No U-Matrix data available.</div>;
  }

  const gridHeight = umatrix[0].length;

  // Find min and max distance for color normalization
  let minDist = Infinity;
  let maxDist = -Infinity;
  umatrix.forEach(row => {
    row.forEach(val => {
      if (val < minDist) minDist = val;
      if (val > maxDist) maxDist = val;
    });
  });

  const getCellColor = (val: number) => {
    const norm = (val - minDist) / (maxDist - minDist || 1);
    // Black & Red palette: pure deep dark red-black for cluster valley to bright crimson for high distance boundaries
    if (norm < 0.25) return `rgba(18, 5, 5, ${0.95 + norm * 0.2})`;
    if (norm < 0.5) return `rgba(127, 29, 29, ${0.8 + norm * 0.3})`;
    if (norm < 0.75) return `rgba(185, 28, 28, ${0.85 + norm * 0.2})`;
    return `rgba(239, 68, 68, ${0.92 + norm * 0.08})`;
  };

  const getSegmentForNode = (x: number, y: number): Segment | undefined => {
    if (!nodeSegmentMatrix || !segments) return undefined;
    const segId = nodeSegmentMatrix[x]?.[y];
    return segments.find(s => s.segment_id === segId);
  };

  const handleCellClick = (x: number, y: number) => {
    setSelectedCell({ x, y });
    const key = `${x},${y}`;
    const custs = nodeCustomers?.[key] || [];
    if (onSelectNodeCustomers) {
      onSelectNodeCustomers(key, custs);
    }
  };

  const activeTarget = hoveredCell || selectedCell;
  let inspectedData: {
    x: number;
    y: number;
    val: number;
    count: number;
    seg?: Segment;
    avgSpend: number;
    customers: CustomerProfile[];
  } | null = null;

  if (activeTarget) {
    const { x, y } = activeTarget;
    const val = umatrix[x]?.[y] ?? 0;
    const count = nodeCounts?.[x]?.[y] || 0;
    const seg = getSegmentForNode(x, y);
    const custs = nodeCustomers?.[`${x},${y}`] || [];
    
    let avgSpend = seg?.average_spending || 0;
    if (custs.length > 0) {
      const sumSpend = custs.reduce((acc, c) => acc + (c.Total_Spending || 0), 0);
      avgSpend = Math.round(sumSpend / custs.length);
    }

    inspectedData = {
      x,
      y,
      val,
      count,
      seg,
      avgSpend,
      customers: custs
    };
  }

  // Filtered customer sample in selected node inspector
  const filteredNodeCusts = inspectedData?.customers.filter(c => {
    if (!customerSearch) return true;
    const query = customerSearch.toLowerCase();
    return String(c.Customer_ID).toLowerCase().includes(query) ||
           (c.risk_level && c.risk_level.toLowerCase().includes(query));
  }) || [];

  return (
    <div className="space-y-4">
      {/* Controls Bar: Zoom & Segment Filtering */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-950 border border-zinc-900 text-xs">
        {/* Segment Filter Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5 text-zinc-400 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-red-500" />
            <span>Filter Segment:</span>
          </div>
          <button
            onClick={() => setFilterSegmentId(null)}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filterSegmentId === null
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-md shadow-red-600/30'
                : 'bg-neutral-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Segments
          </button>
          {segments?.map((seg) => {
            const isFilterActive = filterSegmentId === seg.segment_id;
            return (
              <button
                key={seg.segment_id}
                onClick={() => setFilterSegmentId(isFilterActive ? null : seg.segment_id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  isFilterActive
                    ? 'ring-2 ring-red-500 bg-neutral-900 text-white font-bold border border-red-500/50'
                    : 'bg-neutral-900/80 text-zinc-400 hover:text-white border border-zinc-800/80'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SEGMENT_PALETTE[seg.segment_id % SEGMENT_PALETTE.length] }}
                />
                <span className="truncate max-w-[120px]">{seg.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2 bg-neutral-900 px-2 py-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setZoomScale(prev => Math.max(0.75, prev - 0.15))}
            title="Zoom Out"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-zinc-300 w-12 text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => setZoomScale(prev => Math.min(1.6, prev + 0.15))}
            title="Zoom In"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomScale(1.0)}
            title="Reset Zoom"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-neutral-800 transition ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Canvas & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Grid View */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col items-center justify-center overflow-hidden border border-zinc-900">
          <div className="overflow-auto max-w-full p-2">
            <div
              className="grid gap-1.5 p-3 rounded-2xl bg-black border border-zinc-900 shadow-2xl transition-transform duration-200"
              style={{
                gridTemplateColumns: `repeat(${gridHeight}, minmax(0, 1fr))`,
                transform: `scale(${zoomScale})`,
                transformOrigin: 'center center'
              }}
            >
              {umatrix.map((row, x) =>
                row.map((val, y) => {
                  const count = nodeCounts?.[x]?.[y] || 0;
                  const seg = getSegmentForNode(x, y);
                  const isSelected = selectedCell?.x === x && selectedCell?.y === y;
                  const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

                  // Segment filter dimmed state
                  const isDimmed = filterSegmentId !== null && seg?.segment_id !== filterSegmentId;

                  return (
                    <div
                      key={`${x}-${y}`}
                      onMouseEnter={() => setHoveredCell({ x, y })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => handleCellClick(x, y)}
                      style={{ backgroundColor: getCellColor(val) }}
                      className={`umatrix-cell relative w-9 h-9 md:w-11 md:h-11 rounded-lg cursor-pointer flex flex-col items-center justify-center border transition-all duration-150 ${
                        isDimmed
                          ? 'opacity-20 grayscale'
                          : isSelected
                          ? 'border-red-500 ring-2 ring-red-500/70 scale-110 z-20 shadow-lg shadow-red-600/50'
                          : isHovered
                          ? 'border-red-400 scale-105 z-10 shadow-md'
                          : 'border-white/10 hover:border-red-500/50'
                      }`}
                    >
                      {/* Customer Count on Node */}
                      {count > 0 && (
                        <span className="text-[10px] font-bold text-white font-mono drop-shadow-md">
                          {count}
                        </span>
                      )}

                      {/* Cluster Color Indicator Dot */}
                      {seg && (
                        <span
                          className="w-1.5 h-1.5 rounded-full absolute bottom-1 right-1 shadow-sm"
                          style={{
                            backgroundColor: SEGMENT_PALETTE[seg.segment_id % SEGMENT_PALETTE.length]
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Color Bar Scale Legend */}
          <div className="flex items-center justify-between w-full max-w-md pt-4 mt-2 border-t border-zinc-900 text-[11px] text-zinc-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-black border border-red-950" />
              <span>Cluster Centers (Low Distance)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-600" />
              <span>Boundaries / Ridges (High Distance)</span>
            </span>
          </div>
        </div>

        {/* Node Hover & Click Details Inspector */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-zinc-900">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-white text-sm">SOM Node Inspector</h3>
              </div>
              {inspectedData && (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-300 font-bold border border-red-500/30">
                  ({inspectedData.x}, {inspectedData.y})
                </span>
              )}
            </div>

            {inspectedData ? (
              <div className="mt-4 space-y-4">
                {/* Node Details Box */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-zinc-800 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <span className="text-zinc-400 font-sans">SOM Node:</span>
                    <span className="font-bold text-red-400">({inspectedData.x}, {inspectedData.y})</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-sans">U-Matrix Distance:</span>
                    <span className="font-bold text-rose-300">{inspectedData.val.toFixed(4)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-sans">Customers:</span>
                    <span className="font-bold text-white px-2 py-0.5 rounded bg-red-600/20 text-red-300 border border-red-500/30">
                      {inspectedData.count}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-sans">Segment:</span>
                    <span className="font-bold text-red-400 font-sans">
                      {inspectedData.seg ? `${inspectedData.seg.badge} ${inspectedData.seg.name}` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                    <span className="text-zinc-400 font-sans">Average Spending:</span>
                    <span className="font-bold text-red-400">₹{inspectedData.avgSpend.toLocaleString()}</span>
                  </div>
                </div>

                {/* Customer Roster in Node with Search Filter */}
                {inspectedData.customers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-300 font-semibold">Customers in Neuron:</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {filteredNodeCusts.length} / {inspectedData.customers.length}
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search ID or Risk Level..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {filteredNodeCusts.map((c) => (
                        <div
                          key={c.Customer_ID}
                          onClick={() => onSelectCustomer && onSelectCustomer(c)}
                          className="p-2.5 rounded-xl bg-neutral-900/90 border border-zinc-800 hover:border-red-500/50 cursor-pointer transition flex items-center justify-between text-xs group"
                        >
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <User className="w-3 h-3 text-zinc-400 group-hover:text-red-400" />
                              <span className="font-mono font-bold text-white">#{c.Customer_ID}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans ${
                                c.risk_level === 'High Risk' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                c.risk_level === 'Medium Risk' ? 'bg-rose-950/40 text-rose-300 border border-rose-900/40' : 'bg-zinc-800 text-zinc-300'
                              }`}>
                                {c.risk_level || 'Low Risk'}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              ₹{(c.Total_Spending || 0).toLocaleString()} • {c.Purchase_Frequency || 0} orders
                            </span>
                          </div>
                          <span className="text-[10px] text-red-400 group-hover:text-red-300 font-semibold underline">
                            View
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-12 text-center text-zinc-500 text-xs space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-zinc-600 animate-pulse" />
                <p>Hover or click any SOM grid cell to inspect neuron coordinates, distance, and mapped customers.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
