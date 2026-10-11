import React from 'react';
import {
  X,
  User,
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Radar as RadarIcon,
  Globe,
  Percent,
  TrendingUp,
  Tag
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import type { CustomerProfile, Segment } from '../types';

interface CustomerModalProps {
  customer: CustomerProfile | null;
  segment?: Segment;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ customer, segment, onClose }) => {
  if (!customer) return null;

  // Behavioral Radar Chart Data normalized 0 - 100 for visual comparison
  const radarData = [
    { subject: 'Income', value: Math.min(100, Math.round(((customer.Annual_Income || 0) / 2500000) * 100)) },
    { subject: 'Spending', value: customer.Spending_Score || Math.min(100, Math.round(((customer.Total_Spending || 0) / 300000) * 100)) },
    { subject: 'Frequency', value: Math.min(100, Math.round(((customer.Purchase_Frequency || 0) / 30) * 100)) },
    { subject: 'Recency (Inv)', value: Math.max(0, Math.round(100 - ((customer.Recency || 0) / 365) * 100)) },
    { subject: 'Discount %', value: Math.min(100, Math.round((customer.Discount_Usage || 0) * 100)) },
    { subject: 'Visits', value: Math.min(100, Math.round(((customer.Website_Visits || 0) / 100) * 100)) }
  ];

  const getRiskBadge = (level?: string, score?: number) => {
    const scoreText = score !== undefined ? ` (${score}/100)` : '';
    if (level === 'High Risk') {
      return (
        <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>High Churn Risk{scoreText}</span>
        </span>
      );
    }
    if (level === 'Medium Risk') {
      return (
        <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/40 text-rose-300 border border-rose-900/40 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Medium Risk{scoreText}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Low Risk{scoreText}</span>
      </span>
    );
  };

  // Comparisons against segment benchmark
  const customerSpend = customer.Total_Spending || 0;
  const segmentAvgSpend = segment?.average_spending || customerSpend;
  const spendDiffPct = segmentAvgSpend > 0 ? Math.round(((customerSpend - segmentAvgSpend) / segmentAvgSpend) * 100) : 0;

  const customerFreq = customer.Purchase_Frequency || 0;
  const segmentAvgFreq = segment?.purchase_frequency || customerFreq;

  const customerRecency = customer.Recency || 0;
  const segmentAvgRecency = segment?.recency || customerRecency;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 p-0.5 flex items-center justify-center shadow-lg shadow-red-600/25">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <User className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-bold text-white font-mono">Customer #{customer.Customer_ID}</h2>
                {getRiskBadge(customer.risk_level, customer.risk_score)}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {customer.Age ? `${customer.Age} yrs old` : 'Age N/A'} {customer.Gender ? `• ${customer.Gender}` : ''}
                {segment ? ` • Assigned to ${segment.badge} ${segment.name}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-neutral-900 text-zinc-400 hover:text-white hover:bg-neutral-800 transition border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top SOM Coordinates & BMU Distance Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-neutral-950 border border-zinc-800">
              <div className="flex items-center space-x-1.5 text-zinc-400 text-xs mb-1">
                <Cpu className="w-3.5 h-3.5 text-red-400" />
                <span>BMU Position</span>
              </div>
              <p className="text-base font-bold text-red-400 font-mono">
                ({customer.bmu_x ?? '-'}, {customer.bmu_y ?? '-'})
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-zinc-800">
              <div className="flex items-center space-x-1.5 text-zinc-400 text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                <span>Distance to BMU</span>
              </div>
              <p className="text-base font-bold text-rose-300 font-mono">
                {customer.distance !== undefined ? customer.distance.toFixed(4) : '-'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-zinc-800">
              <div className="flex items-center space-x-1.5 text-zinc-400 text-xs mb-1">
                <Tag className="w-3.5 h-3.5 text-red-500" />
                <span>Assigned Segment</span>
              </div>
              <p className="text-sm font-bold text-red-300 truncate">
                {segment ? `${segment.badge} ${segment.name}` : `Segment ${customer.segment_id ?? 0}`}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-zinc-800">
              <div className="flex items-center space-x-1.5 text-zinc-400 text-xs mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span>Behavioural Retention Risk</span>
              </div>
              <p className="text-sm font-bold text-zinc-200 font-sans">
                {customer.risk_level || 'Low Risk'} {customer.risk_score !== undefined ? `(${customer.risk_score}/100)` : ''}
              </p>
            </div>
          </div>

          {/* Full Behavioural Profile Attributes */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Customer Behavioral Profile Metrics
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-neutral-950/80 border border-zinc-900">
                <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                  <DollarSign className="w-3 h-3 text-red-400" />
                  <span>Annual Income</span>
                </span>
                <p className="text-sm font-bold text-zinc-100 font-mono mt-1">
                  ₹{(customer.Annual_Income || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-zinc-900">
                <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                  <DollarSign className="w-3 h-3 text-red-400" />
                  <span>Total Spending</span>
                </span>
                <p className="text-sm font-bold text-red-400 font-mono mt-1">
                  ₹{(customer.Total_Spending || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-zinc-900">
                <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                  <ShoppingBag className="w-3 h-3 text-red-500" />
                  <span>Purchase Frequency</span>
                </span>
                <p className="text-sm font-bold text-zinc-200 font-mono mt-1">
                  {customer.Purchase_Frequency || 0} orders/yr
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-zinc-900">
                <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>Recency</span>
                </span>
                <p className="text-sm font-bold text-zinc-200 font-mono mt-1">
                  {customer.Recency || 0} days ago
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-zinc-900">
                <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-red-400" />
                  <span>Spending Score (1-100)</span>
                </span>
                <p className="text-sm font-bold text-red-300 font-mono mt-1">
                  {customer.Spending_Score || '-'} / 100
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-zinc-900">
                <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                  <DollarSign className="w-3 h-3 text-red-400" />
                  <span>Avg Order Value (AOV)</span>
                </span>
                <p className="text-sm font-bold text-zinc-100 font-mono mt-1">
                  ₹{(customer.Average_Order_Value || (customer.Total_Spending && customer.Purchase_Frequency ? Math.round(customer.Total_Spending / customer.Purchase_Frequency) : 0)).toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-zinc-900">
                <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-rose-400" />
                  <span>Website Visits</span>
                </span>
                <p className="text-sm font-bold text-zinc-200 font-mono mt-1">
                  {customer.Website_Visits ?? 0} visits
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-zinc-900">
                <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                  <Percent className="w-3 h-3 text-red-500" />
                  <span>Discount Usage</span>
                </span>
                <p className="text-sm font-bold text-rose-300 font-mono mt-1">
                  {Math.round((customer.Discount_Usage || 0) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Radar Chart & Benchmark Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Behavioral Radar */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-zinc-900 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-300">
                <RadarIcon className="w-4 h-4 text-red-500" />
                <span>Normalized Behavioral Feature Signature</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#3f3f46" tick={false} />
                    <Radar name="Customer" dataKey="value" stroke="#ef4444" fill="#dc2626" fillOpacity={0.35} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Segment Comparison & Recommended Strategy */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-zinc-900 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Benchmark vs. Segment Averages
                </span>
                
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-zinc-800 flex justify-between items-center">
                    <span className="text-zinc-400">Total Spending:</span>
                    <div className="text-right">
                      <span className="font-bold text-red-400 font-mono">₹{customerSpend.toLocaleString()}</span>
                      <span className="text-[10px] text-zinc-400 ml-1.5 font-mono">
                        (Seg Avg: ₹{segmentAvgSpend.toLocaleString()} | {spendDiffPct >= 0 ? `+${spendDiffPct}%` : `${spendDiffPct}%`})
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-zinc-800 flex justify-between items-center">
                    <span className="text-zinc-400">Purchase Frequency:</span>
                    <div className="text-right">
                      <span className="font-bold text-zinc-200 font-mono">{customerFreq} orders</span>
                      <span className="text-[10px] text-zinc-400 ml-1.5 font-mono">
                        (Seg Avg: {segmentAvgFreq})
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-zinc-800 flex justify-between items-center">
                    <span className="text-zinc-400">Recency Freshness:</span>
                    <div className="text-right">
                      <span className="font-bold text-zinc-200 font-mono">{customerRecency} days</span>
                      <span className="text-[10px] text-zinc-400 ml-1.5 font-mono">
                        (Seg Avg: {segmentAvgRecency} days)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Marketing Strategy */}
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Recommended Actionable Strategy
                </span>
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-xs text-red-300 space-y-1">
                  <p className="font-bold">
                    {segment ? `${segment.name} Playbook:` : 'Direct Engagement Strategy:'}
                  </p>
                  <p className="text-zinc-300 leading-relaxed">
                    {segment?.recommendation || 'Deploy targeted promotional re-engagement sequence.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
