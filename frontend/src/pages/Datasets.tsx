import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, ArrowRight, Sparkles, Database, Eye, RefreshCw } from 'lucide-react';
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

  const [datasetsList, setDatasetsList] = useState<Dataset[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);

  const fetchDatasets = async () => {
    setLoadingList(true);
    try {
      const data = await apiService.listDatasets();
      setDatasetsList(data);
    } catch (err) {
      console.error('Failed to list datasets:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

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
      fetchDatasets();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to upload dataset.';
      setError(msg);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#3A3A38]/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] font-bold text-[#1A3C2B] uppercase tracking-widest mb-1">
            DATA INGESTION ENGINE
          </div>
          <h2 className="font-grotesk font-bold text-2xl text-[#181816] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#1A3C2B]" />
            Enterprise Dataset Ingestion
          </h2>
          <p className="text-xs text-[#5A5A55] mt-1 font-sans">
            Upload raw CSV or XLSX enterprise datasets. Calculates immutable SHA-256 hashes and stores original files safely under raw storage.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FF8C69]/10 border border-[#FF8C69]/40 text-[#E06B48] font-mono text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploadedDataset ? (
        <div className="bg-white border border-[#1A3C2B] p-6 space-y-4">
          <div className="flex items-center gap-3 text-[#1A3C2B]">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h3 className="font-grotesk font-bold text-lg text-[#181816]">Dataset Ingested Successfully</h3>
              <p className="font-mono text-xs text-[#1A3C2B] font-bold">DATASET ID: {uploadedDataset.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#F7F7F5] border border-[#3A3A38]/20 font-mono text-xs">
            <div>
              <span className="text-[#5A5A55] block text-[10px] uppercase font-bold">FILENAME</span>
              <span className="font-bold text-[#181816] truncate block">{uploadedDataset.original_filename}</span>
            </div>
            <div>
              <span className="text-[#5A5A55] block text-[10px] uppercase font-bold">FILE SIZE</span>
              <span className="font-bold text-[#181816]">{formatBytes(uploadedDataset.file_size)}</span>
            </div>
            <div>
              <span className="text-[#5A5A55] block text-[10px] uppercase font-bold">FORMAT</span>
              <span className="font-bold text-[#1A3C2B] uppercase">{uploadedDataset.file_type}</span>
            </div>
            <div>
              <span className="text-[#5A5A55] block text-[10px] uppercase font-bold">SHA-256 HASH</span>
              <span className="font-mono text-[10px] text-[#5A5A55] truncate block">{uploadedDataset.sha256}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#3A3A38]/10">
            <button
              onClick={() => {
                setUploadedDataset(null);
                setSelectedFile(null);
              }}
              className="px-4 py-2 bg-[#F7F7F5] hover:bg-[#EFEFEA] text-[#181816] font-mono text-xs font-bold uppercase border border-[#3A3A38]/20 transition-colors"
            >
              Upload Another File
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/profile?id=${uploadedDataset.id}`)}
                className="px-4 py-2 bg-white hover:bg-[#F7F7F5] text-[#181816] font-mono text-xs font-bold uppercase border border-[#3A3A38]/30 flex items-center gap-2 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-[#1A3C2B]" />
                View Profile
              </button>
              <button
                onClick={() => navigate(`/analysis?id=${uploadedDataset.id}`)}
                className="px-5 py-2 bg-[#1A3C2B] hover:bg-[#122C1F] text-white font-mono text-xs font-bold uppercase flex items-center gap-2 transition-all border border-[#1A3C2B]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Analyze with AI
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[#3A3A38]/30 hover:border-[#1A3C2B] bg-white p-10 flex flex-col items-center justify-center text-center transition-colors select-none"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, .xlsx"
            className="hidden"
          />

          <div className="p-3 bg-[#F7F7F5] text-[#1A3C2B] border border-[#3A3A38]/20 mb-4">
            <Upload className="w-6 h-6" />
          </div>

          {selectedFile ? (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#181816] bg-[#F7F7F5] border border-[#3A3A38]/20 px-4 py-2">
                <FileText className="w-4 h-4 text-[#1A3C2B]" />
                <span>{selectedFile.name}</span>
                <span className="text-[#5A5A55] font-normal">({formatBytes(selectedFile.size)})</span>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-grotesk font-bold text-[#181816] text-base mb-1">Select Enterprise Dataset</h3>
              <p className="font-sans text-xs text-[#5A5A55] max-w-sm mb-4">
                Drag and drop your CSV or XLSX file here, or browse from disk. Maximum file size: 25MB.
              </p>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-[#F7F7F5] hover:bg-[#EFEFEA] text-[#181816] font-mono text-xs font-bold uppercase border border-[#3A3A38]/20 transition-colors disabled:opacity-50"
            >
              {selectedFile ? 'Change File' : 'Browse Files'}
            </button>

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2 bg-[#1A3C2B] hover:bg-[#122C1F] text-white font-mono text-xs font-bold uppercase flex items-center gap-2 transition-colors disabled:opacity-50 border border-[#1A3C2B]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Process</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Previously Uploaded Enterprise Datasets Table */}
      <div className="bg-white border border-[#3A3A38]/20 overflow-hidden space-y-0">
        <div className="p-4 bg-[#F7F7F5] border-b border-[#3A3A38]/20 flex justify-between items-center">
          <h3 className="font-grotesk font-bold text-[#181816] text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-[#1A3C2B]" />
            Uploaded Enterprise Datasets ({datasetsList.length})
          </h3>
          <button
            onClick={fetchDatasets}
            className="px-3 py-1 bg-white hover:bg-[#EFEFEA] text-[#5A5A55] border border-[#3A3A38]/20 font-mono text-xs flex items-center gap-1.5 transition-colors"
            title="Refresh dataset list"
          >
            <RefreshCw className={`w-3 h-3 ${loadingList ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingList ? (
          <div className="p-8 text-center text-[#5A5A55] font-mono text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1A3C2B]" />
            <span>Querying dataset registry...</span>
          </div>
        ) : datasetsList.length === 0 ? (
          <div className="p-8 text-center text-[#5A5A55] font-mono text-xs">
            No datasets uploaded yet. Ingest a dataset above to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-[#181816]">
              <thead className="bg-[#F7F7F5] text-[#5A5A55] uppercase font-bold text-[10px] tracking-wider border-b border-[#3A3A38]/20">
                <tr>
                  <th className="py-2.5 px-4">Dataset ID</th>
                  <th className="py-2.5 px-4">Filename</th>
                  <th className="py-2.5 px-4">Size</th>
                  <th className="py-2.5 px-4">Format</th>
                  <th className="py-2.5 px-4">Upload Timestamp</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A3A38]/10">
                {datasetsList.map((ds) => (
                  <tr key={ds.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#1A3C2B]">{ds.id}</td>
                    <td className="py-2.5 px-4 font-sans font-medium text-[#181816] max-w-xs truncate">{ds.original_filename}</td>
                    <td className="py-2.5 px-4 text-[#5A5A55]">{formatBytes(ds.file_size)}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 bg-[#F7F7F5] text-[#1A3C2B] border border-[#3A3A38]/20 font-bold text-[10px] uppercase">
                        {ds.file_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#5A5A55] text-[11px]">
                      {new Date(ds.upload_timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/profile?id=${ds.id}`}
                          className="px-2.5 py-1 bg-white hover:bg-[#F7F7F5] text-[#181816] font-mono font-bold border border-[#3A3A38]/20 text-[11px] uppercase inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-[#1A3C2B]" />
                          Profile
                        </Link>
                        <Link
                          to={`/analysis?id=${ds.id}`}
                          className="px-3 py-1 bg-[#1A3C2B] hover:bg-[#122C1F] text-white font-mono font-bold text-[11px] uppercase inline-flex items-center gap-1 transition-all border border-[#1A3C2B]"
                        >
                          <Sparkles className="w-3 h-3" />
                          AI Analysis
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
