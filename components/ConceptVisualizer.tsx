import React, { useEffect, useRef, useState } from 'react';
import { AlgorithmType, SortStep } from '../types';
import { ArrowUp, ScanEye, Eye, Play, Pause, StepForward, RotateCcw } from 'lucide-react';

interface Props {
  step: SortStep | null;
  algorithm: AlgorithmType;
  arraySize: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onNextStep: () => void;
  isPlaying: boolean;
  isFinished: boolean;
}

const ConceptVisualizer: React.FC<Props> = ({ 
    step, algorithm, onPlay, onPause, onReset, onNextStep, isPlaying, isFinished
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(true);

  useEffect(() => {
    if (!isTracking || !step) return;
    const targetIdx = step.swapping.length > 0 ? step.swapping[0] : (step.comparing.length > 0 ? step.comparing[0] : -1);
    const targetElement = targetIdx !== -1 ? document.getElementById(`list-item-${targetIdx}`) : null;

    if (targetElement && containerRef.current) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [step, isTracking]);

  if (!step) return null;

  const renderSimpleList = () => {
    const { array, comparing, swapping, sorted } = step;
    return (
        <div className="flex flex-col items-center w-full p-6">
            <div ref={containerRef} className="flex gap-1.5 flex-wrap justify-center max-h-[300px] overflow-y-auto w-full py-2">
                {array.map((val, idx) => {
                    const isComp = comparing.includes(idx);
                    const isSwap = swapping.includes(idx);
                    const isSorted = sorted.includes(idx);
                    let color = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';
                    if (isSorted) color = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400';
                    else if (isSwap) color = 'bg-rose-100 dark:bg-rose-900/20 border-rose-500 text-rose-700 dark:text-rose-400';
                    else if (isComp) color = 'bg-amber-100 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400';

                    return (
                        <div key={idx} id={`list-item-${idx}`} className="flex flex-col items-center">
                            <div className={`w-10 h-10 flex items-center justify-center border-2 rounded-xl font-bold text-xs shadow-sm transition-all duration-200 ${color}`}>
                                {val}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderRangeView = () => {
      if (!step.aux?.range) return null;
      const { start, end } = step.aux.range;
      const subset = step.array.slice(start, end + 1);
      const isMergeSort = algorithm.includes('归并');
      const mid = Math.floor((start + end) / 2);
      const mergeBuffer = step.aux?.mergeBuffer || [];

      return (
          <div className="flex flex-col items-center w-full gap-8 p-6">
              <div className="space-y-2 w-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">当前处理区间 [{start} - {end}]</p>
                <div className="flex items-center gap-1.5 justify-center flex-wrap min-h-[60px]">
                    {subset.map((val, idx) => {
                        const actualIdx = start + idx;
                        const isComp = step.comparing.includes(actualIdx);
                        const isSwap = step.swapping.includes(actualIdx);
                        const ptrI = step.aux?.pointers?.i;
                        const ptrJ = step.aux?.pointers?.j;
                        
                        const isPtrI = ptrI === actualIdx && (!isMergeSort || (ptrI >= start && ptrI <= mid));
                        const isPtrJ = ptrJ === actualIdx && (!isMergeSort || (ptrJ > mid && ptrJ <= end));

                        return (
                            <React.Fragment key={idx}>
                                {isMergeSort && actualIdx === mid + 1 && <div className="w-px h-10 bg-indigo-200 dark:bg-indigo-800 mx-1 border-dashed border-l-2"></div>}
                                <div className="flex flex-col items-center relative">
                                    <div className={`w-10 h-10 flex flex-col items-center justify-center border-2 rounded-xl transition-all ${isSwap ? 'bg-rose-100 dark:bg-rose-900/20 border-rose-500' : isComp ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-500' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                                        <span className="font-bold text-xs dark:text-slate-100">{val}</span>
                                        <span className="text-[8px] text-slate-400">{actualIdx}</span>
                                    </div>
                                    <div className="absolute top-full mt-1 flex flex-col items-center">
                                        {isPtrI && <div className="flex flex-col items-center text-orange-500 font-black animate-bounce"><ArrowUp size={12} /><span className="text-[9px]">i</span></div>}
                                        {isPtrJ && <div className="flex flex-col items-center text-indigo-500 font-black animate-bounce"><ArrowUp size={12} /><span className="text-[9px]">j</span></div>}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
              </div>

              {isMergeSort && (
                  <div className="space-y-3 w-full pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">归并辅助数组 (Buffer)</p>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                      </div>
                      <div className="flex gap-1.5 justify-center min-h-[50px] flex-wrap">
                          {mergeBuffer.length === 0 ? (
                              <div className="text-[10px] text-slate-400 italic">等待暂存数据...</div>
                          ) : (
                            mergeBuffer.map((val, bidx) => (
                                <div key={bidx} className="w-9 h-9 flex items-center justify-center border-2 border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-xs animate-in zoom-in-50 duration-200">
                                    {val}
                                </div>
                            ))
                          )}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const renderCountingSort = () => {
    if (!step.aux?.counts) return null;
    return (
      <div className="flex flex-wrap gap-2 p-6 w-full justify-center max-h-[280px] overflow-y-auto">
        {step.aux.counts.map((count, idx) => (
            <div key={idx} id={`bucket-${idx}`} className={`w-9 h-9 text-xs border-2 rounded-xl flex flex-col items-center justify-center font-bold transition-all ${step.aux?.bucketIndex === idx ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg' : count > 0 ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700'}`}>
                <span className="text-[8px] opacity-50 mb-0.5">{idx}</span>
                <span>{count}</span>
            </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-800 font-black text-slate-700 dark:text-slate-200 text-xs flex items-center justify-between uppercase tracking-wider">
            <div className="flex items-center gap-2">
                <ScanEye size={16} className="text-indigo-500" />
                <span>原理透视: {algorithm}</span>
            </div>
            <div className="flex items-center gap-1">
                 <button 
                    onClick={onNextStep} 
                    disabled={isPlaying || isFinished}
                    title="单步推进演示"
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0"
                 >
                    <StepForward size={16} />
                 </button>
                 {!isPlaying ? (
                    <button 
                        onClick={onPlay} 
                        disabled={isFinished}
                        title="开始自动演示"
                        className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-emerald-600 hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0"
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                 ) : (
                    <button 
                        onClick={onPause} 
                        title="暂停自动演示"
                        className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-rose-600 hover:-translate-y-1 transition-all"
                    >
                        <Pause size={16} fill="currentColor" />
                    </button>
                 )}
                 <button 
                    onClick={onReset} 
                    title="重置当前进度"
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:-translate-y-1 transition-all"
                 >
                    <RotateCcw size={16} />
                 </button>
                 <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                 <button 
                    onClick={() => setIsTracking(!isTracking)} 
                    title={isTracking ? "停用自动跟随" : "启用自动跟随"}
                    className={`p-2 rounded-xl transition-all hover:-translate-y-1 ${isTracking ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-slate-300'}`}
                 >
                    <Eye size={16} />
                 </button>
            </div>
        </div>
        <div className="min-h-[220px] flex items-center justify-center">
            {algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX 
                ? renderCountingSort() 
                : (algorithm.includes('归并') || algorithm.includes('快速')) 
                    ? renderRangeView() 
                    : renderSimpleList()}
        </div>
    </div>
  );
};

export default ConceptVisualizer;