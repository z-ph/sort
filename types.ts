export enum AlgorithmType {
  BUBBLE = 'Bubble Sort',
  SELECTION = 'Selection Sort',
  INSERTION = 'Insertion Sort',
  BINARY_INSERTION = 'Binary Insertion Sort',
  SHELL = 'Shell Sort',
  COUNTING = 'Counting Sort',
  RADIX = 'Radix Sort',
  QUICK_REC = 'Quick Sort (Recursive)',
  QUICK_ITER = 'Quick Sort (Iterative)',
  MERGE_REC = 'Merge Sort (Recursive)',
  MERGE_ITER = 'Merge Sort (Iterative)', // Implementing simplified iterative or bottom-up
  HEAP = 'Heap Sort'
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