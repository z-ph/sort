import React from 'react';
import { Play, Pause, RotateCcw, Settings, StepForward } from 'lucide-react';
import { AlgorithmType } from '../types';
import { ALGORITHM_OPTIONS } from '../constants';

interface Props {
  algorithm: AlgorithmType;
  setAlgorithm: (a: AlgorithmType) => void;
  size: number;
  setSize: (s: number) => void;
  speed: number;
  setSpeed: (s: number) => void;
  onGenerate: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onNextStep: () => void;
  isPlaying: boolean;
  isFinished: boolean;
}

const ControlPanel: React.FC<Props> = ({
  algorithm,
  setAlgorithm,
  size,
  setSize,
  speed,
  setSpeed,
  onGenerate,
  onPlay,
  onPause,
  onReset,
  onNextStep,
  isPlaying,
  isFinished
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Settings className="w-5 h-5 text-gray-500" />
          <span className="font-semibold text-gray-700">设置</span>
        </div>

        <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
          {/* Algorithm Selector */}
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
            disabled={isPlaying || (!!onNextStep && !isFinished && onNextStep.name === 'noop')} // Disable only if playing, allow changing if reset
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {ALGORITHM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Size Slider */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">数量: {size}</span>
            <input
              type="range"
              min="10"
              max="1500"
              step="10"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              disabled={isPlaying}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Speed Slider */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">速度</span>
            <input
              type="range"
              min="1"
              max="200"
              value={201 - speed} // Invert so right is faster
              onChange={(e) => setSpeed(201 - Number(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t pt-4">
        <button
          onClick={onGenerate}
          disabled={isPlaying}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          生成新数组
        </button>
        
        {!isPlaying ? (
            <button
              onClick={onPlay}
              disabled={isFinished}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isFinished 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              <Play className="w-4 h-4" /> 开始
            </button>
        ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-md"
            >
              <Pause className="w-4 h-4" /> 暂停
            </button>
        )}

        {/* Next Step Button */}
        <button
          onClick={onNextStep}
          disabled={isPlaying || isFinished}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
            isPlaying || isFinished
              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600'
          }`}
          title="执行下一步"
        >
          <StepForward className="w-4 h-4" /> 单步
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors ml-auto"
        >
          <RotateCcw className="w-4 h-4" /> 重置
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;