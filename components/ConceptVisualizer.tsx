import React, { useEffect, useRef, useState } from 'react';
import { AlgorithmType, SortStep } from '../types';
import { CHART_COLORS } from '../constants';
import { ArrowUp, Play, Pause, StepForward, RotateCcw, RefreshCw, ScanEye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';

interface Props {
  step: SortStep | null;
  algorithm: AlgorithmType;
  arraySize: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onGenerate: () => void;
  onNextStep: () => void;
  isPlaying: boolean;
  isFinished: boolean;
}

const ConceptVisualizer: React.FC<Props> = ({ 
    step, 
    algorithm, 
    arraySize,
    onPlay,
    onPause,
    onReset,
    onGenerate,
    onNextStep,
    isPlaying,
    isFinished
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [isGlobalView, setIsGlobalView] = useState(false);

  // Auto-scroll to active element
  useEffect(() => {
    // Disable auto-scroll if tracking is off or global view is on (everything is visible)
    if (!isTracking || isGlobalView) return;

    let targetElement: Element | null = null;

    // 1. Counting / Radix Sort: Target Bucket
    if ((algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX) && step?.aux?.bucketIndex !== undefined) {
      targetElement = document.getElementById(`bucket-${step.aux.bucketIndex}`);
    } 
    // 2. Shell Sort: Target Grid Item
    else if (algorithm === AlgorithmType.SHELL && step) {
       const targetIdx = step.swapping.length > 0 ? step.swapping[0] : (step.comparing.length > 0 ? step.comparing[0] : -1);
       if (targetIdx !== -1) {
           targetElement = document.getElementById(`shell-item-${targetIdx}`);
       }
    }
    // 3. Heap Sort: Target Node (SVG)
    else if (algorithm === AlgorithmType.HEAP && step) {
       const targetIdx = step.swapping.length > 0 ? step.swapping[0] : (step.comparing.length > 0 ? step.comparing[0] : -1);
       if (targetIdx !== -1) {
           targetElement = document.getElementById(`heap-node-${targetIdx}`);
       }
    }

    // Perform Scroll using getBoundingClientRect for better SVG support
    if (targetElement && containerRef.current) {
      const container = containerRef.current;
      const targetRect = targetElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate relative position inside the scrollable content
      // We need to account for current scroll position
      const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
      const relativeLeft = targetRect.left - containerRect.left + container.scrollLeft;

      const elementHeight = targetRect.height;
      const elementWidth = targetRect.width;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;

      let newTop = container.scrollTop;
      let newLeft = container.scrollLeft;
      let needsScroll = false;

      // Vertical Logic
      if (relativeTop < container.scrollTop + 20) {
           // Element is above visible area (or too close to top)
           newTop = Math.max(0, relativeTop - containerHeight / 2);
           needsScroll = true;
      } else if (relativeTop + elementHeight > container.scrollTop + containerHeight - 20) {
           // Element is below visible area
           newTop = relativeTop - containerHeight / 2;
           needsScroll = true;
      }

      // Horizontal Logic
      if (relativeLeft < container.scrollLeft + 20) {
           newLeft = Math.max(0, relativeLeft - containerWidth / 2);
           needsScroll = true;
      } else if (relativeLeft + elementWidth > container.scrollLeft + containerWidth - 20) {
           newLeft = relativeLeft - containerWidth / 2;
           needsScroll = true;
      }

      if (needsScroll) {
           container.scrollTo({
               top: newTop,
               left: newLeft,
               behavior: 'smooth'
           });
      }
    }
  }, [step, algorithm, isTracking, isGlobalView]);

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
    
    // Scale style for global view
    const contentStyle = isGlobalView ? { transform: 'scale(0.6)', transformOrigin: 'top center', width: '166%' } : {};

    return (
      <div className="flex flex-col items-center w-full overflow-hidden">
        {/* Scrollable Container */}
        <div 
            ref={containerRef}
            className={`flex flex-wrap gap-2 p-4 w-full justify-center ${isGlobalView ? 'overflow-hidden' : 'max-h-[280px] overflow-y-auto'} content-start bg-gray-50/50 rounded-inner relative`}
        >
          <div className="flex flex-wrap gap-2 justify-center w-full" style={contentStyle}>
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
      const arr = step.array;
      // Remove size limit
      
      const depth = Math.floor(Math.log2(Math.max(1, arr.length)));
      const height = Math.max(320, (depth + 2) * 80);
      // Calculate dynamic width based on leaf nodes count to prevent overlap
      const leafCount = Math.pow(2, depth);
      const width = Math.max(800, leafCount * 50); // 50px per leaf
      
      const renderNode = (index: number, x: number, y: number, level: number) => {
          if (index >= arr.length) return null;
          
          const leftChildIdx = 2 * index + 1;
          const rightChildIdx = 2 * index + 2;
          // Calculate offset for children based on current level and total width
          // Logic: Level 0 (root) needs offset width/4. Level 1 needs width/8. Level k needs width / 2^(k+2)
          const xOffset = width / Math.pow(2, level + 2);

          const isComparing = step.comparing.includes(index);
          const isSwapping = step.swapping.includes(index);
          const isSorted = step.aux?.heapSize !== undefined && index >= step.aux.heapSize;

          let circleColor = 'fill-white stroke-gray-400';
          if (isSorted) circleColor = 'fill-green-100 stroke-green-500';
          else if (isSwapping) circleColor = 'fill-red-100 stroke-red-500';
          else if (isComparing) circleColor = 'fill-yellow-100 stroke-yellow-500';

          return (
              <g key={index} id={`heap-node-${index}`}>
                  {/* Lines to children */}
                  {leftChildIdx < arr.length && (
                      <line 
                        x1={x} y1={y + 15} 
                        x2={x - xOffset} y2={y + 80 - 15} 
                        stroke="#e2e8f0" strokeWidth="2" 
                      />
                  )}
                  {rightChildIdx < arr.length && (
                      <line 
                        x1={x} y1={y + 15} 
                        x2={x + xOffset} y2={y + 80 - 15} 
                        stroke="#e2e8f0" strokeWidth="2" 
                      />
                  )}
                  
                  {/* Children recursive call */}
                  {renderNode(leftChildIdx, x - xOffset, y + 80, level + 1)}
                  {renderNode(rightChildIdx, x + xOffset, y + 80, level + 1)}

                  {/* Node Circle */}
                  <circle cx={x} cy={y} r="16" className={`${circleColor} stroke-2 transition-colors duration-200`} />
                  <text x={x} y={y} dy=".3em" textAnchor="middle" className="text-xs font-mono font-bold select-none pointer-events-none">
                      {arr[index]}
                  </text>
                  <text x={x} y={y + 30} textAnchor="middle" className="text-[8px] text-gray-400 select-none">
                      {index}
                  </text>
              </g>
          );
      };

      // In global view, we use viewBox to scale the SVG to fit the container
      const svgProps = isGlobalView 
        ? { viewBox: `0 0 ${width} ${height}`, className: "w-full h-full max-h-[400px]" }
        : { width, height, className: "min-w-[300px]" };

      return (
          <div 
            ref={containerRef}
            className={`w-full p-4 ${isGlobalView ? 'h-full flex items-center justify-center overflow-hidden' : 'overflow-auto max-h-[500px]'}`}
          >
              {/* Wrapper to handle centering when content is small, and scroll when content is large */}
              <div className={`${!isGlobalView ? 'min-w-full w-fit' : 'w-full h-full'} flex justify-center`}>
                  <svg {...svgProps}>
                      {renderNode(0, width / 2, 40, 0)}
                  </svg>
              </div>
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

      // Scale style for global view
      const contentStyle = isGlobalView ? { transform: 'scale(0.8)', transformOrigin: 'top center', width: '125%' } : {};

      return (
          <div className="flex flex-col items-center w-full gap-4 p-4 overflow-hidden">
              <div className="w-full flex flex-col items-center" style={contentStyle}>
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
          </div>
      );
  };

  // 4. Shell Sort: Grid View to show groups
  const renderShellSort = () => {
      const gap = step.aux?.gap;
      if (!gap) return <div className="text-gray-400 text-sm p-4">等待增量分组...</div>;

      const items = step.array;
      const contentStyle = isGlobalView ? { transform: 'scale(0.6)', transformOrigin: 'top center', width: '166%' } : {};
      
      return (
          <div className="flex flex-col items-center w-full overflow-hidden">
              <div 
                ref={containerRef}
                className={`grid gap-2 p-4 w-full content-start bg-gray-50/50 rounded-inner relative ${isGlobalView ? 'overflow-hidden' : 'overflow-auto max-h-[280px]'}`}
                style={{ 
                    gridTemplateColumns: `repeat(${gap}, minmax(40px, 1fr))`,
                    ...contentStyle
                }}
              >
                  {items.map((val, idx) => {
                       const isComparing = step.comparing.includes(idx);
                       const isSwapping = step.swapping.includes(idx);
                       
                       let bgColor = 'bg-gray-50';
                       let borderColor = 'border-gray-200';
                       
                       // Highlight columns based on current index logic:
                       const activeRemainder = step.comparing.length > 0 ? step.comparing[0] % gap : -1;
                       const isInActiveGroup = idx % gap === activeRemainder;

                       if (isSwapping) { bgColor = 'bg-red-100'; borderColor = 'border-red-500'; }
                       else if (isComparing) { bgColor = 'bg-yellow-100'; borderColor = 'border-yellow-500'; }
                       else if (isInActiveGroup && activeRemainder !== -1) { bgColor = 'bg-blue-50'; borderColor = 'border-blue-200'; }

                       return (
                           <div 
                                key={idx} 
                                id={`shell-item-${idx}`}
                                className={`flex flex-col items-center p-2 rounded border ${bgColor} ${borderColor} transition-colors`}
                           >
                               <span className="font-bold text-sm text-gray-800">{val}</span>
                               <span className="text-[9px] text-gray-400 mt-1">{idx}</span>
                           </div>
                       );
                  })}
              </div>
              <div className="flex flex-col items-center gap-1 p-4">
                  <span className="text-sm font-semibold text-blue-600">当前增量 (Gap): {gap}</span>
                  <p className="text-xs text-gray-500 text-center max-w-md">
                      数组被分为 {gap} 列（组），每列独立进行插入排序。<br/>
                      这能让较小的元素快速移动到数组左侧。
                  </p>
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
  } else if (algorithm === AlgorithmType.SHELL) {
      content = renderShellSort();
  } else {
      return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-400 text-sm">
            该算法暂无特定的原理演示视图
        </div>
      );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <span>✨ 算法原理透视</span>
                <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-gray-200 rounded-full">{algorithm}</span>
            </div>
            
            {/* Header Controls */}
            <div className="flex items-center gap-1 self-end sm:self-auto">
                 {/* Tracking Toggle */}
                 <button 
                    onClick={() => setIsTracking(!isTracking)}
                    disabled={isGlobalView} // Disable tracking toggle if global view is on
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${isTracking ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:text-gray-600'}`}
                    title={isTracking ? "追踪模式: 开启" : "追踪模式: 关闭"}
                 >
                     {isTracking ? <ScanEye size={16} /> : <EyeOff size={16} />}
                 </button>

                 {/* Global View Toggle */}
                 <button 
                    onClick={() => setIsGlobalView(!isGlobalView)}
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${isGlobalView ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' : 'text-gray-400 hover:text-gray-600'}`}
                    title={isGlobalView ? "全局缩略: 开启" : "全局缩略: 关闭"}
                 >
                     {isGlobalView ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                 </button>

                 <div className="w-px h-4 bg-gray-300 mx-1"></div>

                 <button 
                    onClick={onGenerate}
                    disabled={isPlaying}
                    className="p-1.5 text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-gray-200 disabled:opacity-50"
                    title="生成新数组"
                 >
                     <RefreshCw size={16} />
                 </button>
                 <div className="w-px h-4 bg-gray-300 mx-1"></div>
                 <button 
                    onClick={isPlaying ? onPause : onPlay}
                    disabled={isFinished}
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${isPlaying ? 'bg-amber-100 text-amber-600' : 'text-gray-600 hover:bg-white hover:text-blue-600 border border-transparent hover:border-gray-200 disabled:opacity-50'}`}
                    title={isPlaying ? "暂停" : "开始"}
                 >
                     {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                 </button>
                 <button 
                    onClick={onNextStep}
                    disabled={isPlaying || isFinished}
                    className="p-1.5 text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-gray-200 disabled:opacity-50"
                    title="单步执行"
                 >
                     <StepForward size={16} />
                 </button>
                 <button 
                    onClick={onReset}
                    className="p-1.5 text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    title="重置"
                 >
                     <RotateCcw size={16} />
                 </button>
            </div>
        </div>
        <div className="min-h-[150px] flex items-center justify-center overflow-hidden">
            {content}
        </div>
    </div>
  );
};

export default ConceptVisualizer;