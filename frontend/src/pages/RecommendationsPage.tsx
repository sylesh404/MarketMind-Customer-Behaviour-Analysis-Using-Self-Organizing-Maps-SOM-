import React from 'react';
import { Sparkles, Megaphone } from 'lucide-react';
import { ModelRequiredCard } from '../components/ModelRequiredCard';
import type { Recommendation } from '../types';
import type { TabType } from '../components/Sidebar';

interface RecommendationsPageProps {
  recommendations: Recommendation[];
  onDownloadReport: () => void;
  hasDataset?: boolean;
  datasetName?: string;
  rowCount?: number;
  isTraining?: boolean;
  onTrainSOM?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  recommendations,
  onDownloadReport,
  hasDataset = true,
  datasetName = 'dataset.csv',
  rowCount = 1000,
  isTraining = false,
  onTrainSOM = () => {},
  onNavigateTab = () => {}
}) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <ModelRequiredCard
        featureName="AI Marketing Playbooks & Recommendations"
        featureDescription="Automated data-driven marketing playbooks tailored specifically to each Kohonen customer cluster, including strategic campaign actions, suggested channels, and target goals."
        hasDataset={hasDataset}
        datasetName={datasetName}
        rowCount={rowCount}
        isTraining={isTraining}
        onTrainSOM={onTrainSOM}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">AI Marketing Recommendations</h2>
          <p className="text-xs text-zinc-400">Automated strategic campaigns tailored to SOM customer segment profiles</p>
        </div>
        <button
          onClick={onDownloadReport}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Download Strategy PDF Report</span>
        </button>
      </div>

      {/* Recommendation Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <div key={rec.segment_id} className="glass-panel p-6 rounded-2xl border border-neutral-850 hover:border-red-900/50 transition space-y-4 flex flex-col justify-between bg-black/90">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">{rec.badge} {rec.segment_name}</span>
                <div className="flex items-center space-x-2">
                  {rec.ai_generated && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-emerald-400 mr-1" />
                      <span>Groq AI Playbook</span>
                    </span>
                  )}
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                    Segment #{rec.segment_id + 1}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 font-medium">{rec.summary}</p>

              {/* Business Interpretation */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Business Interpretation</span>
                <p className="text-xs text-zinc-300 leading-relaxed">{rec.business_interpretation}</p>
              </div>

              {/* Marketing Recommendation */}
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/35 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-red-400">
                  <Megaphone className="w-3.5 h-3.5 text-red-400" />
                  <span>Strategic Campaign Action</span>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed font-medium">{rec.marketing_recommendation}</p>
              </div>
            </div>

            {/* Campaign Name & Target Goal */}
            <div className="pt-3 border-t border-neutral-900 grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Suggested Campaign</span>
                <p className="font-bold text-red-400">{rec.suggested_campaign}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Target Goal</span>
                <p className="font-bold text-zinc-200">{rec.target_goal}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
