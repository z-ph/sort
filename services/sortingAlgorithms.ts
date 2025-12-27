import { AlgorithmType, SortStep } from '../types';

// Helper to create a step
const createStep = (
  array: number[],
  comparing: number[] = [],
  swapping: number[] = [],
  sorted: number[] = [],
  description: string = '',
  aux?: SortStep['aux']
): SortStep => ({
  array: [...array],
  comparing,
  swapping,
  sorted,
  description,
  aux
});

// --- Bubble Sort ---
export function* bubbleSort(array: number[]): Generator<SortStep> {
  const n = array.length;
  const arr = [...array];
  const sortedIndices: number[] = [];

  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      yield createStep(arr, [j, j + 1], [], sortedIndices, `冒泡比较: ${arr[j]} > ${arr[j+1]} ?`);
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        yield createStep(arr, [j, j + 1], [j, j + 1], sortedIndices, `交换: 将较大的 ${arr[j+1]} 向后冒泡`);
      }
    }
    sortedIndices.push(n - i - 1);
    yield createStep(arr, [], [], sortedIndices, `元素 ${arr[n-i-1]} 已归位`);
    if (!swapped && i < n - 1) {
         // Optimization: stop if no swaps occurred
         const remaining = Array.from({length: n - sortedIndices.length}, (_, k) => k);
         sortedIndices.push(...remaining);
         yield createStep(arr, [], [], sortedIndices, `未发生交换，数组已完全有序`);
         return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
    }
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
}

// --- Selection Sort ---
export function* selectionSort(array: number[]): Generator<SortStep> {
  const n = array.length;
  const arr = [...array];
  const sortedIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    yield createStep(arr, [i], [], sortedIndices, `开始第 ${i+1} 轮: 假设 ${arr[i]} 为最小值`, { minIdx });
    
    for (let j = i + 1; j < n; j++) {
      yield createStep(arr, [minIdx, j], [], sortedIndices, `寻找最小: 比较当前最小 ${arr[minIdx]} 与 ${arr[j]}`, { minIdx });
      if (arr[j] < arr[minIdx]) {
          minIdx = j;
          yield createStep(arr, [j], [], sortedIndices, `发现新最小值: ${arr[j]}`, { minIdx });
      }
    }
    
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      yield createStep(arr, [i, minIdx], [i, minIdx], sortedIndices, `本轮结束: 将最小值 ${arr[i]} 交换到位置 ${i}`, { minIdx: i });
    } else {
      yield createStep(arr, [i], [], sortedIndices, `本轮结束: ${arr[i]} 已经在正确位置`, { minIdx: i });
    }
    sortedIndices.push(i);
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
}

// --- Insertion Sort ---
export function* insertionSort(array: number[]): Generator<SortStep> {
  const n = array.length;
  const arr = [...array];
  // 0 is trivially sorted
  yield createStep(arr, [], [], [0], `初始状态: 索引 0 已视为有序区间`);
  
  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;
    yield createStep(arr, [i], [], Array.from({length: i}, (_, k) => k), `取牌: 将 ${key} (索引 ${i}) 作为待插入元素`, { keyIdx: i });
    
    while (j >= 0 && arr[j] > key) {
      yield createStep(arr, [j], [], Array.from({length: i}, (_, k) => k), `比较: ${arr[j]} > ${key}，需要后移`, { keyIdx: j + 1 });
      arr[j + 1] = arr[j];
      yield createStep(arr, [], [j+1], Array.from({length: i}, (_, k) => k), `移动: ${arr[j]} 后移到 ${j+1}`, { keyIdx: j }); // key effectively at j
      j = j - 1;
    }
    arr[j + 1] = key;
    yield createStep(arr, [], [j+1], Array.from({length: i+1}, (_, k) => k), `插入: 将 ${key} 放入位置 ${j+1}`, { keyIdx: j + 1 });
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
}

// --- Binary Insertion Sort ---
export function* binaryInsertionSort(array: number[]): Generator<SortStep> {
    const n = array.length;
    const arr = [...array];
    for (let i = 1; i < n; i++) {
        let x = arr[i];
        let left = 0, right = i - 1;
        yield createStep(arr, [i], [], [], `选择 ${x} 准备插入`, { keyIdx: i });
        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            yield createStep(arr, [mid], [], [], `二分查找: 比较 ${x} 与 ${arr[mid]}`, { keyIdx: i });
            if (x < arr[mid]) right = mid - 1;
            else left = mid + 1;
        }
        for (let j = i - 1; j >= left; j--) {
            arr[j + 1] = arr[j];
            yield createStep(arr, [], [j+1, j], [], `向右移动 ${arr[j]}`, { keyIdx: left }); // Conceptual key position
        }
        arr[left] = x;
        yield createStep(arr, [], [left], [], `在索引 ${left} 处插入 ${x}`, { keyIdx: left });
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
}

// --- Shell Sort ---
export function* shellSort(array: number[]): Generator<SortStep> {
    const n = array.length;
    const arr = [...array];
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        yield createStep(arr, [], [], [], `希尔排序: 设定增量 Gap = ${gap}`, { gap });
        for (let i = gap; i < n; i++) {
            let temp = arr[i];
            let j;
            yield createStep(arr, [i], [], [], `增量 ${gap}: 选择 ${temp} 准备插入`, { gap });
            for (j = i; j >= gap; j -= gap) {
                 yield createStep(arr, [j - gap], [], [], `增量 ${gap}: 比较 ${temp} 与 ${arr[j-gap]}`, { gap });
                 if (arr[j - gap] > temp) {
                     arr[j] = arr[j - gap];
                     yield createStep(arr, [j, j-gap], [j, j-gap], [], `增量 ${gap}: 移动 ${arr[j-gap]} 到位置 ${j}`, { gap });
                 } else break;
            }
            arr[j] = temp;
            yield createStep(arr, [], [j], [], `增量 ${gap}: 在 ${j} 处插入 ${temp}`, { gap });
        }
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
}

// --- Counting Sort ---
export function* countingSort(array: number[]): Generator<SortStep> {
    const n = array.length;
    const arr = [...array];
    if (n === 0) return createStep(arr, [], [], [], '完成');
    
    // Step 1: Find Max Value
    let max = arr[0];
    yield createStep(arr, [0], [], [], `第一步: 扫描数组寻找最大值，当前 Max = ${max}`, { val: arr[0], maxValue: max });
    
    for(let i = 1; i < n; i++) {
      yield createStep(arr, [i], [], [], `扫描元素 ${arr[i]}... (当前最大值: ${max})`, { val: arr[i], maxValue: max });
      if (arr[i] > max) {
          max = arr[i];
          yield createStep(arr, [i], [], [], `更新最大值 Max = ${max}`, { val: arr[i], maxValue: max });
      }
    }
    
    yield createStep(arr, [], [], [], `扫描结束，最大值为 ${max}，将创建 ${max + 1} 个计数桶`, { maxValue: max });

    const count = new Array(max + 1).fill(0);
    yield createStep(arr, [], [], [], `初始化 ${max + 1} 个计数桶`, { counts: [...count] });
    
    for(let i = 0; i < n; i++) {
      yield createStep(arr, [i], [], [], `统计 ${arr[i]} (桶[${arr[i]}])`, { val: arr[i], bucketIndex: arr[i], counts: [...count] });
      count[arr[i]]++;
      yield createStep(arr, [i], [], [], `桶[${arr[i]}] 计数 +1`, { val: arr[i], bucketIndex: arr[i], counts: [...count] });
    }
    let z = 0;
    for(let i = 0; i <= max; i++) {
      while(count[i] > 0) {
          yield createStep(arr, [], [z], Array.from({length: z}, (_, k) => k), `从桶[${i}]取出 ${i}`, { bucketIndex: i, val: i, counts: [...count] });
          arr[z] = i;
          count[i]--;
          yield createStep(arr, [], [z], Array.from({length: z+1}, (_, k) => k), `放置 ${i} 到索引 ${z}`, { bucketIndex: i, val: i, counts: [...count] });
          z++;
      }
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
}

// --- Radix Sort (LSD Iterative) ---
export function* radixSort(array: number[]): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;
    const getMax = (a: number[]) => {
        let mx = a[0];
        for(let i=1; i<a.length; i++) if (a[i] > mx) mx = a[i];
        return mx;
    };
    const maxVal = getMax(arr);
    const cloneBuckets = (b: number[][]) => b.map(row => [...row]);

    for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
        const buckets: number[][] = Array.from({length: 10}, () => []);
        const count = new Array(10).fill(0);

        yield createStep(arr, [], [], [], `基数排序 (位=${exp}): 初始化 0-9 号桶`, { counts: [...count], buckets: cloneBuckets(buckets), exp });

        for (let i = 0; i < n; i++) {
            const index = Math.floor(arr[i] / exp) % 10;
            buckets[index].push(arr[i]);
            count[index]++;
            yield createStep(arr, [i], [], [], `基数排序 (位=${exp}): 将 ${arr[i]} 尾插入桶 ${index}`, { 
                bucketIndex: index, val: arr[i], counts: [...count], buckets: cloneBuckets(buckets), exp 
            });
        }
        let arrIdx = 0;
        for (let i = 0; i < 10; i++) {
            while (buckets[i].length > 0) {
                const val = buckets[i].shift()!;
                arr[arrIdx] = val;
                yield createStep(arr, [], [arrIdx], [], `基数排序 (位=${exp}): 从桶 ${i} 取出 ${val} 归位到索引 ${arrIdx}`, { 
                    bucketIndex: i, val: val, counts: [...count], buckets: cloneBuckets(buckets), exp 
                });
                arrIdx++;
            }
        }
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
}

// --- Radix Sort (MSD Recursive) ---
export function* radixSortRecursive(array: number[]): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;
    const getMax = (a: number[]) => {
        let mx = a[0];
        for(let i=1; i<a.length; i++) if (a[i] > mx) mx = a[i];
        return mx;
    };
    const maxVal = getMax(arr);
    
    // Determine max exponent (e.g., if max is 95, exp is 10)
    let startExp = 1;
    while (Math.floor(maxVal / (startExp * 10)) > 0) {
        startExp *= 10;
    }

    const cloneBuckets = (b: number[][]) => b.map(row => [...row]);

    yield* _radixMSD(arr, 0, n - 1, startExp, cloneBuckets);
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
}

function* _radixMSD(
    arr: number[], 
    low: number, 
    high: number, 
    exp: number, 
    cloneBuckets: (b: number[][]) => number[][]
): Generator<SortStep> {
    if (high <= low || exp < 1) return;

    // Use a fresh set of buckets for this recursion level
    const buckets: number[][] = Array.from({length: 10}, () => []);
    
    // Helper to visualize the current recursion scope
    const rangeStep = (msg: string, bIndex?: number, val?: number) => createStep(
        arr, 
        [], 
        [], 
        [], 
        `MSD递归 (位=${exp}): 区间[${low}, ${high}] - ${msg}`, 
        { 
            range: { start: low, end: high }, 
            exp, 
            buckets: cloneBuckets(buckets), 
            bucketIndex: bIndex,
            val
        }
    );

    yield rangeStep(`开始处理，初始化分桶`);

    // Distribution
    for (let i = low; i <= high; i++) {
        const index = Math.floor(arr[i] / exp) % 10;
        buckets[index].push(arr[i]);
        yield createStep(
            arr, 
            [i], 
            [], 
            [], 
            `MSD递归 (位=${exp}): 将 ${arr[i]} 放入桶 ${index}`, 
            { 
                range: { start: low, end: high },
                bucketIndex: index, 
                val: arr[i], 
                buckets: cloneBuckets(buckets),
                exp 
            }
        );
    }

    // Collection & Calculate sub-ranges
    const ranges: {lo: number, hi: number}[] = [];
    let curr = low;

    for (let i = 0; i < 10; i++) {
        const bucketSize = buckets[i].length;
        if (bucketSize > 0) {
            const rangeStart = curr;
            while (buckets[i].length > 0) {
                const val = buckets[i].shift()!;
                arr[curr] = val;
                yield createStep(
                    arr, 
                    [], 
                    [curr], 
                    [], 
                    `MSD递归 (位=${exp}): 从桶 ${i} 写回 ${val}`, 
                    { 
                        range: { start: low, end: high },
                        bucketIndex: i, 
                        val: val, 
                        buckets: cloneBuckets(buckets),
                        exp 
                    }
                );
                curr++;
            }
            // Record range for next recursion level
            if (bucketSize > 1) {
                ranges.push({ lo: rangeStart, hi: rangeStart + bucketSize - 1 });
            }
        }
    }

    // Recursive calls for next digit
    for (const r of ranges) {
        yield* _radixMSD(arr, r.lo, r.hi, exp / 10, cloneBuckets);
    }
}


// --- Quick Sort Partition ---
function* _partition(arr: number[], low: number, high: number): Generator<SortStep, number, any> {
    const pivot = arr[low];
    let i = low + 1, j = high;
    const range = { start: low, end: high };
    yield createStep(arr, [low], [], [], `选择基准值 ${pivot}`, { range, pivot: low, pointers: { i, j } });
    while (true) {
        while (i <= j && arr[i] <= pivot) {
             yield createStep(arr, [i, low], [], [], `左指针 i 向右: ${arr[i]} <= ${pivot}`, { range, pivot: low, pointers: { i, j } });
             i++;
        }
        while (i <= j && arr[j] > pivot) {
             yield createStep(arr, [j, low], [], [], `右指针 j 向左: ${arr[j]} > ${pivot}`, { range, pivot: low, pointers: { i, j } });
             j--;
        }
        if (i < j) {
             yield createStep(arr, [i, j], [], [], `交换 ${arr[i]} 和 ${arr[j]}`, { range, pivot: low, pointers: { i, j } });
             [arr[i], arr[j]] = [arr[j], arr[i]];
             yield createStep(arr, [i, j], [i, j], [], `交换完成`, { range, pivot: low, pointers: { i, j } });
        } else break;
    }
    yield createStep(arr, [low, j], [], [], `将基准值归位`, { range, pivot: low, pointers: { i, j } });
    [arr[low], arr[j]] = [arr[j], arr[low]];
    yield createStep(arr, [j], [j], [], `基准值已归位`, { range, pivot: j, pointers: { i, j } });
    return j;
}

export function* quickSortRecursive(array: number[]): Generator<SortStep> {
  const arr = [...array];
  yield* _quickSortRecursiveHelper(arr, 0, arr.length - 1);
  return createStep(arr, [], [], Array.from({ length: arr.length }, (_, i) => i), '完成');
}
function* _quickSortRecursiveHelper(arr: number[], low: number, high: number): Generator<SortStep> {
  if (low < high) {
    const pi = yield* _partition(arr, low, high);
    yield* _quickSortRecursiveHelper(arr, low, pi - 1);
    yield* _quickSortRecursiveHelper(arr, pi + 1, high);
  }
}
export function* quickSortIterative(array: number[]): Generator<SortStep> {
  const arr = [...array];
  const stack = [0, arr.length - 1];
  while (stack.length > 0) {
    const high = stack.pop()!, low = stack.pop()!;
    const pi = yield* _partition(arr, low, high);
    if (pi + 1 < high) stack.push(pi + 1, high);
    if (pi - 1 > low) stack.push(low, pi - 1);
  }
  return createStep(arr, [], [], Array.from({ length: arr.length }, (_, i) => i), '完成');
}

// --- Merge Sort ---
export function* mergeSortRecursive(array: number[]): Generator<SortStep> {
    const arr = [...array];
    yield* _mergeSortHelper(arr, 0, arr.length - 1);
    return createStep(arr, [], [], Array.from({ length: arr.length }, (_, i) => i), '完成');
}
function* _mergeSortHelper(arr: number[], left: number, right: number): Generator<SortStep> {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    
    // 增加递归划分的可视化步骤
    yield createStep(
        arr, 
        [], 
        [], 
        [], 
        `递归拆分: 划分区间 [${left}, ${right}] 为 [${left}, ${mid}] 与 [${mid+1}, ${right}]`, 
        { range: { start: left, end: right }, mergeBuffer: [] } 
    );

    yield* _mergeSortHelper(arr, left, mid);
    yield* _mergeSortHelper(arr, mid + 1, right);
    yield* _merge(arr, left, mid, right);
}
function* _merge(arr: number[], left: number, mid: number, right: number): Generator<SortStep> {
    const range = { start: left, end: right }, temp: number[] = [];
    let i = left, j = mid + 1;
    while(i <= mid && j <= right) {
        yield createStep(arr, [i, j], [], [], `合并: 比较 ${arr[i]} vs ${arr[j]}`, { range, mergeBuffer: [...temp], pointers: { i, j } });
        if(arr[i] <= arr[j]) temp.push(arr[i++]);
        else temp.push(arr[j++]);
    }
    while(i <= mid) temp.push(arr[i++]);
    while(j <= right) temp.push(arr[j++]);
    for(let k = 0; k < temp.length; k++) {
        arr[left + k] = temp[k];
        yield createStep(arr, [], [left+k], [], `写回: 将 ${temp[k]} 归位到 ${left+k}`, { range, mergeBuffer: [...temp] });
    }
}

// --- Heap Sort (Updated with Detailed Aux) ---
export function* heapSort(array: number[]): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;
    // Build heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        yield* _heapify(arr, n, i);
    }
    // Extract elements
    for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        yield createStep(arr, [0, i], [0, i], [], `交换堆顶与末尾`, { heapSize: i });
        yield* _heapify(arr, i, 0);
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), '完成');
}

function* _heapify(arr: number[], n: number, i: number): Generator<SortStep> {
    let largest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    const aux = { heapSize: n, pointers: { parent: i, left: l, right: r } };

    if (l < n) {
        yield createStep(arr, [l, largest], [], [], `堆化: 比较父节点与左子节点`, aux);
        if (arr[l] > arr[largest]) largest = l;
    }
    if (r < n) {
        yield createStep(arr, [r, largest], [], [], `堆化: 比较当前最大值与右子节点`, aux);
        if (arr[r] > arr[largest]) largest = r;
    }
    if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        yield createStep(arr, [i, largest], [i, largest], [], `堆化: 交换父子节点`, aux);
        yield* _heapify(arr, n, largest);
    }
}

export const AlgorithmGenerators: Record<AlgorithmType, (array: number[]) => Generator<SortStep>> = {
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

export function runBenchmark(type: AlgorithmType, array: number[]): { time: number, comparisons: number, swaps: number } {
    const arr = [...array];
    const start = performance.now();
    // Simplified: reuse generators but run to completion for benchmark logic
    let comparisons = 0, swaps = 0;
    const gen = AlgorithmGenerators[type](arr);
    let step = gen.next();
    while(!step.done) {
        if(step.value.comparing.length > 0) comparisons++;
        if(step.value.swapping.length > 0) swaps++;
        step = gen.next();
    }
    const end = performance.now();
    return { time: end - start, comparisons, swaps };
}