import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { WorkflowStepper } from '../components/WorkflowStepper';
import {
  BarChart3,
  AlertCircle,
  Loader2,
  Database,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { apiService } from '../services/api';
import { DatasetProfile, ColumnProfile } from '../types';
import { formatNumber } from '../utils/formatters';

export const ProfilePage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetIdFromUrl = datasetId || searchParams.get('id') || '';

  const [inputDatasetId, setInputDatasetId] = useState<string>(datasetIdFromUrl);
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasetIdFromUrl);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (datasetIdFromUrl && datasetIdFromUrl !== activeDatasetId) {
      setActiveDatasetId(datasetIdFromUrl);
      setInputDatasetId(datasetIdFromUrl);
    }
  }, [datasetIdFromUrl]);

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
    if (hints.likely_identifier) badges.push({ label: 'ID', color: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800' });
    if (hints.likely_email) badges.push({ label: 'Email', color: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800' });
    if (hints.likely_phone) badges.push({ label: 'Phone', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' });
    if (hints.likely_date) badges.push({ label: 'Date', color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' });
    if (hints.likely_numeric) badges.push({ label: 'Numeric', color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' });
    if (hints.likely_categorical) badges.push({ label: 'Categorical', color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' });
    if (hints.likely_boolean) badges.push({ label: 'Boolean', color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' });

    if (badges.length === 0) return <span className="text-[#6E6966] dark:text-[#9E9793] text-xs font-mono">-</span>;

    return (
      <div className="flex flex-wrap gap-1 font-mono">
        {badges.map((b) => (
          <span
            key={b.label}
            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${b.color}`}
          >
            {b.label}
          </span>
        ))}
      </div>
    );
  };

  const totalCells = profile ? profile.row_count * profile.column_count : 0;
  const totalMissingCells = profile
    ? profile.columns.reduce((acc, col) => acc + col.null_count, 0)
    : 0;
  const overallMissingPct = totalCells > 0 ? ((totalMissingCells / totalCells) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="profile" />

      {/* Header Bar */}
      <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-150">
        <div>
          <div className="font-mono text-[10px] font-bold text-[#7E454B] uppercase tracking-widest mb-1">
            STATISTICAL PROFILER
          </div>
          <h2 className="font-grotesk font-bold text-2xl text-[#2B2827] dark:text-[#F0EDEA] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#7E454B]" />
            Deterministic Dataset Profiling
          </h2>
          <p className="text-xs text-[#6E6966] dark:text-[#9E9793] mt-1 font-sans">
            Statistical distribution analysis, schema type detection, and heuristic pattern extraction.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {profile && (
            <Link
              to={`/analysis?id=${profile.dataset_id}`}
              className="px-4 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold uppercase flex items-center gap-2 transition-all border border-[#7E454B] rounded-lg shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analyze with AI
            </Link>
          )}

          <form onSubmit={handleSearchSubmit} className="flex gap-2 font-mono">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Dataset ID (e.g. ds_...)"
                value={inputDatasetId}
                onChange={(e) => setInputDatasetId(e.target.value)}
                className="bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-white/10 text-xs text-[#2B2827] dark:text-[#F0EDEA] px-3 py-2 pl-8 w-60 rounded-lg focus:outline-none focus:border-[#7E454B]"
              />
              <Search className="w-3.5 h-3.5 text-[#6E6966] dark:text-[#9E9793] absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-[#F6F4F0] dark:bg-[#121114] hover:bg-[#EFECE6] dark:hover:bg-[#201D24] text-[#2B2827] dark:text-[#F0EDEA] text-xs font-bold uppercase border border-[#E5E0D8] dark:border-white/10 rounded-lg transition-colors"
            >
              Load Profile
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-2xl p-12 text-center font-mono text-xs text-[#6E6966] dark:text-[#9E9793] shadow-sm">
          <Loader2 className="w-6 h-6 text-[#7E454B] animate-spin mx-auto mb-2" />
          <span className="font-bold block text-[#2B2827] dark:text-[#F0EDEA] text-sm">PROFILING DATASET METADATA...</span>
          <span className="text-[11px]">Extracting column distributions, null ratios, and pattern heuristics.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 font-mono text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <div>
            <span className="font-bold block uppercase">PROFILING ERROR</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading && !profile && !error && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-2xl p-10 text-center space-y-3 shadow-sm">
          <AlertCircle className="w-8 h-8 text-[#6E6966] dark:text-[#9E9793] mx-auto" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-base">No Dataset Loaded</h3>
          <p className="text-xs text-[#6E6966] dark:text-[#9E9793] max-w-md mx-auto font-sans">
            Ingest a dataset or enter an existing Dataset ID above to generate statistical profiles.
          </p>
          <Link
            to="/datasets"
            className="px-4 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold uppercase inline-flex items-center gap-2 border border-[#7E454B] rounded-lg shadow-sm"
          >
            <Database className="w-4 h-4" />
            Go to Dataset Ingestion
          </Link>
        </div>
      )}

      {!loading && profile && (
        <div className="space-y-6">
          {/* Top KPI Blocks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-bold">TOTAL ROWS</span>
              <span className="font-grotesk text-2xl font-bold text-[#2B2827] dark:text-[#F0EDEA] block mt-1">{formatNumber(profile.row_count)}</span>
            </div>

            <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-bold">TOTAL COLUMNS</span>
              <span className="font-grotesk text-2xl font-bold text-[#2B2827] dark:text-[#F0EDEA] block mt-1">{profile.column_count}</span>
            </div>

            <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-bold">DUPLICATE ROWS</span>
              <span className="font-grotesk text-2xl font-bold text-amber-600 dark:text-amber-400 block mt-1">
                {formatNumber(profile.duplicate_row_count)}{' '}
                <span className="font-mono text-xs font-normal text-amber-600 dark:text-amber-400">({profile.duplicate_row_percentage}%)</span>
              </span>
            </div>

            <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-bold">MISSING CELLS %</span>
              <span className="font-grotesk text-2xl font-bold text-rose-600 dark:text-rose-400 block mt-1">{overallMissingPct}%</span>
            </div>
          </div>

          {/* Column Profile Table */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-[#F6F4F0] dark:bg-[#121114] border-b border-[#E5E0D8] dark:border-white/10 flex justify-between items-center">
              <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#7E454B]" />
                Column Profiles & Pattern Heuristics
              </h3>
              <span className="font-mono text-xs text-[#6E6966] dark:text-[#9E9793]">DATASET ID: {profile.dataset_id}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-[#2B2827] dark:text-[#F0EDEA]">
                <thead className="bg-[#F6F4F0] dark:bg-[#121114] text-[#6E6966] dark:text-[#9E9793] uppercase font-bold text-[10px] tracking-wider border-b border-[#E5E0D8] dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4">Column Name</th>
                    <th className="py-3 px-4">Inferred Type</th>
                    <th className="py-3 px-4">Missing Ratio</th>
                    <th className="py-3 px-4">Unique Ratio</th>
                    <th className="py-3 px-4">Sample Values</th>
                    <th className="py-3 px-4">Semantic Hints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]/60 dark:divide-white/5">
                  {profile.columns.map((col) => (
                    <tr key={col.column_name} className="hover:bg-[#F6F4F0]/60 dark:hover:bg-[#121114]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#2B2827] dark:text-[#F0EDEA]">{col.column_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-[#7E454B]/10 text-[#7E454B] border border-[#7E454B]/20 rounded text-[10px] uppercase font-bold">
                          {col.inferred_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={col.null_percentage > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-[#6E6966] dark:text-[#9E9793]'}>
                          {col.null_percentage}% ({col.null_count})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6E6966] dark:text-[#9E9793]">
                        {col.unique_percentage}% ({col.unique_count})
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {col.sample_values.length > 0 ? (
                            col.sample_values.map((v, idx) => (
                              <span key={idx} className="bg-[#F6F4F0] dark:bg-[#121114] px-1.5 py-0.5 border border-[#E5E0D8] dark:border-white/10 rounded text-[#6E6966] dark:text-[#9E9793] max-w-[110px] truncate inline-block">
                                {String(v)}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#6E6966] dark:text-[#9E9793] italic">None</span>
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

          {/* Bottom Action Card */}
          <div className="p-4 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <span className="font-sans text-xs text-[#6E6966] dark:text-[#9E9793]">
              Profiling complete. Trigger Groq AI Semantic Intelligence for constraint inference and recommendations.
            </span>
            <Link
              to={`/analysis?id=${profile.dataset_id}`}
              className="px-5 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold uppercase flex items-center gap-2 border border-[#7E454B] rounded-lg shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Analyze with AI
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
