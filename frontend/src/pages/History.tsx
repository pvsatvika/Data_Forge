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

      {/* Header section with technical typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#3A3A38]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest text-[#3A3A38]/60 dark:text-slate-400 uppercase">
              // STEP 06: AUDIT & REVERSIBILITY
            </span>
          </div>
          <h2 className="text-2xl font-grotesk font-bold text-[#1A1A18] dark:text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-[#1A3C2B] dark:text-[#9EFFBF]" />
            Immutable Version History & Reversibility Engine
          </h2>
          <p className="text-xs font-sans text-[#3A3A38]/70 dark:text-slate-400 mt-0.5">
            Revert active dataset state to any historical Parquet version with complete audit trail integrity.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 font-mono">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter Dataset ID (e.g. ds_...)"
              value={inputDatasetId}
              onChange={(e) => setInputDatasetId(e.target.value)}
              className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 text-xs font-mono text-[#1A1A18] dark:text-white px-3 py-2 pl-8 rounded-none w-64 focus:outline-none focus:border-[#1A3C2B] dark:focus:border-[#9EFFBF]"
            />
            <Search className="w-3.5 h-3.5 text-[#3A3A38]/40 dark:text-slate-500 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-[#1A1A18] dark:bg-slate-800 hover:bg-[#3A3A38] text-white font-mono text-xs font-semibold rounded-none transition-colors"
          >
            [ LOAD HISTORY ]
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900 rounded-none flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-sans">{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-none flex items-center gap-3 text-emerald-900 dark:text-emerald-300 text-xs font-mono font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#1A3C2B] dark:text-[#9EFFBF]" />
          <span className="font-sans">{statusMessage}</span>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#1A3C2B] dark:text-[#9EFFBF] animate-spin mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm">Loading Version History...</h3>
          <p className="text-xs font-sans text-[#3A3A38]/60 dark:text-slate-400 mt-1">Fetching Parquet dataset versions and audit records.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-10 text-center">
          <AlertCircle className="w-10 h-10 text-[#3A3A38]/40 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white mb-1">No Dataset Selected</h3>
          <p className="text-xs font-sans text-[#3A3A38]/60 dark:text-slate-400 max-w-md mx-auto mb-4">
            Select a dataset to view immutable Parquet version history, download clean files, or perform safe rollbacks.
          </p>
          <Link
            to="/datasets"
            className="px-4 py-2 bg-[#1A3C2B] hover:bg-[#25523b] text-white font-mono text-xs font-bold rounded-none inline-flex items-center gap-2 transition-colors"
          >
            <Database className="w-4 h-4 text-[#9EFFBF]" />
            [ GO TO UPLOAD DATASETS ]
          </Link>
        </div>
      )}

      {!loading && history && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 font-mono">
                <span className="text-xs text-[#3A3A38]/60 dark:text-slate-400">DATASET ID: {history.dataset_id}</span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-bold uppercase rounded-none">
                  ACTIVE: VERSION {history.current_version}
                </span>
              </div>
              <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-base">
                Dataset Version Chain ({history.versions.length} versions)
              </h3>
            </div>
            <a
              href={apiService.getDownloadUrl(history.dataset_id)}
              download
              className="px-4 py-2 bg-[#1A3C2B] hover:bg-[#25523b] text-white font-mono text-xs font-bold rounded-none flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-[#9EFFBF]" />
              [ DOWNLOAD CURRENT ACTIVE VERSION ]
            </a>
          </div>

          {/* Versions Table */}
          <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none overflow-hidden">
            <div className="p-4 bg-[#F7F7F5] dark:bg-[#1A1A18] border-b border-[#3A3A38]/20 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                <FileSpreadsheet className="w-4 h-4 text-[#1A3C2B] dark:text-[#9EFFBF]" />
                Immutable Parquet Version Log
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1A1A18] dark:text-slate-300 font-mono">
                <thead className="bg-[#F7F7F5] dark:bg-[#121212] text-[#3A3A38]/70 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#3A3A38]/20 dark:border-slate-800">
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
                <tbody className="divide-y divide-[#3A3A38]/10 dark:divide-slate-800/60">
                  {history.versions.map((ver: VersionItem) => (
                    <tr
                      key={ver.version_id}
                      className={`hover:bg-[#F7F7F5] dark:hover:bg-[#1A1A18] transition-colors ${
                        ver.is_active ? 'bg-[#1A3C2B]/5 dark:bg-[#1A3C2B]/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-[#1A1A18] dark:text-white">
                        {ver.version_number === 0 ? (
                          <span className="text-amber-700 dark:text-amber-400">Version 0 (Original)</span>
                        ) : (
                          <span>Version {ver.version_number}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ver.is_active ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-[#1A3C2B] dark:text-[#9EFFBF]" /> CURRENT ACTIVE
                          </span>
                        ) : (
                          <span className="text-[#3A3A38]/50 dark:text-slate-500 text-[11px]">Historical</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#3A3A38]/70 dark:text-slate-400 text-[11px]">
                        {new Date(ver.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[#1A1A18] dark:text-slate-200">
                        {formatNumber(ver.row_count)} rows / {ver.column_count} cols
                      </td>
                      <td className="py-3 px-4 text-[#3A3A38]/60 dark:text-slate-400 text-[10px] truncate max-w-[140px]">
                        {ver.sha256}
                      </td>
                      <td className="py-3 px-4 text-[#3A3A38]/70 dark:text-slate-400 text-[11px]">
                        {ver.pipeline_id || 'ingestion'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={apiService.getDownloadUrl(history.dataset_id, ver.version_number)}
                            download
                            className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 text-[#1A1A18] dark:text-slate-200 text-[11px] font-semibold rounded-none flex items-center gap-1 transition-colors hover:bg-[#F7F7F5]"
                          >
                            <Download className="w-3 h-3 text-[#1A3C2B] dark:text-[#9EFFBF]" />
                            [ DOWNLOAD ]
                          </a>

                          {!ver.is_active && (
                            <button
                              onClick={() => setRollbackTarget(ver)}
                              className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold rounded-none flex items-center gap-1 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              [ ROLLBACK ]
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
        <div className="fixed inset-0 bg-[#1A1A18]/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/30 dark:border-slate-800 rounded-none p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
              <RotateCcw className="w-6 h-6" />
              <h3 className="font-grotesk font-bold text-lg text-[#1A1A18] dark:text-white uppercase tracking-tight">Confirm Version Rollback</h3>
            </div>

            <p className="text-xs font-sans text-[#3A3A38] dark:text-slate-300 leading-relaxed">
              Are you sure you want to revert active dataset state to{' '}
              <strong className="text-amber-700 dark:text-amber-400 font-mono">
                Version {rollbackTarget.version_number}
              </strong>
              ?
            </p>

            <div className="p-3 bg-[#F7F7F5] dark:bg-[#1A1A18] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none text-[11px] text-[#3A3A38]/80 dark:text-slate-400 leading-relaxed space-y-1 font-sans">
              <span className="font-mono font-bold text-[#1A1A18] dark:text-slate-200 block uppercase">SAFETY GUARANTEE:</span>
              <p>
                Rollback updates the pointer to the active dataset version. All historical Parquet snapshots are preserved immutably and will NOT be deleted or overwritten.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 font-mono">
              <button
                onClick={() => setRollbackTarget(null)}
                disabled={rollingBack}
                className="px-4 py-2 bg-white dark:bg-[#121212] hover:bg-[#F7F7F5] border border-[#3A3A38]/20 dark:border-slate-800 text-[#1A1A18] dark:text-slate-200 text-xs font-semibold rounded-none transition-colors disabled:opacity-50"
              >
                [ CANCEL ]
              </button>
              <button
                onClick={handleConfirmRollback}
                disabled={rollingBack}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-none text-xs flex items-center gap-2 transition-all border border-amber-400 disabled:opacity-50"
              >
                {rollingBack ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Rolling Back...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    [ CONFIRM ROLLBACK ]
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
