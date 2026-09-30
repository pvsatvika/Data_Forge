import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { WorkflowStepper } from '../components/WorkflowStepper';
import {
  FileCheck2,
  AlertCircle,
  Loader2,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  XCircle,
  Gauge,
  Layers,
  Info,
  Play,
  ShieldCheck,
  History,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';
import {
  CleaningPlanResponse,
  PlanPreviewResponse,
  ExecutionResponse,
  TransformationPlanItem
} from '../types';

export const CleaningPlanPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetIdFromUrl = searchParams.get('id') || '';

  const [inputDatasetId, setInputDatasetId] = useState<string>(datasetIdFromUrl);
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasetIdFromUrl);

  const [recommendations, setRecommendations] = useState<TransformationPlanItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const [plan, setPlan] = useState<CleaningPlanResponse | null>(null);
  const [preview, setPreview] = useState<PlanPreviewResponse | null>(null);
  const [execution, setExecution] = useState<ExecutionResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [previewing, setPreviewing] = useState<boolean>(false);
  const [approving, setApproving] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    setLoading(true);
    setError(null);
    setPreview(null);
    setExecution(null);

    // Fetch AI Analysis recommendations to populate selectable transformations list
    apiService
      .getAnalysis(activeDatasetId)
      .then((analysis) => {
        const items: TransformationPlanItem[] = analysis.recommendations.map((rec) => ({
          column: rec.column,
          operation: rec.operation,
          reason: rec.reason,
          confidence: rec.confidence,
          risk: rec.risk,
          parameters: rec.parameters || {}
        }));
        setRecommendations(items);

        // Fetch existing cleaning plan to sync selection and status
        return apiService.getCleaningPlan(activeDatasetId).then((existingPlan) => {
          setPlan(existingPlan);
          setLoading(false);

          // Sync selected indices based on existing plan transformations
          if (existingPlan.transformations && existingPlan.transformations.length > 0) {
            const selectedSet = new Set<number>();
            items.forEach((item, idx) => {
              const matched = existingPlan.transformations.some(
                (t) => t.column === item.column && t.operation === item.operation
              );
              if (matched) selectedSet.add(idx);
            });
            setSelectedIndices(selectedSet);
          } else {
            // Default: select all if no specific selection saved
            setSelectedIndices(new Set(items.map((_, i) => i)));
          }

          if (existingPlan.status !== 'draft') {
            apiService.previewCleaningPlan(activeDatasetId).then(setPreview).catch(() => {});
          }
        });
      })
      .catch((analysisErr) => {
        // Fallback: try fetching plan directly if analysis call fails
        apiService
          .getCleaningPlan(activeDatasetId)
          .then((existingPlan) => {
            setPlan(existingPlan);
            setRecommendations(existingPlan.transformations || []);
            setSelectedIndices(new Set((existingPlan.transformations || []).map((_, i) => i)));
            setLoading(false);
          })
          .catch(() => {
            const msg =
              analysisErr?.response?.data?.detail ||
              analysisErr?.message ||
              'Failed to load AI recommendations for cleaning plan.';
            setError(msg);
            setLoading(false);
          });
      });
  }, [activeDatasetId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputDatasetId.trim()) {
      setActiveDatasetId(inputDatasetId.trim());
      setSearchParams({ id: inputDatasetId.trim() });
    }
  };

  // Changing selection invalidates existing preview & resets plan status to draft
  const toggleSelection = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
    setPreview(null);
    setExecution(null);
    if (plan && plan.status !== 'draft') {
      setPlan({ ...plan, status: 'draft' });
    }
  };

  const handleSelectAll = () => {
    const next = new Set(recommendations.map((_, i) => i));
    setSelectedIndices(next);
    setPreview(null);
    setExecution(null);
    if (plan && plan.status !== 'draft') {
      setPlan({ ...plan, status: 'draft' });
    }
  };

  const handleClearAll = () => {
    setSelectedIndices(new Set());
    setPreview(null);
    setExecution(null);
    if (plan && plan.status !== 'draft') {
      setPlan({ ...plan, status: 'draft' });
    }
  };

  const handleRunPreview = async () => {
    if (!activeDatasetId) return;

    if (selectedIndices.size === 0) {
      setError('Select at least one transformation to continue.');
      return;
    }

    setPreviewing(true);
    setError(null);
    setStatusMessage(null);

    const selectedTransformations = recommendations.filter((_, idx) => selectedIndices.has(idx));

    try {
      // 1. Post ONLY selected transformations to backend
      const updatedPlan = await apiService.createCleaningPlan(activeDatasetId, selectedTransformations);
      setPlan(updatedPlan);

      // 2. Run dry-run simulation on updated plan
      const previewData = await apiService.previewCleaningPlan(activeDatasetId);
      setPreview(previewData);
      setPlan({ ...updatedPlan, status: previewData.status });
      setPreviewing(false);
      setStatusMessage(
        `In-memory dry run simulation completed for ${selectedTransformations.length} selected transformation(s). Review loss score below and click Approve to authorize execution.`
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to execute dry-run simulation.';
      setError(msg);
      setPreviewing(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!plan) return;

    setApproving(true);
    setError(null);
    setStatusMessage(null);

    try {
      const approvedPlan = await apiService.approveCleaningPlan(plan.plan_id);
      setPlan(approvedPlan);
      setApproving(false);
      setStatusMessage('Cleaning plan successfully APPROVED. "Execute Plan & Commit Version" is now available.');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to approve cleaning plan.';
      setError(msg);
      setApproving(false);
    }
  };

  const handleRejectPlan = async () => {
    if (!plan) return;

    setApproving(true);
    setError(null);

    try {
      const rejectedPlan = await apiService.rejectCleaningPlan(plan.plan_id);
      setPlan(rejectedPlan);
      setApproving(false);
      setStatusMessage('Cleaning plan REJECTED. No transformations authorized.');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to reject cleaning plan.';
      setError(msg);
      setApproving(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!activeDatasetId) return;

    setExecuting(true);
    setError(null);
    setStatusMessage(null);

    try {
      const execRes = await apiService.executeCleaningPlan(activeDatasetId);
      setExecution(execRes);
      if (plan) {
        setPlan({ ...plan, status: 'executed' });
      }
      setExecuting(false);
      setStatusMessage(`Plan successfully EXECUTED! Version ${execRes.version_number} committed to storage.`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to execute cleaning plan.';
      setError(msg);
      setExecuting(false);
    }
  };

  const renderRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">LOW</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">MEDIUM</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">HIGH</span>;
    }
  };

  const allSelected = recommendations.length > 0 && selectedIndices.size === recommendations.length;

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="plan" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-sky-400" />
            Structured Cleaning Plan & Execution Engine
          </h2>
          <p className="text-xs text-slate-400">Select transformations, run dry-run previews, approve, and execute deterministic cleaning.</p>
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
            Load Plan
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-1">Notice</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-400 text-xs font-medium">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>

          {execution && (
            <div className="flex gap-2">
              <Link
                to={`/validation?id=${activeDatasetId}`}
                className="px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-bold rounded flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> View Validation Report
              </Link>
              <Link
                to={`/history?id=${activeDatasetId}`}
                className="px-3 py-1.5 bg-sky-600 text-white text-[11px] font-bold rounded flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" /> View Version History
              </Link>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold text-white text-sm">Building Validated Cleaning Plan...</h3>
          <p className="text-xs text-slate-400 mt-1">Loading AI recommendations and verifying against deterministic transformation registry.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-200 mb-1">No Dataset Selected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Select a dataset with completed Groq AI analysis to construct a validated cleaning plan.
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

      {!loading && activeDatasetId && (
        <div className="space-y-6">
          {/* Information Callout Banner */}
          <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-start gap-3 text-sky-300 text-xs leading-relaxed">
            <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">User-Controlled Selection Engine</span>
              <span>
                AI recommendations are suggestions. Check the boxes next to the transformations you wish to apply to your dataset.
                Only selected transformations will be previewed, approved, and executed.
              </span>
            </div>
          </div>

          {/* Header Metadata & Action Banner */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-full text-[11px] font-mono font-bold uppercase">
                  STATUS: {plan?.status || 'draft'}
                </span>
                {plan && <span className="text-xs text-slate-400 font-mono">Plan ID: {plan.plan_id}</span>}
              </div>
              <h3 className="font-bold text-white text-base">Structured Cleaning Plan Declaration</h3>
            </div>

            {/* Action Buttons Dependent Strictly on Backend Plan Status */}
            <div className="flex items-center gap-2">
              {plan?.status === 'executed' ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/validation?id=${activeDatasetId}`}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    View Validation Report
                  </Link>
                  <Link
                    to={`/history?id=${activeDatasetId}`}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
                  >
                    <History className="w-4 h-4" />
                    View Version History
                  </Link>
                </div>
              ) : plan?.status === 'approved' ? (
                <button
                  onClick={handleExecutePlan}
                  disabled={executing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {executing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Executing & Validating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Execute Plan & Commit Version
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleRunPreview}
                  disabled={previewing || selectedIndices.size === 0}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {previewing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Preview Selected Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Zero Selection Warning */}
          {selectedIndices.size === 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>Select at least one transformation to continue.</span>
            </div>
          )}

          {/* Selection Toolbar & Recommendations Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Recommended Transformations
                </h3>
                <span className="px-2.5 py-0.5 bg-slate-700 text-sky-400 rounded-full text-xs font-mono font-bold">
                  {selectedIndices.size} of {recommendations.length} transformations selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={allSelected ? handleClearAll : handleSelectAll}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {allSelected ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5 text-sky-400" />}
                  <span>{allSelected ? 'Clear All' : 'Select All'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={allSelected ? handleClearAll : handleSelectAll}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Target Column</th>
                    <th className="py-3 px-4">Operation</th>
                    <th className="py-3 px-4">AI Reason / Rationale</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {recommendations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                        No transformations recommended for this dataset.
                      </td>
                    </tr>
                  ) : (
                    recommendations.map((item, idx) => {
                      const isChecked = selectedIndices.has(idx);
                      return (
                        <tr
                          key={idx}
                          onClick={() => toggleSelection(idx)}
                          className={`cursor-pointer transition-colors ${
                            isChecked ? 'bg-sky-500/5 hover:bg-sky-500/10' : 'hover:bg-slate-700/20 opacity-60'
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelection(idx)}
                              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-white">{item.column}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded font-mono text-[11px] font-bold">
                              {item.operation}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-sm text-slate-300">{item.reason}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                            {(item.confidence * 100).toFixed(0)}%
                          </td>
                          <td className="py-3 px-4">{renderRiskBadge(item.risk)}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {Object.keys(item.parameters || {}).length > 0 ? (
                              JSON.stringify(item.parameters)
                            ) : (
                              <span className="text-slate-600">None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dry Run Simulation & Information Loss Section */}
          {preview && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-sky-400" />
                  Deterministic Information Loss Preview ({selectedIndices.size} Selected Transformation(s))
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Rows Affected</span>
                    <span className="text-lg font-bold text-white">{preview.loss_summary.rows_affected}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Cells Changed</span>
                    <span className="text-lg font-bold text-sky-400">{preview.loss_summary.cells_changed}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Rows Removed</span>
                    <span className="text-lg font-bold text-rose-400">{preview.loss_summary.rows_removed}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Values Nullified</span>
                    <span className="text-lg font-bold text-amber-400">{preview.loss_summary.values_nullified}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Affected Cols</span>
                    <span className="text-lg font-bold text-indigo-400">{preview.loss_summary.columns_affected.length}</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-sky-500/40 text-center">
                    <span className="text-[10px] text-sky-400 block uppercase font-bold">Loss Index</span>
                    <span className="text-xl font-bold text-white">{preview.loss_summary.estimated_loss_score}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval & Execution Gate Section */}
          <div className="p-6 bg-slate-800 border border-slate-700 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">Approval & Execution Authorization Gate</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {plan?.status === 'approved'
                    ? 'Cleaning plan has been APPROVED. Execution will apply deterministic transformations, run the automated validation suite, and commit a new Parquet version.'
                    : plan?.status === 'executed'
                    ? 'Cleaning plan has been EXECUTED and committed to version storage.'
                    : `Approval authorizes the ${selectedIndices.size} selected transformation(s) for execution after preview simulation.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              {plan?.status === 'executed' ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Plan Executed & Version Committed
                  </span>
                </div>
              ) : plan?.status === 'approved' ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Plan Approved & Authorized for Execution
                  </span>
                  <button
                    onClick={handleExecutePlan}
                    disabled={executing}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {executing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Executing & Validating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Execute Plan & Commit Version
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleRejectPlan}
                    disabled={approving || plan?.status === 'rejected'}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Plan
                  </button>

                  <div className="flex items-center gap-3">
                    {!preview && (
                      <span className="text-xs text-amber-400 font-medium italic">
                        Run dry run preview above before approving plan.
                      </span>
                    )}
                    <button
                      onClick={handleApprovePlan}
                      disabled={!preview || approving || plan?.status === 'approved' || plan?.status === 'executed'}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {approving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Approve Plan for Execution
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
