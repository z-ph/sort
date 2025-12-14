import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlgorithmType, SortStep, SortStats } from './types';
import { DEFAULT_ARRAY_SIZE, MIN_ARRAY_VALUE, MAX_ARRAY_VALUE, ANIMATION_SPEED_DEFAULT } from './constants';
import { runBenchmark, AlgorithmGenerators } from './services/sortingAlgorithms';
import SortVisualizer from './components/SortVisualizer';
import ConceptVisualizer from './components/ConceptVisualizer';
import ControlPanel from './components/ControlPanel';
import StatsBoard from './components/StatsBoard';
import { Download, Loader2 } from 'lucide-react';

// --- Robust requestIdleCallback Polyfill ---
// Uses MessageChannel if available for better precision than setTimeout
const rIC = (typeof window !== 'undefined' && window.requestIdleCallback) ||
  function (cb: IdleRequestCallback) {
    const start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

const App: React.FC = () => {
  // State
  const [array, setArray] = useState<number[]>([]);
  const [arraySize, setArraySize] = useState(DEFAULT_ARRAY_SIZE);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(AlgorithmType.BUBBLE);
  const [speed, setSpeed] = useState(ANIMATION_SPEED_DEFAULT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSorting, setIsSorting] = useState(false); 
  const [currentStep, setCurrentStep] = useState<SortStep | null>(null);
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0, time: '0s' });
  const [benchmarkResults, setBenchmarkResults] = useState<SortStats[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  // Refs for animation loop
  const generatorRef = useRef<Generator<SortStep> | null>(null);
  const rafRef = useRef<number | null>(null); 
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const stepsLogRef = useRef<SortStep[]>([]);
  
  // Refs for batching logic
  const stepsSinceLastRender = useRef(0);
  const accumulatedStats = useRef({ comparisons: 0, swaps: 0 });

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
    setIsSorting(false);
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
    accumulatedStats.current = { comparisons: 0, swaps: 0 };
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  // --- Core Step Execution Logic ---
  // Returns true if finished, false otherwise
  const executeSingleStep = (): { finished: boolean, value?: SortStep } => {
    if (!generatorRef.current) return { finished: true };
    
    const { value, done } = generatorRef.current.next();
    
    if (done) {
       return { finished: true, value };
    }
    
    if (value) {
        // Accumulate stats without triggering re-render yet
        accumulatedStats.current.comparisons += (value.comparing.length > 0 ? 1 : 0);
        accumulatedStats.current.swaps += (value.swapping.length > 0 ? 1 : 0);
        return { finished: false, value };
    }
    return { finished: false };
  };

  // --- The Animation Loop (Time Sliced) ---
  const performAnimationLoop = useCallback(() => {
     if (!isPlaying || isFinished) return;

     const isMaxSpeed = speed < 5;
     
     // TIME BUDGET: 
     // If max speed, we use a 12ms budget per frame (leaving 4ms for React render/Browser paint).
     // If slower, we only run 1 step.
     const frameStart = performance.now();
     const timeBudget = 12; // ms
     
     let lastStepValue: SortStep | null = null;
     let finished = false;
     let stepsProcessed = 0;

     // Execute steps loop
     do {
         const result = executeSingleStep();
         finished = result.finished;
         if (result.value) {
             lastStepValue = result.value;
             stepsLogRef.current.push(result.value);
         }
         stepsProcessed++;

         // Break conditions:
         // 1. If finished
         // 2. If not max speed (one step per call)
         // 3. If max speed, but time budget exceeded
         if (finished) break;
         if (!isMaxSpeed) break; 
         
     } while (performance.now() - frameStart < timeBudget);

     // Update UI with the state of the LAST step in this batch
     if (lastStepValue) {
        setCurrentStep(lastStepValue);
        const elapsed = ((performance.now() - startTimeRef.current) / 1000).toFixed(1);
        
        // Batch update stats
        setStats(prev => ({
            comparisons: prev.comparisons + accumulatedStats.current.comparisons,
            swaps: prev.swaps + accumulatedStats.current.swaps,
            time: `${elapsed}s`
        }));
        
        // Reset accumulator
        accumulatedStats.current = { comparisons: 0, swaps: 0 };
     }

     if (finished) {
         setIsPlaying(false);
         setIsFinished(true);
         if (timerRef.current) clearInterval(timerRef.current);
         if (rafRef.current) cancelAnimationFrame(rafRef.current);
     } else {
         // Schedule next frame
         if (isMaxSpeed) {
             rafRef.current = requestAnimationFrame(performAnimationLoop);
         }
         // Note: For slow speeds, the setInterval in useEffect handles the scheduling, 
         // so we don't recursive call here.
     }

  }, [isPlaying, isFinished, speed]);


  // Effect to manage the loop trigger
  useEffect(() => {
      if (!isPlaying || isFinished) return;

      if (speed < 5) {
          // Use rAF for high speed (batch processing)
          rafRef.current = requestAnimationFrame(performAnimationLoop);
      } else {
          // Use Interval for controlled slow speed
          timerRef.current = window.setInterval(performAnimationLoop, speed);
      }

      return () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
      };
  }, [isPlaying, isFinished, speed, performAnimationLoop]);


  // Handlers
  const handlePlay = () => {
    if (!generatorRef.current) {
      generatorRef.current = AlgorithmGenerators[algorithm](array);
      startTimeRef.current = performance.now();
      setIsSorting(true);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const handleNextStep = () => {
    if (isFinished) return;
    if (!generatorRef.current) {
      generatorRef.current = AlgorithmGenerators[algorithm](array);
      startTimeRef.current = performance.now();
      setIsSorting(true);
    }
    
    // Execute exactly one step manually
    const { finished, value } = executeSingleStep();
    
    if (value) {
        setCurrentStep(value);
        stepsLogRef.current.push(value);
        const elapsed = ((performance.now() - startTimeRef.current) / 1000).toFixed(1);
        setStats(prev => ({
            comparisons: prev.comparisons + accumulatedStats.current.comparisons,
            swaps: prev.swaps + accumulatedStats.current.swaps,
            time: `${elapsed}s`
        }));
        accumulatedStats.current = { comparisons: 0, swaps: 0 };
    }

    if (finished) {
        setIsFinished(true);
        setIsPlaying(false);
    }
  };

  const handleGenerate = () => {
    generateArray(arraySize);
  };

  const handleReset = () => {
    resetSorter(array);
  };

  // --- Time-Sliced Benchmark Runner ---
  const runBenchmarks = () => {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    setBenchmarkResults([]);

    const BENCHMARK_SIZE = 2000; 
    // Create benchmark array (heavy operation, do it once)
    const benchmarkArray = Array.from({ length: BENCHMARK_SIZE }, () =>
        Math.floor(Math.random() * (MAX_ARRAY_VALUE - MIN_ARRAY_VALUE + 1) + MIN_ARRAY_VALUE)
    );

    const algos = Object.values(AlgorithmType) as AlgorithmType[];
    const tasks = [...algos]; // Queue of algorithms to test
    const newResults: SortStats[] = [];

    // The "Task Processor"
    const processNext = (deadline: IdleDeadline) => {
        // While there is time remaining in this frame (and tasks left)
        while (tasks.length > 0 && deadline.timeRemaining() > 1) {
            const currentAlgo = tasks.shift();
            if (currentAlgo) {
                // Run sync algorithm (might take 5-50ms for BubbleSort N=2000)
                // This blocks ONLY for that specific algorithm's duration, then yields.
                const res = runBenchmark(currentAlgo, benchmarkArray);
                newResults.push({
                    algorithm: currentAlgo,
                    timeMs: parseFloat(res.time.toFixed(2)),
                    comparisons: res.comparisons,
                    swaps: res.swaps,
                    arraySize: BENCHMARK_SIZE
                });
            }
        }

        // Update UI with partial results so user sees progress
        setBenchmarkResults([...newResults]);

        if (tasks.length > 0) {
            // If tasks remain, request next idle slot
            rIC(processNext);
        } else {
            // All done
            setIsBenchmarking(false);
        }
    };

    // Start the chain
    rIC(processNext);
  };

  // Download Logs
  const downloadLog = () => {
      const sampledSteps = stepsLogRef.current.filter((_, i) => i % 10 === 0 || i === stepsLogRef.current.length - 1);
      const simplifiedSteps = sampledSteps.map(step => ({ array: step.array }));
      const exportData = {
          initialArray: array,
          algorithm: algorithm,
          steps: simplifiedSteps,
          finalStats: stats
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    S
                </div>
                <h1 className="text-xl font-bold text-gray-900 hidden sm:block">排序算法综合演示系统</h1>
                <h1 className="text-xl font-bold text-gray-900 block sm:hidden">排序演示</h1>
            </div>
            <div className="flex gap-4">
                 <button onClick={downloadLog} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                     <Download className="w-4 h-4" /> <span className="hidden sm:inline">下载报告</span>
                 </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
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
                    onNextStep={handleNextStep}
                    isPlaying={isPlaying}
                    isFinished={isFinished}
                    isSorting={isSorting}
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

            <div className="lg:col-span-2 space-y-6">
                <div className="h-[400px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                    <SortVisualizer step={currentStep!} maxValue={MAX_ARRAY_VALUE} algorithm={algorithm} />
                </div>
                
                <ConceptVisualizer 
                    step={currentStep} 
                    algorithm={algorithm} 
                    arraySize={arraySize}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onReset={handleReset}
                    onGenerate={handleGenerate}
                    onNextStep={handleNextStep}
                    isPlaying={isPlaying}
                    isFinished={isFinished}
                />
            </div>
        </div>

        <StatsBoard 
            currentStats={stats}
            benchmarkResults={benchmarkResults}
        />
        
        <div className="flex justify-center flex-col items-center gap-2">
            <button 
                onClick={runBenchmarks}
                disabled={isBenchmarking}
                className={`px-6 py-3 rounded-full shadow-lg transition-all font-medium flex items-center gap-2 ${isBenchmarking ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-xl'}`}
            >
                {isBenchmarking && <Loader2 className="animate-spin w-4 h-4" />}
                {isBenchmarking ? '正在进行基准测试...' : '运行综合性能测试 (N=2000)'}
            </button>
            <p className="text-xs text-gray-500">
                注意：基准测试为防止阻塞，采用时间分片异步执行，期间您可以继续操作页面。
            </p>
        </div>

      </main>
    </div>
  );
};

export default App;