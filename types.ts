export enum AlgorithmType {
  BUBBLE = '冒泡排序',
  SELECTION = '选择排序',
  INSERTION = '插入排序',
  BINARY_INSERTION = '折半插入排序',
  SHELL = '希尔排序',
  COUNTING = '计数排序',
  RADIX = '基数排序',
  QUICK_REC = '快速排序 (递归)',
  QUICK_ITER = '快速排序 (非递归)',
  MERGE_REC = '归并排序 (递归)',
  MERGE_ITER = '归并排序 (非递归)', // Implementing simplified iterative or bottom-up
  HEAP = '堆排序'
}

export interface SortStep {
  array: number[];
  comparing: number[]; // Indices currently being compared
  swapping: number[]; // Indices currently being swapped
  sorted: number[]; // Indices that are confirmed sorted
  description?: string;
}

export interface SortStats {
  algorithm: AlgorithmType;
  timeMs: number;
  comparisons: number;
  swaps: number;
  arraySize: number;
}

export type SortGenerator = Generator<SortStep, SortStep, void>;

export interface SortingState {
  array: number[];
  steps: SortStep[];
  currentStep: number;
  isPlaying: boolean;
  isFinished: boolean;
  speed: number; // ms delay
  algorithm: AlgorithmType;
  comparisonCount: number;
  swapCount: number;
  startTime: number | null;
}