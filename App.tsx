import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlgorithmType, SortStep, SortStats } from './types';
import { DEFAULT_ARRAY_SIZE, MIN_ARRAY_VALUE, MAX_ARRAY_VALUE, ANIMATION_SPEED_DEFAULT } from './constants';
import { runBenchmark, AlgorithmGenerators } from './services/sortingAlgorithms';
import SortVisualizer from './components/SortVisualizer';
import ControlPanel from './components/ControlPanel';
import StatsBoard from './components/StatsBoard';
import FileImporter from './components/FileImporter';
import { Download } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [array, setArray] = useState<number[]>([]);
  const [arraySize, setArraySize] = useState(DEFAULT_ARRAY_SIZE);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(AlgorithmType.BUBBLE);
  const [speed, setSpeed] = useState(ANIMATION_SPEED_DEFAULT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentStep, setCurrentStep] = useState<SortStep | null>(null);
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0, time: '0s' });
  const [benchmarkResults, setBenchmarkResults] = useState<SortStats[]>([]);

  // Refs
  const generatorRef = useRef<Generator<SortStep> | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const stepsLogRef = useRef<SortStep[]>([]);

  // Init Array
  const generateArray = useCallback((size: number) => {
    const newArray = Array.from({ length: size }, () =>
      Math.floor(Math.random() * (MAX_ARRAY_VALUE - MIN_ARRAY_VALUE + 1) + MIN_ARRAY_VALUE)
    );
    setArray(newArray);
    resetSorter(newArray);
  }, []);

  useEffect(() => {
    generateArray(arraySize);
  }, [arraySize, generateArray]);

  // Reset Logic
  const resetSorter = (arr: number[]) => {
    setIsPlaying(false);
    setIsFinished(false);
    setStats({ comparisons: 0, swaps: 0, time: '0s' });
    setCurrentStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [],
      description: '准备排序'
    });
    generatorRef.current = null;
    stepsLogRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Animation Loop
  const runSortingStep = () => {
    if (!generatorRef.current) return;

    const { value, done } = generatorRef.current.next();

    if (done) {
      setIsPlaying(false);
      setIsFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      // Log final step
      if(value) stepsLogRef.current.push(value);
      return;
    }

    if (value) {
      setCurrentStep(value);
      stepsLogRef.current.push(value); // Save for log file
      
      // Update basic stats
      const elapsed = ((performance.now() - startTimeRef.current) / 1000).toFixed(1);
      setStats(prev => ({
        comparisons: prev.comparisons + (value.comparing.length > 0 ? 1 : 0),
        swaps: prev.swaps + (value.swapping.length > 0 ? 1 : 0),
        time: `${elapsed}s`
      }));
    }
  };

  // Handlers
  const handlePlay = () => {
    if (!generatorRef.current) {
      generatorRef.current = AlgorithmGenerators[algorithm](array);
      startTimeRef.current = performance.now();
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleGenerate = () => {
    generateArray(arraySize);
  };

  const handleReset = () => {
    resetSorter(array);
  };

  const handleImport = (importedArray: number[]) => {
    // Cap size for visual performance
    const validArray = importedArray.slice(0, 200); 
    setArraySize(validArray.length);
    setArray(validArray);
    resetSorter(validArray);
  };

  // Effect for Timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(runSortingStep, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  // Run Benchmark for all algos to populate chart
  const runBenchmarks = () => {
    // Generate a larger random dataset (e.g., 2000 items) for accurate CPU benchmarking
    // The visualizer array is usually too small (50-100) to show O(n) vs O(n^2) differences meaningfully.
    const BENCHMARK_SIZE = 2000;
    const benchmarkArray = Array.from({ length: BENCHMARK_SIZE }, () =>
        Math.floor(Math.random() * (MAX_ARRAY_VALUE - MIN_ARRAY_VALUE + 1) + MIN_ARRAY_VALUE)
    );

    const results: SortStats[] = [];
    const algos = Object.values(AlgorithmType);
    
    algos.forEach(algo => {
        if (typeof algo === 'string') {
            const res = runBenchmark(algo as AlgorithmType, benchmarkArray);
            results.push({
                algorithm: algo as AlgorithmType,
                timeMs: parseFloat(res.time.toFixed(2)),
                comparisons: res.comparisons,
                swaps: res.swaps,
                arraySize: BENCHMARK_SIZE
            });
        }
    });
    setBenchmarkResults(results);
  };

  // Download Logs
  const downloadLog = () => {
      const logContent = JSON.stringify({
          initialArray: array,
          algorithm: algorithm,
          steps: stepsLogRef.current.filter((_, i) => i % 10 === 0 || i === stepsLogRef.current.length - 1), // Sample every 10th step to save space
          finalStats: stats
      }, null, 2);
      
      const blob = new Blob([logContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sort_log_${algorithm}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    S
                </div>
                <h1 className="text-xl font-bold text-gray-900">排序算法综合演示系统</h1>
            </div>
            <div className="flex gap-4">
                 <FileImporter onImport={handleImport} />
                 <button onClick={downloadLog} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                     <Download className="w-4 h-4" /> 下载报告
                 </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Section: Controls & Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Controls & Stats */}
            <div className="space-y-6 lg:col-span-1">
                <ControlPanel 
                    algorithm={algorithm}
                    setAlgorithm={setAlgorithm}
                    size={arraySize}
                    setSize={setArraySize}
                    speed={speed}
                    setSpeed={setSpeed}
                    onGenerate={handleGenerate}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onReset={handleReset}
                    isPlaying={isPlaying}
                    isFinished={isFinished}
                />

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-2 border-b pb-2">状态日志</h3>
                    <div className="h-40 overflow-y-auto text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                        {currentStep?.description || "准备就绪..."}
                        <br/>
                        <span className="text-xs text-gray-400">
                            元素数: {arraySize} | 算法: {algorithm}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Visualization Canvas */}
            <div className="lg:col-span-2 h-[500px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                <SortVisualizer step={currentStep!} maxValue={MAX_ARRAY_VALUE} />
            </div>
        </div>

        {/* Bottom Section: Performance Charts */}
        <StatsBoard 
            currentStats={stats}
            benchmarkResults={benchmarkResults}
        />
        
        {/* Trigger Benchmark Button */}
        <div className="flex justify-center flex-col items-center gap-2">
            <button 
                onClick={runBenchmarks}
                className="px-6 py-3 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all font-medium"
            >
                运行综合性能测试 (N=2000)
            </button>
            <p className="text-xs text-gray-500">
                注意：基准测试使用独立的 2000 个随机数据，不包含动画渲染开销，以确保数据真实准确。
            </p>
        </div>

      </main>
    </div>
  );
};

export default App;