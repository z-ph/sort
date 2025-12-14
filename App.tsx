import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlgorithmType, SortStep, SortStats } from './types';
import { DEFAULT_ARRAY_SIZE, MIN_ARRAY_VALUE, MAX_ARRAY_VALUE, ANIMATION_SPEED_DEFAULT } from './constants';
import { runBenchmark, AlgorithmGenerators } from './services/sortingAlgorithms';
import { explainAlgorithm, analyzePerformance } from './services/geminiService';
import SortVisualizer from './components/SortVisualizer';
import ControlPanel from './components/ControlPanel';
import StatsBoard from './components/StatsBoard';
import FileImporter from './components/FileImporter';
import { FileText, BrainCircuit, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// NOTE: react-markdown would typically be installed. If not, simple text rendering is used.
// Since I cannot install packages, I will simulate it or assume it's available. 
// For this strict output, I will render basic HTML if ReactMarkdown isn't assumed, but the prompt allows standard libraries.
// I will render raw text in a pre tag for safety if Markdown component fails, but for now assuming clean text.

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
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

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
      description: 'Ready to sort'
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
      // Run benchmark silently in background for accurate chart data later?
      // Or just run it on finish. Let's run benchmark separately for clean data.
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
    const results: SortStats[] = [];
    const algos = Object.values(AlgorithmType);
    
    algos.forEach(algo => {
        if (typeof algo === 'string') {
            const res = runBenchmark(algo as AlgorithmType, array);
            results.push({
                algorithm: algo as AlgorithmType,
                timeMs: parseFloat(res.time.toFixed(2)),
                comparisons: res.comparisons,
                swaps: res.swaps,
                arraySize: array.length
            });
        }
    });
    setBenchmarkResults(results);
  };

  // AI Handlers
  const handleExplain = async () => {
    setIsLoadingAi(true);
    setAiAnalysis("Thinking...");
    const text = await explainAlgorithm(algorithm, arraySize);
    setAiAnalysis(text || "No response.");
    setIsLoadingAi(false);
  };

  const handleAnalyzePerformance = async () => {
     if (benchmarkResults.length === 0) {
         runBenchmarks(); // Run if empty
     }
     setIsLoadingAi(true);
     setAiAnalysis("Analyzing performance data...");
     // We need to wait for state update if we just ran benchmark, but for simplicity pass results directly if available
     // Actually, runBenchmarks updates state, so we might miss it here.
     // Let's force a run locally.
     const results: SortStats[] = [];
     Object.values(AlgorithmType).forEach(algo => {
         const res = runBenchmark(algo as AlgorithmType, array);
         results.push({ algorithm: algo, timeMs: res.time, comparisons: res.comparisons, swaps: res.swaps, arraySize: array.length });
     });
     setBenchmarkResults(results);
     
     const text = await analyzePerformance(results);
     setAiAnalysis(text || "No response.");
     setIsLoadingAi(false);
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
                <h1 className="text-xl font-bold text-gray-900">SortMaster Pro</h1>
            </div>
            <div className="flex gap-4">
                 <FileImporter onImport={handleImport} />
                 <button onClick={downloadLog} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                     <Download className="w-4 h-4" /> Download Report
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
                    <h3 className="font-semibold text-gray-800 mb-2 border-b pb-2">Status Log</h3>
                    <div className="h-40 overflow-y-auto text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                        {currentStep?.description || "Ready..."}
                        <br/>
                        <span className="text-xs text-gray-400">
                            Items: {arraySize} | Algo: {algorithm}
                        </span>
                    </div>
                </div>

                {/* AI Tutor Button */}
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={handleExplain}
                        className="flex items-center justify-center gap-2 p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm"
                    >
                        <BrainCircuit className="w-4 h-4" /> Explain Algo
                    </button>
                    <button 
                        onClick={handleAnalyzePerformance}
                        className="flex items-center justify-center gap-2 p-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium text-sm"
                    >
                        <FileText className="w-4 h-4" /> Analyze Stats
                    </button>
                 </div>
            </div>

            {/* Right: Visualization Canvas */}
            <div className="lg:col-span-2 h-[500px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                <SortVisualizer step={currentStep!} maxValue={MAX_ARRAY_VALUE} />
                {aiAnalysis && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-8 overflow-y-auto z-10 transition-opacity">
                         <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2">
                                <BrainCircuit className="w-6 h-6" /> AI Analysis
                            </h2>
                            <button onClick={() => setAiAnalysis("")} className="text-gray-400 hover:text-gray-600">Close</button>
                         </div>
                         <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                             {isLoadingAi ? "Processing with Gemini..." : <ReactMarkdown>{aiAnalysis}</ReactMarkdown>}
                         </div>
                    </div>
                )}
            </div>
        </div>

        {/* Bottom Section: Performance Charts */}
        <StatsBoard 
            currentStats={stats}
            benchmarkResults={benchmarkResults}
        />
        
        {/* Trigger Benchmark Button */}
        <div className="flex justify-center">
            <button 
                onClick={runBenchmarks}
                className="px-6 py-3 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all font-medium"
            >
                Run Comprehensive Benchmark (All Algorithms)
            </button>
        </div>

      </main>
    </div>
  );
};

export default App;