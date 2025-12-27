import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlgorithmType, SortStep, SortStats } from './types';
import { DEFAULT_ARRAY_SIZE, MIN_ARRAY_VALUE, MAX_ARRAY_VALUE, ANIMATION_SPEED_DEFAULT, ALGORITHM_OPTIONS } from './constants';
import { AlgorithmGenerators } from './services/sortingAlgorithms';
import { parseImportFile, downloadFile, downloadSample } from './services/fileService';
import SortVisualizer from './components/SortVisualizer';
import ConceptVisualizer from './components/ConceptVisualizer';
import BenchmarkPage from './components/BenchmarkPage';
import { Sun, Moon, LayoutDashboard, Zap, Activity, Shuffle, Upload, Download, FileJson, FileType, FileText, Settings, RotateCcw } from 'lucide-react';

export const getAlgorithmMetrics = (type: AlgorithmType) => {
  switch (type) {
    case AlgorithmType.COUNTING:
      return { label1: '数据扫描', label2: '计数/写回' };
    case AlgorithmType.RADIX:
      return { label1: '位次扫描', label2: '分配/收集' };
    case AlgorithmType.INSERTION:
    case AlgorithmType.BINARY_INSERTION:
    case AlgorithmType.SHELL:
      return { label1: '比较次数', label2: '元素移动' };
    case AlgorithmType.MERGE_REC:
    case AlgorithmType.MERGE_ITER:
      return { label1: '比较次数', label2: '辅助写回' };
    default:
      return { label1: '比较次数', label2: '交换次数' };
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'benchmark'>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [array, setArray] = useState<number[]>([]);
  const [arraySize, setArraySize] = useState(DEFAULT_ARRAY_SIZE);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(AlgorithmType.BUBBLE);
  const [speed, setSpeed] = useState(ANIMATION_SPEED_DEFAULT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSorting, setIsSorting] = useState(false); 
  const [currentStep, setCurrentStep] = useState<SortStep | null>(null);
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0, time: '0s' });

  const generatorRef = useRef<Generator<SortStep> | null>(null);
  const rafRef = useRef<number | null>(null); 
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedStats = useRef({ comparisons: 0, swaps: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const resetSorter = useCallback((arr: number[]) => {
    setIsPlaying(false);
    setIsFinished(false);
    setIsSorting(false);
    setStats({ comparisons: 0, swaps: 0, time: '0s' });
    setCurrentStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [],
      description: '系统就绪，等待演示开始...'
    });
    generatorRef.current = null;
    accumulatedStats.current = { comparisons: 0, swaps: 0 };
    startTimeRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const generateArray = useCallback((size: number) => {
    const newArray = Array.from({ length: size }, () =>
      Math.floor(Math.random() * (MAX_ARRAY_VALUE - MIN_ARRAY_VALUE + 1) + MIN_ARRAY_VALUE)
    );
    setArray(newArray);
    resetSorter(newArray);
  }, [resetSorter]);

  useEffect(() => {
    generateArray(arraySize);
  }, [arraySize, generateArray]);

  const executeSingleStep = (): { finished: boolean, value?: SortStep } => {
    if (!generatorRef.current) return { finished: true };
    const { value, done } = generatorRef.current.next();
    if (done) return { finished: true, value };
    if (value) {
        if (value.comparing.length > 0) accumulatedStats.current.comparisons += 1;
        if (value.swapping.length > 0) accumulatedStats.current.swaps += 1;
        return { finished: false, value };
    }
    return { finished: false };
  };

  const updateStatsState = () => {
    const elapsed = startTimeRef.current > 0 ? ((performance.now() - startTimeRef.current) / 1000).toFixed(1) : '0.0';
    const compDelta = accumulatedStats.current.comparisons;
    const swapDelta = accumulatedStats.current.swaps;

    setStats(prev => ({
      comparisons: prev.comparisons + compDelta,
      swaps: prev.swaps + swapDelta,
      time: `${elapsed}s`
    }));
    accumulatedStats.current = { comparisons: 0, swaps: 0 };
  };

  const performAnimationLoop = useCallback(() => {
     if (!isPlaying || isFinished) return;
     const isMaxSpeed = speed < 5;
     const frameStart = performance.now();
     const timeBudget = 12; 
     let lastStepValue: SortStep | null = null;
     let finished = false;

     do {
         const result = executeSingleStep();
         finished = result.finished;
         if (result.value) lastStepValue = result.value;
         if (finished) break;
         if (!isMaxSpeed) break; 
     } while (performance.now() - frameStart < timeBudget);

     if (lastStepValue) {
        setCurrentStep(lastStepValue);
        updateStatsState();
     }

     if (finished) {
         setIsPlaying(false);
         setIsFinished(true);
     } else if (isMaxSpeed) {
         rafRef.current = requestAnimationFrame(performAnimationLoop);
     }
  }, [isPlaying, isFinished, speed]);

  useEffect(() => {
      if (!isPlaying || isFinished) return;
      if (speed < 5) rafRef.current = requestAnimationFrame(performAnimationLoop);
      else timerRef.current = window.setInterval(performAnimationLoop, speed);
      
      return () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
      };
  }, [isPlaying, isFinished, speed, performAnimationLoop]);

  const handleNextStep = () => {
    if (isFinished) return;
    if (!generatorRef.current) { 
      generatorRef.current = AlgorithmGenerators[algorithm](array); 
      startTimeRef.current = performance.now(); 
      setIsSorting(true); 
    }
    const { finished, value } = executeSingleStep();
    if (value) { 
      setCurrentStep(value);
      updateStatsState();
    }
    if (finished) { 
      setIsFinished(true); 
      setIsPlaying(false); 
    }
  };

  const handleImport = async (file: File) => {
    try {
      const numbers = await parseImportFile(file);
      if (numbers.length > 0) {
        setArraySize(numbers.length);
        setArray(numbers);
        resetSorter(numbers);
      }
    } catch (e) { alert('文件导入失败: ' + (e as Error).message); }
  };

  const metrics = getAlgorithmMetrics(algorithm);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 relative z-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">排序算法实验室</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Sorting Algorithm Professional Lab</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button data-tooltip-bottom="可视化动画演示" onClick={() => setView('home')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'home' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <LayoutDashboard size={18} />可视化
            </button>
            <button data-tooltip-bottom="多算法性能压力测试" onClick={() => setView('benchmark')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'benchmark' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Zap size={18} />性能测试
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />
            <button data-tooltip-bottom={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'} onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>

        <main>
          {view === 'home' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* 控制面板：移除所有 overflow 限制 */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-40">
                {/* 第一行：数据管理与导入示例 */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-y-4 gap-x-6 rounded-t-3xl">
                  <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">数据中心</span>
                    <button data-tooltip-bottom="生成一组全新的随机乱序数据" onClick={() => generateArray(arraySize)} disabled={isPlaying} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50 shadow-sm">
                      <Shuffle size={14} /> 随机生成
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button data-tooltip-bottom="从电脑选择 JSON/CSV/TXT 文件导入" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Upload size={14} /> 导入数据
                      </button>
                      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} className="hidden" accept=".json,.csv,.txt" />
                      
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-400 uppercase">格式示例:</span>
                        <button data-tooltip-bottom="下载标准 JSON 格式示例" onClick={() => downloadSample('json')} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors px-1">JSON</button>
                        <button data-tooltip-bottom="下载标准 CSV 格式示例" onClick={() => downloadSample('csv')} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors px-1">CSV</button>
                        <button data-tooltip-bottom="下载标准 TXT 格式示例" onClick={() => downloadSample('txt')} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors px-1">TXT</button>
                      </div>
                    </div>
                    
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">结果导出:</span>
                      <button data-tooltip-bottom="下载当前数组为 JSON" onClick={() => downloadFile(currentStep?.array || array, 'json', 'export')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-500 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"><FileJson size={18}/></button>
                      <button data-tooltip-bottom="下载当前数组为 CSV" onClick={() => downloadFile(currentStep?.array || array, 'csv', 'export')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-500 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"><FileType size={18}/></button>
                      <button data-tooltip-bottom="下载当前数组为 TXT" onClick={() => downloadFile(currentStep?.array || array, 'txt', 'export')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-500 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"><FileText size={18}/></button>
                    </div>
                  </div>
                </div>

                {/* 第二行：算法策略 */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col lg:flex-row items-center gap-8 rounded-b-3xl">
                  <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
                    <div className="flex items-center gap-2 shrink-0">
                      <Settings size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">算法策略</span>
                    </div>
                    <select
                      data-tooltip="切换不同的排序算法"
                      value={algorithm}
                      onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
                      disabled={isSorting && !isFinished} 
                      className="flex-1 max-w-[200px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-black transition-all shadow-sm"
                    >
                      {ALGORITHM_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button data-tooltip="重置到初始状态" onClick={() => resetSorter(array)} className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition-all shadow-sm">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-8 flex-1 w-full lg:w-auto">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">数组规模: {arraySize}</label>
                      <input data-tooltip={`调整元素数量: ${arraySize}`} type="range" min="10" max="1500" step="10" value={arraySize} onChange={(e) => setArraySize(Number(e.target.value))} disabled={isPlaying} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase block ml-1">执行延时: {speed}ms</label>
                      <input data-tooltip={`调整动画间隔: ${speed}ms`} type="range" min="1" max="200" value={201 - speed} onChange={(e) => setSpeed(201 - Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-30">
                <div className="xl:col-span-2 space-y-6">
                  <SortVisualizer step={currentStep} maxValue={MAX_ARRAY_VALUE} algorithm={algorithm} theme={theme} />
                  <ConceptVisualizer 
                    step={currentStep} algorithm={algorithm} arraySize={arraySize}
                    onPlay={() => {
                      if (!generatorRef.current) { generatorRef.current = AlgorithmGenerators[algorithm](array); startTimeRef.current = performance.now(); setIsSorting(true); }
                      setIsPlaying(true);
                    }}
                    onPause={() => setIsPlaying(false)}
                    onReset={() => resetSorter(array)}
                    onNextStep={handleNextStep}
                    isPlaying={isPlaying} isFinished={isFinished}
                  />
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-10">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Activity size={18} className="text-indigo-500" />状态看板
                    </h4>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div data-tooltip={metrics.label1} className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/50">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{metrics.label1}</p>
                        <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{stats.comparisons.toLocaleString()}</p>
                      </div>
                      <div data-tooltip={metrics.label2} className="p-4 bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl border border-rose-100/50 dark:border-rose-800/50">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">{metrics.label2}</p>
                        <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{stats.swaps.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-1 mb-2">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">实时耗时</h4>
                      <span className="text-[11px] font-mono text-emerald-500 font-black">{stats.time}</span>
                    </div>
                    <div data-tooltip="当前操作的文字描述" className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 min-h-[100px] flex items-center italic text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {currentStep?.description || '等待操作...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <BenchmarkPage />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;