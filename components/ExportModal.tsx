import React, { useState } from 'react';
import { X, Download, FileImage, FileText, Settings2 } from 'lucide-react';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  quality: number; // 0.1 to 1.0
  scale: number; // 1, 2, 4
  transparentBg: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isSvg: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, isSvg }) => {
  const [format, setFormat] = useState<'png' | 'jpg' | 'pdf' | 'svg'>('png');
  const [quality, setQuality] = useState(0.9);
  const [scale, setScale] = useState(2);
  const [transparentBg, setTransparentBg] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Export Visual
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setFormat('png')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${format === 'png' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'}`}
              >
                <FileImage className="w-6 h-6" />
                <span className="text-sm font-bold">PNG</span>
              </button>
              <button 
                onClick={() => setFormat('jpg')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${format === 'jpg' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'}`}
              >
                <FileImage className="w-6 h-6" />
                <span className="text-sm font-bold">JPG</span>
              </button>
              <button 
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${format === 'pdf' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'}`}
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm font-bold">PDF</span>
              </button>
              {isSvg && (
                <button 
                  onClick={() => setFormat('svg')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${format === 'svg' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'}`}
                >
                  <Settings2 className="w-6 h-6" />
                  <span className="text-sm font-bold">SVG Vector</span>
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Options</label>
            
            {format !== 'svg' && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Resolution Scale</span>
                <select 
                  value={scale} 
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
                >
                  <option value={1}>1x (Standard)</option>
                  <option value={2}>2x (Retina)</option>
                  <option value={4}>4x (Print)</option>
                </select>
              </div>
            )}

            {format === 'jpg' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quality</span>
                  <span className="text-sm font-bold text-blue-600">{Math.round(quality * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.1" 
                  value={quality} 
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            )}

            {format === 'png' && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={transparentBg} 
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Transparent Background</span>
              </label>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onExport({ format, quality, scale, transparentBg })}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Now
          </button>
        </div>
      </div>
    </div>
  );
};
