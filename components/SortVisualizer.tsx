import React from 'react';
import { SortStep } from '../types';
import { CHART_COLORS } from '../constants';

interface Props {
  step: SortStep;
  maxValue: number;
}

const SortVisualizer: React.FC<Props> = ({ step, maxValue }) => {
  if (!step) return <div className="h-64 flex items-center justify-center text-gray-400">No data</div>;

  return (
    <div className="w-full h-full flex items-end justify-center gap-[2px] p-4 bg-white rounded-lg shadow-inner border border-gray-200 overflow-hidden">
      {step.array.map((value, idx) => {
        let color = CHART_COLORS.bar;
        if (step.sorted.includes(idx)) color = CHART_COLORS.sorted;
        else if (step.swapping.includes(idx)) color = CHART_COLORS.swap;
        else if (step.comparing.includes(idx)) color = CHART_COLORS.compare;

        const heightPercentage = Math.max((value / maxValue) * 100, 1);

        return (
          <div
            key={idx}
            style={{
              height: `${heightPercentage}%`,
              backgroundColor: color,
              width: `${100 / step.array.length}%`
            }}
            className="transition-all duration-75 rounded-t-sm"
            title={`Value: ${value}`}
          />
        );
      })}
    </div>
  );
};

export default SortVisualizer;
