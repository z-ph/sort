import React from 'react';
import { Play, Pause, RotateCcw, Settings, StepForward, AlertCircle } from 'lucide-react';
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
  isSorting: boolean;
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
  isFinished,
  isSorting
}) => {
  const handleSpeedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 200) val = 200;
    setSpeed(201 - val);
  };

  const handleSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 10;
    if (val < 10) val = 10;
    if (val > 1500) val = 1500;
    setSize(val);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 text-gray-700 font-semibold">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <span>设置</span>
          </div>
          {isSorting && !isFinished && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-xs border border-amber-100 animate-pulse">
              <AlertCircle size={14} />
              <span>提示：切换算法前请先重置</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
            disabled={isSorting && !isFinished} 
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto min-w-[160px] disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
          >
            {ALGORITHM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 flex-grow sm:flex-grow-0">
            <span className="text-sm text-gray-600 whitespace-nowrap">数量:</span>
            <input 
              type="number"
              min="10"
              max="1500"
              value={size}
              onChange={handleSizeInputChange}
              disabled={isPlaying}
              className="w-14 px-1 py-0.5 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <input
              type="range"
              min="10"
              max="1500"
              step="10"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              disabled={isPlaying}
              className="w-24 sm:w-32 lg:w-40 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 flex-grow sm:flex-grow-0">
            <span className="text-sm text-gray-600 whitespace-nowrap">速度:</span>
             <input 
              type="number"
              min="1"
              max="200"
              value={201 - speed}
              onChange={handleSpeedInputChange}
              className="w-14 px-1 py-0.5 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <input
              type="range"
              min="1"
              max="200"
              value={201 - speed}
              onChange={(e) => setSpeed(201 - Number(e.target.value))}
              className="w-24 sm:w-32 lg:w-40 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <button
          onClick={onGenerate}
          disabled={isPlaying}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap flex-grow sm:flex-grow-0"
        >
          生成新数组
        </button>
        
        {!isPlaying ? (
            <button
              onClick={onPlay}
              disabled={isFinished}
              className={`flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-colors flex-grow sm:flex-grow-0 min-w-[100px] ${
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
              className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-md flex-grow sm:flex-grow-0 min-w-[100px]"
            >
              <Pause className="w-4 h-4" /> 暂停
            </button>
        )}

        <button
          onClick={onNextStep}
          disabled={isPlaying || isFinished}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border flex-grow sm:flex-grow-0 ${
            isPlaying || isFinished
              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600'
          }`}
        >
          <StepForward className="w-4 h-4" /> 单步
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors ml-auto whitespace-nowrap font-medium"
        >
          <RotateCcw className="w-4 h-4" /> 重置系统
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;