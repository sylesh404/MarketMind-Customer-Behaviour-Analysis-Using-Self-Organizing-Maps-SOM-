import React, { useState } from 'react';
import { Upload, Trash2, ArrowRight } from 'lucide-react';
import type { DatasetInfo } from '../types';

interface DatasetPageProps {
  dataset: DatasetInfo | null;
  onFileUpload: (file: File) => void;
  onLoadDemo: () => void;
  onNavigateNext: () => void;
  isUploading: boolean;
}

export const DatasetPage: React.FC<DatasetPageProps> = ({
  dataset,
  onFileUpload,
  onLoadDemo,
  onNavigateNext,
  isUploading
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [ignoredCols, setIgnoredCols] = useState<string[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const toggleIgnoreCol = (colName: string) => {
    if (ignoredCols.includes(colName)) {
      setIgnoredCols(ignoredCols.filter(c => c !== colName));
    } else {
      setIgnoredCols([...ignoredCols, colName]);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Upload Dropzone Header */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Dataset Upload & Preview</h2>
            <p className="text-xs text-zinc-400">Upload customer CSV or Excel file to analyze purchasing and behavioral patterns</p>
          </div>
          <button
            onClick={onLoadDemo}
            className="px-4 py-2 rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 font-semibold text-xs transition"
          >
            Load Sample Dataset (1,000 Rows)
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 ${
            dragOver
              ? 'border-red-500 bg-red-600/10 scale-[1.01]'
              : 'border-zinc-800 bg-neutral-950/60 hover:border-red-900/60'
          }`}
        >
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                {isUploading ? 'Uploading & Validating Dataset...' : 'Click or Drag & Drop CSV / Excel File'}
              </p>
              <p className="text-xs text-zinc-500">Supports .CSV, .XLSX datasets up to 50MB</p>
            </div>
          </label>
        </div>
      </div>

      {/* Dataset Summary & Table Preview */}
      {dataset && (
        <div className="space-y-6">
          {/* File Name Banner */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-zinc-400 font-sans">Active File:</span>
              <span className="font-mono font-bold text-red-400">{dataset.filename}</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Validated & Stored in SQLite
            </span>
          </div>

          {/* Summary Cards with All 8 Dimensions */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="glass-panel p-3.5 rounded-xl text-center border-red-950/40">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Rows</span>
              <p className="text-lg font-bold text-white font-mono">{dataset.row_count.toLocaleString()}</p>
            </div>

            <div className="glass-panel p-3.5 rounded-xl text-center border-red-950/40">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Columns</span>
              <p className="text-lg font-bold text-red-400 font-mono">{dataset.column_count}</p>
            </div>

            <div className="glass-panel p-3.5 rounded-xl text-center border-red-950/40">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Missing Values</span>
              <p className="text-lg font-bold text-rose-400 font-mono">
                {dataset.validation.total_missing} ({dataset.validation.missing_percentage}%)
              </p>
            </div>

            <div className="glass-panel p-3.5 rounded-xl text-center border-red-950/40">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Duplicate Rows</span>
              <p className="text-lg font-bold text-red-500 font-mono">{dataset.validation.duplicate_rows}</p>
            </div>

            <div className="glass-panel p-3.5 rounded-xl text-center border-red-950/40">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Numeric Columns</span>
              <p className="text-lg font-bold text-zinc-200 font-mono">{dataset.validation.numeric_columns.length}</p>
            </div>

            <div className="glass-panel p-3.5 rounded-xl text-center border-red-950/40">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Categorical</span>
              <p className="text-lg font-bold text-zinc-300 font-mono">{dataset.validation.categorical_columns.length}</p>
            </div>

            <div className="glass-panel p-3.5 rounded-xl text-center border-red-950/40">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Constant Columns</span>
              <p className="text-lg font-bold text-zinc-400 font-mono">{dataset.validation.constant_columns?.length || 0}</p>
            </div>
          </div>

          {/* Table Preview */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Dataset Preview (First 100 Records)</h3>
              <button
                onClick={onNavigateNext}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center space-x-2 transition"
              >
                <span>Proceed to Data Preprocessing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-zinc-400 uppercase font-mono border-b border-zinc-800">
                  <tr>
                    {dataset.columns.map((col) => {
                      const isIgnored = ignoredCols.includes(col);
                      const isNumeric = dataset.validation.numeric_columns.includes(col);
                      return (
                        <th key={col} className={`p-3 whitespace-nowrap ${isIgnored ? 'opacity-40' : ''}`}>
                          <div className="flex items-center space-x-1.5">
                            <span>{col}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isNumeric ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-zinc-800 text-zinc-400'}`}>
                              {isNumeric ? 'num' : 'str'}
                            </span>
                            <button
                              onClick={() => toggleIgnoreCol(col)}
                              title={isIgnored ? 'Include column' : 'Ignore column'}
                              className="text-zinc-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-mono">
                  {dataset.preview.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-950/80 transition">
                      {dataset.columns.map((col) => (
                        <td
                          key={col}
                          className={`p-3 whitespace-nowrap text-zinc-300 ${
                            ignoredCols.includes(col) ? 'opacity-30 line-through' : ''
                          }`}
                        >
                          {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
