export interface ExportStep {
  stepIndex: number;
  description: string;
  array: number[];
}

export const parseImportFile = async (file: File): Promise<number[]> => {
  // 1. 最优先检查：文件大小
  if (file.size === 0) {
    throw new Error('文件为空 (0 KB)，请检查文件内容。');
  }

  let text = '';
  try {
    text = await file.text();
  } catch (readError) {
    throw new Error('无法读取文件内容，可能是文件权限问题或文件损坏。');
  }
  
  // 2. 二次检查：内容是否全为空白
  if (!text || text.trim().length === 0) {
    throw new Error('文件内容为空白，未包含任何数据。');
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  let numbers: number[] = [];

  if (extension === 'json') {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error('JSON 格式不符合要求：根节点必须是一个数组 (例如 [10, 20, 30])');
      }
      // 过滤出有效的数字
      numbers = data.filter((n: any) => typeof n === 'number' && !isNaN(n));
      
      if (numbers.length === 0 && data.length > 0) {
         throw new Error('JSON 数组中未找到有效的数值数据。');
      }
    } catch (e: any) {
      // 捕获所有 JSON 解析错误并重新包装，确保界面层能接收到清晰的消息
      if (e instanceof SyntaxError) {
         throw new Error(`非法 JSON 文件: 语法解析错误 (${e.message})`);
      }
      // 传递手动抛出的业务错误
      throw e; 
    }
  } else if (extension === 'csv') {
    // 处理 CSV：逗号或换行分隔
    numbers = text.split(/[,\n\r]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0) // 移除空字符串
      .map(s => Number(s))
      .filter(n => !isNaN(n));
  } else {
    // 处理 TXT：按空白分隔（空格、制表符、换行）
    numbers = text.split(/\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => Number(s))
      .filter(n => !isNaN(n));
  }

  return numbers;
};

// 已弃用：保留用于单数组导出，但现在使用历史导出
export const downloadFile = (data: number[], format: 'json' | 'csv' | 'txt', filename: string) => {
  let content = '';
  let mimeType = '';

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  } else if (format === 'csv') {
    content = data.join(',');
    mimeType = 'text/csv';
  } else {
    content = data.join('\n');
    mimeType = 'text/plain';
  }

  triggerDownload(content, mimeType, filename, format);
};

export const downloadSortingHistory = (history: ExportStep[], format: 'json' | 'csv' | 'txt', filename: string) => {
  let content = '';
  let mimeType = '';

  if (format === 'json') {
    // JSON：导出完整对象数组
    content = JSON.stringify(history, null, 2);
    mimeType = 'application/json';
  } else if (format === 'csv') {
    // CSV 表头
    const maxLen = history.length > 0 ? history[0].array.length : 0;
    const valueHeaders = Array.from({length: maxLen}, (_, i) => `Val_${i}`).join(',');
    content = `Step,Description,${valueHeaders}\n`;

    // CSV 行
    content += history.map(h => {
        // 转义描述中的引号
        const safeDesc = `"${h.description.replace(/"/g, '""')}"`;
        return `${h.stepIndex},${safeDesc},${h.array.join(',')}`;
    }).join('\n');
    
    mimeType = 'text/csv';
  } else {
    // TXT：可读文本格式
    content = history.map(h => {
        return `[Step ${h.stepIndex}] ${h.description}\nArray: [${h.array.join(', ')}]\n`;
    }).join('\n----------------------------------------\n');
    mimeType = 'text/plain';
  }

  triggerDownload(content, mimeType, filename, format);
};

export const downloadSample = (format: 'json' | 'csv' | 'txt') => {
  const sample = [10, 45, 23, 89, 4, 12, 77, 33];
  downloadFile(sample, format, 'sample_array');
};

const triggerDownload = (content: string, mimeType: string, filename: string, extension: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
};
