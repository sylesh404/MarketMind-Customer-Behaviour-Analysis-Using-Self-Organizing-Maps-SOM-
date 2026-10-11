import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CustomerProfile, Segment } from '../types';

interface CustomerScatterProps {
  customers: CustomerProfile[];
  segments: Segment[];
  gridWidth: number;
  gridHeight: number;
  onSelectCustomer?: (customer: CustomerProfile) => void;
}

const SEGMENT_COLORS = ['#ef4444', '#dc2626', '#b91c1c', '#f87171', '#991b1b', '#fca5a5', '#e11d48', '#fda4af'];

export const CustomerScatter: React.FC<CustomerScatterProps> = ({
  customers,
  segments,
  gridWidth,
  gridHeight,
  onSelectCustomer
}) => {
  if (!customers || customers.length === 0) {
    return <div className="p-6 text-center text-zinc-500 text-xs">No customer scatter data available.</div>;
  }

  // Add deterministic jitter to BMU coordinates for visual separation of customer points in the same node
  const scatterData = customers.map((c, index) => {
    // Deterministic pseudo-randomness based on customer id/index
    const idNum = Number(String(c.Customer_ID).replace(/\D/g, '')) || index;
    const pseudoX = Math.abs(Math.sin(idNum * 12.9898 + 78.233)) % 1;
    const pseudoY = Math.abs(Math.cos(idNum * 93.9898 + 67.345)) % 1;
    const jitterX = (pseudoX - 0.5) * 0.45;
    const jitterY = (pseudoY - 0.5) * 0.45;
    const x = (c.bmu_x ?? 0) + jitterX;
    const y = (c.bmu_y ?? 0) + jitterY;
    const segId = c.segment_id ?? 0;
    const color = SEGMENT_COLORS[segId % SEGMENT_COLORS.length];

    return {
      ...c,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      segId,
      color
    };
  });

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4 border border-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Customer Topological Distribution Map</h3>
          <p className="text-xs text-zinc-400">Each dot represents a customer mapped to their Best Matching Unit (BMU) neuron</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {segments.map((seg, i) => (
            <div key={seg.segment_id} className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-zinc-800">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
              <span className="text-zinc-300 font-medium">{seg.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis
              type="number"
              dataKey="x"
              name="SOM X"
              domain={[-0.5, gridWidth - 0.5]}
              unit=""
              stroke="#52525b"
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="SOM Y"
              domain={[-0.5, gridHeight - 0.5]}
              unit=""
              stroke="#52525b"
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
            />
            <ZAxis type="number" range={[40, 40]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as CustomerProfile & { color: string };
                  const seg = segments.find(s => s.segment_id === data.segment_id);
                  return (
                    <div className="p-3 rounded-xl bg-neutral-950 border border-zinc-800 shadow-2xl text-xs space-y-1">
                      <p className="font-mono font-bold text-red-400">Customer #{data.Customer_ID}</p>
                      <p className="text-zinc-300">BMU Neuron: ({data.bmu_x}, {data.bmu_y})</p>
                      <p className="text-zinc-400">Total Spend: ₹{(data.Total_Spending || 0).toLocaleString()}</p>
                      <p className="text-zinc-400">Purchase Freq: {data.Purchase_Frequency} orders/yr</p>
                      {seg && (
                        <p className="text-red-300 font-semibold pt-1 border-t border-zinc-800">
                          {seg.badge} {seg.name}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={scatterData} onClick={(data: any) => onSelectCustomer && onSelectCustomer(data?.payload)}>
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
