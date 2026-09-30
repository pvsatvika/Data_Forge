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
  FileSpreadsheet,
  Trash2
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
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
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

  const handleConfirmClearHistory = async () => {
    if (!activeDatasetId) return;

    setClearing(true);
    setError(null);
    setStatusMessage(null);

    try {
      const res = await apiService.clearHistory(activeDatasetId);
      setClearing(false);
      setShowClearModal(false);
      setStatusMessage(res.message || 'Dataset change history cleared successfully.');
      fetchHistory();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to clear dataset history.';
      setError(msg);
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="rollback" />

      {/* Header section with technical typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8] dark:border-[#29262C] transition-colors duration-150">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest text-[#6E6966] dark:text-[#9E9793] uppercase">
              // STEP 06: AUDIT & REVERSIBILITY
            </span>
          </div>
          <h2 className="text-2xl font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-[#7E454B] dark:text-[#9E5A61]" />
            Immutable Version History & Reversibility Engine
          </h2>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] mt-0.5">
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
              className="bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-[#29262C] text-xs font-mono text-[#2B2827] dark:text-[#F0EDEA] px-3 py-2 pl-8 rounded-lg w-64 focus:outline-none focus:border-[#7E454B] dark:focus:border-[#9E5A61]"
            />
            <Search className="w-3.5 h-3.5 text-[#6E6966] dark:text-[#9E9793] absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-semibold rounded-lg transition-colors border border-[#7E454B]"
          >
            [ LOAD HISTORY ]
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-sans">{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-sans">{statusMessage}</span>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#7E454B] dark:text-[#9E5A61] animate-spin mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm">Loading Version History...</h3>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] mt-1">Fetching Parquet dataset versions and audit records.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-[#6E6966] dark:text-[#9E9793] mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] mb-1">No Dataset Selected</h3>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] max-w-md mx-auto mb-4">
            Select a dataset to view immutable Parquet version history, download clean files, or perform safe rollbacks.
          </p>
          <Link
            to="/datasets"
            className="px-4 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold rounded-lg inline-flex items-center gap-2 transition-colors border border-[#7E454B]"
          >
            <Database className="w-4 h-4 text-white" />
            [ GO TO UPLOAD DATASETS ]
          </Link>
        </div>
      )}

      {!loading && history && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 font-mono">
                <span className="text-xs text-[#6E6966] dark:text-[#9E9793]">DATASET ID: {history.dataset_id}</span>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 text-[11px] font-bold uppercase rounded-md">
                  ACTIVE: VERSION {history.current_version}
                </span>
              </div>
              <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-base">
                Dataset Version Chain ({history.versions.length} versions)
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowClearModal(true)}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                [ CLEAR HISTORY ]
              </button>
              <a
                href={apiService.getDownloadUrl(history.dataset_id)}
                download
                className="px-4 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold rounded-lg flex items-center gap-2 transition-colors border border-[#7E454B]"
              >
                <Download className="w-4 h-4 text-white" />
                [ DOWNLOAD CURRENT ACTIVE VERSION ]
              </a>
            </div>
          </div>

          {/* Versions Table */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl overflow-hidden">
            <div className="p-4 bg-[#F6F4F0] dark:bg-[#222026] border-b border-[#E5E0D8] dark:border-[#29262C] flex justify-between items-center">
              <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm flex items-center gap-2 uppercase tracking-wide">
                <FileSpreadsheet className="w-4 h-4 text-[#7E454B] dark:text-[#9E5A61]" />
                Immutable Parquet Version Log
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#2B2827] dark:text-[#F0EDEA] font-mono">
                <thead className="bg-[#F6F4F0] dark:bg-[#222026] text-[#6E6966] dark:text-[#9E9793] uppercase font-bold text-[10px] tracking-wider border-b border-[#E5E0D8] dark:border-[#29262C]">
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
                <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#29262C]">
                  {history.versions.map((ver: VersionItem) => (
                    <tr
                      key={ver.version_id}
                      className={`hover:bg-[#F6F4F0] dark:hover:bg-[#222026] transition-colors ${
                        ver.is_active ? 'bg-[#7E454B]/5 dark:bg-[#7E454B]/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-[#2B2827] dark:text-[#F0EDEA]">
                        {ver.version_number === 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">Version 0 (Original)</span>
                        ) : (
                          <span>Version {ver.version_number}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ver.is_active ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> CURRENT ACTIVE
                          </span>
                        ) : (
                          <span className="text-[#6E6966] dark:text-[#9E9793] text-[11px]">Historical</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#6E6966] dark:text-[#9E9793] text-[11px]">
                        {new Date(ver.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[#2B2827] dark:text-[#F0EDEA]">
                        {formatNumber(ver.row_count)} rows / {ver.column_count} cols
                      </td>
                      <td className="py-3 px-4 text-[#6E6966] dark:text-[#9E9793] text-[10px] truncate max-w-[140px]">
                        {ver.sha256}
                      </td>
                      <td className="py-3 px-4 text-[#6E6966] dark:text-[#9E9793] text-[11px]">
                        {ver.pipeline_id || 'ingestion'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={apiService.getDownloadUrl(history.dataset_id, ver.version_number)}
                            download
                            className="px-2.5 py-1 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] text-[#2B2827] dark:text-[#F0EDEA] text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors hover:bg-[#F6F4F0] dark:hover:bg-[#222026]"
                          >
                            <Download className="w-3 h-3 text-[#7E454B] dark:text-[#9E5A61]" />
                            [ DOWNLOAD ]
                          </a>

                          {!ver.is_active && (
                            <button
                              onClick={() => setRollbackTarget(ver)}
                              className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors hover:bg-amber-500/20"
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
        <div className="fixed inset-0 bg-[#2B2827]/70 dark:bg-[#121114]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <RotateCcw className="w-6 h-6" />
              <h3 className="font-grotesk font-bold text-lg text-[#2B2827] dark:text-[#F0EDEA] uppercase tracking-tight">Confirm Version Rollback</h3>
            </div>

            <p className="text-xs font-sans text-[#2B2827] dark:text-[#F0EDEA] leading-relaxed">
              Are you sure you want to revert active dataset state to{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-mono">
                Version {rollbackTarget.version_number}
              </strong>
              ?
            </p>

            <div className="p-3 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg text-[11px] text-[#6E6966] dark:text-[#9E9793] leading-relaxed space-y-1 font-sans">
              <span className="font-mono font-bold text-[#2B2827] dark:text-[#F0EDEA] block uppercase">SAFETY GUARANTEE:</span>
              <p>
                Rollback updates the pointer to the active dataset version. All historical Parquet snapshots are preserved immutably and will NOT be deleted or overwritten.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 font-mono">
              <button
                onClick={() => setRollbackTarget(null)}
                disabled={rollingBack}
                className="px-4 py-2 bg-white dark:bg-[#222026] hover:bg-[#F6F4F0] dark:hover:bg-[#2A2730] border border-[#E5E0D8] dark:border-[#29262C] text-[#2B2827] dark:text-[#F0EDEA] text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                [ CANCEL ]
              </button>
              <button
                onClick={handleConfirmRollback}
                disabled={rollingBack}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all border border-amber-600 disabled:opacity-50"
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

      {/* Clear History Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-[#2B2827]/70 dark:bg-[#121114]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
              <h3 className="font-grotesk font-bold text-lg text-[#2B2827] dark:text-[#F0EDEA] uppercase tracking-tight">Clear History?</h3>
            </div>

            <p className="text-xs font-sans text-[#2B2827] dark:text-[#F0EDEA] leading-relaxed">
              This will remove the history records associated with this account.
            </p>

            {activeDatasetId && (
              <div className="p-3 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg text-[11px] text-[#6E6966] dark:text-[#9E9793] leading-relaxed space-y-1 font-sans">
                <span className="font-mono font-bold text-[#2B2827] dark:text-[#F0EDEA] block uppercase">TARGET DATASET:</span>
                <p className="font-mono text-[#2B2827] dark:text-[#F0EDEA] font-semibold">{activeDatasetId}</p>
                <p>Non-active historical Parquet snapshots and audit logs will be deleted. The active version and Version 0 baseline are preserved.</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 font-mono">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="px-4 py-2 bg-white dark:bg-[#222026] hover:bg-[#F6F4F0] dark:hover:bg-[#2A2730] border border-[#E5E0D8] dark:border-[#29262C] text-[#2B2827] dark:text-[#F0EDEA] text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearHistory}
                disabled={clearing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all border border-rose-600 disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Clearing History...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Clear History
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
