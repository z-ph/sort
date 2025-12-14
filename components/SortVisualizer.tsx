import React from 'react';
import { AlgorithmType, SortStep } from '../types';
import { CHART_COLORS } from '../constants';
import { ArrowDown, BoxSelect, Spline } from 'lucide-react';

interface Props {
  step: SortStep;
  maxValue: number;
  algorithm?: AlgorithmType;
}

const SortVisualizer: React.FC<Props> = ({ step, maxValue, algorithm }) => {
  if (!step) return <div className="h-64 flex items-center justify-center text-gray-400">无数据</div>;

  const isLargeDataset = step.array.length > 80;
  const gapClass = isLargeDataset ? '' : 'gap-[1px]';
  const transitionClass = isLargeDataset ? '' : 'transition-all duration-75';
  
  // -- Auxiliary Renderers --

  // 1. Merge Sort / Quick Sort Range Overlay
  const renderRangeOverlay = () => {
    if (!step.aux?.range) return null;
    const { start, end } = step.aux.range;
    const total = step.array.length;
    // Calculate percentages
    const left = (start / total) * 100;
    const width = ((end - start + 1) / total) * 100;

    const color = algorithm?.includes('归并') ? 'bg-blue-100/50 border-blue-300' : 'bg-purple-100/50 border-purple-300';

    return (
      <div 
        className={`absolute top-0 bottom-0 border-x-2 border-t-2 border-dashed z-0 rounded-t-lg pointer-events-none ${color}`}
        style={{ left: `${left}%`, width: `${width}%` }}
      >
        <div className="absolute top-0 left-0 bg-white/80 text-[10px] px-1 rounded-br text-gray-600 font-mono">
            {algorithm?.includes('归并') ? 'Group' : 'Partition'}
        </div>
      </div>
    );
  };

  // 2. Quick Sort Pivot Indicator
  const renderPivotIndicator = () => {
      if (step.aux?.pivot === undefined) return null;
      const total = step.array.length;
      const left = (step.aux.pivot / total) * 100;
      const barWidth = 100 / total;

      return (
          <div 
            className="absolute bottom-0 z-20 flex flex-col items-center pointer-events-none transition-all duration-75"
            style={{ left: `${left}%`, width: `${barWidth}%`, height: '100%' }}
          >
              <div className="w-full h-full border-2 border-purple-500 bg-purple-200/20 absolute bottom-0"></div>
              <div className="absolute -top-6 text-purple-600 font-bold text-xs flex flex-col items-center">
                  <span>Pivot</span>
                  <ArrowDown size={12} />
              </div>
          </div>
      );
  };

  // 3. Heap Sort Boundary
  const renderHeapBoundary = () => {
      if (step.aux?.heapSize === undefined) return null;
      const total = step.array.length;
      const split = (step.aux.heapSize / total) * 100;
      
      return (
          <div className="absolute top-0 bottom-0 border-r-2 border-red-400 z-20 pointer-events-none" style={{ left: `${split}%` }}>
              <div className="absolute top-2 right-1 text-xs text-red-500 font-bold bg-white/80 px-1 rounded transform rotate-90 origin-right whitespace-nowrap">
                  Sorted Region &darr;
              </div>
          </div>
      );
  };

  // 4. Counting/Radix Sort Info
  const renderCountingInfo = () => {
      if(step.aux?.val === undefined && step.aux?.bucketIndex === undefined) return null;
      
      return (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-gray-200 p-3 rounded-lg shadow-lg z-30 text-sm flex flex-col gap-1 min-w-[140px]">
              <div className="font-bold text-gray-700 border-b pb-1 mb-1">
                  {algorithm === AlgorithmType.COUNTING ? '计数桶状态' : '基数桶状态'}
              </div>
              {step.aux?.val !== undefined && (
                  <div className="flex justify-between">
                      <span className="text-gray-500">当前数值:</span>
                      <span className="font-mono font-bold text-blue-600">{step.aux.val}</span>
                  </div>
              )}
               {step.aux?.bucketIndex !== undefined && (
                  <div className="flex justify-between">
                      <span className="text-gray-500">目标桶:</span>
                      <span className="font-mono font-bold text-orange-600">[{step.aux.bucketIndex}]</span>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="w-full h-full relative p-4 bg-white rounded-lg shadow-inner border border-gray-200 overflow-hidden">
      
      {/* Background Overlays for Groups/Partitions */}
      {renderRangeOverlay()}
      {renderPivotIndicator()}
      {renderHeapBoundary()}
      {renderCountingInfo()}

      <div className={`w-full h-full flex items-end justify-center ${gapClass} relative z-10`}>
        {step.array.map((value, idx) => {
          let color = CHART_COLORS.bar;
          
          // Default Highlights
          if (step.sorted.includes(idx)) color = CHART_COLORS.sorted;
          else if (step.swapping.includes(idx)) color = CHART_COLORS.swap;
          else if (step.comparing.includes(idx)) color = CHART_COLORS.compare;
          
          // Specific Algorithm Overrides
          if (algorithm === AlgorithmType.QUICK_REC || algorithm === AlgorithmType.QUICK_ITER) {
             if (idx === step.aux?.pivot) color = '#9333ea'; // Purple 600
          }
          if (algorithm === AlgorithmType.HEAP) {
              if (step.aux?.heapSize !== undefined && idx >= step.aux.heapSize) {
                  color = CHART_COLORS.sorted; // Explicitly green for sorted region
              }
          }
          if (algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX) {
               // Highlight the specific value being counted or placed
               if (step.aux?.val === value && step.comparing.includes(idx)) color = '#f59e0b'; // Amber for scanning
               if (step.aux?.val === value && step.swapping.includes(idx)) color = '#22c55e'; // Green for placing
          }

          // Calculate height
          const heightPercentage = Math.max((value / maxValue) * 100, 0.5); 

          return (
            <div
              key={idx}
              style={{
                height: `${heightPercentage}%`,
                backgroundColor: color,
                width: `${100 / step.array.length}%`
              }}
              className={`${transitionClass} rounded-t-sm`}
              title={`Index: ${idx}, Value: ${value}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SortVisualizer;