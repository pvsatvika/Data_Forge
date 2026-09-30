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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-sky-400" />
            Dry Run & Information Loss Simulation
          </h2>
          <p className="text-xs text-slate-400">In-memory transformation preview comparing original vs simulated dataset state.</p>
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
            Load Preview
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-1">Preview Simulation Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold text-white text-sm">Running Dry Run Simulation...</h3>
          <p className="text-xs text-slate-400 mt-1">Executing transformations on isolated DataFrame copy.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-200 mb-1">No Active Dataset Loaded</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Select a dataset with an active cleaning plan to run dry run simulations.
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

      {!loading && preview && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Original Rows</span>
                <span className="text-xl font-bold text-white">{preview.loss_summary.original_row_count}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Simulated Rows</span>
                <span className="text-xl font-bold text-emerald-400">{preview.loss_summary.simulated_row_count}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Changed Cells</span>
                <span className="text-xl font-bold text-amber-400">{preview.loss_summary.cells_changed}</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Loss Score</span>
                <span className="text-xl font-bold text-white">{preview.loss_summary.estimated_loss_score}</span>
              </div>
            </div>
          </div>

          {/* Per-Operation Stats Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                Per-Transformation Execution Statistics
              </h3>
              <span className="text-xs text-slate-400 font-mono">Plan ID: {preview.plan_id}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">Operation</th>
                    <th className="py-3 px-4">Target Column</th>
                    <th className="py-3 px-4">Affected Rows</th>
                    <th className="py-3 px-4">Changed Cells</th>
                    <th className="py-3 px-4">Nulls Created</th>
                    <th className="py-3 px-4">Rows Removed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 font-mono">
                  {preview.transformation_stats.map((st, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/20">
                      <td className="py-3 px-4 text-sky-400 font-bold">{st.operation}</td>
                      <td className="py-3 px-4 text-white">{st.column}</td>
                      <td className="py-3 px-4 text-slate-300">{st.affected_rows}</td>
                      <td className="py-3 px-4 text-amber-400">{st.changed_cells}</td>
                      <td className="py-3 px-4 text-rose-400">{st.nulls_created}</td>
                      <td className="py-3 px-4 text-rose-400">{st.rows_removed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cell Diff Sample Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                Cell Value Modification Diffs ({preview.cell_diffs.length} samples)
              </h3>
              {preview.diff_truncated && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-semibold">
                  Sample Truncated at 50 Records
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">Row Index</th>
                    <th className="py-3 px-4">Column Name</th>
                    <th className="py-3 px-4">Original Value</th>
                    <th className="py-3 px-4">Simulated Value</th>
                    <th className="py-3 px-4">Applied Operation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 font-mono">
                  {preview.cell_diffs.map((diff, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/20">
                      <td className="py-2.5 px-4 text-slate-400">#{diff.row_index}</td>
                      <td className="py-2.5 px-4 text-white font-bold">{diff.column_name}</td>
                      <td className="py-2.5 px-4 text-rose-300 bg-rose-500/5">{diff.old_value ?? '<null>'}</td>
                      <td className="py-2.5 px-4 text-emerald-300 bg-emerald-500/5">{diff.new_value ?? '<null>'}</td>
                      <td className="py-2.5 px-4 text-sky-400">{diff.operation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Return to Cleaning Plan to authorize plan execution.
            </span>
            <Link
              to={`/plan?id=${preview.dataset_id}`}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
            >
              Back to Cleaning Plan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
