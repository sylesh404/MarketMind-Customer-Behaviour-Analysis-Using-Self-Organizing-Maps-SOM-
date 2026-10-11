import React, { useState } from 'react';
import { AlertTriangle, Activity, Sparkles, Send, Bot, Loader2, ArrowRight } from 'lucide-react';
import { ModelRequiredCard } from '../components/ModelRequiredCard';
import type { MarketInsight, CorrelationMatrixData, RiskSummary } from '../types';
import type { TabType } from '../components/Sidebar';
import { api } from '../services/api';

interface InsightsPageProps {
  analysisId?: string;
  insights: MarketInsight[];
  correlation: CorrelationMatrixData | null;
  riskSummary: RiskSummary | null;
  hasDataset?: boolean;
  datasetName?: string;
  rowCount?: number;
  isTraining?: boolean;
  onTrainSOM?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({
  analysisId,
  insights,
  correlation,
  riskSummary,
  hasDataset = true,
  datasetName = 'dataset.csv',
  rowCount = 1000,
  isTraining = false,
  onTrainSOM = () => {},
  onNavigateTab = () => {}
}) => {
  const [query, setQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotHistory, setCopilotHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; model?: string }>>([]);

  const starterQuestions = [
    "How should we reduce churn for our At-Risk Spenders?",
    "Which segment is our highest revenue driver?",
    "What do the SOM topological metrics tell us about cluster quality?"
  ];

  const handleAskCopilot = async (questionToAsk?: string) => {
    const q = (questionToAsk || query).trim();
    if (!q || !analysisId || copilotLoading) return;
    
    setQuery('');
    setCopilotHistory(prev => [...prev, { role: 'user', text: q }]);
    setCopilotLoading(true);

    try {
      const res = await api.askAIAnalyst(analysisId, q);
      setCopilotHistory(prev => [
        ...prev,
        { role: 'assistant', text: res.answer, model: res.model }
      ]);
    } catch (err: any) {
      setCopilotHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Error connecting to Groq AI Copilot: ${err?.response?.data?.detail || err?.message || 'Request failed'}`
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  if (!riskSummary && (!insights || insights.length === 0) && !correlation) {
    return (
      <ModelRequiredCard
        featureName="Behavioral Insights & Market Findings"
        featureDescription="Extract statistical relationships, Pearson feature correlation heatmaps, revenue driver highlights, and customer retention churn risk stratification."
        hasDataset={hasDataset}
        datasetName={datasetName}
        rowCount={rowCount}
        isTraining={isTraining}
        onTrainSOM={onTrainSOM}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  const hasAIEnhancedInsights = insights.some(i => i.ai_generated);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-zinc-100">Behavioral Insights & Market Findings</h2>
            {hasAIEnhancedInsights && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 shadow-sm shadow-emerald-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Groq AI Active (openai/gpt-oss-120b)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Statistical relationships, feature correlation matrices, and customer retention risk analysis</p>
        </div>
      </div>

      {/* Retention Risk Indicator Breakdown */}
      {riskSummary && (
        <div className="glass-panel p-6 rounded-2xl border border-neutral-850 space-y-4 bg-black/90">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-zinc-100 text-sm">Customer Retention & Risk Distribution</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span className="font-semibold">Low Risk Base</span>
                <span className="font-mono text-zinc-200">{riskSummary.low_risk_pct}%</span>
              </div>
              <p className="text-2xl font-bold text-white font-mono">{riskSummary.low_risk_count} Customers</p>
              <p className="text-[11px] text-zinc-400">Low recency, steady repeat orders, high engagement.</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-red-900/35 space-y-1">
              <div className="flex justify-between items-center text-xs text-red-400">
                <span className="font-semibold">Medium Risk Base</span>
                <span className="font-mono text-red-300">{riskSummary.medium_risk_pct}%</span>
              </div>
              <p className="text-2xl font-bold text-red-400 font-mono">{riskSummary.medium_risk_count} Customers</p>
              <p className="text-[11px] text-zinc-400">Moderate recency gaps (30-60 days) or declining website visits.</p>
            </div>

            <div className="p-4 rounded-xl bg-red-950/20 border border-red-600/40 space-y-1">
              <div className="flex justify-between items-center text-xs text-red-400">
                <span className="font-semibold">High Churn Risk</span>
                <span className="font-mono text-red-300">{riskSummary.high_risk_pct}%</span>
              </div>
              <p className="text-2xl font-extrabold text-red-500 font-mono">{riskSummary.high_risk_count} Customers</p>
              <p className="text-[11px] text-zinc-400">High recency (&gt;90 days), low purchase frequency. Action required.</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Market Insights Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-100 text-sm">Key Market Insights</h3>
          {hasAIEnhancedInsights && (
            <span className="text-[10px] text-zinc-400 font-medium flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-red-400" />
              <span>Grounded in SOM cluster topology</span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <div key={insight.id} className="glass-panel p-5 rounded-2xl border border-neutral-850 hover:border-red-900/50 transition space-y-3 bg-black/90">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 font-mono">
                    {insight.metric}
                  </span>
                  {insight.ai_generated && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Groq AI</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-red-400">{insight.impact}</span>
              </div>

              <h4 className="font-bold text-zinc-100 text-sm">{insight.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Groq AI Market Copilot */}
      {analysisId && (
        <div className="glass-panel p-6 rounded-2xl border border-neutral-850 space-y-4 bg-gradient-to-b from-neutral-950/90 to-black/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-md shadow-red-600/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-sm">MarketMind AI Analyst Copilot</h3>
                <p className="text-[11px] text-zinc-400">Ask questions about your SOM cluster topology, revenue opportunities, or churn prevention</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-neutral-900 text-zinc-400 border border-neutral-800">
              Groq • gpt-oss-120b
            </span>
          </div>

          {/* Quick Starters */}
          <div className="flex flex-wrap gap-2 pt-1">
            {starterQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAskCopilot(q)}
                disabled={copilotLoading}
                className="text-left text-[11px] px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-red-950/40 hover:border-red-600/40 border border-neutral-800 text-zinc-300 transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <span>{q}</span>
                <ArrowRight className="w-3 h-3 text-red-400 shrink-0" />
              </button>
            ))}
          </div>

          {/* Chat History */}
          {copilotHistory.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 pt-2">
              {copilotHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl text-xs leading-relaxed ${
                    item.role === 'user'
                      ? 'bg-red-950/20 border border-red-900/30 text-red-200 ml-8'
                      : 'bg-neutral-900/80 border border-neutral-800 text-zinc-200 mr-8 whitespace-pre-line'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-400">
                      {item.role === 'user' ? 'You' : 'MarketMind Copilot (Groq AI)'}
                    </span>
                  </div>
                  <div className="prose prose-invert prose-xs max-w-none">
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskCopilot();
              }}
              placeholder="Ask anything (e.g., 'What strategies will boost our VIP retention rate?')..."
              disabled={copilotLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-500 focus:outline-none text-xs text-zinc-100 placeholder-zinc-500"
            />
            <button
              onClick={() => handleAskCopilot()}
              disabled={!query.trim() || copilotLoading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs shadow-md shadow-red-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {copilotLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Feature Correlation Matrix */}
      {correlation && correlation.features.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-neutral-850 space-y-4 bg-black/90">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">Pearson Feature Correlation Matrix</h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-900">
            <table className="w-full text-center text-xs">
              <thead className="bg-neutral-950 text-zinc-400 uppercase font-mono">
                <tr>
                  <th className="p-2.5 text-left">Feature</th>
                  {correlation.features.map(f => (
                    <th key={f} className="p-2.5 whitespace-nowrap">{f.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 font-mono">
                {correlation.features.map((rowFeat, i) => (
                  <tr key={rowFeat}>
                    <td className="p-2.5 font-bold text-left text-zinc-200 whitespace-nowrap">{rowFeat.replace(/_/g, ' ')}</td>
                    {correlation.matrix[i].map((val, j) => {
                      const isSelf = i === j;
                      const opacity = Math.abs(val);
                      return (
                        <td
                          key={j}
                          style={{
                            backgroundColor: isSelf
                              ? 'rgba(239, 68, 68, 0.3)'
                              : val > 0
                              ? `rgba(239, 68, 68, ${opacity * 0.45})`
                              : `rgba(113, 113, 122, ${opacity * 0.3})`
                          }}
                          className="p-2.5 font-semibold text-zinc-200"
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
    </div>
  );
};
