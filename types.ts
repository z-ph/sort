
export enum AlgorithmType {
  BUBBLE = '冒泡排序',
  SELECTION = '选择排序',
  INSERTION = '插入排序',
  BINARY_INSERTION = '折半插入排序',
  SHELL = '希尔排序',
  COUNTING = '计数排序',
  RADIX = '基数排序', // 迭代（LSD）
  RADIX_REC = '基数排序 (递归)', // 递归（MSD）
  QUICK_REC = '快速排序 (递归)',
  QUICK_ITER = '快速排序 (非递归)',
  MERGE_REC = '归并排序 (递归)',
  MERGE_ITER = '归并排序 (非递归)', // 简化的迭代/自底向上实现
  HEAP = '堆排序'
}

export interface SortStep {
  array: number[];
  comparing: number[]; // 正在比较的索引
  swapping: number[]; // 正在交换的索引
  sorted: number[]; // 已确认有序的索引
  description?: string;
  // 可视化专用的辅助数据
  aux?: {
    range?: { start: number; end: number }; // 归并/快排区间范围
    pivot?: number; // 快排枢轴
    heapSize?: number; // 堆排序边界
    val?: number; // 计数排序（当前处理的值）
    maxValue?: number; // 计数排序（当前最大值）
    bucketIndex?: number; // 计数/基数排序（当前桶）
    counts?: number[]; // 计数数组快照（可选）
    buckets?: number[][]; // 桶内容快照（基数排序链表视图）
    mergeBuffer?: number[]; // 归并排序临时数组快照
    pointers?: { [label: string]: number }; // 指针标记，如 { i: 2, j: 5 }
    gap?: number; // 希尔排序步长
    exp?: number; // 基数排序位值（1、10、100...）
    minIdx?: number; // 选择排序当前最小候选
    keyIdx?: number; // 插入排序当前插入项
  };
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
  speed: number; // 毫秒延迟
  algorithm: AlgorithmType;
  comparisonCount: number;
  swapCount: number;
  startTime: number | null;
}
