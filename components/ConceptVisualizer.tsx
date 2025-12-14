import React, { useEffect, useRef } from 'react';
import { AlgorithmType, SortStep } from '../types';
import { CHART_COLORS } from '../constants';
import { ArrowUp } from 'lucide-react';

interface Props {
  step: SortStep | null;
  algorithm: AlgorithmType;
  arraySize: number;
}

const ConceptVisualizer: React.FC<Props> = ({ step, algorithm, arraySize }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active bucket for Counting/Radix Sort
  useEffect(() => {
    if ((algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX) && step?.aux?.bucketIndex !== undefined) {
      const bucketId = `bucket-${step.aux.bucketIndex}`;
      const element = document.getElementById(bucketId);
      const container = containerRef.current;

      if (element && container) {
        // Calculate position relative to the container
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const containerTop = container.scrollTop;
        const containerHeight = container.clientHeight;

        // Check if element is out of view
        if (elementTop < containerTop || elementTop + elementHeight > containerTop + containerHeight) {
             // Scroll container to center the element
             container.scrollTo({
                 top: elementTop - containerHeight / 2 + elementHeight / 2,
                 behavior: 'smooth'
             });
        }
      }
    }
  }, [step?.aux?.bucketIndex, algorithm]);

  if (!step) return null;

  // --- Renderers for specific algorithms ---

  // 1. Counting Sort / Radix Sort: Show Buckets
  const renderCountingSort = () => {
    // Radix sort might just start without counts populated in step 0, handle graceful fallback or wait for step 1
    if (!step.aux?.counts) {
         // If it's Radix sort, we can show empty 0-9 buckets initially if data missing
         if (algorithm === AlgorithmType.RADIX) {
             // Render empty placeholder for Radix if counts missing (though we fixed algorithm to send them)
             return <div className="text-gray-400 text-sm p-4">初始化基数桶 (0-9)...</div>;
         }
         return <div className="text-gray-400 text-sm p-4">等待数据初始化...</div>;
    }
    
    const counts = step.aux.counts;
    
    return (
      <div className="flex flex-col items-center w-full">
        {/* Scrollable Container */}
        <div 
            ref={containerRef}
            className="flex flex-wrap gap-2 p-4 w-full justify-center max-h-[280px] overflow-y-auto content-start bg-gray-50/50 rounded-inner relative"
        >
          {counts.map((count, idx) => {
            const isActive = step.aux?.bucketIndex === idx;
            const isNonZero = count > 0;
            
            return (
              <div 
                key={idx} 
                id={`bucket-${idx}`}
                className="flex flex-col items-center gap-0.5 min-w-[28px]"
              >
                <div 
                  className={`w-7 h-7 text-xs border rounded flex items-center justify-center font-medium transition-all duration-200 ${
                    isActive 
                        ? 'border-blue-500 bg-blue-100 scale-125 shadow-lg z-10 ring-2 ring-blue-300' 
                        : isNonZero 
                            ? 'border-gray-300 bg-white text-gray-800 font-bold'
                            : 'border-gray-100 bg-white/50 text-gray-300'
                  }`}
                >
                  {count}
                </div>
                <span className={`text-[9px] font-mono select-none ${isActive ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                    {idx}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between w-full px-4 mt-2 text-xs text-gray-500">
             <span>* 桶下标对应{algorithm === AlgorithmType.RADIX ? '当前位数值' : '数值'}</span>
             <span>范围: 0 ~ {counts.length - 1}</span>
        </div>
      </div>
    );
  };

  // 2. Heap Sort: Show Binary Tree
  const renderHeapSort = () => {
      // If array is too large, tree visualization becomes unreadable
      if (arraySize > 31) {
          return (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  数据量过大 ({arraySize})，无法清晰展示树状结构。建议将数量调整至 30 以下。
              </div>
          );
      }

      const arr = step.array;
      const levels = Math.floor(Math.log2(arr.length)) + 1;
      const height = levels * 60;
      const width = Math.min(800, arr.length * 40);
      
      const renderNode = (index: number, x: number, y: number, level: number) => {
          if (index >= arr.length) return null;
          
          const leftChildIdx = 2 * index + 1;
          const rightChildIdx = 2 * index + 2;
          const xOffset = width / Math.pow(2, level + 2);

          const isComparing = step.comparing.includes(index);
          const isSwapping = step.swapping.includes(index);
          const isSorted = step.aux?.heapSize !== undefined && index >= step.aux.heapSize;

          let circleColor = 'fill-white stroke-gray-400';
          if (isSorted) circleColor = 'fill-green-100 stroke-green-500';
          else if (isSwapping) circleColor = 'fill-red-100 stroke-red-500';
          else if (isComparing) circleColor = 'fill-yellow-100 stroke-yellow-500';

          return (
              <g key={index}>
                  {/* Lines to children */}
                  {leftChildIdx < arr.length && (
                      <line 
                        x1={x} y1={y + 15} 
                        x2={x - xOffset} y2={y + 60 - 15} 
                        stroke="#e2e8f0" strokeWidth="2" 
                      />
                  )}
                  {rightChildIdx < arr.length && (
                      <line 
                        x1={x} y1={y + 15} 
                        x2={x + xOffset} y2={y + 60 - 15} 
                        stroke="#e2e8f0" strokeWidth="2" 
                      />
                  )}
                  
                  {/* Children recursive call */}
                  {renderNode(leftChildIdx, x - xOffset, y + 60, level + 1)}
                  {renderNode(rightChildIdx, x + xOffset, y + 60, level + 1)}

                  {/* Node Circle */}
                  <circle cx={x} cy={y} r="16" className={`${circleColor} stroke-2 transition-colors duration-200`} />
                  <text x={x} y={y} dy=".3em" textAnchor="middle" className="text-xs font-mono font-bold select-none pointer-events-none">
                      {arr[index]}
                  </text>
                  <text x={x} y={y + 28} textAnchor="middle" className="text-[8px] text-gray-400 select-none">
                      {index}
                  </text>
              </g>
          );
      };

      return (
          <div className="w-full overflow-x-auto flex justify-center p-4">
              <svg width={width} height={height} className="min-w-[300px]">
                  {renderNode(0, width / 2, 30, 0)}
              </svg>
          </div>
      );
  };

  // 3. Merge/Quick Sort: Show Split/Range View
  const renderRangeView = () => {
      if (!step.aux?.range) return <div className="text-gray-400 text-sm p-4">等待分治操作...</div>;

      const { start, end } = step.aux.range;
      const subset = step.array.slice(start, end + 1);
      const mergeBuffer = step.aux.mergeBuffer;
      
      // Determine split point (mid for merge, pivot for quick)
      let splitIdx = -1;
      if (algorithm.includes('归并')) {
          splitIdx = Math.floor((end - start) / 2);
      } else if (step.aux.pivot !== undefined) {
          splitIdx = step.aux.pivot - start;
      }

      return (
          <div className="flex flex-col items-center w-full gap-4 p-4">
              {/* Main Subarray Visualization */}
              <div className="flex items-center gap-1 justify-center flex-wrap pt-4">
                   {subset.map((val, idx) => {
                       const actualIdx = start + idx;
                       const isComparing = step.comparing.includes(actualIdx);
                       const isSwapping = step.swapping.includes(actualIdx);
                       const isPivot = algorithm.includes('快速') && step.aux?.pivot === actualIdx;
                       
                       // Pointer Checks
                       const isPtrI = step.aux?.pointers?.i === actualIdx;
                       const isPtrJ = step.aux?.pointers?.j === actualIdx;
                       
                       let bgColor = 'bg-gray-100';
                       let borderColor = 'border-gray-200';
                       
                       if (isPivot) { bgColor = 'bg-purple-100'; borderColor = 'border-purple-500'; }
                       else if (isSwapping) { bgColor = 'bg-red-100'; borderColor = 'border-red-500'; }
                       else if (isComparing) { bgColor = 'bg-yellow-100'; borderColor = 'border-yellow-500'; }

                       return (
                           <React.Fragment key={idx}>
                               {/* Visual Splitter for Merge Sort */}
                               {algorithm.includes('归并') && idx === splitIdx + 1 && (
                                   <div className="w-px h-8 bg-blue-400 mx-2 border-dashed border-l border-blue-400" title="Split Point"></div>
                               )}
                               
                               <div className="flex flex-col items-center relative">
                                   <div className={`w-10 h-10 flex flex-col items-center justify-center border-2 rounded ${bgColor} ${borderColor} transition-colors z-10`}>
                                       <span className="font-bold text-sm">{val}</span>
                                       <span className="text-[8px] text-gray-500">{actualIdx}</span>
                                   </div>
                                   
                                   {/* Pointers Visualization */}
                                   {(isPtrI || isPtrJ) && (
                                       <div className="absolute top-full mt-1 flex gap-1">
                                           {isPtrI && (
                                                <div className="flex flex-col items-center text-orange-600 animate-bounce" style={{animationDuration: '1s'}}>
                                                    <ArrowUp size={14} strokeWidth={3} />
                                                    <span className="text-xs font-bold leading-none">i</span>
                                                </div>
                                           )}
                                           {isPtrJ && (
                                                <div className="flex flex-col items-center text-blue-600 animate-bounce" style={{animationDuration: '1.2s'}}>
                                                    <ArrowUp size={14} strokeWidth={3} />
                                                    <span className="text-xs font-bold leading-none">j</span>
                                                </div>
                                           )}
                                       </div>
                                   )}
                               </div>
                           </React.Fragment>
                       );
                   })}
              </div>

              {/* Merge Sort Auxiliary Array Visualization */}
              {algorithm.includes('归并') && mergeBuffer && (
                 <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
                     <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                         辅助数组 (Temp Array)
                     </span>
                     <div className="flex gap-1 flex-wrap justify-center min-h-[36px]">
                         {mergeBuffer.length === 0 && <span className="text-xs text-gray-400 italic">空 (等待填充)</span>}
                         {mergeBuffer.map((val, bIdx) => (
                             <div key={bIdx} className="w-8 h-8 flex items-center justify-center bg-indigo-500 text-white rounded font-bold text-sm shadow-sm">
                                 {val}
                             </div>
                         ))}
                     </div>
                 </div>
              )}

              {/* Legend */}
              <div className="text-xs text-gray-500 mt-6 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                  {algorithm.includes('归并') 
                    ? (
                        <span className="flex gap-3">
                            <span><strong className="text-orange-600">i</strong>: 左组扫描指针</span>
                            <span><strong className="text-blue-600">j</strong>: 右组扫描指针</span>
                            <span><strong className="text-indigo-600">Temp</strong>: 有序合并结果</span>
                        </span>
                    )
                    : (
                        <span className="flex gap-3">
                            <span><strong className="text-purple-600">Pivot</strong>: 基准值</span>
                            <span><strong className="text-orange-600">i</strong>: 左扫描指针 &rarr;</span>
                            <span><strong className="text-blue-600">j</strong>: 右扫描指针 &larr;</span>
                        </span>
                    )
                  }
              </div>
          </div>
      );
  };

  // Dispatcher
  let content = null;
  if (algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX) {
      content = renderCountingSort();
  } else if (algorithm === AlgorithmType.HEAP) {
      content = renderHeapSort();
  } else if (algorithm.includes('归并') || algorithm.includes('快速')) {
      content = renderRangeView();
  } else {
      return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-400 text-sm">
            该算法暂无特定的原理演示视图
        </div>
      );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700 text-sm flex items-center gap-2">
            <span>✨ 算法原理透视</span>
            <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-gray-200 rounded-full">{algorithm}</span>
        </div>
        <div className="min-h-[150px] flex items-center justify-center">
            {content}
        </div>
    </div>
  );
};

export default ConceptVisualizer;