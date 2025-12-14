import React, { useEffect, useRef } from 'react';
import { AlgorithmType, SortStep } from '../types';
import { CHART_COLORS } from '../constants';
import { ArrowDown } from 'lucide-react';

interface Props {
  step: SortStep | null;
  maxValue: number;
  algorithm?: AlgorithmType;
}

const SortVisualizer: React.FC<Props> = ({ step, maxValue, algorithm }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !step) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency
    if (!ctx) return;

    // Handle High DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    // Resize only if dimensions changed to avoid flickering
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
    }

    // Normalize coordinate system to use css pixels
    // Reset transform to identity before scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const { array, comparing, swapping, sorted, aux } = step;
    const total = array.length;
    // Calculate precise float width to avoid gaps accumulating
    const barWidth = rect.width / total; 
    
    // Performance optimization: 
    // Instead of using array.includes() inside the loop (which makes it O(N*M)),
    // we use Sets for O(1) lookups.
    const comparingSet = new Set(comparing);
    const swappingSet = new Set(swapping);
    const sortedSet = new Set(sorted);

    // Batch draw calls by color to minimize state changes (optional optimization, keeping simple for now)
    
    for (let i = 0; i < total; i++) {
        const value = array[i];
        let fillStyle = CHART_COLORS.bar;

        // Determine Color Priority (Hot paths first)
        if (sortedSet.has(i)) {
            fillStyle = CHART_COLORS.sorted;
        } else if (swappingSet.has(i)) {
            fillStyle = CHART_COLORS.swap;
        } else if (comparingSet.has(i)) {
            fillStyle = CHART_COLORS.compare;
        }

        // Algorithm Specific Overrides
        if (algorithm === AlgorithmType.QUICK_REC || algorithm === AlgorithmType.QUICK_ITER) {
            if (i === aux?.pivot) fillStyle = '#9333ea'; 
        } else if (algorithm === AlgorithmType.HEAP) {
            if (aux?.heapSize !== undefined && i >= aux.heapSize) {
                fillStyle = CHART_COLORS.sorted;
            }
        } else if (algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX) {
            if (aux?.val === value && comparingSet.has(i)) fillStyle = '#f59e0b';
            if (aux?.val === value && swappingSet.has(i)) fillStyle = '#22c55e';
        }

        // Draw Bar
        const heightPercentage = Math.max((value / maxValue), 0.005);
        const barHeight = Math.floor(heightPercentage * rect.height);
        const x = Math.floor(i * barWidth);
        const y = rect.height - barHeight;
        // Use Math.ceil for width to prevent sub-pixel gaps
        const w = Math.ceil(barWidth); 

        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, w, barHeight);
    }

  }, [step, maxValue, algorithm]);

  if (!step) return <div className="h-64 flex items-center justify-center text-gray-400">无数据</div>;

  // Render Overlays (Pivot, Range, etc.) using DOM absolute positioning
  // These are few in number (usually < 5 elements), so DOM is fine and easier for styling.
  const renderRangeOverlay = () => {
    if (!step.aux?.range) return null;
    const { start, end } = step.aux.range;
    const total = step.array.length;
    const left = (start / total) * 100;
    const width = ((end - start + 1) / total) * 100;
    const color = algorithm?.includes('归并') ? 'bg-blue-100/50 border-blue-300' : 'bg-purple-100/50 border-purple-300';

    return (
      <div 
        className={`absolute top-0 bottom-0 border-x-2 border-t-2 border-dashed z-0 rounded-t-lg pointer-events-none ${color}`}
        style={{ left: `${left}%`, width: `${width}%` }}
      >
      </div>
    );
  };

  const renderPivotIndicator = () => {
      if (step.aux?.pivot === undefined) return null;
      const total = step.array.length;
      const left = (step.aux.pivot / total) * 100;
      const barWidthPercentage = 100 / total;

      return (
          <div 
            className="absolute bottom-0 z-20 flex flex-col items-center pointer-events-none"
            style={{ left: `${left}%`, width: `${Math.max(barWidthPercentage, 0.5)}%`, height: '100%' }}
          >
              <div className="absolute -top-6 text-purple-600 font-bold text-xs flex flex-col items-center whitespace-nowrap">
                  <span>Pivot</span>
                  <ArrowDown size={12} />
              </div>
          </div>
      );
  };

  const renderHeapBoundary = () => {
      if (step.aux?.heapSize === undefined) return null;
      const total = step.array.length;
      const split = (step.aux.heapSize / total) * 100;
      
      return (
          <div className="absolute top-0 bottom-0 border-r-2 border-red-400 z-20 pointer-events-none" style={{ left: `${split}%` }}>
              <div className="absolute top-2 right-1 text-xs text-red-500 font-bold bg-white/80 px-1 rounded transform rotate-90 origin-right whitespace-nowrap shadow-sm">
                  Sorted &darr;
              </div>
          </div>
      );
  };

  return (
    <div className="w-full h-full relative p-4 bg-white rounded-lg shadow-inner border border-gray-200 overflow-hidden" ref={containerRef}>
      {renderRangeOverlay()}
      {renderPivotIndicator()}
      {renderHeapBoundary()}
      <canvas 
        ref={canvasRef}
        className="block relative z-10 w-full h-full"
      />
    </div>
  );
};

export default SortVisualizer;