import React, { useEffect, useRef } from 'react';
import { AlgorithmType, SortStep } from '../types';
import { CHART_COLORS } from '../constants';
import { Zap } from 'lucide-react';

interface Props {
  step: SortStep | null;
  maxValue: number;
  algorithm?: AlgorithmType;
  theme?: 'light' | 'dark';
}

const SortVisualizer: React.FC<Props> = ({ step, maxValue, algorithm, theme = 'light' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !step) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    // Background match: bg-slate-50 / bg-slate-950
    ctx.fillStyle = theme === 'dark' ? '#020617' : '#f8fafc';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const { array, comparing, swapping, sorted, aux } = step;
    const total = array.length;
    const barWidth = rect.width / total; 
    
    const comparingSet = new Set(comparing);
    const swappingSet = new Set(swapping);
    const sortedSet = new Set(sorted);

    for (let i = 0; i < total; i++) {
        const value = array[i];
        
        // IMPROVED CONTRAST FOR DARK MODE
        // Using a more vibrant slate/blue for better visibility in dark mode against pure dark background
        let fillStyle = theme === 'dark' ? '#334155' : CHART_COLORS.bar; // slate-700 vs original dark blue

        if (sortedSet.has(i)) {
            fillStyle = CHART_COLORS.sorted;
        } else if (swappingSet.has(i)) {
            fillStyle = CHART_COLORS.swap;
        } else if (comparingSet.has(i)) {
            fillStyle = CHART_COLORS.compare;
        }

        if (algorithm === AlgorithmType.QUICK_REC || algorithm === AlgorithmType.QUICK_ITER) {
            if (i === aux?.pivot) fillStyle = '#a855f7'; // Purple for pivot
        } else if (algorithm === AlgorithmType.HEAP) {
            if (aux?.heapSize !== undefined && i >= aux.heapSize) {
                fillStyle = CHART_COLORS.sorted;
            }
        } else if (algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX || algorithm === AlgorithmType.RADIX_REC) {
            if (aux?.val === value && comparingSet.has(i)) fillStyle = '#f59e0b';
            if (aux?.val === value && swappingSet.has(i)) fillStyle = '#22c55e';
        }

        const heightPercentage = Math.max((value / maxValue), 0.005);
        const barHeight = Math.floor(heightPercentage * rect.height);
        const x = Math.floor(i * barWidth);
        const y = rect.height - barHeight;
        const w = Math.ceil(barWidth); 

        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, w, barHeight);
        
        // Add subtle outlines for clarity
        if (total < 100) {
          ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, w, barHeight);
        }
    }

  }, [step, maxValue, algorithm, theme]);

  if (!step) return (
    <div className="h-[400px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
      <Zap size={48} className="mb-3 opacity-20" />
      <p className="font-black text-sm uppercase tracking-widest">初始化看板中...</p>
    </div>
  );

  const renderRangeOverlay = () => {
    if (!step.aux?.range) return null;
    const { start, end } = step.aux.range;
    const total = step.array.length;
    const left = (start / total) * 100;
    const width = ((end - start + 1) / total) * 100;
    const color = algorithm?.includes('归并') 
        ? 'bg-blue-500/10 border-blue-500/30' 
        : 'bg-purple-500/10 border-purple-500/30';

    return (
      <div 
        className={`absolute top-0 bottom-0 border-x-2 border-t-2 border-dashed z-0 rounded-t-xl pointer-events-none transition-all duration-300 ${color}`}
        style={{ left: `${left}%`, width: `${width}%` }}
      />
    );
  };

  return (
    <div className="w-full h-[400px] relative p-1 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden" ref={containerRef}>
      {renderRangeOverlay()}
      <canvas 
        ref={canvasRef}
        className="block relative z-10 w-full h-full"
      />
    </div>
  );
};

export default SortVisualizer;