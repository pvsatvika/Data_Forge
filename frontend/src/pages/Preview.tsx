import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { WorkflowStepper } from '../components/WorkflowStepper';
import {
  Eye,
  AlertCircle,
  Loader2,
  Database,
  Search,
  Gauge,
  Layers,
  AlertTriangle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { apiService } from '../services/api';
import { PlanPreviewResponse } from '../types';

export const PreviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetIdFromUrl = searchParams.get('id') || '';

  const [inputDatasetId, setInputDatasetId] = useState<string>(datasetIdFromUrl);
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasetIdFromUrl);

  const [preview, setPreview] = useState<PlanPreviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    setLoading(true);
    setError(null);

    apiService
      .previewCleaningPlan(activeDatasetId)
      .then((data) => {
        setPreview(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to load preview simulation.';
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

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="simulate" />

      {/* Header section with technical typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#3A3A38]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest text-[#3A3A38]/60 dark:text-slate-400 uppercase">
              // STEP 04: SIMULATION & LOSS ESTIMATION
            </span>
          </div>
          <h2 className="text-2xl font-grotesk font-bold text-[#1A1A18] dark:text-white tracking-tight flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#1A3C2B] dark:text-[#9EFFBF]" />
            Dry Run & Information Loss Simulation
          </h2>
          <p className="text-xs font-sans text-[#3A3A38]/70 dark:text-slate-400 mt-0.5">
            In-memory transformation preview comparing original vs simulated dataset state.
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
            [ LOAD PREVIEW ]
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900 rounded-none flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-bold block text-xs uppercase mb-1">PREVIEW SIMULATION ERROR</span>
            <span className="font-sans">{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#1A3C2B] dark:text-[#9EFFBF] animate-spin mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm">Running Dry Run Simulation...</h3>
          <p className="text-xs font-sans text-[#3A3A38]/60 dark:text-slate-400 mt-1">Executing transformations on isolated in-memory DataFrame copy.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-10 text-center">
          <AlertCircle className="w-10 h-10 text-[#3A3A38]/40 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white mb-1">No Active Dataset Loaded</h3>
          <p className="text-xs font-sans text-[#3A3A38]/60 dark:text-slate-400 max-w-md mx-auto mb-4">
            Select a dataset with an active cleaning plan to run dry run simulations.
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

      {!loading && preview && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-4 flex items-center gap-3">
              <div className="p-3 bg-[#F7F7F5] dark:bg-[#1A1A18] text-[#1A3C2B] dark:text-[#9EFFBF] border border-[#3A3A38]/20 dark:border-slate-800">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#3A3A38]/60 dark:text-slate-400 block uppercase font-mono font-bold">Original Rows</span>
                <span className="text-2xl font-grotesk font-bold text-[#1A1A18] dark:text-white">{preview.loss_summary.original_row_count}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-4 flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-[#1A3C2B] dark:text-[#9EFFBF] border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#3A3A38]/60 dark:text-slate-400 block uppercase font-mono font-bold">Simulated Rows</span>
                <span className="text-2xl font-grotesk font-bold text-[#1A3C2B] dark:text-[#9EFFBF]">{preview.loss_summary.simulated_row_count}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-4 flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#3A3A38]/60 dark:text-slate-400 block uppercase font-mono font-bold">Changed Cells</span>
                <span className="text-2xl font-grotesk font-bold text-amber-600 dark:text-amber-400">{preview.loss_summary.cells_changed}</span>
              </div>
            </div>

            <div className="bg-[#1A3C2B] text-white border border-[#1A3C2B] rounded-none p-4 flex items-center gap-3">
              <div className="p-3 bg-white/10 text-[#9EFFBF]">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#9EFFBF] block uppercase font-mono font-bold">Loss Index</span>
                <span className="text-2xl font-grotesk font-bold text-white">{preview.loss_summary.estimated_loss_score}</span>
              </div>
            </div>
          </div>

          {/* Per-Operation Stats Table */}
          <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none overflow-hidden">
            <div className="p-4 bg-[#F7F7F5] dark:bg-[#1A1A18] border-b border-[#3A3A38]/20 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                <Gauge className="w-4 h-4 text-[#1A3C2B] dark:text-[#9EFFBF]" />
                Per-Transformation Execution Statistics
              </h3>
              <span className="text-xs text-[#3A3A38]/60 dark:text-slate-400 font-mono">PLAN ID: {preview.plan_id}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1A1A18] dark:text-slate-300 font-mono">
                <thead className="bg-[#F7F7F5] dark:bg-[#121212] text-[#3A3A38]/70 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#3A3A38]/20 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Operation</th>
                    <th className="py-3 px-4">Target Column</th>
                    <th className="py-3 px-4">Affected Rows</th>
                    <th className="py-3 px-4">Changed Cells</th>
                    <th className="py-3 px-4">Nulls Created</th>
                    <th className="py-3 px-4">Rows Removed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3A38]/10 dark:divide-slate-800/60">
                  {preview.transformation_stats.map((st, idx) => (
                    <tr key={idx} className="hover:bg-[#F7F7F5] dark:hover:bg-[#1A1A18] transition-colors">
                      <td className="py-3 px-4 text-[#1A3C2B] dark:text-[#9EFFBF] font-bold">{st.operation}</td>
                      <td className="py-3 px-4 text-[#1A1A18] dark:text-white font-bold">{st.column}</td>
                      <td className="py-3 px-4 text-[#3A3A38] dark:text-slate-300">{st.affected_rows}</td>
                      <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-bold">{st.changed_cells}</td>
                      <td className="py-3 px-4 text-[#FF8C69] font-bold">{st.nulls_created}</td>
                      <td className="py-3 px-4 text-[#FF8C69] font-bold">{st.rows_removed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cell Diff Sample Table */}
          <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none overflow-hidden">
            <div className="p-4 bg-[#F7F7F5] dark:bg-[#1A1A18] border-b border-[#3A3A38]/20 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                <Eye className="w-4 h-4 text-[#1A3C2B] dark:text-[#9EFFBF]" />
                Cell Value Modification Diffs ({preview.cell_diffs.length} SAMPLES)
              </h3>
              {preview.diff_truncated && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-mono text-[10px] font-bold uppercase">
                  Sample Truncated at 50 Records
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1A1A18] dark:text-slate-300 font-mono">
                <thead className="bg-[#F7F7F5] dark:bg-[#121212] text-[#3A3A38]/70 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#3A3A38]/20 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Row Index</th>
                    <th className="py-3 px-4">Column Name</th>
                    <th className="py-3 px-4">Original Value</th>
                    <th className="py-3 px-4">Simulated Value</th>
                    <th className="py-3 px-4">Applied Operation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3A38]/10 dark:divide-slate-800/60">
                  {preview.cell_diffs.map((diff, idx) => (
                    <tr key={idx} className="hover:bg-[#F7F7F5] dark:hover:bg-[#1A1A18] transition-colors">
                      <td className="py-2.5 px-4 text-[#3A3A38]/60 dark:text-slate-500">#{diff.row_index}</td>
                      <td className="py-2.5 px-4 text-[#1A1A18] dark:text-white font-bold">{diff.column_name}</td>
                      <td className="py-2.5 px-4 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 border-l-2 border-rose-500">
                        {diff.old_value ?? '<null>'}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border-l-2 border-emerald-500">
                        {diff.new_value ?? '<null>'}
                      </td>
                      <td className="py-2.5 px-4 text-[#1A3C2B] dark:text-[#9EFFBF] font-bold">{diff.operation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none flex items-center justify-between font-mono">
            <span className="text-xs text-[#3A3A38]/70 dark:text-slate-400 font-sans">
              Return to Cleaning Plan to authorize plan execution.
            </span>
            <Link
              to={`/plan?id=${preview.dataset_id}`}
              className="px-4 py-2 bg-[#1A3C2B] hover:bg-[#25523b] text-white text-xs font-bold rounded-none flex items-center gap-2 transition-colors"
            >
              [ BACK TO CLEANING PLAN ]
              <ArrowRight className="w-4 h-4 text-[#9EFFBF]" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
