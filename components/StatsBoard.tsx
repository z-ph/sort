import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { SortStats } from '../types';

interface Props {
  currentStats: { comparisons: number; swaps: number; time: string };
  benchmarkResults: SortStats[];
}

const StatsBoard: React.FC<Props> = ({ currentStats, benchmarkResults }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Real-time Stats */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">当前运行统计</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-xs text-indigo-500 font-semibold uppercase">比较次数</p>
            <p className="text-2xl font-bold text-indigo-700">{currentStats.comparisons}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-xs text-red-500 font-semibold uppercase">交换次数</p>
            <p className="text-2xl font-bold text-red-700">{currentStats.swaps}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-xs text-green-500 font-semibold uppercase">耗时</p>
            <p className="text-xl font-bold text-green-700">{currentStats.time}</p>
          </div>
        </div>
      </div>

      {/* Benchmark Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[300px]">
        <h3 className="text-lg font-bold text-gray-800 mb-4">性能基准测试对比 (ms)</h3>
        {benchmarkResults.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            运行不同算法以进行对比
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={benchmarkResults} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="algorithm" type="category" width={120} tick={{fontSize: 10}} />
              <Tooltip />
              <Legend />
              <Bar dataKey="timeMs" fill="#6366f1" name="时间 (ms)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default StatsBoard;