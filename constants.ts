import { AlgorithmType } from './types';

export const DEFAULT_ARRAY_SIZE = 50;
export const MIN_ARRAY_VALUE = 5;
export const MAX_ARRAY_VALUE = 500;
export const ANIMATION_SPEED_DEFAULT = 200; // 设置为 200ms，即最慢执行速度（最大延迟）

export const ALGORITHM_OPTIONS = [
  { value: AlgorithmType.BUBBLE, label: '冒泡排序', complexity: 'O(n²)', spaceComplexity: 'O(1)' },
  { value: AlgorithmType.SELECTION, label: '选择排序', complexity: 'O(n²)', spaceComplexity: 'O(1)' },
  { value: AlgorithmType.INSERTION, label: '插入排序', complexity: 'O(n²)', spaceComplexity: 'O(1)' },
  { value: AlgorithmType.BINARY_INSERTION, label: '折半插入排序', complexity: 'O(n²)', spaceComplexity: 'O(1)' },
  { value: AlgorithmType.SHELL, label: '希尔排序', complexity: 'O(n log n)', spaceComplexity: 'O(1)' },
  { value: AlgorithmType.COUNTING, label: '计数排序', complexity: 'O(n + k)', spaceComplexity: 'O(k)' },
  { value: AlgorithmType.RADIX, label: '基数排序 (LSD)', complexity: 'O(nk)', spaceComplexity: 'O(n + k)' },
  { value: AlgorithmType.RADIX_REC, label: '基数排序 (递归 MSD)', complexity: 'O(nk)', spaceComplexity: 'O(n + k)' },
  { value: AlgorithmType.QUICK_REC, label: '快速排序 (递归)', complexity: 'O(n log n)', spaceComplexity: 'O(log n)' },
  { value: AlgorithmType.QUICK_ITER, label: '快速排序 (非递归)', complexity: 'O(n log n)', spaceComplexity: 'O(log n)' },
  { value: AlgorithmType.MERGE_REC, label: '归并排序 (递归)', complexity: 'O(n log n)', spaceComplexity: 'O(n)' },
  { value: AlgorithmType.HEAP, label: '堆排序', complexity: 'O(n log n)', spaceComplexity: 'O(1)' },
];

export const CHART_COLORS = {
  bar: '#6366f1', // Indigo 500
  compare: '#eab308', // Yellow 500
  swap: '#ef4444', // Red 500
  sorted: '#22c55e', // Green 500
};