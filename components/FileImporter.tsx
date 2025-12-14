import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface Props {
  onImport: (data: number[]) => void;
}

const FileImporter: React.FC<Props> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Parse integers from text (comma, space, or newline separated)
      const numbers = text
        .split(/[\s,]+/)
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));

      if (numbers.length > 0) {
        onImport(numbers);
      } else {
        alert("文件中未找到有效数字。");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.csv"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
      >
        <Upload className="w-4 h-4" /> 从文件导入
      </button>
    </div>
  );
};

export default FileImporter;