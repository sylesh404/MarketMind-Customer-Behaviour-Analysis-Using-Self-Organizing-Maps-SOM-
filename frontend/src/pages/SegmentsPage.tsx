import React, { useState, useMemo } from 'react';
import { RefreshCw, Search, Filter } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { SegmentCard } from '../components/SegmentCard';
import { CustomerModal } from '../components/CustomerModal';
import { ModelRequiredCard } from '../components/ModelRequiredCard';
import type { SOMAnalysisResult, CustomerProfile } from '../types';
import type { TabType } from '../components/Sidebar';

interface SegmentsPageProps {
  analysis: SOMAnalysisResult | null;
  customers: CustomerProfile[];
  onRecluster: (nClusters: number) => void;
  isReclustering: boolean;
  hasDataset?: boolean;
  datasetName?: string;
  rowCount?: number;
  isTraining?: boolean;
  onTrainSOM?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

const SEGMENT_PALETTE = ['#ef4444', '#dc2626', '#b91c1c', '#f87171', '#991b1b', '#fca5a5', '#e11d48', '#fda4af'];

export const SegmentsPage: React.FC<SegmentsPageProps> = ({
  analysis,
  customers,
  onRecluster,
  isReclustering,
  hasDataset = true,
  datasetName = 'dataset.csv',
  rowCount = 1000,
  isTraining = false,
  onTrainSOM = () => {},
  onNavigateTab = () => {}
}) => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [targetK, setTargetK] = useState(6);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Risk Distribution per Segment Data
  const riskPerSegmentData = useMemo(() => {
    if (!analysis || !analysis.segments) return [];
    return analysis.segments.map(seg => {
      const segCusts = customers.filter(c => c.segment_id === seg.segment_id);
      const low = segCusts.filter(c => c.risk_level === 'Low Risk').length;
      const med = segCusts.filter(c => c.risk_level === 'Medium Risk').length;
      const high = segCusts.filter(c => c.risk_level === 'High Risk').length;
      return {
        name: seg.badge.split(' ')[0] + ' ' + seg.name.split(' ')[0],
        fullName: seg.name,
        'Low Risk': low,
        'Medium Risk': med,
        'High Risk': high,
        total: segCusts.length
      };
    });
  }, [analysis, customers]);

  // Filtered customer table
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSeg = selectedSegmentId === null || c.segment_id === selectedSegmentId;
      const matchRisk = riskFilter === 'all' || c.risk_level === riskFilter;
      const matchSearch = !searchQuery || String(c.Customer_ID).includes(searchQuery);
      return matchSeg && matchRisk && matchSearch;
    });
  }, [customers, selectedSegmentId, riskFilter, searchQuery]);

  if (!analysis) {
    return (
      <ModelRequiredCard
        featureName="Customer Segments & Behavioral Archetypes"
        featureDescription="Hierarchical Agglomerative Clustering executed over SOM codebook vectors to reveal actionable customer segments (VIPs, Loyal buyers, At-Risk churners, and Discount Hunters)."
        hasDataset={hasDataset}
        datasetName={datasetName}
        rowCount={rowCount}
        isTraining={isTraining}
        onTrainSOM={onTrainSOM}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  // Calculate overall dataset benchmarks for comparisons
  const totalCustomers = customers.length || 1;
  const overallAvgSpend = Math.round(customers.reduce((acc, c) => acc + (c.Total_Spending || 0), 0) / totalCustomers);

  // 1. Spending & Revenue Comparison Data
  const spendingComparisonData = analysis.segments.map(seg => ({
    name: seg.badge.split(' ')[0] + ' ' + seg.name.split(' ')[0],
    fullName: seg.name,
    segmentSpend: seg.average_spending,
    benchmarkSpend: overallAvgSpend,
    revenueShare: seg.revenue_contribution
  }));

  // Scatter data for Spending vs Frequency
  const scatterData = customers.map(c => ({
    x: c.Purchase_Frequency || 0,
    y: c.Total_Spending || 0,
    segment_id: c.segment_id || 0,
    customer_id: c.Customer_ID,
    risk_level: c.risk_level || 'Low Risk',
    color: SEGMENT_PALETTE[(c.segment_id || 0) % SEGMENT_PALETTE.length]
  }));

  const getSegmentForCustomer = (cust: CustomerProfile) => {
    return analysis.segments.find(s => s.segment_id === cust.segment_id);
  };

  return (
    <div className="space-y-8">
      {/* Header & Dynamic Re-clustering Controls */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-white">Customer Segments & Behavioral Archetypes</h2>
          <p className="text-xs text-zinc-400">
            Hierarchical Agglomerative Clustering executed over SOM codebook vectors ({analysis.segments.length} active segments)
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-neutral-950/90 p-2 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium pl-2">Target Clusters (K):</span>
          <input
            type="number"
            min="2"
            max="10"
            value={targetK}
            onChange={(e) => setTargetK(parseInt(e.target.value) || 6)}
            className="w-14 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white text-center focus:border-red-500 focus:outline-none"
          />
          <button
            onClick={() => onRecluster(targetK)}
            disabled={isReclustering}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 disabled:opacity-50 shadow-lg shadow-red-600/25"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReclustering ? 'animate-spin' : ''}`} />
            <span>{isReclustering ? 'Reclustering...' : 'Recluster (No Retrain)'}</span>
          </button>
        </div>
      </div>

      {/* Segment Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Behavioral Archetype Profiles (Click card to filter customer table)
          </span>
          {selectedSegmentId !== null && (
            <button
              onClick={() => setSelectedSegmentId(null)}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              Clear Segment Selection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {analysis.segments.map((seg) => (
            <SegmentCard
              key={seg.segment_id}
              segment={seg}
              isSelected={selectedSegmentId === seg.segment_id}
              onSelectSegment={(id) => setSelectedSegmentId(selectedSegmentId === id ? null : id)}
            />
          ))}
        </div>
      </div>

      {/* Meaningful Business Comparison Visualizations */}
      <div className="space-y-4">
        <h3 className="font-bold text-white text-sm">Cross-Segment Comparative Analytics</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Segment Spending vs Dataset Average */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-900 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-white text-xs">Average Spending vs. Dataset Benchmark</h4>
              <span className="text-[11px] text-red-400 font-mono">Dataset Avg: ₹{overallAvgSpend.toLocaleString()}</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingComparisonData}>
                  <XAxis dataKey="name" stroke="#52525b" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis stroke="#52525b" tick={{ fontSize: 11, fill: '#a1a1aa' }} unit="₹" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 rounded-xl bg-neutral-950 border border-zinc-800 text-xs space-y-1 shadow-2xl">
                            <p className="font-bold text-white">{d.fullName}</p>
                            <p className="text-red-400 font-bold">Segment Avg Spend: ₹{d.segmentSpend.toLocaleString()}</p>
                            <p className="text-zinc-400">Dataset Benchmark: ₹{d.benchmarkSpend.toLocaleString()}</p>
                            <p className="text-rose-400">Revenue Contribution: {d.revenueShare}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="segmentSpend" name="Segment Spending" radius={[6, 6, 0, 0]}>
                    {spendingComparisonData.map((_, index) => (
                      <Cell key={`cell-spend-${index}`} fill={SEGMENT_PALETTE[index % SEGMENT_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Risk Distribution per Segment */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-900 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-white text-xs">Retention Risk Composition per Segment</h4>
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded bg-zinc-600" /><span>Low</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded bg-rose-800" /><span>Med</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded bg-red-600" /><span>High</span></span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskPerSegmentData}>
                  <XAxis dataKey="name" stroke="#52525b" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis stroke="#52525b" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 rounded-xl bg-neutral-950 border border-zinc-800 text-xs space-y-1 shadow-2xl">
                            <p className="font-bold text-white">{d.fullName} ({d.total} Cust)</p>
                            <p className="text-zinc-400">Low Risk: {d['Low Risk']} ({Math.round(d['Low Risk']/d.total*100)}%)</p>
                            <p className="text-rose-400">Medium Risk: {d['Medium Risk']} ({Math.round(d['Medium Risk']/d.total*100)}%)</p>
                            <p className="text-red-500 font-bold">High Risk: {d['High Risk']} ({Math.round(d['High Risk']/d.total*100)}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Low Risk" stackId="a" fill="#52525b" />
                  <Bar dataKey="Medium Risk" stackId="a" fill="#9f1239" />
                  <Bar dataKey="High Risk" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 2D Scatter: Purchase Frequency vs Spending */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white text-xs">Customer Value Mapping: Purchase Frequency vs. Total Spending</h4>
            <span className="text-[11px] text-zinc-400 font-mono">1 Dot = 1 Customer Profile (Click dot to open profile)</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <XAxis type="number" dataKey="x" name="Purchase Freq" unit=" orders/yr" stroke="#52525b" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis type="number" dataKey="y" name="Total Spend" unit=" ₹" stroke="#52525b" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const seg = analysis.segments.find(s => s.segment_id === d.segment_id);
                      return (
                        <div className="p-3 rounded-xl bg-neutral-950 border border-zinc-800 text-xs space-y-1 shadow-2xl">
                          <p className="font-mono font-bold text-red-400">Customer #{d.customer_id}</p>
                          <p className="text-zinc-300">Purchase Frequency: {d.x} orders/yr</p>
                          <p className="text-red-400 font-bold">Total Spend: ₹{d.y.toLocaleString()}</p>
                          <p className="text-zinc-400">Risk Tier: {d.risk_level}</p>
                          {seg && <p className="text-red-300 font-semibold pt-1 border-t border-zinc-800">{seg.badge} {seg.name}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={scatterData}
                  onClick={(data: any) => {
                    const cust = customers.find(c => c.Customer_ID === data?.payload?.customer_id);
                    if (cust) setSelectedCustomer(cust);
                  }}
                >
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-scatter-${index}`} fill={entry.color} opacity={0.75} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer Roster Table with Search and Risk Filters */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-sm">
              {selectedSegmentId !== null
                ? `Customers in ${analysis.segments.find(s => s.segment_id === selectedSegmentId)?.name} (${filteredCustomers.length})`
                : `Customer Population Roster (${filteredCustomers.length} Records)`}
            </h3>
            <p className="text-[11px] text-zinc-400">Filtered view mapped to SOM Best Matching Unit coordinates</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Risk filter selector */}
            <div className="flex items-center space-x-1.5 bg-neutral-950/90 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-transparent text-zinc-200 outline-none text-xs"
              >
                <option value="all" className="bg-neutral-900">All Risk Tiers</option>
                <option value="Low Risk" className="bg-neutral-900">Low Risk</option>
                <option value="Medium Risk" className="bg-neutral-900">Medium Risk</option>
                <option value="High Risk" className="bg-neutral-900">High Risk</option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-neutral-950/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none w-36"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800 max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-zinc-400 uppercase font-mono border-b border-zinc-800 sticky top-0">
              <tr>
                <th className="p-3">Customer ID</th>
                <th className="p-3">Annual Income</th>
                <th className="p-3">Total Spending</th>
                <th className="p-3">Purchase Freq</th>
                <th className="p-3">Recency</th>
                <th className="p-3">SOM (X, Y)</th>
                <th className="p-3">Segment</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono">
              {filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((c) => {
                const seg = getSegmentForCustomer(c);
                return (
                  <tr key={c.Customer_ID} className="hover:bg-zinc-950/80 transition">
                    <td className="p-3 font-bold text-white">#{c.Customer_ID}</td>
                    <td className="p-3 text-zinc-300">₹{(c.Annual_Income || 0).toLocaleString()}</td>
                    <td className="p-3 text-red-400 font-bold">₹{(c.Total_Spending || 0).toLocaleString()}</td>
                    <td className="p-3 text-zinc-300">{c.Purchase_Frequency} orders/yr</td>
                    <td className="p-3 text-zinc-300">{c.Recency} days</td>
                    <td className="p-3 text-red-400">({c.bmu_x}, {c.bmu_y})</td>
                    <td className="p-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-300 font-sans font-semibold border border-red-500/20">
                        {seg?.badge} {seg?.name}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-semibold ${
                        c.risk_level === 'High Risk' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        c.risk_level === 'Medium Risk' ? 'bg-rose-950/40 text-rose-300 border border-rose-900/40' : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {c.risk_level || 'Low Risk'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-red-950/40 text-red-300 font-sans text-xs transition border border-zinc-800 hover:border-red-500/40"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Navigation Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-neutral-950 border border-zinc-800 text-zinc-200 rounded px-2 py-1 outline-none font-mono"
            >
              <option value={10} className="bg-neutral-900">10</option>
              <option value={25} className="bg-neutral-900">25</option>
              <option value={50} className="bg-neutral-900">50</option>
              <option value={100} className="bg-neutral-900">100</option>
            </select>
            <span>
              Showing {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredCustomers.length)} of {filteredCustomers.length.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-2 font-mono">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 rounded bg-neutral-900 text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-sans transition border border-zinc-800 hover:border-red-500/40"
            >
              Previous
            </button>
            <span className="px-2">
              Page {currentPage} of {Math.max(1, Math.ceil(filteredCustomers.length / pageSize))}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredCustomers.length / pageSize), p + 1))}
              disabled={currentPage >= Math.ceil(filteredCustomers.length / pageSize)}
              className="px-3 py-1 rounded bg-neutral-900 text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-sans transition border border-zinc-800 hover:border-red-500/40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <CustomerModal
        customer={selectedCustomer}
        segment={selectedCustomer ? getSegmentForCustomer(selectedCustomer) : undefined}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
};
