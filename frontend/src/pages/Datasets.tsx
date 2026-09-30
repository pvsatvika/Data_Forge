import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';
import { Dataset } from '../types';
import { formatBytes } from '../utils/formatters';

export const Datasets: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDataset, setUploadedDataset] = useState<Dataset | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'csv' && ext !== 'xlsx') {
        setError('Unsupported file type. Please select a .csv or .xlsx file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setUploadedDataset(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'csv' && ext !== 'xlsx') {
        setError('Unsupported file type. Please select a .csv or .xlsx file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setUploadedDataset(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const dataset = await apiService.uploadDataset(selectedFile);
      setUploadedDataset(dataset);
      setUploading(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to upload dataset.';
      setError(msg);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Dataset Ingestion</h2>
        <p className="text-xs text-slate-400">Upload CSV or XLSX enterprise datasets for automated profiling & cleaning.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploadedDataset ? (
        <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg text-white">Dataset Successfully Uploaded</h3>
              <p className="text-xs text-emerald-400 font-mono">Dataset ID: {uploadedDataset.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/60 rounded-lg text-xs border border-slate-700/50">
            <div>
              <span className="text-slate-400 block">Filename</span>
              <span className="font-medium text-white truncate block">{uploadedDataset.original_filename}</span>
            </div>
            <div>
              <span className="text-slate-400 block">File Size</span>
              <span className="font-medium text-white">{formatBytes(uploadedDataset.file_size)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Format</span>
              <span className="font-medium text-sky-400 uppercase">{uploadedDataset.file_type}</span>
            </div>
            <div>
              <span className="text-slate-400 block">SHA-256 Hash</span>
              <span className="font-mono text-[10px] text-slate-300 truncate block">{uploadedDataset.sha256}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setUploadedDataset(null);
                setSelectedFile(null);
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              Upload Another File
            </button>

            <button
              onClick={() => navigate(`/profile?id=${uploadedDataset.id}`)}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
            >
              View Dataset Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 bg-slate-800/30 rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, .xlsx"
            className="hidden"
          />

          <div className="p-4 bg-sky-500/10 text-sky-400 rounded-full mb-4">
            <Upload className="w-8 h-8" />
          </div>

          {selectedFile ? (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-white font-medium text-sm bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>{selectedFile.name}</span>
                <span className="text-xs text-slate-400">({formatBytes(selectedFile.size)})</span>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-white mb-1">Select Enterprise Dataset</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Drag and drop your CSV or XLSX file here, or click to browse. Max file size: 25MB.
              </p>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              {selectedFile ? 'Change File' : 'Browse Files'}
            </button>

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Process</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
