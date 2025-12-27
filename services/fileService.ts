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

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadSample = (format: 'json' | 'csv' | 'txt') => {
  const sample = [10, 45, 23, 89, 4, 12, 77, 33];
  downloadFile(sample, format, 'sample_array');
};