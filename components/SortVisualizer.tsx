import React from 'react';
import { SortStep } from '../types';
import { CHART_COLORS } from '../constants';

interface Props {
  step: SortStep;
  maxValue: number;
}

const SortVisualizer: React.FC<Props> = ({ step, maxValue }) => {
  if (!step) return <div className="h-64 flex items-center justify-center text-gray-400">无数据</div>;

  // Performance Optimization:
  // If array size is large, disable CSS transitions and gaps to improve rendering performance and visibility.
  const isLargeDataset = step.array.length > 100;
  const gapClass = isLargeDataset ? '' : 'gap-[2px]';
  const transitionClass = isLargeDataset ? '' : 'transition-all duration-75';

  return (
    <div className={`w-full h-full flex items-end justify-center ${gapClass} p-4 bg-white rounded-lg shadow-inner border border-gray-200 overflow-hidden`}>
      {step.array.map((value, idx) => {
        let color = CHART_COLORS.bar;
        if (step.sorted.includes(idx)) color = CHART_COLORS.sorted;
        else if (step.swapping.includes(idx)) color = CHART_COLORS.swap;
        else if (step.comparing.includes(idx)) color = CHART_COLORS.compare;

        const heightPercentage = Math.max((value / maxValue) * 100, 0.5); // Ensure at least tiny visibility

        return (
          <div
            key={idx}
            style={{
              height: `${heightPercentage}%`,
              backgroundColor: color,
              width: `${100 / step.array.length}%`
            }}
            className={`${transitionClass} rounded-t-sm`}
            title={`数值: ${value}`}
          />
        );
      })}
    </div>
  );
};

export default SortVisualizer;