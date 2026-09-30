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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8] dark:border-[#29262C] transition-colors duration-150">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest text-[#6E6966] dark:text-[#9E9793] uppercase">
              // STEP 04: SIMULATION & LOSS ESTIMATION
            </span>
          </div>
          <h2 className="text-2xl font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] tracking-tight flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#7E454B] dark:text-[#9E5A61]" />
            Dry Run & Information Loss Simulation
          </h2>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] mt-0.5">
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
              className="bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-[#29262C] text-xs font-mono text-[#2B2827] dark:text-[#F0EDEA] px-3 py-2 pl-8 rounded-lg w-64 focus:outline-none focus:border-[#7E454B] dark:focus:border-[#9E5A61]"
            />
            <Search className="w-3.5 h-3.5 text-[#6E6966] dark:text-[#9E9793] absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-semibold rounded-lg transition-colors border border-[#7E454B]"
          >
            [ LOAD PREVIEW ]
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-bold block text-xs uppercase mb-1">PREVIEW SIMULATION ERROR</span>
            <span className="font-sans">{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#7E454B] dark:text-[#9E5A61] animate-spin mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm">Running Dry Run Simulation...</h3>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] mt-1">Executing transformations on isolated in-memory DataFrame copy.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-[#6E6966] dark:text-[#9E9793] mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] mb-1">No Active Dataset Loaded</h3>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] max-w-md mx-auto mb-4">
            Select a dataset with an active cleaning plan to run dry run simulations.
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

      {!loading && preview && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-[#F6F4F0] dark:bg-[#222026] text-[#7E454B] dark:text-[#9E5A61] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-mono font-bold">Original Rows</span>
                <span className="text-2xl font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA]">{preview.loss_summary.original_row_count}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-mono font-bold">Simulated Rows</span>
                <span className="text-2xl font-grotesk font-bold text-emerald-600 dark:text-emerald-400">{preview.loss_summary.simulated_row_count}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-mono font-bold">Changed Cells</span>
                <span className="text-2xl font-grotesk font-bold text-amber-600 dark:text-amber-400">{preview.loss_summary.cells_changed}</span>
              </div>
            </div>

            <div className="bg-[#7E454B] text-white border border-[#7E454B] rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-white/10 text-white rounded-lg">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-white/80 block uppercase font-mono font-bold">Loss Index</span>
                <span className="text-2xl font-grotesk font-bold text-white">{preview.loss_summary.estimated_loss_score}</span>
              </div>
            </div>
          </div>

          {/* Per-Operation Stats Table */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl overflow-hidden">
            <div className="p-4 bg-[#F6F4F0] dark:bg-[#222026] border-b border-[#E5E0D8] dark:border-[#29262C] flex justify-between items-center">
              <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm flex items-center gap-2 uppercase tracking-wide">
                <Gauge className="w-4 h-4 text-[#7E454B] dark:text-[#9E5A61]" />
                Per-Transformation Execution Statistics
              </h3>
              <span className="text-xs text-[#6E6966] dark:text-[#9E9793] font-mono">PLAN ID: {preview.plan_id}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#2B2827] dark:text-[#F0EDEA] font-mono">
                <thead className="bg-[#F6F4F0] dark:bg-[#222026] text-[#6E6966] dark:text-[#9E9793] uppercase font-bold text-[10px] tracking-wider border-b border-[#E5E0D8] dark:border-[#29262C]">
                  <tr>
                    <th className="py-3 px-4">Operation</th>
                    <th className="py-3 px-4">Target Column</th>
                    <th className="py-3 px-4">Affected Rows</th>
                    <th className="py-3 px-4">Changed Cells</th>
                    <th className="py-3 px-4">Nulls Created</th>
                    <th className="py-3 px-4">Rows Removed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#29262C]">
                  {preview.transformation_stats.map((st, idx) => (
                    <tr key={idx} className="hover:bg-[#F6F4F0] dark:hover:bg-[#222026] transition-colors">
                      <td className="py-3 px-4 text-[#7E454B] dark:text-[#9E5A61] font-bold">{st.operation}</td>
                      <td className="py-3 px-4 text-[#2B2827] dark:text-[#F0EDEA] font-bold">{st.column}</td>
                      <td className="py-3 px-4 text-[#6E6966] dark:text-[#9E9793]">{st.affected_rows}</td>
                      <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-bold">{st.changed_cells}</td>
                      <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-bold">{st.nulls_created}</td>
                      <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-bold">{st.rows_removed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cell Diff Sample Table */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl overflow-hidden">
            <div className="p-4 bg-[#F6F4F0] dark:bg-[#222026] border-b border-[#E5E0D8] dark:border-[#29262C] flex justify-between items-center">
              <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm flex items-center gap-2 uppercase tracking-wide">
                <Eye className="w-4 h-4 text-[#7E454B] dark:text-[#9E5A61]" />
                Cell Value Modification Diffs ({preview.cell_diffs.length} SAMPLES)
              </h3>
              {preview.diff_truncated && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40 rounded-md font-mono text-[10px] font-bold uppercase">
                  Sample Truncated at 50 Records
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#2B2827] dark:text-[#F0EDEA] font-mono">
                <thead className="bg-[#F6F4F0] dark:bg-[#222026] text-[#6E6966] dark:text-[#9E9793] uppercase font-bold text-[10px] tracking-wider border-b border-[#E5E0D8] dark:border-[#29262C]">
                  <tr>
                    <th className="py-3 px-4">Row Index</th>
                    <th className="py-3 px-4">Column Name</th>
                    <th className="py-3 px-4">Original Value</th>
                    <th className="py-3 px-4">Simulated Value</th>
                    <th className="py-3 px-4">Applied Operation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#29262C]">
                  {preview.cell_diffs.map((diff, idx) => (
                    <tr key={idx} className="hover:bg-[#F6F4F0] dark:hover:bg-[#222026] transition-colors">
                      <td className="py-2.5 px-4 text-[#6E6966] dark:text-[#9E9793]">#{diff.row_index}</td>
                      <td className="py-2.5 px-4 text-[#2B2827] dark:text-[#F0EDEA] font-bold">{diff.column_name}</td>
                      <td className="py-2.5 px-4 text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-950/40 border-l-2 border-rose-500">
                        {diff.old_value ?? '<null>'}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-l-2 border-emerald-500">
                        {diff.new_value ?? '<null>'}
                      </td>
                      <td className="py-2.5 px-4 text-[#7E454B] dark:text-[#9E5A61] font-bold">{diff.operation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl flex items-center justify-between font-mono">
            <span className="text-xs text-[#6E6966] dark:text-[#9E9793] font-sans">
              Return to Cleaning Plan to authorize plan execution.
            </span>
            <Link
              to={`/plan?id=${preview.dataset_id}`}
              className="px-4 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors border border-[#7E454B]"
            >
              [ BACK TO CLEANING PLAN ]
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
