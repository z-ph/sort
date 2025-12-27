import React, { useState, useRef, useEffect } from 'react';
import { AlgorithmType, SortStats } from '../types';
import { ALGORITHM_OPTIONS } from '../constants';
import { getAlgorithmMetrics } from '../App';
import { runBenchmarkAsync } from '../services/sortingAlgorithms';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Play, RotateCcw, BarChart3, Clock, Zap, Info, Square, Loader2 } from 'lucide-react';

const BenchmarkPage: React.FC = () => {
  const [results, setResults] = useState<SortStats[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkSize, setBenchmarkSize] = useState(1000);
  const [currentRunning, setCurrentRunning] = useState<AlgorithmType | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  // 用于中断测试的引用
  const abortRef = useRef(false);

  // 组件卸载时设置中断标志
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  const startBenchmark = async () => {
    // 重置状态
    setIsBenchmarking(true);
    setResults([]);
    setProgress({ current: 0, total: ALGORITHM_OPTIONS.length });
    abortRef.current = false;
    
    // 1. 预先生成统一的随机数据，保证公平性
    const baseArray = Array.from({ length: benchmarkSize }, () => 
      Math.floor(Math.random() * 10000)
    );

    try {
      // 2. 使用异步循环进行任务调度
      for (let i = 0; i < ALGORITHM_OPTIONS.length; i++) {
        // 检查是否被用户中止
        if (abortRef.current) break;

        const algoOpt = ALGORITHM_OPTIONS[i];
        
        // 更新 UI：显示当前正在跑哪个算法
        setCurrentRunning(algoOpt.value as AlgorithmType);
        
        // 小的停顿，确保UI有一次渲染机会
        await new Promise(resolve => setTimeout(resolve, 10));

        // 再次检查中止
        if (abortRef.current) break;

        // 执行异步基准测试任务 (Time Slicing inside)
        // 传入 abort 检查回调
        const rawResult = await runBenchmarkAsync(
            algoOpt.value as AlgorithmType, 
            [...baseArray], 
            () => abortRef.current
        );
        
        const result: SortStats = {
          algorithm: algoOpt.value as AlgorithmType,
          timeMs: parseFloat(rawResult.time.toFixed(3)),
          comparisons: rawResult.comparisons,
          swaps: rawResult.swaps,
          arraySize: benchmarkSize
        };

        setResults(prev => [...prev, result]);
        setProgress({ current: i + 1, total: ALGORITHM_OPTIONS.length });
      }
    } catch (err: any) {
      if (err.message === "Benchmark Aborted") {
          console.log("Benchmark was aborted by user.");
      } else {
          console.error("Benchmark execution failed:", err);
          alert("测试过程发生错误: " + err.message);
      }
    } finally {
      setIsBenchmarking(false);
      setCurrentRunning(null);
      abortRef.current = false;
    }
  };

  const stopBenchmark = () => {
    abortRef.current = true;
  };

  const clearResults = () => {
    setResults([]);
    setCurrentRunning(null);
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-indigo-500" />
              测试配置
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  样本数据规模: <span className="text-indigo-600 font-bold">{benchmarkSize}</span>
                </label>
                <input 
                  type="range"
                  min="100"
                  max="100000" 
                  step="100"
                  value={benchmarkSize}
                  onChange={(e) => setBenchmarkSize(parseInt(e.target.value))}
                  disabled={isBenchmarking}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>100</span>
                  <span>100,000</span>
                </div>
                {benchmarkSize > 5000 && (
                  <p className="text-[10px] text-orange-500 mt-2">
                    警告：10万级别数据量下，O(n²) 算法（如冒泡/插入/选择）可能会导致浏览器卡顿数秒甚至更久，建议仅用于测试对数级算法。
                  </p>
                )}
                {benchmarkSize <= 5000 && benchmarkSize > 2000 && (
                  <p className="text-[10px] text-orange-500 mt-2">
                    注意：规模较大时，O(n²) 算法（如冒泡排序）耗时可能较长，但系统会保持响应。
                  </p>
                )}
              </div>

              <div className="pt-4 border-t dark:border-slate-700 space-y-2">
                {!isBenchmarking ? (
                  <button
                    onClick={startBenchmark}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                  >
                    <Play size={18} fill="currentColor" />
                    开始全面测试
                  </button>
                ) : (
                  <button
                    onClick={stopBenchmark}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-none transition-all animate-pulse"
                  >
                    <Square size={18} fill="currentColor" />
                    停止测试
                  </button>
                )}
                
                <button
                  onClick={clearResults}
                  disabled={isBenchmarking || results.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                >
                  <RotateCcw size={18} />
                  清除结果
                </button>
              </div>
            </div>
          </div>

          <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-2xl border border-sky-100 dark:border-sky-800/50">
             <div className="flex gap-3 text-sky-700 dark:text-sky-300">
                <Info size={20} className="shrink-0" />
                <div className="text-xs leading-relaxed space-y-1">
                  <p><strong>异步调度：</strong> 系统使用时间分片技术在主线程执行测试，确保 UI 保持响应。</p>
                  <p><strong>内存优化：</strong> 测试模式下跳过了可视化数据的生成，大幅提升性能。</p>
                </div>
             </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
             {isBenchmarking && (
                <div className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-300 ease-out z-10" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
             )}

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 size={22} className="text-indigo-500" />
                耗时对比 (ms)
              </h3>
              {isBenchmarking ? (
                <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                   <Loader2 size={14} className="animate-spin" />
                   <span className="tabular-nums">运行中: {progress.current} / {progress.total}</span>
                   {currentRunning && <span className="opacity-75 text-xs border-l border-indigo-200 dark:border-indigo-700 pl-2 ml-1">{currentRunning}</span>}
                </div>
              ) : results.length > 0 ? (
                 <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">测试完成</div>
              ) : null}
            </div>

            <div className="h-[400px]">
              {results.length === 0 && !isBenchmarking ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Zap size={48} className="mb-4 opacity-20" />
                  <p>暂无测试数据，请点击左侧按钮开始测试</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="algorithm" 
                      angle={-45} 
                      textAnchor="end" 
                      interval={0} 
                      height={80}
                      tick={{fontSize: 11, fill: '#64748b'}} 
                    />
                    <YAxis tick={{fontSize: 11, fill: '#64748b'}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', backgroundColor: '#1e293b', color: '#fff' }}
                    />
                    <Bar dataKey="timeMs" radius={[6, 6, 0, 0]} animationDuration={500}>
                      {results.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.timeMs < 1 ? '#22c55e' : entry.timeMs > 100 ? '#ef4444' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Details Table */}
          {results.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">算法名称</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">总耗时 (ms)</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">比较/扫描项</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">交换/写回项</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">时间复杂度</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">空间复杂度</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {results.map((res, i) => {
                       const opt = ALGORITHM_OPTIONS.find(o => o.value === res.algorithm);
                       return (
                         <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                           <td className="px-6 py-4">
                             <div className="font-bold text-slate-700 dark:text-slate-200">{res.algorithm}</div>
                             <div className="text-[10px] text-slate-400">{getAlgorithmMetrics(res.algorithm).label1} / {getAlgorithmMetrics(res.algorithm).label2}</div>
                           </td>
                           <td className="px-6 py-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">{res.timeMs}</td>
                           <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">{res.comparisons.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">{res.swaps.toLocaleString()}</td>
                           {/* Time Complexity */}
                           <td className="px-6 py-4 text-center">
                             <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${opt?.complexity.includes('n²') ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                               {opt?.complexity}
                             </span>
                           </td>
                           {/* Space Complexity */}
                           <td className="px-6 py-4 text-center">
                             <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${opt?.spaceComplexity.includes('1') ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                               {opt?.spaceComplexity}
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BenchmarkPage;