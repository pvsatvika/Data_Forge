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
        return <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">LOW</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">MEDIUM</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">HIGH</span>;
    }
  };

  const allSelected = recommendations.length > 0 && selectedIndices.size === recommendations.length;

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="plan" />

      {/* Header section with technical typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#3A3A38]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest text-[#3A3A38]/60 dark:text-slate-400 uppercase">
              // STEP 03: SPECIFICATION & CONTROL
            </span>
          </div>
          <h2 className="text-2xl font-grotesk font-bold text-[#1A1A18] dark:text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#1A3C2B] dark:text-[#9EFFBF]" />
            Structured Cleaning Plan & Execution Engine
          </h2>
          <p className="text-xs font-sans text-[#3A3A38]/70 dark:text-slate-400 mt-0.5">
            Explicitly select transformations, simulate in-memory dry runs, approve, and execute deterministic transformations.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
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
            [ LOAD PLAN ]
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900 rounded-none flex items-start gap-3 text-rose-800 dark:text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-bold block text-xs uppercase mb-1">TRANSFORMATION SPECIFICATION ALERT</span>
            <span className="font-sans">{error}</span>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-none flex items-center justify-between text-emerald-900 dark:text-emerald-300 text-xs font-mono">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#1A3C2B] dark:text-[#9EFFBF]" />
            <span className="font-sans">{statusMessage}</span>
          </div>

          {execution && (
            <div className="flex gap-2 font-mono">
              <Link
                to={`/validation?id=${activeDatasetId}`}
                className="px-3 py-1.5 bg-[#1A3C2B] hover:bg-[#25523b] text-white text-[11px] font-bold rounded-none flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#9EFFBF]" /> [ VALIDATION REPORT ]
              </Link>
              <Link
                to={`/history?id=${activeDatasetId}`}
                className="px-3 py-1.5 bg-[#1A1A18] hover:bg-[#3A3A38] text-white text-[11px] font-bold rounded-none flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5 text-slate-300" /> [ VERSION HISTORY ]
              </Link>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#1A3C2B] dark:text-[#9EFFBF] animate-spin mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm">Building Validated Cleaning Plan...</h3>
          <p className="text-xs font-sans text-[#3A3A38]/60 dark:text-slate-400 mt-1">Loading AI recommendations and verifying against deterministic transformation registry.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-10 text-center">
          <AlertCircle className="w-10 h-10 text-[#3A3A38]/40 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white mb-1">No Dataset Selected</h3>
          <p className="text-xs font-sans text-[#3A3A38]/60 dark:text-slate-400 max-w-md mx-auto mb-4">
            Select a dataset with completed Groq AI analysis to construct a validated cleaning plan.
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

      {!loading && activeDatasetId && (
        <div className="space-y-6">
          {/* Technical Info Banner */}
          <div className="p-4 bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none flex items-start gap-3 text-[#1A1A18] dark:text-slate-300 text-xs leading-relaxed">
            <Sparkles className="w-5 h-5 text-[#1A3C2B] dark:text-[#9EFFBF] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-grotesk font-bold text-[#1A1A18] dark:text-white block mb-0.5 uppercase tracking-wide">
                HUMAN APPROVAL GATEWAY & SELECTIVE EXECUTION
              </span>
              <span className="font-sans text-[#3A3A38]/80 dark:text-slate-300">
                AI recommendations are non-binding suggestions. Check the boxes next to transformations you wish to apply.
                Only explicitly selected transformations will proceed to dry run preview, human approval, and deterministic execution.
              </span>
            </div>
          </div>

          {/* Header Metadata & Action Bar */}
          <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 font-mono">
                <span className="px-2.5 py-0.5 bg-[#1A3C2B] text-[#9EFFBF] text-[11px] font-bold uppercase rounded-none border border-[#1A3C2B]">
                  STATUS: {plan?.status || 'draft'}
                </span>
                {plan && <span className="text-xs text-[#3A3A38]/60 dark:text-slate-400">PLAN ID: {plan.plan_id}</span>}
              </div>
              <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-base">Structured Cleaning Plan Declaration</h3>
            </div>

            {/* Action Buttons Dependent Strictly on Backend Plan Status */}
            <div className="flex items-center gap-2 font-mono">
              {plan?.status === 'executed' ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/validation?id=${activeDatasetId}`}
                    className="px-4 py-2.5 bg-[#1A3C2B] hover:bg-[#25523b] text-white font-bold rounded-none text-xs flex items-center gap-2 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#9EFFBF]" />
                    [ VIEW VALIDATION REPORT ]
                  </Link>
                  <Link
                    to={`/history?id=${activeDatasetId}`}
                    className="px-4 py-2.5 bg-[#1A1A18] hover:bg-[#3A3A38] text-white font-bold rounded-none text-xs flex items-center gap-2 transition-all"
                  >
                    <History className="w-4 h-4 text-slate-300" />
                    [ VIEW VERSION HISTORY ]
                  </Link>
                </div>
              ) : plan?.status === 'approved' ? (
                <button
                  onClick={handleExecutePlan}
                  disabled={executing}
                  className="px-5 py-2.5 bg-[#1A3C2B] hover:bg-[#25523b] text-white font-bold rounded-none text-xs flex items-center gap-2 transition-all border border-[#9EFFBF]/30 disabled:opacity-50"
                >
                  {executing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#9EFFBF]" />
                      Executing & Validating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-[#9EFFBF]" />
                      [ EXECUTE PLAN & COMMIT VERSION ]
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleRunPreview}
                  disabled={previewing || selectedIndices.size === 0}
                  className="px-5 py-2.5 bg-[#1A3C2B] hover:bg-[#25523b] text-white font-bold rounded-none text-xs flex items-center gap-2 transition-all border border-[#9EFFBF]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {previewing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#9EFFBF]" />
                      Simulating Dry Run...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-[#9EFFBF]" />
                      [ PREVIEW SELECTED CHANGES ]
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Zero Selection Warning */}
          {selectedIndices.size === 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-none flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-mono font-semibold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Select at least one transformation to proceed to dry run preview.</span>
            </div>
          )}

          {/* Selection Toolbar & Recommendations Table */}
          <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none overflow-hidden">
            <div className="p-4 bg-[#F7F7F5] dark:bg-[#1A1A18] border-b border-[#3A3A38]/20 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                  <Layers className="w-4 h-4 text-[#1A3C2B] dark:text-[#9EFFBF]" />
                  Recommended Transformations
                </h3>
                <span className="px-2.5 py-0.5 bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 text-[#1A3C2B] dark:text-[#9EFFBF] rounded-none text-xs font-mono font-bold">
                  {selectedIndices.size} OF {recommendations.length} SELECTED
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <button
                  onClick={allSelected ? handleClearAll : handleSelectAll}
                  className="px-3 py-1.5 bg-white dark:bg-[#121212] hover:bg-[#F7F7F5] border border-[#3A3A38]/20 dark:border-slate-800 text-[#1A1A18] dark:text-slate-200 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-colors"
                >
                  {allSelected ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5 text-[#1A3C2B] dark:text-[#9EFFBF]" />}
                  <span>{allSelected ? '[ CLEAR ALL ]' : '[ SELECT ALL ]'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1A1A18] dark:text-slate-300">
                <thead className="bg-[#F7F7F5] dark:bg-[#121212] text-[#3A3A38]/70 dark:text-slate-400 font-mono uppercase font-bold text-[10px] tracking-wider border-b border-[#3A3A38]/20 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={allSelected ? handleClearAll : handleSelectAll}
                        className="w-4 h-4 rounded-none bg-white border-[#3A3A38]/40 text-[#1A3C2B] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Target Column</th>
                    <th className="py-3 px-4">Operation</th>
                    <th className="py-3 px-4">AI Reason / Rationale</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3A38]/10 dark:divide-slate-800/60 font-sans">
                  {recommendations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-[#3A3A38]/50 italic font-mono">
                        No transformations recommended for this dataset.
                      </td>
                    </tr>
                  ) : (
                    recommendations.map((item, idx) => {
                      const isChecked = selectedIndices.has(idx);
                      const displayNum = String(idx + 1).padStart(2, '0');
                      return (
                        <tr
                          key={idx}
                          onClick={() => toggleSelection(idx)}
                          className={`cursor-pointer transition-colors ${
                            isChecked ? 'bg-[#1A3C2B]/5 dark:bg-[#1A3C2B]/20' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelection(idx)}
                              className="w-4 h-4 rounded-none border-[#3A3A38]/40 text-[#1A3C2B] focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#3A3A38]/50 dark:text-slate-500 font-bold">{displayNum}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#1A1A18] dark:text-white">{item.column}</td>
                          <td className="py-3 px-4 font-mono">
                            <span className="px-2 py-0.5 bg-[#1A3C2B] text-[#9EFFBF] border border-[#1A3C2B] text-[11px] font-bold uppercase rounded-none">
                              {item.operation}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-sm text-[#3A3A38] dark:text-slate-300 leading-normal">{item.reason}</td>
                          <td className="py-3 px-4 font-mono text-[#1A3C2B] dark:text-[#9EFFBF] font-bold">
                            {(item.confidence * 100).toFixed(0)}%
                          </td>
                          <td className="py-3 px-4">{renderRiskBadge(item.risk)}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#3A3A38]/60 dark:text-slate-400">
                            {Object.keys(item.parameters || {}).length > 0 ? (
                              JSON.stringify(item.parameters)
                            ) : (
                              <span className="text-[#3A3A38]/40 dark:text-slate-600">None</span>
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
              <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-5 space-y-4">
                <h4 className="text-xs font-mono font-bold text-[#1A1A18] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#1A3C2B] dark:text-[#9EFFBF]" />
                  DETERMINISTIC INFORMATION LOSS PREVIEW ({selectedIndices.size} SELECTED TRANSFORMATIONS)
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono">
                  <div className="p-3 bg-[#F7F7F5] dark:bg-[#1A1A18] border border-[#3A3A38]/20 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-[#3A3A38]/60 dark:text-slate-400 block uppercase font-bold">Rows Affected</span>
                    <span className="text-lg font-bold text-[#1A1A18] dark:text-white">{preview.loss_summary.rows_affected}</span>
                  </div>
                  <div className="p-3 bg-[#F7F7F5] dark:bg-[#1A1A18] border border-[#3A3A38]/20 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-[#3A3A38]/60 dark:text-slate-400 block uppercase font-bold">Cells Changed</span>
                    <span className="text-lg font-bold text-[#1A3C2B] dark:text-[#9EFFBF]">{preview.loss_summary.cells_changed}</span>
                  </div>
                  <div className="p-3 bg-[#F7F7F5] dark:bg-[#1A1A18] border border-[#3A3A38]/20 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-[#3A3A38]/60 dark:text-slate-400 block uppercase font-bold">Rows Removed</span>
                    <span className="text-lg font-bold text-[#FF8C69]">{preview.loss_summary.rows_removed}</span>
                  </div>
                  <div className="p-3 bg-[#F7F7F5] dark:bg-[#1A1A18] border border-[#3A3A38]/20 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-[#3A3A38]/60 dark:text-slate-400 block uppercase font-bold">Values Nullified</span>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{preview.loss_summary.values_nullified}</span>
                  </div>
                  <div className="p-3 bg-[#F7F7F5] dark:bg-[#1A1A18] border border-[#3A3A38]/20 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-[#3A3A38]/60 dark:text-slate-400 block uppercase font-bold">Affected Cols</span>
                    <span className="text-lg font-bold text-[#1A1A18] dark:text-slate-200">{preview.loss_summary.columns_affected.length}</span>
                  </div>
                  <div className="p-3 bg-[#1A3C2B] border border-[#1A3C2B] text-center text-white">
                    <span className="text-[10px] text-[#9EFFBF] block uppercase font-bold">Loss Index</span>
                    <span className="text-xl font-bold">{preview.loss_summary.estimated_loss_score}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval & Execution Gate Section */}
          <div className="p-6 bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none space-y-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#1A3C2B] dark:text-[#9EFFBF] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm uppercase tracking-wide">
                  APPROVAL & EXECUTION AUTHORIZATION GATE
                </h4>
                <p className="text-xs font-sans text-[#3A3A38]/70 dark:text-slate-400 mt-1 leading-relaxed">
                  {plan?.status === 'approved'
                    ? 'Cleaning plan has been APPROVED by human operator. Execution will apply deterministic transformations, run automated test suite, and commit a new Parquet version.'
                    : plan?.status === 'executed'
                    ? 'Cleaning plan has been EXECUTED and committed to version storage.'
                    : `Approval authorizes the ${selectedIndices.size} selected transformation(s) for execution after dry-run preview simulation.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3A3A38]/20 dark:border-slate-800 font-mono">
              {plan?.status === 'executed' ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#1A3C2B] dark:text-[#9EFFBF] font-bold flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-4 h-4" /> PLAN EXECUTED & VERSION COMMITTED
                  </span>
                </div>
              ) : plan?.status === 'approved' ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-[#1A3C2B] dark:text-[#9EFFBF] font-bold flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-4 h-4" /> PLAN APPROVED & AUTHORIZED FOR EXECUTION
                  </span>
                  <button
                    onClick={handleExecutePlan}
                    disabled={executing}
                    className="px-6 py-2.5 bg-[#1A3C2B] hover:bg-[#25523b] text-white font-bold rounded-none text-xs flex items-center gap-2 transition-all border border-[#9EFFBF]/30 disabled:opacity-50"
                  >
                    {executing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#9EFFBF]" />
                        Executing & Validating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-[#9EFFBF]" />
                        [ EXECUTE PLAN & COMMIT VERSION ]
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleRejectPlan}
                    disabled={approving || plan?.status === 'rejected'}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-xs font-semibold rounded-none flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    [ REJECT PLAN ]
                  </button>

                  <div className="flex items-center gap-3">
                    {!preview && (
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium italic">
                        Run dry run preview above before approving plan.
                      </span>
                    )}
                    <button
                      onClick={handleApprovePlan}
                      disabled={!preview || approving || plan?.status === 'approved' || plan?.status === 'executed'}
                      className="px-6 py-2.5 bg-[#1A3C2B] hover:bg-[#25523b] text-white font-bold rounded-none text-xs flex items-center gap-2 transition-all border border-[#9EFFBF]/30 disabled:opacity-50"
                    >
                      {approving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#9EFFBF]" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#9EFFBF]" />
                          [ APPROVE PLAN FOR EXECUTION ]
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
