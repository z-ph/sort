import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AlgorithmType, SortStep } from '../types';
import { ArrowUp, ScanEye, Eye, Play, Pause, StepForward, RotateCcw, Hash, Grid3X3, ArrowDown, ArrowRight } from 'lucide-react';

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

const NODE_SIZE = 48;
const LEVEL_HEIGHT = 90;
const MIN_HORIZONTAL_SPACING = 30;

const ConceptVisualizer: React.FC<Props> = ({ 
    step, algorithm, onPlay, onPause, onReset, onNextStep, isPlaying, isFinished
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const topListRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(true);

  // --- 核心 Hook 区域 ---
  const n = step?.array.length || 0;
  const maxLevel = n > 0 ? Math.floor(Math.log2(n)) : 0;
  const totalLeafNodes = Math.pow(2, maxLevel);
  const canvasWidth = Math.max(800, totalLeafNodes * (NODE_SIZE + MIN_HORIZONTAL_SPACING));
  const canvasHeight = (maxLevel + 1) * LEVEL_HEIGHT + 60;

  const heapNodes = useMemo(() => {
    if (!step || algorithm !== AlgorithmType.HEAP) return [];
    const res = [];
    for (let i = 0; i < step.array.length; i++) {
      const level = Math.floor(Math.log2(i + 1));
      const levelIdx = i - (Math.pow(2, level) - 1);
      const nodesInLevel = Math.pow(2, level);
      const x = ((levelIdx + 0.5) * canvasWidth) / nodesInLevel;
      const y = level * LEVEL_HEIGHT + 50;
      res.push({ x, y, val: step.array[i], idx: i });
    }
    return res;
  }, [step?.array, algorithm, canvasWidth]);

  // --- 统一的自动滚动追踪逻辑 ---
  useEffect(() => {
    if (!isTracking || !step) return;

    // 1. 处理顶部序列滚动 (仅计数/基数排序有效)
    // 无论是否涉及桶操作，只要有数组元素被比较或交换，顶部列表就应该跟随
    if ((algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX || algorithm === AlgorithmType.RADIX_REC) && topListRef.current) {
        const activeArrayIdx = step.swapping[0] ?? step.comparing[0];
        if (activeArrayIdx !== undefined) {
            const item = document.getElementById(`concept-item-${activeArrayIdx}`);
            if (item) {
                const container = topListRef.current;
                const itemRect = item.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // 计算使得元素居中的 scrollLeft
                const scrollLeft = container.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width / 2) + (itemRect.width / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }

    // 2. 处理主容器滚动 (适用于所有算法)
    if (containerRef.current) {
        let targetId: string | null = null;
        
        if (algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX || algorithm === AlgorithmType.RADIX_REC) {
            // 计数/基数模式下，主容器显示的是桶
            // 如果 step 中指定了 bucketIndex，则追踪桶；否则不强制滚动底部（保持用户视野）
            if (step.aux?.bucketIndex !== undefined) {
                targetId = `concept-item-bucket-${step.aux.bucketIndex}`;
            }
        } else {
            // 其他模式下，主容器显示的是数组元素
            const activeIdx = step.swapping[0] ?? step.comparing[0];
            if (activeIdx !== undefined) {
                targetId = `concept-item-${activeIdx}`;
            }
        }

        if (targetId) {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const container = containerRef.current;
                const targetRect = targetElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                const relativeTop = container.scrollTop + (targetRect.top - containerRect.top);
                const relativeLeft = container.scrollLeft + (targetRect.left - containerRect.left);

                container.scrollTo({
                    left: relativeLeft - containerRect.width / 2 + targetRect.width / 2,
                    top: relativeTop - containerRect.height / 2 + targetRect.height / 2,
                    behavior: 'smooth'
                });
            }
        }
    }
  }, [step, isTracking, algorithm]);

  if (!step) return null;

  // --- 希尔排序矩阵视图 (固定高度) ---
  const renderShellView = () => {
    const { array, comparing, swapping, aux } = step;
    const gap = aux?.gap || 1;
    const activeCols = new Set([...comparing, ...swapping].map(idx => idx % gap));

    return (
      <div className="flex flex-col h-[400px] w-full">
        <div className="flex items-center justify-between px-5 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-20 shadow-sm">
           <div className="flex items-center gap-2">
              <Grid3X3 size={12} className="text-indigo-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                矩阵布局 (列宽 = Gap)
              </span>
           </div>
           <div className="flex items-center gap-1.5">
             <span className="text-[9px] font-bold text-slate-400 uppercase">当前步长:</span>
             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
               {gap}
             </span>
           </div>
        </div>
        
        <div ref={containerRef} className="flex-1 overflow-auto p-8 pt-16 bg-white dark:bg-slate-950">
            <div 
              className="grid gap-x-4 gap-y-6 mx-auto"
              style={{ 
                gridTemplateColumns: `repeat(${gap}, minmax(48px, 1fr))`,
                width: 'fit-content',
                minWidth: '100%'
              }}
            >
                {array.map((val, idx) => {
                    const col = idx % gap;
                    const isComp = comparing.includes(idx);
                    const isSwap = swapping.includes(idx);
                    const isInActiveCol = activeCols.has(col);
                    
                    const groupColor = `hsla(${(col * 360) / gap}, 70%, 50%, 1)`;
                    const groupBg = `hsla(${(col * 360) / gap}, 70%, 50%, 0.1)`;

                    return (
                        <div key={idx} id={`concept-item-${idx}`} className="relative flex flex-col items-center">
                            {idx + gap < array.length && (
                              <div 
                                className={`absolute top-full h-6 w-0.5 transition-opacity ${isInActiveCol ? 'opacity-80' : 'opacity-10'}`}
                                style={{ backgroundColor: groupColor }}
                              />
                            )}

                            <div 
                                className={`w-12 h-12 flex flex-col items-center justify-center border-2 rounded-xl z-10 transition-all shadow-sm ${isSwap ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-500 scale-110 z-20 shadow-lg' : isComp ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-500 scale-110 z-20 shadow-lg' : 'bg-white dark:bg-slate-900'}`}
                                style={(!isSwap && !isComp) ? { borderColor: groupColor, backgroundColor: groupBg } : {}}
                            >
                                <span className="font-black text-xs" style={(!isSwap && !isComp) ? { color: groupColor } : {}}>{val}</span>
                                <span className="text-[7px] font-bold text-slate-400/40 absolute -top-4">#{idx}</span>
                            </div>

                            {idx < gap && (
                                <div className="absolute -top-11 text-[9px] font-black uppercase tracking-tighter" style={{ color: groupColor }}>
                                    列 {col}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 text-center shrink-0">
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">垂直对齐显示当前 Gap={gap} 下的逻辑子序列</p>
        </div>
      </div>
    );
  };

  // --- 计数排序视图 (固定高度) ---
  const renderCountingSort = () => {
    // 如果存在 buckets 数据（基数排序），则使用专门的链表视图
    if ((algorithm === AlgorithmType.RADIX || algorithm === AlgorithmType.RADIX_REC) && step.aux?.buckets) return renderRadixLinkedList();
    
    // 计数排序的“寻找最大值”阶段回退到简单列表
    if (!step.aux?.counts && algorithm === AlgorithmType.COUNTING) return renderSimpleList();
    if (!step.aux?.counts) return renderSimpleList();

    const { bucketIndex } = step.aux;
    
    return (
      <div className="flex flex-col h-[400px] w-full bg-slate-50/50 dark:bg-slate-950/20 overflow-hidden">
        {renderTopArrayRow()}
        
        {/* 底部桶区域：占据剩余空间，垂直滚动 */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-6 relative">
             <div className="absolute top-4 left-0 w-full text-center pointer-events-none opacity-10 font-black text-6xl text-slate-300 dark:text-slate-700 uppercase tracking-widest select-none">Buckets</div>
            <div className="flex flex-wrap gap-4 justify-center relative z-10">
                {step.aux.counts.map((count, idx) => (
                    <div 
                        key={idx} 
                        id={`concept-item-bucket-${idx}`} 
                        className={`w-16 h-20 border-2 rounded-2xl flex flex-col items-center justify-between p-2 font-black transition-all duration-300 shrink-0 ${bucketIndex === idx ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-xl' : count > 0 ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700'}`}
                    >
                        <span className="text-[9px] opacity-60 uppercase tracking-tighter">桶 {idx}</span>
                        <div className="flex-1 flex items-center justify-center text-xl">{count}</div>
                        {bucketIndex === idx && <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce mb-1"></div>}
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  };

  // --- 基数排序链表视图 (固定高度) ---
  const renderRadixLinkedList = () => {
      const { bucketIndex, buckets, exp } = step.aux!;

      return (
          <div className="flex flex-col h-[400px] w-full bg-slate-50/50 dark:bg-slate-950/20 overflow-hidden">
              {renderTopArrayRow()}

              <div ref={containerRef} className="flex-1 overflow-y-auto p-6 relative">
                  <div className="absolute top-4 left-0 w-full text-center pointer-events-none opacity-10 font-black text-6xl text-slate-300 dark:text-slate-700 uppercase tracking-widest select-none">Linked List</div>
                  
                  <div className="flex flex-col gap-3 relative z-10 max-w-4xl mx-auto">
                      {buckets!.map((bucket, idx) => {
                          const isActiveBucket = bucketIndex === idx;
                          return (
                              <div key={idx} id={`concept-item-bucket-${idx}`} className={`flex items-start gap-4 p-2 rounded-xl transition-all ${isActiveBucket ? 'bg-indigo-50/80 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800' : ''}`}>
                                  {/* 桶头 (Head) */}
                                  <div className={`w-12 h-12 flex flex-col items-center justify-center border-2 rounded-xl font-black shrink-0 z-10 ${isActiveBucket ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                      <span className="text-sm">{idx}</span>
                                      <span className="text-[8px] font-normal uppercase opacity-70">Bucket</span>
                                  </div>

                                  {/* 链表节点 */}
                                  <div className="flex items-center gap-1 overflow-x-auto py-1 px-1 scrollbar-hide">
                                      {bucket.length === 0 ? (
                                          <div className="h-10 flex items-center text-slate-300 dark:text-slate-700 italic text-xs pl-2">Empty</div>
                                      ) : (
                                          bucket.map((val, vIdx) => {
                                              // 高亮最新加入的节点
                                              const isNewNode = isActiveBucket && vIdx === bucket.length - 1 && (step.description?.includes('尾插入') || step.description?.includes('放入桶'));
                                              // 高亮即将移除的节点 (Shift)
                                              const isLeavingNode = isActiveBucket && vIdx === 0 && (step.description?.includes('取出') || step.description?.includes('写回'));

                                              return (
                                                  <div key={`${idx}-${vIdx}`} className="flex items-center gap-1 animate-in slide-in-from-left-2 duration-300">
                                                      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600" />
                                                      <div className={`w-10 h-10 flex items-center justify-center border-2 rounded-full font-bold text-xs shadow-sm transition-all ${
                                                          isNewNode ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 scale-110' : 
                                                          isLeavingNode ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-500 text-rose-700 dark:text-rose-400 opacity-50 scale-90' :
                                                          'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                                                      }`}>
                                                          {/* 高亮当前位 */}
                                                          {renderNumberWithDigit(val, isActiveBucket, exp)}
                                                      </div>
                                                  </div>
                                              );
                                          })
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  // 辅助函数：渲染顶部数组行
  const renderTopArrayRow = () => {
      const exp = step.aux?.exp;
      return (
        <div ref={topListRef} className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-sm overflow-x-auto relative">
             <div className="flex gap-1.5 items-center w-max min-w-full px-2">
                 <div className="mr-3 text-[10px] font-black text-slate-400 uppercase tracking-widest flex flex-col items-center gap-1 shrink-0 sticky left-0 bg-white dark:bg-slate-900 z-20 px-2 py-1 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm">
                    <span>原始序列</span>
                    {exp && <span className="text-indigo-500 text-[9px] bg-indigo-50 dark:bg-indigo-900/30 px-1.5 rounded">当前位: {exp}</span>}
                 </div>
                 {step.array.map((val, idx) => {
                    const isFocus = step.comparing.includes(idx) || step.swapping.includes(idx);
                    // 只有在非递归基数排序或者递归的当前范围内才高亮
                    const isInRecursiveRange = step.aux?.range ? (idx >= step.aux.range.start && idx <= step.aux.range.end) : true;
                    
                    return (
                        <div key={idx} id={`concept-item-${idx}`} className={`w-10 h-10 flex items-center justify-center border-2 rounded-lg text-[11px] font-bold transition-all shrink-0 relative overflow-hidden ${!isInRecursiveRange ? 'opacity-30 grayscale' : ''} ${isFocus ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-md z-10' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                            {renderNumberWithDigit(val, isFocus, exp)}
                            {isFocus && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></div>}
                        </div>
                    );
                 })}
             </div>
        </div>
      );
  };

  // 辅助函数：渲染带有高亮位的数字
  const renderNumberWithDigit = (val: number, isFocus: boolean, exp?: number) => {
      if (!exp) return <span className="z-10 relative">{val}</span>;
      
      const strVal = Math.abs(val).toString();
      const digitPosFromRight = Math.log10(exp);
      const targetIndex = strVal.length - 1 - digitPosFromRight;
      
      if (targetIndex < 0) return <span className="z-10 relative">{val}</span>; 

      return (
          <span className="flex items-center justify-center z-10 relative font-mono tracking-tighter">
              {strVal.split('').map((char, i) => (
                  <span key={i} className={`${i === targetIndex ? (isFocus ? 'text-white bg-white/30 rounded px-0.5 mx-px' : 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 rounded px-0.5 mx-px') : ''}`}>
                      {char}
                  </span>
              ))}
          </span>
      );
  };

  // --- 简单列表视图 (自适应高度) ---
  const renderSimpleList = () => {
    // 检查是否是计数排序的 "寻找最大值" 阶段
    const isCountingScan = algorithm === AlgorithmType.COUNTING && step.aux?.maxValue !== undefined;
    
    return (
        <div className="flex flex-col h-auto w-full"> {/* Changed from h-full to h-auto */}
            {isCountingScan && (
                <div className="shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-2">
                        <ScanEye size={16} className="text-amber-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">扫描阶段: 确定数值范围</span>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-800">
                        <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase">Current Max</span>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">{step.aux?.maxValue}</span>
                    </div>
                </div>
            )}
            
            {/* Added max-h and min-h for adaptability */}
            <div ref={containerRef} className="flex gap-2 flex-wrap justify-center overflow-auto w-full p-8 max-h-[400px] min-h-[160px]">
                {step.array.map((val, idx) => {
                    const isComp = step.comparing.includes(idx);
                    const isSwap = step.swapping.includes(idx);
                    const isSorted = step.sorted.includes(idx);
                    const isMinIdx = step.aux?.minIdx === idx;
                    const isKeyIdx = step.aux?.keyIdx === idx;
                    
                    let color = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';
                    let extraStyles = '';
                    
                    if (isSorted) color = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400';
                    else if (isSwap) color = 'bg-rose-100 dark:bg-rose-900/20 border-rose-500 text-rose-700 dark:text-rose-400 scale-110 z-10';
                    else if (isComp) color = 'bg-amber-100 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400 scale-105 z-10';
                    else if (isMinIdx) color = 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-400 shadow-md ring-2 ring-purple-200 dark:ring-purple-900/50';
                    else if (isKeyIdx) color = 'bg-sky-50 dark:bg-sky-900/20 border-sky-500 text-sky-700 dark:text-sky-400 shadow-md -translate-y-2';

                    return (
                        <div key={idx} id={`concept-item-${idx}`} className={`relative w-10 h-10 flex items-center justify-center border-2 rounded-xl font-bold text-xs shadow-sm transition-all duration-200 shrink-0 ${color} ${extraStyles}`}>
                            {val}
                            {isMinIdx && (
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter whitespace-nowrap z-20">
                                    Min
                                </div>
                            )}
                            {isKeyIdx && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-sky-500 font-black flex flex-col items-center animate-bounce">
                                    <span className="text-[8px] uppercase tracking-tighter">Key</span>
                                    <ArrowDown size={10} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  // --- 范围视图 (归并/快排) (固定高度) ---
  const renderRangeView = () => {
      // 修复：如果 aux.range 尚未初始化（初始状态），则回退到简单列表视图
      if (!step.aux?.range) return renderSimpleList();

      const { start, end } = step.aux.range;
      const isMergeSort = algorithm.includes('归并');
      const mid = Math.floor((start + end) / 2);
      const mergeBuffer = step.aux.mergeBuffer;

      return (
          <div className="flex flex-col items-center w-full h-[400px]"> {/* Fixed height */}
              <div className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 dark:border-slate-800 w-full bg-slate-50/50 dark:bg-slate-900/50 shrink-0">当前激活区间: [{start} - {end}]</div>
              
              <div ref={containerRef} className="flex-1 w-full overflow-auto py-8 px-4">
                <div className="flex flex-col items-center gap-12 w-full mx-auto">
                    
                    {/* 主数组视图 - 允许换行 */}
                    <div className="flex flex-wrap items-center gap-2 justify-center w-full">
                        {step.array.slice(start, end + 1).map((val, idx) => {
                            const actualIdx = start + idx;
                            const isComp = step.comparing.includes(actualIdx);
                            const isSwap = step.swapping.includes(actualIdx);
                            const ptrI = step.aux?.pointers?.i === actualIdx;
                            const ptrJ = step.aux?.pointers?.j === actualIdx;

                            return (
                                <React.Fragment key={actualIdx}>
                                    {isMergeSort && actualIdx === mid + 1 && <div className="w-px h-12 bg-indigo-200 dark:bg-indigo-800 mx-1 border-dashed border-l-2 shrink-0 hidden sm:block"></div>}
                                    <div id={`concept-item-${actualIdx}`} className="flex flex-col items-center relative shrink-0 my-1">
                                        <div className={`w-11 h-11 flex flex-col items-center justify-center border-2 rounded-xl transition-all ${isSwap ? 'bg-rose-100 dark:bg-rose-900/20 border-rose-500' : isComp ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}>
                                            <span className="font-bold text-xs dark:text-slate-100">{val}</span>
                                            <span className="text-[7px] text-slate-400 absolute -top-4">{actualIdx}</span>
                                        </div>
                                        <div className="absolute top-full mt-1 flex flex-col items-center z-10 pointer-events-none">
                                            {ptrI && <div className="flex flex-col items-center text-orange-500 font-black"><ArrowUp size={10} /><span className="text-[9px]">i</span></div>}
                                            {ptrJ && <div className="flex flex-col items-center text-indigo-500 font-black"><ArrowUp size={10} /><span className="text-[9px]">j</span></div>}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* 辅助数组视图 (仅归并排序显示) - 允许换行 */}
                    {isMergeSort && (
                         <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 fade-in duration-300 w-full">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-6 h-px bg-slate-300 dark:bg-slate-700"></span>
                                辅助数组 (Merge Buffer)
                                <span className="w-6 h-px bg-slate-300 dark:bg-slate-700"></span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 justify-center max-w-full">
                                {(mergeBuffer || []).map((val, idx) => (
                                    <div key={idx} className="w-9 h-9 flex items-center justify-center bg-indigo-500 text-white rounded-lg shadow-sm border border-indigo-400 text-[10px] font-bold shrink-0 animate-in zoom-in-50 duration-200">
                                        {val}
                                    </div>
                                ))}
                                {/* 填充剩余空位，保持视觉长度一致 (如果换行太多则不显示占位符以节省空间) */}
                                {(mergeBuffer?.length || 0) < 20 && Array.from({ length: Math.max(0, (end - start + 1) - (mergeBuffer?.length || 0)) }).map((_, idx) => (
                                     <div key={`empty-${idx}`} className="w-9 h-9 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-lg shrink-0"></div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              </div>
          </div>
      );
  };

  // --- 堆排序视图 (固定高度) ---
  const renderHeapView = () => {
    const { comparing, swapping, aux, sorted } = step;
    const heapSize = aux?.heapSize ?? step.array.length;
    return (
        <div ref={containerRef} className="w-full h-[400px] overflow-auto bg-white dark:bg-slate-950"> {/* Fixed height */}
            <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
                <svg className="absolute inset-0 pointer-events-none" width={canvasWidth} height={canvasHeight}>
                    {heapNodes.map((node) => {
                        const children = [2 * node.idx + 1, 2 * node.idx + 2].filter(c => c < step.array.length);
                        return children.map(cIdx => {
                            const childNode = heapNodes[cIdx];
                            if (!childNode) return null;
                            const isEdgeComp = (comparing.includes(node.idx) && comparing.includes(cIdx)) || (swapping.includes(node.idx) && swapping.includes(cIdx));
                            const isInactive = node.idx >= heapSize || cIdx >= heapSize;
                            return (
                                <line key={`edge-${node.idx}-${cIdx}`} x1={node.x} y1={node.y} x2={childNode.x} y2={childNode.y} stroke={isEdgeComp ? '#f59e0b' : isInactive ? 'rgba(34, 197, 94, 0.1)' : 'currentColor'} strokeWidth={isEdgeComp ? 3 : 1.5} className={`${isInactive ? 'text-emerald-500/10' : 'text-slate-200 dark:text-slate-800'} transition-all duration-300`} />
                            );
                        });
                    })}
                </svg>
                {heapNodes.map((node) => {
                    const isInactive = node.idx >= heapSize;
                    const isSorted = sorted.includes(node.idx);
                    const isComp = comparing.includes(node.idx);
                    const isSwap = swapping.includes(node.idx);
                    let statusColor = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200';
                    if (isSorted || isInactive) statusColor = 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 opacity-60';
                    else if (isSwap || isComp) statusColor = isSwap ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-500 text-rose-700 scale-110 z-20 shadow-lg' : 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-700 scale-110 z-20 shadow-lg';
                    else if (node.idx === aux?.pointers?.parent) statusColor = 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-300';
                    return (
                        <div key={`node-${node.idx}`} id={`concept-item-${node.idx}`} className={`absolute flex flex-col items-center justify-center border-2 rounded-full font-black transition-all duration-300 ${statusColor}`} style={{ left: node.x - NODE_SIZE/2, top: node.y - NODE_SIZE/2, width: NODE_SIZE, height: NODE_SIZE, fontSize: '10px' }}>
                            <span className="text-[7px] text-slate-400/60 mb-0.5">{node.idx}</span>
                            <span>{node.val}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-20 flex flex-col"> {/* Removed min-h-[480px] */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-800 font-black text-slate-700 dark:text-slate-200 text-xs flex items-center justify-between uppercase tracking-wider rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2">
                <ScanEye size={16} className="text-indigo-500" />
                <span>算法原理透视 (局部视野)</span>
            </div>
            <div className="flex items-center gap-1.5">
                 <button 
                  data-tooltip="单步执行下一帧"
                  onClick={onNextStep} 
                  disabled={isPlaying || isFinished} 
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 hover:text-indigo-600 disabled:opacity-30 transition-all"
                 >
                   <StepForward size={14}/>
                 </button>
                 {!isPlaying ? 
                    <button 
                      data-tooltip="开始自动演示"
                      onClick={onPlay} 
                      disabled={isFinished} 
                      className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-emerald-600 disabled:opacity-30 transition-all active:scale-95"
                    >
                      <Play size={14} fill="currentColor"/>
                    </button> :
                    <button 
                      data-tooltip="暂停当前演示"
                      onClick={onPause} 
                      className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-rose-600 transition-all active:scale-95"
                    >
                      <Pause size={14} fill="currentColor"/>
                    </button>
                 }
                 <button 
                  data-tooltip="重置当前算法演示"
                  onClick={onReset} 
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-rose-600 transition-all"
                 >
                   <RotateCcw size={14}/>
                 </button>
                 <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                 <button 
                  data-tooltip={isTracking ? "禁用视口自动追踪" : "启用视口自动追踪"}
                  onClick={() => setIsTracking(!isTracking)} 
                  className={`p-2 rounded-xl transition-all ${isTracking ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                 >
                   <Eye size={14} />
                 </button>
            </div>
        </div>
        <div className="flex-1 bg-slate-50/30 dark:bg-slate-950/20 overflow-hidden rounded-b-2xl min-h-[120px]"> {/* Added min-h-[120px] for empty state safety */}
            {algorithm === AlgorithmType.HEAP ? renderHeapView() : 
             (algorithm === AlgorithmType.COUNTING || algorithm === AlgorithmType.RADIX || algorithm === AlgorithmType.RADIX_REC) ? renderCountingSort() :
             algorithm === AlgorithmType.SHELL ? renderShellView() :
             (algorithm.includes('归并') || algorithm.includes('快速')) ? renderRangeView() : renderSimpleList()}
        </div>
    </div>
  );
};

export default ConceptVisualizer;