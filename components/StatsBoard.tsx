import React from 'react';

interface Props {
  currentStats: { comparisons: number; swaps: number; time: string };
  benchmarkResults?: any[]; // 保留签名但当前未使用
}

const StatsBoard: React.FC<Props> = ({ currentStats }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">实时性能监控</h3>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
          <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest mb-1">比较次数 (Comparisons)</p>
          <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">{currentStats.comparisons.toLocaleString()}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/30 p-4 rounded-xl border border-rose-100 dark:border-rose-800/50">
          <p className="text-xs text-rose-500 dark:text-rose-400 font-bold uppercase tracking-widest mb-1">交换/移位 (Swaps/Shifts)</p>
          <p className="text-3xl font-black text-rose-700 dark:text-rose-300">{currentStats.swaps.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
          <p className="text-xs text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest mb-1">执行时间 (Elapsed)</p>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{currentStats.time}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsBoard;
