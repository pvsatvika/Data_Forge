import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { WorkflowStepper } from '../components/WorkflowStepper';
import {
  BarChart3,
  AlertCircle,
  Loader2,
  Database,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Search,
  Tag
} from 'lucide-react';
import { apiService } from '../services/api';
import { DatasetProfile, ColumnProfile } from '../types';
import { formatNumber } from '../utils/formatters';

export const ProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetIdFromUrl = searchParams.get('id') || '';

  const [inputDatasetId, setInputDatasetId] = useState<string>(datasetIdFromUrl);
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasetIdFromUrl);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    setLoading(true);
    setError(null);

    apiService
      .getProfile(activeDatasetId)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to fetch dataset profile.';
        setError(msg);
        setLoading(false);
      });
  }, [activeDatasetId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputDatasetId.trim()) {
      setActiveDatasetId(inputDatasetId.trim());
      setSearchParams({ id: inputDatasetId.trim() });
    }
  };

  const renderSemanticBadges = (hints: ColumnProfile['semantic_hints']) => {
    const badges = [];
    if (hints.likely_identifier) badges.push({ label: 'ID', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' });
    if (hints.likely_email) badges.push({ label: 'Email', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' });
    if (hints.likely_phone) badges.push({ label: 'Phone', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' });
    if (hints.likely_date) badges.push({ label: 'Date', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' });
    if (hints.likely_numeric) badges.push({ label: 'Numeric', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' });
    if (hints.likely_categorical) badges.push({ label: 'Categorical', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' });
    if (hints.likely_boolean) badges.push({ label: 'Boolean', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' });

    if (badges.length === 0) return <span className="text-slate-500 text-xs">-</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((b) => (
          <span
            key={b.label}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${b.color}`}
          >
            {b.label}
          </span>
        ))}
      </div>
    );
  };

  // Calculate overall missing cells percentage
  const totalCells = profile ? profile.row_count * profile.column_count : 0;
  const totalMissingCells = profile
    ? profile.columns.reduce((acc, col) => acc + col.null_count, 0)
    : 0;
  const overallMissingPct = totalCells > 0 ? ((totalMissingCells / totalCells) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="profile" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            Deterministic Data Profiler
          </h2>
          <p className="text-xs text-slate-400">Statistical distribution, schema detection, and heuristic pattern recognition.</p>
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
            Load Profile
          </button>
        </form>
      </div>

      {loading && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold text-white text-sm">Profiling Dataset...</h3>
          <p className="text-xs text-slate-400 mt-1">Analyzing column statistics, sample values, null ratios, and pattern heuristics.</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold block">Profiling Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading && !profile && !error && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-200 mb-1">No Dataset Loaded</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Upload a CSV/XLSX file from the Datasets page or enter an existing Dataset ID to generate statistical profiles.
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

      {!loading && profile && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Rows</span>
                <span className="text-xl font-bold text-white">{formatNumber(profile.row_count)}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Columns</span>
                <span className="text-xl font-bold text-white">{profile.column_count}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Duplicate Rows</span>
                <span className="text-xl font-bold text-white">
                  {formatNumber(profile.duplicate_row_count)}{' '}
                  <span className="text-xs text-amber-400 font-normal">({profile.duplicate_row_percentage}%)</span>
                </span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Missing Cells %</span>
                <span className="text-xl font-bold text-white">{overallMissingPct}%</span>
              </div>
            </div>
          </div>

          {/* Column Profile Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                Column Profiles & Pattern Heuristics
              </h3>
              <span className="text-xs text-slate-400 font-mono">Dataset ID: {profile.dataset_id}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">Column Name</th>
                    <th className="py-3 px-4">Inferred Type</th>
                    <th className="py-3 px-4">Missing %</th>
                    <th className="py-3 px-4">Unique %</th>
                    <th className="py-3 px-4">Sample Values</th>
                    <th className="py-3 px-4">Semantic Hints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {profile.columns.map((col) => (
                    <tr key={col.column_name} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-white">{col.column_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-200 rounded font-mono text-[11px] uppercase">
                          {col.inferred_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={col.null_percentage > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {col.null_percentage}% ({col.null_count})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {col.unique_percentage}% ({col.unique_count})
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                          {col.sample_values.length > 0 ? (
                            col.sample_values.map((v, idx) => (
                              <span key={idx} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300 max-w-[120px] truncate inline-block">
                                {String(v)}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{renderSemanticBadges(col.semantic_hints)}</td>
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
