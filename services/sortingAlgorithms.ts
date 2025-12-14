import { AlgorithmType, SortStep } from '../types';

// Helper to create a step
const createStep = (
  array: number[],
  comparing: number[] = [],
  swapping: number[] = [],
  sorted: number[] = [],
  description: string = ''
): SortStep => ({
  array: [...array],
  comparing,
  swapping,
  sorted,
  description,
});

// --- Bubble Sort ---
export function* bubbleSort(array: number[]): Generator<SortStep> {
  const n = array.length;
  const arr = [...array];
  const sortedIndices: number[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield createStep(arr, [j, j + 1], [], sortedIndices, `Comparing index ${j} and ${j+1}`);
      
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield createStep(arr, [j, j + 1], [j, j + 1], sortedIndices, `Swapped index ${j} and ${j+1}`);
      }
    }
    sortedIndices.push(n - i - 1);
    yield createStep(arr, [], [], sortedIndices, `Index ${n-i-1} is sorted`);
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), 'Finished');
}

// --- Selection Sort ---
export function* selectionSort(array: number[]): Generator<SortStep> {
  const n = array.length;
  const arr = [...array];
  const sortedIndices: number[] = [];

  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield createStep(arr, [minIdx, j], [], sortedIndices, `Comparing min ${minIdx} with ${j}`);
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      yield createStep(arr, [i, minIdx], [i, minIdx], sortedIndices, `Swapped new min ${minIdx} to ${i}`);
    }
    sortedIndices.push(i);
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), 'Finished');
}

// --- Insertion Sort ---
export function* insertionSort(array: number[]): Generator<SortStep> {
  const n = array.length;
  const arr = [...array];
  const sortedIndices: number[] = []; // Technically insertion sort builds sorted part from left

  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;
    yield createStep(arr, [i], [], [], `Selected key ${key} at index ${i}`);

    while (j >= 0 && arr[j] > key) {
      yield createStep(arr, [j, j+1], [], [], `Comparing key ${key} with ${arr[j]}`);
      arr[j + 1] = arr[j];
      yield createStep(arr, [], [j+1], [], `Moved ${arr[j]} to ${j+1}`);
      j = j - 1;
    }
    arr[j + 1] = key;
    yield createStep(arr, [], [j+1], [], `Inserted key at ${j+1}`);
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), 'Finished');
}

// --- Quick Sort (Recursive) ---
export function* quickSortRecursive(array: number[]): Generator<SortStep> {
  const arr = [...array];
  const n = arr.length;
  
  yield* _quickSortRecursiveHelper(arr, 0, n - 1);
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), 'Finished');
}

function* _quickSortRecursiveHelper(arr: number[], low: number, high: number): Generator<SortStep> {
  if (low < high) {
    const pi = yield* _partition(arr, low, high);
    yield* _quickSortRecursiveHelper(arr, low, pi - 1);
    yield* _quickSortRecursiveHelper(arr, pi + 1, high);
  }
}

function* _partition(arr: number[], low: number, high: number): Generator<SortStep> {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    yield createStep(arr, [j, high], [], [], `Comparing with pivot ${pivot}`);
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      yield createStep(arr, [i, j], [i, j], [], `Swapped smaller element to left`);
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  yield createStep(arr, [i + 1, high], [i + 1, high], [], `Placed pivot at correct position`);
  return i + 1;
}

// --- Quick Sort (Iterative) ---
export function* quickSortIterative(array: number[]): Generator<SortStep> {
  const arr = [...array];
  const n = arr.length;
  const stack: number[] = [];
  
  stack.push(0);
  stack.push(n - 1);

  while (stack.length > 0) {
    const high = stack.pop()!;
    const low = stack.pop()!;

    // Same partition logic, but inlined to avoid yield* complexity issues with stack
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
        yield createStep(arr, [j, high], [], [], `Iterative: Comparing with pivot ${pivot}`);
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
            yield createStep(arr, [i, j], [i, j], [], `Iterative: Swapped`);
        }
    }
    [arr[i+1], arr[high]] = [arr[high], arr[i+1]];
    yield createStep(arr, [i+1, high], [i+1, high], [], `Iterative: Pivot placed`);
    
    const p = i + 1;

    if (p - 1 > low) {
      stack.push(low);
      stack.push(p - 1);
    }
    if (p + 1 < high) {
      stack.push(p + 1);
      stack.push(high);
    }
  }
  return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), 'Finished');
}

// --- Merge Sort (Recursive) ---
export function* mergeSortRecursive(array: number[]): Generator<SortStep> {
    const arr = [...array];
    yield* _mergeSortHelper(arr, 0, arr.length - 1);
    return createStep(arr, [], [], Array.from({ length: arr.length }, (_, i) => i), 'Finished');
}

function* _mergeSortHelper(arr: number[], left: number, right: number): Generator<SortStep> {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    yield* _mergeSortHelper(arr, left, mid);
    yield* _mergeSortHelper(arr, mid + 1, right);
    yield* _merge(arr, left, mid, right);
}

function* _merge(arr: number[], left: number, mid: number, right: number): Generator<SortStep> {
    const temp: number[] = [];
    let i = left, j = mid + 1;
    
    while(i <= mid && j <= right) {
        yield createStep(arr, [i, j], [], [], `Merging: compare ${arr[i]} and ${arr[j]}`);
        if(arr[i] <= arr[j]) {
            temp.push(arr[i++]);
        } else {
            temp.push(arr[j++]);
        }
    }
    while(i <= mid) temp.push(arr[i++]);
    while(j <= right) temp.push(arr[j++]);

    for(let k = 0; k < temp.length; k++) {
        arr[left + k] = temp[k];
        yield createStep(arr, [], [left+k], [], `Merging: Updated value at ${left+k}`);
    }
}

// --- Heap Sort ---
export function* heapSort(array: number[]): Generator<SortStep> {
    const arr = [...array];
    const n = arr.length;

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        yield* _heapify(arr, n, i);
    }

    for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        yield createStep(arr, [0, i], [0, i], [], `Moved max to end`);
        yield* _heapify(arr, i, 0);
    }
    return createStep(arr, [], [], Array.from({ length: n }, (_, i) => i), 'Finished');
}

function* _heapify(arr: number[], n: number, i: number): Generator<SortStep> {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;

    if (l < n) {
        yield createStep(arr, [l, largest], [], [], `Heapify compare left`);
        if (arr[l] > arr[largest]) largest = l;
    }
    if (r < n) {
        yield createStep(arr, [r, largest], [], [], `Heapify compare right`);
        if (arr[r] > arr[largest]) largest = r;
    }

    if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        yield createStep(arr, [i, largest], [i, largest], [], `Heapify swap`);
        yield* _heapify(arr, n, largest);
    }
}


export const AlgorithmGenerators: Record<AlgorithmType, (array: number[]) => Generator<SortStep>> = {
  [AlgorithmType.BUBBLE]: bubbleSort,
  [AlgorithmType.SELECTION]: selectionSort,
  [AlgorithmType.INSERTION]: insertionSort,
  [AlgorithmType.QUICK_REC]: quickSortRecursive,
  [AlgorithmType.QUICK_ITER]: quickSortIterative,
  [AlgorithmType.MERGE_REC]: mergeSortRecursive,
  [AlgorithmType.MERGE_ITER]: mergeSortRecursive, // Fallback to recursive for visual simplicity
  [AlgorithmType.HEAP]: heapSort
};

// --- Benchmarking Utils ---
// We create synchronous versions or modified versions for speed, but for simplicity/code size,
// we can iterate the generator without yielding delay to measure ops. 
// A production benchmark would use raw loops without yield overhead.
// Here we approximate using the generator but consuming it fully synchronously.

export function runBenchmark(type: AlgorithmType, array: number[]): { time: number, comparisons: number, swaps: number } {
    const generator = AlgorithmGenerators[type]([...array]);
    let start = performance.now();
    let comparisons = 0;
    let swaps = 0;
    
    for (const step of generator) {
        if (step.comparing.length > 0) comparisons++;
        if (step.swapping.length > 0) swaps++;
    }
    
    let end = performance.now();
    return {
        time: end - start,
        comparisons,
        swaps
    };
}
