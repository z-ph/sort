import { AlgorithmType, SortStep } from '../types';

// Helper to create a step
// OPTIMIZATION: Added isBenchmark flag to skip expensive array cloning during stress tests
const createStep = (
  array: number[],
  comparing: number[] = [],
  swapping: number[] = [],
  sorted: number[] = [],
  description: string = '',
  aux?: SortStep['aux'],
  isBenchmark: boolean = false
): SortStep => ({
  array: isBenchmark ? [] : [...array], 
  comparing,
  swapping,
  sorted: isBenchmark ? [] : [...sorted], // Clone sorted to prevent reference mutation issues in history
  description,
  aux
});

// ============================================================================
// VISUALIZATION GENERATORS (Keep these for the Visualizer UI)
// ============================================================================

// --- Bubble Sort ---
export function* bubbleSort(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
  const n = array.length;
  const arr = [...array];
  const sortedIndices: number[] = [];

  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      yield createStep(arr, [j, j + 1], [], sortedIndices, isBenchmark ? '' : `冒泡比较: ${arr[j]} > ${arr[j+1]} ?`, undefined, isBenchmark);
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        yield createStep(arr, [j, j + 1], [j, j + 1], sortedIndices, isBenchmark ? '' : `交换: 将较大的 ${arr[j+1]} 向后冒泡`, undefined, isBenchmark);
      }
    }
    sortedIndices.push(n - i - 1);
    // Removed "Element settled" step as requested
    
    if (!swapped && i < n - 1) {
         // If no swaps occurred, the rest is sorted. 
         // Removed "Array sorted" intermediate step as requested.
         return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
    }
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
}

// --- Selection Sort ---
export function* selectionSort(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
  const n = array.length;
  const arr = [...array];
  const sortedIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    yield createStep(arr, [i], [], sortedIndices, isBenchmark ? '' : `开始第 ${i+1} 轮: 假设 ${arr[i]} 为最小值`, isBenchmark ? undefined : { minIdx }, isBenchmark);
    for (let j = i + 1; j < n; j++) {
      yield createStep(arr, [minIdx, j], [], sortedIndices, isBenchmark ? '' : `寻找最小: 比较当前最小 ${arr[minIdx]} 与 ${arr[j]}`, isBenchmark ? undefined : { minIdx }, isBenchmark);
      if (arr[j] < arr[minIdx]) {
          minIdx = j;
          yield createStep(arr, [j], [], sortedIndices, isBenchmark ? '' : `发现新最小值: ${arr[j]}`, isBenchmark ? undefined : { minIdx }, isBenchmark);
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      yield createStep(arr, [i, minIdx], [i, minIdx], sortedIndices, isBenchmark ? '' : `本轮结束: 将最小值 ${arr[i]} 交换到位置 ${i}`, isBenchmark ? undefined : { minIdx: i }, isBenchmark);
    } 
    // Removed "Already in place" step as requested
    
    sortedIndices.push(i);
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
}

// --- Insertion Sort ---
export function* insertionSort(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
  const n = array.length;
  const arr = [...array];
  yield createStep(arr, [], [], [0], isBenchmark ? '' : `初始状态: 索引 0 已视为有序区间`, undefined, isBenchmark);
  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;
    const getSortedRange = (len: number) => isBenchmark ? [] : Array.from({length: len}, (_, k) => k);
    yield createStep(arr, [i], [], getSortedRange(i), isBenchmark ? '' : `取牌: 将 ${key} (索引 ${i}) 作为待插入元素`, isBenchmark ? undefined : { keyIdx: i }, isBenchmark);
    while (j >= 0 && arr[j] > key) {
      yield createStep(arr, [j], [], getSortedRange(i), isBenchmark ? '' : `比较: ${arr[j]} > ${key}，需要后移`, isBenchmark ? undefined : { keyIdx: j + 1 }, isBenchmark);
      arr[j + 1] = arr[j];
      yield createStep(arr, [], [j+1], getSortedRange(i), isBenchmark ? '' : `移动: ${arr[j]} 后移到 ${j+1}`, isBenchmark ? undefined : { keyIdx: j }, isBenchmark);
      j = j - 1;
    }
    arr[j + 1] = key;
    yield createStep(arr, [], [j+1], getSortedRange(i+1), isBenchmark ? '' : `插入: 将 ${key} 放入位置 ${j+1}`, isBenchmark ? undefined : { keyIdx: j + 1 }, isBenchmark);
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
}

// --- Binary Insertion Sort ---
export function* binaryInsertionSort(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
    const n = array.length;
    const arr = [...array];
    for (let i = 1; i < n; i++) {
        let x = arr[i];
        let left = 0, right = i - 1;
        yield createStep(arr, [i], [], [], isBenchmark ? '' : `选择 ${x} 准备插入`, isBenchmark ? undefined : { keyIdx: i }, isBenchmark);
        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            yield createStep(arr, [mid], [], [], isBenchmark ? '' : `二分查找: 比较 ${x} 与 ${arr[mid]}`, isBenchmark ? undefined : { keyIdx: i }, isBenchmark);
            if (x < arr[mid]) right = mid - 1;
            else left = mid + 1;
        }
        for (let j = i - 1; j >= left; j--) {
            arr[j + 1] = arr[j];
            yield createStep(arr, [], [j+1, j], [], isBenchmark ? '' : `向右移动 ${arr[j]}`, isBenchmark ? undefined : { keyIdx: left }, isBenchmark);
        }
        arr[left] = x;
        yield createStep(arr, [], [left], [], isBenchmark ? '' : `在索引 ${left} 处插入 ${x}`, isBenchmark ? undefined : { keyIdx: left }, isBenchmark);
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
}

// --- Shell Sort ---
export function* shellSort(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
    const n = array.length;
    const arr = [...array];
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        yield createStep(arr, [], [], [], isBenchmark ? '' : `希尔排序: 设定增量 Gap = ${gap}`, isBenchmark ? undefined : { gap }, isBenchmark);
        for (let i = gap; i < n; i++) {
            let temp = arr[i];
            let j;
            yield createStep(arr, [i], [], [], isBenchmark ? '' : `增量 ${gap}: 选择 ${temp} 准备插入`, isBenchmark ? undefined : { gap }, isBenchmark);
            for (j = i; j >= gap; j -= gap) {
                 yield createStep(arr, [j - gap], [], [], isBenchmark ? '' : `增量 ${gap}: 比较 ${temp} 与 ${arr[j-gap]}`, isBenchmark ? undefined : { gap }, isBenchmark);
                 if (arr[j - gap] > temp) {
                     arr[j] = arr[j - gap];
                     yield createStep(arr, [j, j-gap], [j, j-gap], [], isBenchmark ? '' : `增量 ${gap}: 移动 ${arr[j-gap]} 到位置 ${j}`, isBenchmark ? undefined : { gap }, isBenchmark);
                 } else break;
            }
            arr[j] = temp;
            yield createStep(arr, [], [j], [], isBenchmark ? '' : `增量 ${gap}: 在 ${j} 处插入 ${temp}`, isBenchmark ? undefined : { gap }, isBenchmark);
        }
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
}

// --- Counting Sort ---
export function* countingSort(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
    const n = array.length;
    const arr = [...array];
    if (n === 0) return createStep(arr, [], [], [], '完成', undefined, isBenchmark);
    let max = arr[0];
    yield createStep(arr, [0], [], [], isBenchmark ? '' : `第一步: 扫描数组寻找最大值，当前 Max = ${max}`, isBenchmark ? undefined : { val: arr[0], maxValue: max }, isBenchmark);
    for(let i = 1; i < n; i++) {
      yield createStep(arr, [i], [], [], isBenchmark ? '' : `扫描元素 ${arr[i]}... (当前最大值: ${max})`, isBenchmark ? undefined : { val: arr[i], maxValue: max }, isBenchmark);
      if (arr[i] > max) {
          max = arr[i];
          yield createStep(arr, [i], [], [], isBenchmark ? '' : `更新最大值 Max = ${max}`, isBenchmark ? undefined : { val: arr[i], maxValue: max }, isBenchmark);
      }
    }
    yield createStep(arr, [], [], [], isBenchmark ? '' : `扫描结束，最大值为 ${max}，将创建 ${max + 1} 个计数桶`, { maxValue: max }, isBenchmark);
    const count = new Array(max + 1).fill(0);
    yield createStep(arr, [], [], [], isBenchmark ? '' : `初始化 ${max + 1} 个计数桶`, { counts: isBenchmark ? [] : [...count] }, isBenchmark);
    for(let i = 0; i < n; i++) {
      yield createStep(arr, [i], [], [], isBenchmark ? '' : `统计 ${arr[i]} (桶[${arr[i]}])`, isBenchmark ? undefined : { val: arr[i], bucketIndex: arr[i], counts: isBenchmark ? [] : [...count] }, isBenchmark);
      count[arr[i]]++;
      yield createStep(arr, [i], [], [], isBenchmark ? '' : `桶[${arr[i]}] 计数 +1`, isBenchmark ? undefined : { val: arr[i], bucketIndex: arr[i], counts: isBenchmark ? [] : [...count] }, isBenchmark);
    }
    const getSortedRange = (len: number) => isBenchmark ? [] : Array.from({length: len}, (_, k) => k);
    let z = 0;
    for(let i = 0; i <= max; i++) {
      while(count[i] > 0) {
          yield createStep(arr, [], [z], getSortedRange(z), isBenchmark ? '' : `从桶[${i}]取出 ${i}`, { bucketIndex: i, val: i, counts: isBenchmark ? [] : [...count] }, isBenchmark);
          arr[z] = i;
          count[i]--;
          yield createStep(arr, [], [z], getSortedRange(z+1), isBenchmark ? '' : `放置 ${i} 到索引 ${z}`, { bucketIndex: i, val: i, counts: isBenchmark ? [] : [...count] }, isBenchmark);
          z++;
      }
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
}

// --- Radix Sort (LSD Iterative) ---
export function* radixSort(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;
    const getMax = (a: number[]) => {
        let mx = a[0];
        for(let i=1; i<a.length; i++) if (a[i] > mx) mx = a[i];
        return mx;
    };
    const maxVal = getMax(arr);
    const cloneBuckets = (b: number[][]) => isBenchmark ? [] : b.map(row => [...row]);
    for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
        const buckets: number[][] = Array.from({length: 10}, () => []);
        const count = new Array(10).fill(0);
        yield createStep(arr, [], [], [], `基数排序 (位=${exp}): 初始化 0-9 号桶`, { counts: isBenchmark ? [] : [...count], buckets: cloneBuckets(buckets), exp }, isBenchmark);
        for (let i = 0; i < n; i++) {
            const index = Math.floor(arr[i] / exp) % 10;
            buckets[index].push(arr[i]);
            count[index]++;
            yield createStep(arr, [i], [], [], `基数排序 (位=${exp}): 将 ${arr[i]} 尾插入桶 ${index}`, { bucketIndex: index, val: arr[i], counts: isBenchmark ? [] : [...count], buckets: cloneBuckets(buckets), exp }, isBenchmark);
        }
        let arrIdx = 0;
        for (let i = 0; i < 10; i++) {
            while (buckets[i].length > 0) {
                const val = buckets[i].shift()!;
                arr[arrIdx] = val;
                yield createStep(arr, [], [arrIdx], [], `基数排序 (位=${exp}): 从桶 ${i} 取出 ${val} 归位到索引 ${arrIdx}`, { bucketIndex: i, val: val, counts: isBenchmark ? [] : [...count], buckets: cloneBuckets(buckets), exp }, isBenchmark);
                arrIdx++;
            }
        }
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
}

// --- Radix Sort (MSD Recursive) ---
export function* radixSortRecursive(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;
    const getMax = (a: number[]) => {
        let mx = a[0];
        for(let i=1; i<a.length; i++) if (a[i] > mx) mx = a[i];
        return mx;
    };
    const maxVal = getMax(arr);
    let startExp = 1;
    while (Math.floor(maxVal / (startExp * 10)) > 0) {
        startExp *= 10;
    }
    const cloneBuckets = (b: number[][]) => isBenchmark ? [] : b.map(row => [...row]);
    yield* _radixMSD(arr, 0, n - 1, startExp, cloneBuckets, isBenchmark);
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
}
function* _radixMSD(arr: number[], low: number, high: number, exp: number, cloneBuckets: (b: number[][]) => number[][], isBenchmark: boolean): Generator<SortStep> {
    if (high <= low || exp < 1) return;
    const buckets: number[][] = Array.from({length: 10}, () => []);
    const rangeStep = (msg: string, bIndex?: number, val?: number) => createStep(arr, [], [], [], `MSD递归 (位=${exp}): 区间[${low}, ${high}] - ${msg}`, { range: { start: low, end: high }, exp, buckets: cloneBuckets(buckets), bucketIndex: bIndex, val }, isBenchmark);
    yield rangeStep(`开始处理，初始化分桶`);
    for (let i = low; i <= high; i++) {
        const index = Math.floor(arr[i] / exp) % 10;
        buckets[index].push(arr[i]);
        yield createStep(arr, [i], [], [], `MSD递归 (位=${exp}): 将 ${arr[i]} 放入桶 ${index}`, { range: { start: low, end: high }, bucketIndex: index, val: arr[i], buckets: cloneBuckets(buckets), exp }, isBenchmark);
    }
    const ranges: {lo: number, hi: number}[] = [];
    let curr = low;
    for (let i = 0; i < 10; i++) {
        const bucketSize = buckets[i].length;
        if (bucketSize > 0) {
            const rangeStart = curr;
            while (buckets[i].length > 0) {
                const val = buckets[i].shift()!;
                arr[curr] = val;
                yield createStep(arr, [], [curr], [], `MSD递归 (位=${exp}): 从桶 ${i} 写回 ${val}`, { range: { start: low, end: high }, bucketIndex: i, val: val, buckets: cloneBuckets(buckets), exp }, isBenchmark);
                curr++;
            }
            if (bucketSize > 1) {
                ranges.push({ lo: rangeStart, hi: rangeStart + bucketSize - 1 });
            }
        }
    }
    for (const r of ranges) {
        yield* _radixMSD(arr, r.lo, r.hi, exp / 10, cloneBuckets, isBenchmark);
    }
}

// --- Quick Sort ---
function* _partition(arr: number[], low: number, high: number, isBenchmark: boolean): Generator<SortStep, number, any> {
    const pivot = arr[low];
    let i = low + 1, j = high;
    const range = { start: low, end: high };
    yield createStep(arr, [low], [], [], `选择基准值 ${pivot}`, { range, pivot: low, pointers: { i, j } }, isBenchmark);
    while (true) {
        while (i <= j && arr[i] <= pivot) {
             yield createStep(arr, [i, low], [], [], `左指针 i 向右: ${arr[i]} <= ${pivot}`, { range, pivot: low, pointers: { i, j } }, isBenchmark);
             i++;
        }
        while (i <= j && arr[j] > pivot) {
             yield createStep(arr, [j, low], [], [], `右指针 j 向左: ${arr[j]} > ${pivot}`, { range, pivot: low, pointers: { i, j } }, isBenchmark);
             j--;
        }
        if (i < j) {
             // Removing comparing=[i, j] to avoid counting this setup step as a comparison.
             // Visualizer will still show pointers i and j.
             yield createStep(arr, [], [], [], `准备交换 ${arr[i]} 和 ${arr[j]}`, { range, pivot: low, pointers: { i, j } }, isBenchmark);
             [arr[i], arr[j]] = [arr[j], arr[i]];
             yield createStep(arr, [i, j], [i, j], [], `交换完成`, { range, pivot: low, pointers: { i, j } }, isBenchmark);
        } else break;
    }
    // Removing comparing=[low, j] to avoid counting this setup step as a comparison
    yield createStep(arr, [], [], [], `准备将基准值归位`, { range, pivot: low, pointers: { i, j } }, isBenchmark);
    [arr[low], arr[j]] = [arr[j], arr[low]];
    yield createStep(arr, [j], [j], [], `基准值已归位`, { range, pivot: j, pointers: { i, j } }, isBenchmark);
    return j;
}
export function* quickSortRecursive(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
  const arr = [...array];
  yield* _quickSortRecursiveHelper(arr, 0, arr.length - 1, isBenchmark);
  return createStep(arr, [], [], Array.from({ length: arr.length }, (_, i) => i), '完成', undefined, isBenchmark);
}
function* _quickSortRecursiveHelper(arr: number[], low: number, high: number, isBenchmark: boolean): Generator<SortStep> {
  if (low < high) {
    const pi = yield* _partition(arr, low, high, isBenchmark);
    yield* _quickSortRecursiveHelper(arr, low, pi - 1, isBenchmark);
    yield* _quickSortRecursiveHelper(arr, pi + 1, high, isBenchmark);
  }
}
export function* quickSortIterative(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
  const arr = [...array];
  const stack = [0, arr.length - 1];
  while (stack.length > 0) {
    const high = stack.pop()!, low = stack.pop()!;
    const pi = yield* _partition(arr, low, high, isBenchmark);
    const leftLen = pi - 1 - low;
    const rightLen = high - (pi + 1);
    if (leftLen > rightLen) {
        if (pi - 1 > low) stack.push(low, pi - 1);
        if (pi + 1 < high) stack.push(pi + 1, high);
    } else {
        if (pi + 1 < high) stack.push(pi + 1, high);
        if (pi - 1 > low) stack.push(low, pi - 1);
    }
  }
  return createStep(arr, [], [], Array.from({ length: arr.length }, (_, i) => i), '完成', undefined, isBenchmark);
}

// --- Merge Sort ---
export function* mergeSortRecursive(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
    const arr = [...array];
    yield* _mergeSortHelper(arr, 0, arr.length - 1, isBenchmark);
    return createStep(arr, [], [], Array.from({ length: arr.length }, (_, i) => i), '完成', undefined, isBenchmark);
}
function* _mergeSortHelper(arr: number[], left: number, right: number, isBenchmark: boolean): Generator<SortStep> {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    yield createStep(arr, [], [], [], `递归拆分: 划分区间 [${left}, ${right}] 为 [${left}, ${mid}] 与 [${mid+1}, ${right}]`, { range: { start: left, end: right }, mergeBuffer: [] }, isBenchmark);
    yield* _mergeSortHelper(arr, left, mid, isBenchmark);
    yield* _mergeSortHelper(arr, mid + 1, right, isBenchmark);
    yield* _merge(arr, left, mid, right, isBenchmark);
}
function* _merge(arr: number[], left: number, mid: number, right: number, isBenchmark: boolean): Generator<SortStep> {
    const range = { start: left, end: right }, temp: number[] = [];
    let i = left, j = mid + 1;
    while(i <= mid && j <= right) {
        yield createStep(arr, [i, j], [], [], `合并: 比较 ${arr[i]} vs ${arr[j]}`, { range, mergeBuffer: isBenchmark ? [] : [...temp], pointers: { i, j } }, isBenchmark);
        if(arr[i] <= arr[j]) temp.push(arr[i++]);
        else temp.push(arr[j++]);
    }
    while(i <= mid) temp.push(arr[i++]);
    while(j <= right) temp.push(arr[j++]);
    for(let k = 0; k < temp.length; k++) {
        arr[left + k] = temp[k];
        yield createStep(arr, [], [left+k], [], `写回: 将 ${temp[k]} 归位到 ${left+k}`, { range, mergeBuffer: isBenchmark ? [] : [...temp] }, isBenchmark);
    }
}

// --- Heap Sort ---
export function* heapSort(array: number[], isBenchmark: boolean = false): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        yield* _heapify(arr, n, i, isBenchmark);
    }
    for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        yield createStep(arr, [0, i], [0, i], [], `交换堆顶与末尾`, { heapSize: i }, isBenchmark);
        yield* _heapify(arr, i, 0, isBenchmark);
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成', undefined, isBenchmark);
}
function* _heapify(arr: number[], n: number, i: number, isBenchmark: boolean): Generator<SortStep> {
    let largest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    const aux = { heapSize: n, pointers: { parent: i, left: l, right: r } };
    if (l < n) {
        yield createStep(arr, [l, largest], [], [], `堆化: 比较父节点与左子节点`, aux, isBenchmark);
        if (arr[l] > arr[largest]) largest = l;
    }
    if (r < n) {
        yield createStep(arr, [r, largest], [], [], `堆化: 比较当前最大值与右子节点`, aux, isBenchmark);
        if (arr[r] > arr[largest]) largest = r;
    }
    if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        yield createStep(arr, [i, largest], [i, largest], [], `堆化: 交换父子节点`, aux, isBenchmark);
        yield* _heapify(arr, n, largest, isBenchmark);
    }
}

// Export Generators for Visualizer
export const AlgorithmGenerators: Record<AlgorithmType, (array: number[], isBenchmark?: boolean) => Generator<SortStep>> = {
  [AlgorithmType.BUBBLE]: bubbleSort,
  [AlgorithmType.SELECTION]: selectionSort,
  [AlgorithmType.INSERTION]: insertionSort,
  [AlgorithmType.BINARY_INSERTION]: binaryInsertionSort,
  [AlgorithmType.SHELL]: shellSort,
  [AlgorithmType.COUNTING]: countingSort,
  [AlgorithmType.RADIX]: radixSort,
  [AlgorithmType.RADIX_REC]: radixSortRecursive,
  [AlgorithmType.QUICK_REC]: quickSortRecursive,
  [AlgorithmType.QUICK_ITER]: quickSortIterative,
  [AlgorithmType.MERGE_REC]: mergeSortRecursive,
  [AlgorithmType.MERGE_ITER]: mergeSortRecursive,
  [AlgorithmType.HEAP]: heapSort
};

// ============================================================================
// PURE ALGORITHMS FOR BENCHMARKING (No Generators, No Yield Overhead)
// ============================================================================

interface PureStats { comparisons: number; swaps: number; }

const pureBubble = (arr: number[]): PureStats => {
    let comparisons = 0, swaps = 0;
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            comparisons++;
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swapped = true;
                swaps++;
            }
        }
        if (!swapped) break;
    }
    return { comparisons, swaps };
};

const pureSelection = (arr: number[]): PureStats => {
    let comparisons = 0, swaps = 0;
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            comparisons++;
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        if (minIdx !== i) {
            [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            swaps++;
        }
    }
    return { comparisons, swaps };
};

const pureInsertion = (arr: number[]): PureStats => {
    let comparisons = 0, swaps = 0;
    const n = arr.length;
    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0) {
            comparisons++;
            if (arr[j] > key) {
                arr[j + 1] = arr[j];
                swaps++; // Count shifting as a swap-like operation for stats
                j--;
            } else {
                break;
            }
        }
        arr[j + 1] = key;
        swaps++; // Assignment
    }
    return { comparisons, swaps };
};

const pureBinaryInsertion = (arr: number[]): PureStats => {
    let comparisons = 0, swaps = 0;
    const n = arr.length;
    for (let i = 1; i < n; i++) {
        let x = arr[i];
        let left = 0, right = i - 1;
        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            comparisons++;
            if (x < arr[mid]) right = mid - 1;
            else left = mid + 1;
        }
        for (let j = i - 1; j >= left; j--) {
            arr[j + 1] = arr[j];
            swaps++;
        }
        arr[left] = x;
        swaps++;
    }
    return { comparisons, swaps };
};

const pureShell = (arr: number[]): PureStats => {
    let comparisons = 0, swaps = 0;
    const n = arr.length;
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        for (let i = gap; i < n; i++) {
            let temp = arr[i];
            let j;
            for (j = i; j >= gap; j -= gap) {
                comparisons++;
                if (arr[j - gap] > temp) {
                    arr[j] = arr[j - gap];
                    swaps++;
                } else {
                    break;
                }
            }
            arr[j] = temp;
            if (j !== i) swaps++;
        }
    }
    return { comparisons, swaps };
};

const pureCounting = (arr: number[]): PureStats => {
    let comparisons = 0, swaps = 0; // Comparisons used for scanning, Swaps used for writes
    const n = arr.length;
    if (n === 0) return { comparisons, swaps };
    
    let max = arr[0];
    for(let i=1; i<n; i++) {
        comparisons++;
        if (arr[i] > max) max = arr[i];
    }
    
    const count = new Array(max + 1).fill(0);
    for(let i=0; i<n; i++) {
        count[arr[i]]++;
        comparisons++; // Accessing
    }
    
    let z = 0;
    for(let i=0; i<=max; i++) {
        while(count[i] > 0) {
            arr[z++] = i;
            count[i]--;
            swaps++; // Write back
        }
    }
    return { comparisons, swaps };
};

const pureRadixIterative = (arr: number[]): PureStats => {
    let comparisons = 0, swaps = 0;
    const n = arr.length;
    let maxVal = arr[0];
    for(let i=1; i<n; i++) if (arr[i] > maxVal) maxVal = arr[i];
    
    for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
        const buckets: number[][] = Array.from({length: 10}, () => []);
        for (let i = 0; i < n; i++) {
            const index = Math.floor(arr[i] / exp) % 10;
            buckets[index].push(arr[i]);
            comparisons++; // Scan cost
        }
        let arrIdx = 0;
        for (let i = 0; i < 10; i++) {
            for(const val of buckets[i]) {
                arr[arrIdx++] = val;
                swaps++; // Copy back cost
            }
        }
    }
    return { comparisons, swaps };
};

const pureRadixRecursive = (arr: number[]): PureStats => {
    const stats = { comparisons: 0, swaps: 0 };
    if (arr.length === 0) return stats;
    let maxVal = arr[0];
    for(let i=1; i<arr.length; i++) if (arr[i] > maxVal) maxVal = arr[i];
    
    let startExp = 1;
    while (Math.floor(maxVal / (startExp * 10)) > 0) startExp *= 10;

    const _msd = (low: number, high: number, exp: number) => {
        if (high <= low || exp < 1) return;
        const buckets: number[][] = Array.from({length: 10}, () => []);
        for (let i = low; i <= high; i++) {
            const index = Math.floor(arr[i] / exp) % 10;
            buckets[index].push(arr[i]);
            stats.comparisons++;
        }
        let curr = low;
        const ranges: {lo: number, hi: number}[] = [];
        for (let i = 0; i < 10; i++) {
             const size = buckets[i].length;
             if (size > 0) {
                 const start = curr;
                 for (const val of buckets[i]) {
                     arr[curr++] = val;
                     stats.swaps++;
                 }
                 if (size > 1) ranges.push({lo: start, hi: start + size - 1});
             }
        }
        for(const r of ranges) _msd(r.lo, r.hi, exp/10);
    };

    _msd(0, arr.length - 1, startExp);
    return stats;
};

const pureHeap = (arr: number[]): PureStats => {
    let comparisons = 0, swaps = 0;
    const n = arr.length;
    
    const heapify = (n: number, i: number) => {
        let largest = i;
        let current = i;

        while (true) {
            const l = 2 * current + 1;
            const r = 2 * current + 2;
            largest = current;

            if (l < n) {
                comparisons++;
                if (arr[l] > arr[largest]) largest = l;
            }
            if (r < n) {
                comparisons++;
                if (arr[r] > arr[largest]) largest = r;
            }

            if (largest !== current) {
                [arr[current], arr[largest]] = [arr[largest], arr[current]];
                swaps++;
                current = largest; // Move down to the child
            } else {
                break; // Position found
            }
        }
    };

    // Build heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(n, i);
    }
    
    // Extract elements
    for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        swaps++;
        heapify(i, 0);
    }
    
    return { comparisons, swaps };
};

const pureQuickIterative = (arr: number[]): PureStats => {
    let comparisons = 0, swaps = 0;
    const stack = [0, arr.length - 1];
    while (stack.length > 0) {
        const high = stack.pop()!;
        const low = stack.pop()!;
        
        const pivot = arr[low];
        let i = low + 1, j = high;
        while(true) {
            while(i <= j) {
                comparisons++;
                if (arr[i] <= pivot) i++;
                else break;
            }
            while(i <= j) {
                comparisons++;
                if (arr[j] > pivot) j--;
                else break;
            }
            if(i < j) {
                [arr[i], arr[j]] = [arr[j], arr[i]];
                swaps++;
            } else break;
        }
        [arr[low], arr[j]] = [arr[j], arr[low]];
        swaps++;
        
        const pi = j;
        const leftLen = pi - 1 - low;
        const rightLen = high - (pi + 1);

        if (leftLen > rightLen) {
            if (pi - 1 > low) { stack.push(low); stack.push(pi - 1); }
            if (pi + 1 < high) { stack.push(pi + 1); stack.push(high); }
        } else {
            if (pi + 1 < high) { stack.push(pi + 1); stack.push(high); }
            if (pi - 1 > low) { stack.push(low); stack.push(pi - 1); }
        }
    }
    return { comparisons, swaps };
};

const pureQuickRecursive = (arr: number[]): PureStats => {
    const stats = { comparisons: 0, swaps: 0 };
    const _sort = (low: number, high: number) => {
        if (low < high) {
            const pivot = arr[low];
            let i = low + 1, j = high;
            while(true) {
                while(i <= j) {
                    stats.comparisons++;
                    if (arr[i] <= pivot) i++;
                    else break;
                }
                while(i <= j) {
                    stats.comparisons++;
                    if (arr[j] > pivot) j--;
                    else break;
                }
                if(i < j) {
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    stats.swaps++;
                } else break;
            }
            [arr[low], arr[j]] = [arr[j], arr[low]];
            stats.swaps++;
            
            const pi = j;
            _sort(low, pi - 1);
            _sort(pi + 1, high);
        }
    };
    _sort(0, arr.length - 1);
    return stats;
};

const pureMergeRecursive = (arr: number[]): PureStats => {
    const stats = { comparisons: 0, swaps: 0 };
    const _merge = (left: number, mid: number, right: number) => {
        const temp = [];
        let i = left, j = mid + 1;
        while(i <= mid && j <= right) {
            stats.comparisons++;
            if(arr[i] <= arr[j]) temp.push(arr[i++]);
            else temp.push(arr[j++]);
        }
        while(i <= mid) temp.push(arr[i++]);
        while(j <= right) temp.push(arr[j++]);
        for(let k=0; k<temp.length; k++) {
            arr[left + k] = temp[k];
            stats.swaps++;
        }
    };
    const _sort = (left: number, right: number) => {
        if (left >= right) return;
        const mid = Math.floor((left + right) / 2);
        _sort(left, mid);
        _sort(mid + 1, right);
        _merge(left, mid, right);
    };
    _sort(0, arr.length - 1);
    return stats;
};

// Pure implementations mapping
const PureAlgorithms: Record<AlgorithmType, (arr: number[]) => PureStats> = {
    [AlgorithmType.BUBBLE]: pureBubble,
    [AlgorithmType.SELECTION]: pureSelection,
    [AlgorithmType.INSERTION]: pureInsertion,
    [AlgorithmType.BINARY_INSERTION]: pureBinaryInsertion,
    [AlgorithmType.SHELL]: pureShell,
    [AlgorithmType.COUNTING]: pureCounting,
    [AlgorithmType.RADIX]: pureRadixIterative,
    [AlgorithmType.RADIX_REC]: pureRadixRecursive,
    [AlgorithmType.QUICK_REC]: pureQuickRecursive,
    [AlgorithmType.QUICK_ITER]: pureQuickIterative,
    [AlgorithmType.MERGE_REC]: pureMergeRecursive,
    [AlgorithmType.MERGE_ITER]: pureMergeRecursive, // Using recursive pure for benchmark simplicity, or impl iterative if strictly needed
    [AlgorithmType.HEAP]: pureHeap
};

export function runBenchmark(type: AlgorithmType, array: number[]): { time: number, comparisons: number, swaps: number } {
    // This function is kept for WebWorker compatibility if needed
    const arr = [...array];
    const start = performance.now();
    const stats = PureAlgorithms[type](arr);
    const end = performance.now();
    return { time: end - start, ...stats };
}

// Rewritten Async Benchmark: No Generators, No Yielding inside algorithm
// We simply run the pure function synchronously. For N=5000, even O(n^2) is < 200ms in V8.
export async function runBenchmarkAsync(
    type: AlgorithmType, 
    array: number[], 
    shouldAbort: () => boolean
): Promise<{ time: number, comparisons: number, swaps: number }> {
    // Check abort before starting
    if (shouldAbort()) throw new Error("Benchmark Aborted");

    const arr = [...array];
    const start = performance.now();
    
    // EXECUTE PURE ALGORITHM (Blocking main thread for a brief moment)
    const stats = PureAlgorithms[type](arr);
    
    const end = performance.now();
    
    // Check abort after finishing (in case it was long)
    if (shouldAbort()) throw new Error("Benchmark Aborted");
    
    return { time: end - start, ...stats };
}