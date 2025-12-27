import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlgorithmType, SortStep, SortStats } from './types';
import { DEFAULT_ARRAY_SIZE, MIN_ARRAY_VALUE, MAX_ARRAY_VALUE, ANIMATION_SPEED_DEFAULT, ALGORITHM_OPTIONS } from './constants';
import { AlgorithmGenerators } from './services/sortingAlgorithms';
import { parseImportFile, downloadFile, downloadSample } from './services/fileService';
import SortVisualizer from './components/SortVisualizer';
import ConceptVisualizer from './components/ConceptVisualizer';
// Removed unused ControlPanel import as functional components were moved to App.tsx top bar
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
      description: '等待操作...'
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
        // 核心修复：更精确地捕捉步骤中的动作
        if (value.comparing.length > 0) accumulatedStats.current.comparisons += 1;
        if (value.swapping.length > 0) accumulatedStats.current.swaps += 1;
        return { finished: false, value };
    }
    return { finished: false };
  };

  const updateStatsState = () => {
    const elapsed = startTimeRef.current > 0 ? ((performance.now() - startTimeRef.current) / 1000).toFixed(1) : '0.0';
    
    // 立即消耗当前累加的值
    const compDelta = accumulatedStats.current.comparisons;
    const swapDelta = accumulatedStats.current.swaps;

    if (compDelta > 0 || swapDelta > 0) {
      setStats(prev => ({
        comparisons: prev.comparisons + compDelta,
        swaps: prev.swaps + swapDelta,
        time: `${elapsed}s`
      }));
      // 重置累加器
      accumulatedStats.current = { comparisons: 0, swaps: 0 };
    } else {
      // 仅更新时间
      setStats(prev => ({ ...prev, time: `${elapsed}s` }));
    }
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
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">排序算法综合演示系统</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Professional Algorithm Lab & Analyzer</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button title="切换至可视化演示视图" onClick={() => setView('home')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'home' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <LayoutDashboard size={18} />可视化演示
            </button>
            <button title="切换至性能压力测试视图" onClick={() => setView('benchmark')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'benchmark' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Zap size={18} />性能测试
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />
            <button title={theme === 'light' ? '切换至暗色模式' : '切换至亮色模式'} onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>

        <main>
          {view === 'home' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* TOP COMBINED CONSOLE SECTION */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Row 1: Data Management */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6">
                  <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">数据管理</span>
                    <button title="随机生成一组新的乱序数组" onClick={() => generateArray(arraySize)} disabled={isPlaying} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50">
                      <Shuffle size={14} /> 随机生成
                    </button>
                  </div>

                  <div className="flex flex-1 items-center gap-4 overflow-x-auto no-scrollbar py-1">
                    <div className="flex items-center gap-2">
                      <button title="从本地上传 .json, .csv 或 .txt 文件" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        <Upload size={14} /> 导入数据
                      </button>
                      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} className="hidden" accept=".json,.csv,.txt" />
                    </div>
                    
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">结果导出:</span>
                      <button title="下载为 JSON 格式" onClick={() => downloadFile(currentStep?.array || array, 'json', 'export')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-500"><FileJson size={16}/></button>
                      <button title="下载为 CSV 格式" onClick={() => downloadFile(currentStep?.array || array, 'csv', 'export')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-500"><FileType size={16}/></button>
                      <button title="下载为 TXT 格式" onClick={() => downloadFile(currentStep?.array || array, 'txt', 'export')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-500"><FileText size={16}/></button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase">样本下载:</span>
                      <button title="下载 JSON 示例文件" onClick={() => downloadSample('json')} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:underline">JSON</button>
                      <button title="下载 CSV 示例文件" onClick={() => downloadSample('csv')} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:underline">CSV</button>
                      <button title="下载 TXT 示例文件" onClick={() => downloadSample('txt')} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:underline">TXT</button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Algorithm Configuration */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col lg:flex-row items-center gap-6">
                  <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
                    <div className="flex items-center gap-2 shrink-0">
                      <Settings size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">算法配置</span>
                    </div>
                    <select
                      title="选择要演示的排序算法"
                      value={algorithm}
                      onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
                      disabled={isSorting && !isFinished} 
                      className="flex-1 max-w-[200px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 font-bold transition-all shadow-sm"
                    >
                      {ALGORITHM_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button title="重置当前进度并将数组恢复为初始状态" onClick={() => resetSorter(array)} className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition-all shadow-sm">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    {isSorting && !isFinished && (
                      <div className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[9px] font-black border border-amber-500/20 animate-pulse uppercase">
                        切换算法请前先重置
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 flex-1 w-full lg:w-auto">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">数据规模: {arraySize}</label>
                      </div>
                      <input title={`调整数组长度（当前: ${arraySize}）`} type="range" min="10" max="1500" step="10" value={arraySize} onChange={(e) => setArraySize(Number(e.target.value))} disabled={isPlaying} className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">执行速度: {201 - speed}</label>
                      </div>
                      <input title={`调整动画演示频率（当前延时: ${speed}ms）`} type="range" min="1" max="200" value={201 - speed} onChange={(e) => setSpeed(201 - Number(e.target.value))} className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Activity size={18} className="text-indigo-500" />执行看板
                    </h4>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div title={metrics.label1} className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/50">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{metrics.label1}</p>
                        <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{stats.comparisons.toLocaleString()}</p>
                      </div>
                      <div title={metrics.label2} className="p-4 bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl border border-rose-100/50 dark:border-rose-800/50">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">{metrics.label2}</p>
                        <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{stats.swaps.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-1 mb-2">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">实时状态计时</h4>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">{stats.time}</span>
                    </div>
                    <div title="当前算法操作的详细自然语言描述" className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 min-h-[90px] flex items-center italic text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {currentStep?.description || '系统就绪，等待演示开始...'}
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