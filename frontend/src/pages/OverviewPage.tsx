import React from 'react';
import {
  Users,
  DollarSign,
  ShoppingBag,
  Layers,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Percent
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import type { DatasetInfo, SOMAnalysisResult, CustomerProfile, RiskSummary, MarketInsight } from '../types';

interface OverviewPageProps {
  dataset: DatasetInfo | null;
  analysis: SOMAnalysisResult | null;
  customers?: CustomerProfile[];
  riskSummary?: RiskSummary | null;
  insights?: MarketInsight[];
  onNavigateTab: (tab: any) => void;
}

const SEGMENT_COLORS = ['#ef4444', '#dc2626', '#b91c1c', '#f87171', '#991b1b', '#fca5a5', '#e11d48', '#fda4af'];
const RISK_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const OverviewPage: React.FC<OverviewPageProps> = ({
  dataset,
  analysis,
  customers: _customers = [],
  riskSummary,
  insights: _insights = [],
  onNavigateTab
}) => {
  if (!dataset) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center glass-panel rounded-2xl my-8 space-y-4 border border-red-900/30">
        <Users className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
        <h2 className="text-xl font-bold text-zinc-100">No Active Dataset Loaded</h2>
        <p className="text-sm text-zinc-400">Please upload a customer dataset or load the sample demo dataset to view analytics.</p>
        <button
          onClick={() => onNavigateTab('dataset')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs shadow-lg shadow-red-600/30"
        >
          Go to Dataset Upload
        </button>
      </div>
    );
  }

  // Purely computed metrics directly from backend results
  const totalCustomers = analysis?.mapped_customers_count || dataset.row_count || 0;
  
  // Real revenue calculated from segments (avg_spending * count)
  let totalRevenue = 0;
  let avgSpending = 0;
  let avgOrderValue = 0;
  let highRiskCount = 0;
  let atRiskPct = 0;

  if (analysis && analysis.segments.length > 0) {
    totalRevenue = analysis.segments.reduce((acc, s) => acc + (s.average_spending * s.customer_count), 0);
    avgSpending = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
    
    const totalAOVWeight = analysis.segments.reduce((acc, s) => {
      const aov = s.average_order_value || (s.purchase_frequency > 0 ? s.average_spending / s.purchase_frequency : s.average_spending);
      return acc + (aov * s.customer_count);
    }, 0);
    avgOrderValue = totalCustomers > 0 ? Math.round(totalAOVWeight / totalCustomers) : 0;

    const rSum = analysis.risk_summary || riskSummary;
    highRiskCount = rSum?.high_risk_count || 0;
    atRiskPct = rSum?.at_risk_pct || 0;
  } else if (dataset.preview && dataset.preview.length > 0) {
    // If not trained yet, calculate transparently from preview sample
    const sampleRevenue = dataset.preview.reduce((acc, row) => acc + (row.Total_Spending || 0), 0);
    avgSpending = Math.round(sampleRevenue / dataset.preview.length);
    totalRevenue = avgSpending * dataset.row_count;
    avgOrderValue = Math.round(dataset.preview.reduce((acc, row) => acc + (row.Average_Order_Value || (row.Total_Spending ? row.Total_Spending / (row.Purchase_Frequency || 1) : 0)), 0) / dataset.preview.length);
  }

  const segmentCount = analysis ? analysis.segments.length : 0;

  // Segment revenue data for charts
  const revenueChartData = analysis ? analysis.segments.map(seg => ({
    name: seg.badge + ' ' + seg.name.split(' ')[0],
    fullName: seg.name,
    revenue: seg.revenue_contribution,
    avgSpend: seg.average_spending,
    customerCount: seg.customer_count,
    share: seg.percentage
  })) : [];

  // Risk distribution for pie chart
  const rSum = analysis?.risk_summary || riskSummary;
  const riskPieData = rSum ? [
    { name: 'Low Risk', value: rSum.low_risk_count, pct: rSum.low_risk_pct },
    { name: 'Medium Risk', value: rSum.medium_risk_count, pct: rSum.medium_risk_pct },
    { name: 'High Risk', value: rSum.high_risk_count, pct: rSum.high_risk_pct }
  ] : [];

  // Top revenue segment
  const topRevenueSegment = analysis?.segments.length 
    ? [...analysis.segments].sort((a, b) => b.revenue_contribution - a.revenue_contribution)[0] 
    : null;

  // Highest risk segment
  const highestRiskSegment = analysis?.segments.find(s => s.name.includes('At-Risk') || s.name.includes('Lapsing')) 
    || analysis?.segments.find(s => s.recency > 60);

  // Highest discount segment
  const discountSegment = analysis?.segments.length
    ? [...analysis.segments].sort((a, b) => (b.discount_usage || 0) - (a.discount_usage || 0))[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-neutral-950 border border-red-900/40">
        <div>
          <h2 className="text-lg font-bold text-white">Executive Customer Analytics Overview</h2>
          <p className="text-xs text-red-300/90">
            {analysis 
              ? `Real-time analytics from SOM neural mapping (${analysis.grid_width}x${analysis.grid_height} lattice, ${segmentCount} behavioral clusters)`
              : `Dataset '${dataset.filename}' loaded. Run SOM training to discover customer segments.`}
          </p>
        </div>
        {!analysis ? (
          <button
            onClick={() => onNavigateTab('features')}
            className="mt-3 sm:mt-0 flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs transition shadow-md shadow-red-600/30"
          >
            <span>Proceed to SOM Training</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="mt-3 sm:mt-0 flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-600/30 text-xs text-red-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-red-400" />
            <span>SOM Model Trained & Mapped</span>
          </div>
        )}
      </div>

      {/* KPI Cards — Purely Derived from Backend */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Total Customers</span>
          </div>
          <p className="text-xl font-extrabold text-white font-mono">{totalCustomers.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 font-sans">Active Population</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Total Revenue</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-400 font-mono">
            ₹{totalRevenue.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-sans">Gross Value</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Avg Spending</span>
          </div>
          <p className="text-xl font-extrabold text-cyan-300 font-mono">
            ₹{avgSpending.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-sans">Per Customer</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <ShoppingBag className="w-4 h-4 text-purple-400" />
            <span>Avg Order Value</span>
          </div>
          <p className="text-xl font-extrabold text-purple-300 font-mono">
            ₹{avgOrderValue.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-sans">Basket Size</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Customer Segments</span>
          </div>
          <p className="text-xl font-extrabold text-amber-300 font-mono">{segmentCount || '-'}</p>
          <span className="text-[10px] text-slate-500 font-sans">SOM Archetypes</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>High-Risk Customers</span>
          </div>
          <p className="text-xl font-extrabold text-rose-400 font-mono">
            {highRiskCount > 0 ? `${highRiskCount} (${atRiskPct}%)` : (analysis ? '0' : '-')}
          </p>
          <span className="text-[10px] text-slate-500 font-sans">Churn Threat</span>
        </div>
      </div>

      {/* SECTION 1: WHAT IS HAPPENING WITH OUR CUSTOMERS? */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>1. What is Happening With Our Customers?</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Top-level population distribution, revenue concentration, and retention risk spread</p>
          </div>
          {analysis && (
            <span className="text-xs text-slate-400 font-mono">
              QE: {analysis.quantization_error} | TE: {analysis.topographic_error}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Contribution Chart */}
          <div className="lg:col-span-2 space-y-2">
            <span className="text-xs font-semibold text-slate-300">Revenue Contribution (%) by Segment</span>
            {revenueChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1">
                              <p className="font-bold text-indigo-300">{d.fullName}</p>
                              <p className="text-slate-300">Revenue Share: {d.revenue}%</p>
                              <p className="text-slate-400">Customer Count: {d.customerCount} ({d.share}%)</p>
                              <p className="text-emerald-400 font-bold">Avg Spend: ₹{d.avgSpend?.toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {revenueChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                <Layers className="w-8 h-8 text-slate-600" />
                <p>Train SOM to compute segment revenue distributions.</p>
              </div>
            )}
          </div>

          {/* Retention Risk Spread Donut Chart */}
          <div className="space-y-2 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-300">Behavioural Retention Risk Spread</span>
            {riskPieData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {riskPieData.map((_, idx) => (
                        <Cell key={`risk-cell-${idx}`} fill={RISK_COLORS[idx % RISK_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs">
                              <p className="font-bold text-white">{d.name}: {d.value} customers ({d.pct}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                Pending SOM mapping.
              </div>
            )}

            {rSum && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <span className="text-[10px] text-emerald-400 font-semibold">Low Risk</span>
                  <p className="font-bold text-white font-mono">{rSum.low_risk_pct}%</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <span className="text-[10px] text-amber-400 font-semibold">Medium</span>
                  <p className="font-bold text-white font-mono">{rSum.medium_risk_pct}%</p>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <span className="text-[10px] text-rose-400 font-semibold">High Risk</span>
                  <p className="font-bold text-white font-mono">{rSum.high_risk_pct}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: WHAT NEEDS ATTENTION? & SECTION 3: WHAT SHOULD WE DO? */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WHAT NEEDS ATTENTION? */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>2. What Needs Attention?</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Critical behavioral risks, revenue dependencies, and margin leaks</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* High Churn Risk Cohort */}
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>High-Risk Churn Threat</span>
                </span>
                <span className="font-mono text-rose-300 font-semibold">{highRiskCount} Customers</span>
              </div>
              <p className="text-slate-300">
                {highestRiskSegment 
                  ? `${highestRiskSegment.name} represents ${highestRiskSegment.customer_count} customers with high recency (${highestRiskSegment.recency} days) and declining frequency.`
                  : `${highRiskCount} customers show purchase recency exceeding 90 days.`}
              </p>
            </div>

            {/* Discount Sensitivity Leak */}
            {discountSegment && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 flex items-center space-x-1.5">
                    <Percent className="w-4 h-4" />
                    <span>Margin Pressure in {discountSegment.name}</span>
                  </span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {Math.round((discountSegment.discount_usage || 0) * 100)}% Discount Utilization
                  </span>
                </div>
                <p className="text-slate-300">
                  Customers in this cluster rely heavily on promotions. Switching to minimum spend thresholds will protect gross margins.
                </p>
              </div>
            )}

            {/* Revenue Concentration Risk */}
            {topRevenueSegment && (
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Top Revenue Driver: {topRevenueSegment.name}</span>
                  </span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {topRevenueSegment.revenue_contribution}% Revenue Share
                  </span>
                </div>
                <p className="text-slate-300">
                  {topRevenueSegment.customer_count} customers generate ₹{(topRevenueSegment.average_spending * topRevenueSegment.customer_count).toLocaleString()} in revenue (avg ₹{topRevenueSegment.average_spending.toLocaleString()}/customer).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* WHAT SHOULD WE DO? */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>3. What Should We Do?</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Recommended tactical strategies derived from SOM behavioral mapping</p>
            </div>

            <div className="space-y-3 text-xs mt-4">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400">1. VIP Loyalty & White-Glove Retention</span>
                <p className="text-slate-300">
                  Protect the {topRevenueSegment ? topRevenueSegment.name : 'VIP'} tier with concierge support, invite-only previews, and surprise anniversary perks to guarantee 95%+ annual retention.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-400">2. Automated 3-Stage Win-Back Campaigns</span>
                <p className="text-slate-300">
                  Deploy scheduled email/SMS reactivation sequences targeting {highRiskCount} at-risk customers with personalized re-engagement offers.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="font-bold text-purple-400">3. Discount Margin Threshold Optimization</span>
                <p className="text-slate-300">
                  Convert flat discount coupons into tiered order minimums (e.g. "Spend ₹3,000 get ₹500 off") to increase Average Order Value (AOV) by 20%.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('recommendations')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
            >
              <span>View Full AI Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('som-analysis')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
            >
              Inspect U-Matrix Grid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
