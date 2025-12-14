import { AlgorithmType } from './types';

export const DEFAULT_ARRAY_SIZE = 50;
export const MIN_ARRAY_VALUE = 5;
export const MAX_ARRAY_VALUE = 500;
export const ANIMATION_SPEED_DEFAULT = 50; // ms

export const ALGORITHM_OPTIONS = [
  { value: AlgorithmType.BUBBLE, label: '冒泡排序', complexity: 'O(n²)' },
  { value: AlgorithmType.SELECTION, label: '选择排序', complexity: 'O(n²)' },
  { value: AlgorithmType.INSERTION, label: '插入排序', complexity: 'O(n²)' },
  { value: AlgorithmType.BINARY_INSERTION, label: '折半插入排序', complexity: 'O(n²)' },
  { value: AlgorithmType.SHELL, label: '希尔排序', complexity: 'O(n log n)' },
  { value: AlgorithmType.COUNTING, label: '计数排序', complexity: 'O(n + k)' },
  { value: AlgorithmType.RADIX, label: '基数排序', complexity: 'O(nk)' },
  { value: AlgorithmType.QUICK_REC, label: '快速排序 (递归)', complexity: 'O(n log n)' },
  { value: AlgorithmType.QUICK_ITER, label: '快速排序 (非递归)', complexity: 'O(n log n)' },
  { value: AlgorithmType.MERGE_REC, label: '归并排序 (递归)', complexity: 'O(n log n)' },
  { value: AlgorithmType.HEAP, label: '堆排序', complexity: 'O(n log n)' },
];

export const CHART_COLORS = {
  bar: '#6366f1', // Indigo 500
  compare: '#eab308', // Yellow 500
  swap: '#ef4444', // Red 500
  sorted: '#22c55e', // Green 500
};