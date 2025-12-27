import { runBenchmark } from './sortingAlgorithms';
import { AlgorithmType, SortStats } from '../types';
import { ALGORITHM_OPTIONS } from '../constants';

// 定义 Worker 接收的消息类型
type BenchmarkMessage = {
  type: 'START';
  payload: {
    size: number;
    algorithms: AlgorithmType[];
  };
};

// 定义 Worker 发送的消息类型
type BenchmarkResponse = 
  | { type: 'PROGRESS'; result: SortStats; current: number; total: number }
  | { type: 'COMPLETE'; results: SortStats[] }
  | { type: 'ERROR'; error: string };

self.onmessage = (e: MessageEvent<BenchmarkMessage>) => {
  if (e.data.type === 'START') {
    const { size, algorithms } = e.data.payload;
    const results: SortStats[] = [];

    try {
      // 生成统一的随机数组，确保所有算法处理相同数据
      const baseArray = Array.from({ length: size }, () => 
        Math.floor(Math.random() * 10000)
      );

      for (let i = 0; i < algorithms.length; i++) {
        const algoType = algorithms[i];
        
        // 这里的 runBenchmark 是同步且耗时的，但因为它在 Worker 中运行，
        // 所以不会阻塞主线程 UI
        const benchmarkResult = runBenchmark(algoType, [...baseArray]);

        const result: SortStats = {
          algorithm: algoType,
          timeMs: parseFloat(benchmarkResult.time.toFixed(3)),
          comparisons: benchmarkResult.comparisons,
          swaps: benchmarkResult.swaps,
          arraySize: size
        };

        results.push(result);

        // 发送单项进度
        self.postMessage({
          type: 'PROGRESS',
          result: result,
          current: i + 1,
          total: algorithms.length
        });
      }

      // 发送完成信号
      self.postMessage({ type: 'COMPLETE', results });

    } catch (error) {
      self.postMessage({ type: 'ERROR', error: (error as Error).message });
    }
  }
};
