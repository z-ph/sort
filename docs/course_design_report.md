# 排序算法综合演示系统课程设计报告

> **题目：** 排序算法综合演示系统  
> **班级：** ________  
> **姓名：** ________  
> **学号：** ________  
> **完成日期：** ________

---

## 1. 需求分析

### 1.1 项目任务
- 通过 Web 前端将 11 种排序算法可视化展示，支持动态播放、单步调试、实时统计与基准测试。
- 允许学生生成指定规模的随机数组，观察不同算法在同一数据集上的表现。
- 支持下载排序过程日志，用于实验报告及复盘。

### 1.2 输入形式与范围
- 输入数据：长度 10~1500 的整数数组，每个元素范围 5~500（`constants.ts` 中定义常量限制）。
- 控制参数：算法类型（冒泡/选择/插入/折半插入/希尔/计数/基数/快速递归/快速迭代/归并/堆）、动画速度（1~200，对应 50~1ms 延迟）、生成新数组、单步执行、播放/暂停、重置。
- 错误输入会被界面控件实时钳制；例如规模输入值 <10 自动回调到 10。

### 1.3 输出形式
- 主柱状图可视化：柱高对应元素值，颜色区分比较、交换、已排序、特殊状态。
- 概念视图：按算法渲染桶结构、堆树、Shell 分组、快速/归并范围等辅助图形。
- 状态日志：文本描述当前操作及指针位置。
- 实时统计：比较次数、交换次数、耗时。
- 基准测试图：对 2000 规模数据运行所有算法，输出时间条形图。
- JSON 报告：包含初始数组、算法名称、采样步骤、最终统计。

### 1.4 功能要求
1. 生成新数组、调整规模和速度。
2. 选择任意算法并播放动画，可随时暂停、单步或重置。
3. 运行综合性能测试，比较不同算法的时间/比较/交换指标。
4. 下载排序日志文件，供附录或复现实验使用。

### 1.5 测试数据
| 用例 | 输入数组 | 期望输出 |
| --- | --- | --- |
| 随机 10 个元素 | `[42,11,85,7,29,63,18,50,3,71]` | `[3,7,11,18,29,42,50,63,71,85]` |
| 已排序 10 个元素 | `[2,5,9,14,28,37,45,52,60,90]` | `[2,5,9,14,28,37,45,52,60,90]` |
| 逆序 12 个元素（含重复） | `[99,90,75,61,55,50,33,27,20,20,5,1]` | `[1,5,20,20,27,33,50,55,61,75,90,99]` |
| 非法规模输入 | 在规模输入框填入 `5` | 控件自动纠正为 `10` 并重置数组 |
| 非法速度输入 | 在速度输入框填入 `250` | 控件自动纠正为 `200` |


## 2. 概要设计

### 2.1 体系结构
```
App.tsx
 ├─ ControlPanel（算法/规模/速度设置 + 播放控制）
 ├─ SortVisualizer（柱状图 + 高亮）
 ├─ ConceptVisualizer（桶、堆、Shell、范围等辅助图）
 ├─ StatsBoard（实时统计 + 基准条形图）
 └─ services/sortingAlgorithms.ts
       ├─ AlgorithmGenerators（动画步骤生成）
       └─ pure algorithms + runBenchmark（性能采集）
```

### 2.2 数据类型
- `AlgorithmType`：枚举 11 种算法名称。
- `SortStep`：记录动画帧数组、比较索引、交换索引、已排序索引、文本描述及 `aux` 辅助数据（范围、枢纽、桶、指针、堆界、希尔 gap 等）。
- `SortStats`：记录算法、时间、比较次数、交换次数、数组规模。

### 2.3 主程序流程
1. 页面加载后根据 `arraySize` 生成随机数组，并调用 `resetSorter` 初始化状态。
2. 用户选择算法及控制参数，通过控制面板回调触发播放、暂停、单步或重置。
3. 播放时 `timerRef` 定时调用 `runSortingStep` 执行生成器，更新 `currentStep` 与统计数据。
4. 可随时触发 `runBenchmarks` 在大数据集上运行纯算法并更新基准图。
5. 完成后可调用 `downloadLog` 导出 JSON。

## 3. 详细设计

### 3.1 关键函数
- `generateArray(size)`：生成指定规模的随机数组，并调用 `resetSorter` 同步刷新。
- `resetSorter(arr)`：重置播放状态、计时器、步骤日志、统计信息，并将当前步骤设为“准备排序”。
- `AlgorithmGenerators[algorithm](array)`：返回对应排序算法的生成器，内部通过 `createStep` 逐步产生日志。
- `runSortingStep()`：从生成器取下一步，更新 `currentStep`、统计次数、步骤日志；若完成则终止计时器并标记 `isFinished`。
- `runBenchmark(type,array)`：调用纯算法版本统计时间、比较和交换，用于性能对比。
- `downloadLog()`：抽样步骤日志（每 10 步 + 最终帧），导出 JSON 文件。

### 3.2 算法伪代码示例
**冒泡排序 (Bubble Sort)**
```
for i = 0 .. n-1:
  for j = 0 .. n-i-2:
    emit(array, comparing=[j,j+1])
    if array[j] > array[j+1]:
      swap(array[j], array[j+1])
      emit(array, swapping=[j,j+1])
  mark index n-i-1 as sorted
```

**快速排序 (Hoare Partition)**
```
partition(low,high):
  pivot = array[low]
  i = low + 1; j = high
  while true:
    while i<=j and array[i] <= pivot: i++
    while i<=j and array[j] > pivot: j--
    if i < j: swap(array[i], array[j]); emit step
    else break
  swap(array[low], array[j]); return j
```

**计数排序**
```
max = max(array); counts = [0]*(max+1)
for each value v: counts[v]++
z = 0
for v from 0..max:
  while counts[v] > 0:
    array[z] = v; counts[v]--; z++
```

### 3.3 组件交互
- ControlPanel → App：通过 props 回调控制播放、暂停、单步、重置、生成与算法/参数设置。
- App → SortVisualizer/ConceptVisualizer：将 `currentStep` 与 `algorithm` 传入，驱动不同渲染逻辑。
- App → StatsBoard：提供实时统计和基准测试结果。
- ConceptVisualizer 内部根据 `step.aux` 自动定位目标元素，提供跟踪/全局视图切换。

### 3.4 辅助数据结构
- `stepsLogRef`: `SortStep[]`，用于日志导出。
- `timerRef`: `number | null`，用于管理 `setInterval`。
- `generatorRef`: `Generator<SortStep> | null`，确保生成器不会重复构造。

## 4. 调试分析

1. **单步与播放切换冲突**：最初“单步”会重新实例化生成器导致步骤跳跃，已通过 `generatorRef` 判断只在首次调用时创建。
2. **多计时器叠加**：频繁播放/暂停后存在僵尸计时器，现统一由 `timerRef` 管理并在暂停/卸载时清理。
3. **统计口径不一致**：不同算法使用自定义字段统计数值导致偏差，现由 `runSortingStep` 根据 `comparing/swapping` 是否为空统一累计。
4. **性能瓶颈**：基准测试曾在 UI 线程直接运行，建议未来将 `runBenchmarks` 搬至 Web Worker，避免阻塞动画。
5. **复杂度总结**：
   - 冒泡/选择/插入/折半插入：时间 `O(n²)`，空间 `O(1)`。
   - 希尔：平均 `O(n log n)`，空间 `O(1)`。
   - 计数：`O(n + k)`，空间 `O(n + k)`。
   - 基数：`O(nk)`，空间 `O(n + k)`。
   - 快速：平均 `O(n log n)`，空间 `O(log n)`（递归栈）。
   - 归并：`O(n log n)`，空间 `O(n)`。
   - 堆排序：`O(n log n)`，空间 `O(1)`。

## 5. 用户使用说明

1. **运行环境**：安装 Node.js，克隆仓库后执行 `npm install`，若需接入 Gemini API，可在 `.env.local` 中设置 `GEMINI_API_KEY`。启动命令 `npm run dev`。
2. **生成/设置数据**：使用“数量”输入框或滑块设置数组长度（10~1500），点击“生成新数组”刷新；速度同理设置 1~200 的动画级别。
3. **选择算法并播放**：在下拉框选择算法，点击“开始”播放。可随时点击“暂停”“单步”“重置”。排序过程中“算法选择”会锁定防止错误切换。
4. **查看统计与概念**：主区域显示柱状图和概念视图（例如桶状态、堆树、Shell 分组），左侧状态日志实时描述当前操作。
5. **运行基准测试**：点击“运行综合性能测试 (N=2000)”会在 2000 条随机数据上对比所有算法的时间/比较/交换指标。
6. **下载报告**：排序完成后点击“下载报告”生成 JSON 文件，包含初始数组、算法名称、采样的排序步骤及最终统计，便于附录或复盘。

## 6. 测试结果

使用 Node.js 脚本对典型数据集进行了交叉验证（Bubble / Quick / Counting 三种算法输出一致）：

```json
[
  {
    "name": "随机10",
    "output": [3,7,11,18,29,42,50,63,71,85]
  },
  {
    "name": "已排序10",
    "output": [2,5,9,14,28,37,45,52,60,90]
  },
  {
    "name": "逆序12(含重复)",
    "output": [1,5,20,20,27,33,50,55,61,75,90,99]
  }
]
```

界面输入验证：
- 规模输入 5 → 自动更正为 10 并重新生成数组。
- 速度输入 250 → 自动更正为 200。
- 多次开始/暂停 → 不再出现重复计时器或动画冲突。

## 7. 附录（源程序清单）

- `App.tsx`
- `components/ControlPanel.tsx`
- `components/SortVisualizer.tsx`
- `components/ConceptVisualizer.tsx`
- `components/StatsBoard.tsx`
- `services/sortingAlgorithms.ts`
- `constants.ts`
- `types.ts`
- `README.md`

> 若需提交源程序光盘，可直接复制上述文件至介质中；本报告附带的 JSON 日志可从界面“下载报告”按钮获得。

