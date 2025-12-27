export interface ExportStep {
  stepIndex: number;
  description: string;
  array: number[];
}

export const parseImportFile = async (file: File): Promise<number[]> => {
  const text = await file.text();
  const extension = file.name.split('.').pop()?.toLowerCase();

  let numbers: number[] = [];

  if (extension === 'json') {
    try {
      const data = JSON.parse(text);
      numbers = Array.isArray(data) ? data : [];
    } catch (e) {
      throw new Error('Invalid JSON format');
    }
  } else if (extension === 'csv') {
    numbers = text.split(/[,\n\r]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  } else {
    // txt: space or newline separated
    numbers = text.split(/\s+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }

  return numbers;
};

// Deprecated: kept for single array export if needed, but UI now uses history export
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
    // JSON: 导出完整的对象数组
    content = JSON.stringify(history, null, 2);
    mimeType = 'application/json';
  } else if (format === 'csv') {
    // CSV Header
    const maxLen = history.length > 0 ? history[0].array.length : 0;
    const valueHeaders = Array.from({length: maxLen}, (_, i) => `Val_${i}`).join(',');
    content = `Step,Description,${valueHeaders}\n`;

    // CSV Rows
    content += history.map(h => {
        // Escape quotes in description
        const safeDesc = `"${h.description.replace(/"/g, '""')}"`;
        return `${h.stepIndex},${safeDesc},${h.array.join(',')}`;
    }).join('\n');
    
    mimeType = 'text/csv';
  } else {
    // TXT: Human readable format
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