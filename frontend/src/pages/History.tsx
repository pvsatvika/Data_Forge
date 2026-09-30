import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { WorkflowStepper } from '../components/WorkflowStepper';
import {
  History,
  AlertCircle,
  Loader2,
  Database,
  Search,
  Download,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { apiService } from '../services/api';
import { DatasetHistoryResponse, VersionItem } from '../types';
import { formatNumber } from '../utils/formatters';

export const HistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetIdFromUrl = searchParams.get('id') || '';

  const [inputDatasetId, setInputDatasetId] = useState<string>(datasetIdFromUrl);
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasetIdFromUrl);

  const [history, setHistory] = useState<DatasetHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<VersionItem | null>(null);
  const [rollingBack, setRollingBack] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchHistory = () => {
    if (!activeDatasetId) return;

    setLoading(true);
    setError(null);

    apiService
      .getHistory(activeDatasetId)
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to load dataset version history.';
        setError(msg);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, [activeDatasetId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputDatasetId.trim()) {
      setActiveDatasetId(inputDatasetId.trim());
      setSearchParams({ id: inputDatasetId.trim() });
    }
  };

  const handleConfirmRollback = async () => {
    if (!rollbackTarget || !activeDatasetId) return;

    setRollingBack(true);
    setError(null);
    setStatusMessage(null);

    try {
      const res = await apiService.rollbackDataset(
        activeDatasetId,
        rollbackTarget.version_number,
        `User requested rollback to Version ${rollbackTarget.version_number}`
      );
      setRollingBack(false);
      setRollbackTarget(null);
      setStatusMessage(res.message);
      fetchHistory(); // Refresh version list
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to execute version rollback.';
      setError(msg);
      setRollingBack(false);
    }
  };

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="rollback" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            Immutable Version History & Reversibility Engine
          </h2>
          <p className="text-xs text-slate-400">Revert active dataset state to any historical version with complete audit integrity.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter Dataset ID (e.g. ds_...)"
              value={inputDatasetId}
              onChange={(e) => setInputDatasetId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 pl-8 rounded-lg w-64 focus:outline-none focus:border-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Load History
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {loading && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold text-white text-sm">Loading Version History...</h3>
          <p className="text-xs text-slate-400 mt-1">Fetching Parquet dataset versions and audit records.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-200 mb-1">No Dataset Selected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Select a dataset to view immutable Parquet version history, download clean files, or perform safe rollbacks.
          </p>
          <Link
            to="/datasets"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Database className="w-4 h-4" />
            Go to Upload Datasets
          </Link>
        </div>
      )}

      {!loading && history && (
        <div className="space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400 font-mono">Dataset ID: {history.dataset_id}</span>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-mono font-bold">
                  ACTIVE: Version {history.current_version}
                </span>
              </div>
              <h3 className="font-bold text-white text-base">Dataset Version Chain ({history.versions.length} versions)</h3>
            </div>
            <a
              href={apiService.getDownloadUrl(history.dataset_id)}
              download
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-colors shadow-lg shadow-sky-600/20"
            >
              <Download className="w-4 h-4" />
              Download Current Active Version
            </a>
          </div>

          {/* Versions Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                Immutable Parquet Version Log
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Active State</th>
                    <th className="py-3 px-4">Created Timestamp</th>
                    <th className="py-3 px-4">Rows / Cols</th>
                    <th className="py-3 px-4">SHA-256 Hash</th>
                    <th className="py-3 px-4">Pipeline Origin</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 font-mono">
                  {history.versions.map((ver: VersionItem) => (
                    <tr
                      key={ver.version_id}
                      className={`hover:bg-slate-700/20 transition-colors ${
                        ver.is_active ? 'bg-sky-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-white">
                        {ver.version_number === 0 ? (
                          <span className="text-amber-400">Version 0 (Original)</span>
                        ) : (
                          <span>Version {ver.version_number}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ver.is_active ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> CURRENT ACTIVE
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Historical</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(ver.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {formatNumber(ver.row_count)} rows / {ver.column_count} cols
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[10px] truncate max-w-[140px]">
                        {ver.sha256}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {ver.pipeline_id || 'ingestion'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={apiService.getDownloadUrl(history.dataset_id, ver.version_number)}
                            download
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium rounded flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>

                          {!ver.is_active && (
                            <button
                              onClick={() => setRollbackTarget(ver)}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Rollback
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw className="w-6 h-6" />
              <h3 className="font-bold text-lg text-white">Confirm Version Rollback</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to change the active dataset version to{' '}
              <strong className="text-amber-400 font-mono">
                Version {rollbackTarget.version_number}
              </strong>
              ?
            </p>

            <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-[11px] text-slate-400 leading-relaxed space-y-1">
              <span className="font-bold text-slate-200 block">Safety Guarantee:</span>
              <p>
                Rollback changes the active dataset version. Historical versions are preserved immutably and will NOT be deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRollbackTarget(null)}
                disabled={rollingBack}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRollback}
                disabled={rollingBack}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                {rollingBack ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rolling Back...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Confirm Rollback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
