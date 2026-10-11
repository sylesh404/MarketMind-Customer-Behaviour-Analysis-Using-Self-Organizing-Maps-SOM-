import React from 'react';
import { ArrowRight, DollarSign, TrendingUp, ShoppingBag, Clock } from 'lucide-react';
import type { Segment } from '../types';

interface SegmentCardProps {
  segment: Segment;
  onSelectSegment: (segmentId: number) => void;
  isSelected?: boolean;
}

export const SegmentCard: React.FC<SegmentCardProps> = ({ segment, onSelectSegment, isSelected }) => {
  return (
    <div
      onClick={() => onSelectSegment(segment.segment_id)}
      className={`glass-panel p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer group ${
        isSelected
          ? 'border-red-600 ring-2 ring-red-600/40 bg-neutral-950 shadow-xl shadow-red-600/20'
          : 'border-zinc-900 hover:border-red-600/50 hover:bg-neutral-950/80'
      }`}
    >
      <div>
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{segment.badge.split(' ')[0]}</span>
            <h3 className="font-bold text-white text-sm group-hover:text-red-400 transition">
              {segment.name}
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-600/15 text-red-300 border border-red-500/25 font-mono">
            {segment.percentage}% Base
          </span>
        </div>

        <p className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed">{segment.description}</p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-neutral-950 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 font-medium flex items-center space-x-1">
              <DollarSign className="w-3 h-3 text-red-400" />
              <span>Avg Spending</span>
            </span>
            <p className="font-mono font-bold text-red-400 mt-0.5">₹{(segment.average_spending || 0).toLocaleString()}</p>
          </div>

          <div className="p-2 rounded-xl bg-neutral-950 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 font-medium flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-rose-400" />
              <span>Revenue Share</span>
            </span>
            <p className="font-mono font-bold text-rose-400 mt-0.5">{segment.revenue_contribution}%</p>
          </div>

          <div className="p-2 rounded-xl bg-neutral-950 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 font-medium flex items-center space-x-1">
              <ShoppingBag className="w-3 h-3 text-red-500" />
              <span>Avg Income</span>
            </span>
            <p className="font-mono font-bold text-zinc-200 mt-0.5">₹{(segment.average_income || 0).toLocaleString()}</p>
          </div>

          <div className="p-2 rounded-xl bg-neutral-950 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 font-medium flex items-center space-x-1">
              <Clock className="w-3 h-3 text-red-400" />
              <span>Recency / Freq</span>
            </span>
            <p className="font-mono font-bold text-zinc-300 mt-0.5">{segment.recency}d • {segment.purchase_frequency}x</p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium font-mono">{segment.customer_count.toLocaleString()} Customers</span>
        <button
          className="flex items-center space-x-1 text-xs font-semibold text-red-400 group-hover:text-red-300 transition"
        >
          <span>{isSelected ? 'Viewing Customer Roster' : 'Explore Segment'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
