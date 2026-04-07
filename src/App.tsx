import React, { useState } from 'react';
import { FileUp, FileDown, SplitSquareHorizontal, Type, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from './lib/utils';

type Tab = 'merge' | 'split' | 'annotate';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('merge');
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileDown className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">PDF Studio</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <TabButton 
              active={activeTab === 'merge'} 
              onClick={() => setActiveTab('merge')}
              icon={<FileUp className="w-4 h-4" />}
              label="Merge PDFs"
            />
            <TabButton 
              active={activeTab === 'split'} 
              onClick={() => setActiveTab('split')}
              icon={<SplitSquareHorizontal className="w-4 h-4" />}
              label="Split PDF"
            />
            <TabButton 
              active={activeTab === 'annotate'} 
              onClick={() => setActiveTab('annotate')}
              icon={<Type className="w-4 h-4" />}
              label="Annotate"
            />
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'merge' && <MergeTab />}
            {activeTab === 'split' && <SplitTab />}
            {activeTab === 'annotate' && <AnnotateTab />}
          </div>
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors",
        active 
          ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" 
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MergeTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least two PDF files to merge.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('/api/pdf/merge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to merge PDFs');
      }

      const blob = await response.blob();
      downloadBlob(blob, 'merged.pdf');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-lg mx-auto">
        <h2 className="text-lg font-medium text-gray-900">Merge Multiple PDFs</h2>
        <p className="text-sm text-gray-500 mt-1">Combine multiple PDF files into a single document.</p>
      </div>

      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
        <input 
          type="file" 
          multiple 
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Click or drag PDFs here</p>
            <p className="text-xs text-gray-500 mt-1">Supports multiple files</p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Selected Files ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={handleMerge}
          disabled={files.length < 2 || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Merge PDFs
        </button>
      </div>
    </div>
  );
}

function SplitTab() {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSplit = async () => {
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ranges', ranges);

    try {
      const response = await fetch('/api/pdf/split', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to split PDF');
      }

      const blob = await response.blob();
      downloadBlob(blob, 'split.pdf');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-lg mx-auto">
        <h2 className="text-lg font-medium text-gray-900">Split PDF</h2>
        <p className="text-sm text-gray-500 mt-1">Extract specific pages from a PDF document.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Select File</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <FileUp className="w-6 h-6 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">
                {file ? file.name : 'Click to select PDF'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Page Ranges</label>
          <input
            type="text"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="e.g., 1-3, 5, 8-10"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <p className="text-xs text-gray-500">
            Leave blank to extract all pages. Use commas to separate ranges.
          </p>
        </div>
      </div>

      {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={handleSplit}
          disabled={!file || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SplitSquareHorizontal className="w-4 h-4" />}
          Extract Pages
        </button>
      </div>
    </div>
  );
}

function AnnotateTab() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [page, setPage] = useState('1');
  const [x, setX] = useState('50');
  const [y, setY] = useState('50');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnnotate = async () => {
    if (!file || !text) {
      setError('Please select a file and enter text.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('text', text);
    formData.append('page', page);
    formData.append('x', x);
    formData.append('y', y);

    try {
      const response = await fetch('/api/pdf/annotate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to annotate PDF');
      }

      const blob = await response.blob();
      downloadBlob(blob, 'annotated.pdf');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-lg mx-auto">
        <h2 className="text-lg font-medium text-gray-900">Annotate PDF</h2>
        <p className="text-sm text-gray-500 mt-1">Add text annotations to a specific page.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Select File</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <FileUp className="w-6 h-6 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">
                {file ? file.name : 'Click to select PDF'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annotation Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to add..."
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Page</label>
              <input
                type="number"
                min="1"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">X Pos</label>
              <input
                type="number"
                value={x}
                onChange={(e) => setX(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Y Pos</label>
              <input
                type="number"
                value={y}
                onChange={(e) => setY(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={handleAnnotate}
          disabled={!file || !text || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Type className="w-4 h-4" />}
          Add Annotation
        </button>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
