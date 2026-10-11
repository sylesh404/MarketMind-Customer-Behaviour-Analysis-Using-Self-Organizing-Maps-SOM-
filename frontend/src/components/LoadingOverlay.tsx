import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle } from 'lucide-react';

interface LoadingOverlayProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  iterations?: number;
  gridWidth?: number;
  gridHeight?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  title = 'Training Self-Organizing Map',
  subtitle = 'Iterative Neural Network Topological Feature Mapping',
  iterations = 10000,
  gridWidth = 10,
  gridHeight = 10
}) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const steps = [
    'Preprocessing & standardizing numerical customer vectors...',
    `Initializing ${gridWidth}x${gridHeight} SOM grid neurons with PCA...`,
    'Calculating Best Matching Units (BMUs) and winner neurons...',
    'Updating neighborhood topological weights across iterations...',
    'Computing final U-Matrix distance matrix & Quantization Error...'
  ];

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          return 98.4;
        }
        // Smooth incremental progress
        const increment = Math.max(0.8, (100 - prev) * 0.08);
        const next = Math.min(98.4, Number((prev + increment).toFixed(1)));
        setStep(Math.min(4, Math.floor((next / 100) * 5)));
        return next;
      });
    }, 120);

    return () => {
      clearInterval(interval);
      setProgress(0);
      setStep(0);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentIteration = Math.min(iterations, Math.floor((progress / 100) * iterations));
  const currentQE = (0.88 - (progress / 100) * 0.52).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-red-600/35 shadow-2xl text-center space-y-6 bg-black">
        {/* Animated Icon Header */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-950 p-0.5 shadow-xl shadow-red-600/35">
          <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
            <Cpu className="w-8 h-8 text-red-500 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
        </div>

        {/* Progress Display */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-sans">Iteration:</span>
            <span className="font-bold text-white">
              {currentIteration.toLocaleString()} / {iterations.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-sans">Progress:</span>
            <span className="font-bold text-red-400 text-sm">
              {progress.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-neutral-900">
            <span className="text-zinc-400 font-sans">Quantization Error:</span>
            <span className="font-bold text-red-300">
              {currentQE}
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-neutral-900 p-0.5 overflow-hidden border border-neutral-800 mt-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pipeline Phase Steps */}
        <div className="text-left space-y-2 pt-1 border-t border-neutral-900">
          {steps.map((text, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-xs">
              {idx <= step ? (
                <CheckCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-neutral-800 flex-shrink-0" />
              )}
              <span className={idx <= step ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
