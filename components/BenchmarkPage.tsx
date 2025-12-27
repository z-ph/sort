import React, { useState } from 'react';
import { AlgorithmType, SortStats } from '../types';
import { ALGORITHM_OPTIONS } from '../constants';
import { runBenchmark } from '../services/sortingAlgorithms';
import { getAlgorithmMetrics } from '../App';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Play, RotateCcw, BarChart3, Clock, Zap, Info } from 'lucide-react';

const BenchmarkPage: React.FC = () => {
  const [results, setResults] = useState<SortStats[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkSize, setBenchmarkSize] = useState(1000);
  const [currentRunning, setCurrentRunning] = useState<AlgorithmType | null>(null);

  const startBenchmark = async () => {
    setIsBenchmarking(true);
    setResults([]);
    
    const baseArray = Array.from({ length: benchmarkSize }, () => 
      Math.floor(Math.random() * 10000)
    );

    const newResults: SortStats[] = [];
    
    for (const option of ALGORITHM_OPTIONS) {
      const type = option.value as AlgorithmType;
      setCurrentRunning(type);
      
      await new Promise(r => setTimeout(r, 50));
      
      const res = runBenchmark(type, [...baseArray]);
      newResults.push({
        algorithm: type,
        timeMs: parseFloat(res.time.toFixed(3)),
        comparisons: res.comparisons,
        swaps: res.swaps,
        arraySize: benchmarkSize
      });
      
      setResults([...newResults]);
    }
    
    setCurrentRunning(null);
    setIsBenchmarking(false);
  };

  const clearResults = () => {
    setResults([]);
    setCurrentRunning(null);
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
                  max="5000"
                  step="100"
                  value={benchmarkSize}
                  onChange={(e) => setBenchmarkSize(parseInt(e.target.value))}
                  disabled={isBenchmarking}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>100</span>
                  <span>5000</span>
                </div>
              </div>

              <div className="pt-4 border-t dark:border-slate-700">
                <button
                  onClick={startBenchmark}
                  disabled={isBenchmarking}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
                >
                  <Play size={18} fill="currentColor" />
                  {isBenchmarking ? '正在测试...' : '开始全面压力测试'}
                </button>
                <button
                  onClick={clearResults}
                  disabled={isBenchmarking || results.length === 0}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                >
                  <RotateCcw size={18} />
                  清除结果
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50">
             <div className="flex gap-3 text-amber-700 dark:text-amber-300">
                <Info size={20} className="shrink-0" />
                <p className="text-xs leading-relaxed">
                  <strong>提示：</strong> 为了保证测试结果的客观性，系统会为所有参与测试的算法生成同一组随机样本。
                </p>
             </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 size={22} className="text-indigo-500" />
                耗时对比 (ms)
              </h3>
              {currentRunning && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                   <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                   正在运行: {currentRunning}
                </div>
              )}
            </div>

            <div className="h-[400px]">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Zap size={48} className="mb-4 opacity-20" />
                  <p>暂无测试数据，请点击左侧按钮开始测试</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                    />
                    <Bar dataKey="timeMs" radius={[6, 6, 0, 0]}>
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">算法名称</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">总耗时 (ms)</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">比较/扫描项</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">交换/写回项</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">复杂度期望</th>
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
                           <td className="px-6 py-4 text-center">
                             <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${opt?.complexity.includes('n²') ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                               {opt?.complexity}
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