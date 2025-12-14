import { AlgorithmType } from './types';

export const DEFAULT_ARRAY_SIZE = 50;
export const MIN_ARRAY_VALUE = 5;
export const MAX_ARRAY_VALUE = 500;
export const ANIMATION_SPEED_DEFAULT = 50; // ms

export const ALGORITHM_OPTIONS = [
  { value: AlgorithmType.BUBBLE, label: 'Bubble Sort', complexity: 'O(n²)' },
  { value: AlgorithmType.SELECTION, label: 'Selection Sort', complexity: 'O(n²)' },
  { value: AlgorithmType.INSERTION, label: 'Insertion Sort', complexity: 'O(n²)' },
  { value: AlgorithmType.BINARY_INSERTION, label: 'Binary Insertion Sort', complexity: 'O(n²)' },
  { value: AlgorithmType.SHELL, label: 'Shell Sort', complexity: 'O(n log n)' },
  { value: AlgorithmType.QUICK_REC, label: 'Quick Sort (Recursive)', complexity: 'O(n log n)' },
  { value: AlgorithmType.QUICK_ITER, label: 'Quick Sort (Iterative)', complexity: 'O(n log n)' },
  { value: AlgorithmType.MERGE_REC, label: 'Merge Sort (Recursive)', complexity: 'O(n log n)' },
  { value: AlgorithmType.HEAP, label: 'Heap Sort', complexity: 'O(n log n)' },
];

export const CHART_COLORS = {
  bar: '#6366f1', // Indigo 500
  compare: '#eab308', // Yellow 500
  swap: '#ef4444', // Red 500
  sorted: '#22c55e', // Green 500
};