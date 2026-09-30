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
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">LOW</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">MEDIUM</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">HIGH</span>;
    }
  };

  const allSelected = recommendations.length > 0 && selectedIndices.size === recommendations.length;

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="plan" />

      {/* Header section with technical typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8] dark:border-[#29262C] transition-colors duration-150">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest text-[#6E6966] dark:text-[#9E9793] uppercase">
              // STEP 03: SPECIFICATION & CONTROL
            </span>
          </div>
          <h2 className="text-2xl font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#7E454B] dark:text-[#9E5A61]" />
            Structured Cleaning Plan & Execution Engine
          </h2>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] mt-0.5">
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
              className="bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-[#29262C] text-xs font-mono text-[#2B2827] dark:text-[#F0EDEA] px-3 py-2 pl-8 rounded-lg w-64 focus:outline-none focus:border-[#7E454B] dark:focus:border-[#9E5A61]"
            />
            <Search className="w-3.5 h-3.5 text-[#6E6966] dark:text-[#9E9793] absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-semibold rounded-lg transition-colors border border-[#7E454B]"
          >
            [ LOAD PLAN ]
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-bold block text-xs uppercase mb-1">TRANSFORMATION SPECIFICATION ALERT</span>
            <span className="font-sans">{error}</span>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-mono">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-sans">{statusMessage}</span>
          </div>

          {execution && (
            <div className="flex gap-2 font-mono">
              <Link
                to={`/validation?id=${activeDatasetId}`}
                className="px-3 py-1.5 bg-[#7E454B] hover:bg-[#6A393E] text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-white" /> [ VALIDATION REPORT ]
              </Link>
              <Link
                to={`/history?id=${activeDatasetId}`}
                className="px-3 py-1.5 bg-[#F6F4F0] dark:bg-[#222026] hover:bg-[#EFECE6] dark:hover:bg-[#2A2730] text-[#2B2827] dark:text-[#F0EDEA] text-[11px] font-bold rounded-lg flex items-center gap-1.5 border border-[#E5E0D8] dark:border-[#29262C]"
              >
                <History className="w-3.5 h-3.5 text-[#6E6966] dark:text-[#9E9793]" /> [ VERSION HISTORY ]
              </Link>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#7E454B] dark:text-[#9E5A61] animate-spin mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm">Building Validated Cleaning Plan...</h3>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] mt-1">Loading AI recommendations and verifying against deterministic transformation registry.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-[#6E6966] dark:text-[#9E9793] mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] mb-1">No Dataset Selected</h3>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] max-w-md mx-auto mb-4">
            Select a dataset with completed Groq AI analysis to construct a validated cleaning plan.
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

      {!loading && activeDatasetId && (
        <div className="space-y-6">
          {/* Technical Info Banner */}
          <div className="p-4 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl flex items-start gap-3 text-[#2B2827] dark:text-[#F0EDEA] text-xs leading-relaxed">
            <Sparkles className="w-5 h-5 text-[#7E454B] dark:text-[#9E5A61] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] block mb-0.5 uppercase tracking-wide">
                HUMAN APPROVAL GATEWAY & SELECTIVE EXECUTION
              </span>
              <span className="font-sans text-[#6E6966] dark:text-[#9E9793]">
                AI recommendations are non-binding suggestions. Check the boxes next to transformations you wish to apply.
                Only explicitly selected transformations will proceed to dry run preview, human approval, and deterministic execution.
              </span>
            </div>
          </div>

          {/* Header Metadata & Action Bar */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 font-mono">
                <span className="px-2.5 py-0.5 bg-[#7E454B] text-white text-[11px] font-bold uppercase rounded-md border border-[#7E454B]">
                  STATUS: {plan?.status || 'draft'}
                </span>
                {plan && <span className="text-xs text-[#6E6966] dark:text-[#9E9793]">PLAN ID: {plan.plan_id}</span>}
              </div>
              <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-base">Structured Cleaning Plan Declaration</h3>
            </div>

            {/* Action Buttons Dependent Strictly on Backend Plan Status */}
            <div className="flex items-center gap-2 font-mono">
              {plan?.status === 'executed' ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/validation?id=${activeDatasetId}`}
                    className="px-4 py-2.5 bg-[#7E454B] hover:bg-[#6A393E] text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    [ VIEW VALIDATION REPORT ]
                  </Link>
                  <Link
                    to={`/history?id=${activeDatasetId}`}
                    className="px-4 py-2.5 bg-[#F6F4F0] dark:bg-[#222026] hover:bg-[#EFECE6] dark:hover:bg-[#2A2730] text-[#2B2827] dark:text-[#F0EDEA] font-bold rounded-lg text-xs flex items-center gap-2 transition-all border border-[#E5E0D8] dark:border-[#29262C]"
                  >
                    <History className="w-4 h-4 text-[#6E6966] dark:text-[#9E9793]" />
                    [ VIEW VERSION HISTORY ]
                  </Link>
                </div>
              ) : plan?.status === 'approved' ? (
                <button
                  onClick={handleExecutePlan}
                  disabled={executing}
                  className="px-5 py-2.5 bg-[#7E454B] hover:bg-[#6A393E] text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all border border-[#7E454B] disabled:opacity-50"
                >
                  {executing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Executing & Validating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-white" />
                      [ EXECUTE PLAN & COMMIT VERSION ]
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleRunPreview}
                  disabled={previewing || selectedIndices.size === 0}
                  className="px-5 py-2.5 bg-[#7E454B] hover:bg-[#6A393E] text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all border border-[#7E454B] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {previewing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Simulating Dry Run...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-white" />
                      [ PREVIEW SELECTED CHANGES ]
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Zero Selection Warning */}
          {selectedIndices.size === 0 && (
            <div className="p-4 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-600 dark:text-amber-400 text-xs font-mono font-semibold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Select at least one transformation to proceed to dry run preview.</span>
            </div>
          )}

          {/* Selection Toolbar & Recommendations Table */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl overflow-hidden">
            <div className="p-4 bg-[#F6F4F0] dark:bg-[#222026] border-b border-[#E5E0D8] dark:border-[#29262C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm flex items-center gap-2 uppercase tracking-wide">
                  <Layers className="w-4 h-4 text-[#7E454B] dark:text-[#9E5A61]" />
                  Recommended Transformations
                </h3>
                <span className="px-2.5 py-0.5 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] text-[#7E454B] dark:text-[#9E5A61] rounded-md text-xs font-mono font-bold">
                  {selectedIndices.size} OF {recommendations.length} SELECTED
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <button
                  onClick={allSelected ? handleClearAll : handleSelectAll}
                  className="px-3 py-1.5 bg-white dark:bg-[#19181C] hover:bg-[#EFECE6] dark:hover:bg-[#2A2730] border border-[#E5E0D8] dark:border-[#29262C] text-[#2B2827] dark:text-[#F0EDEA] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {allSelected ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5 text-[#7E454B] dark:text-[#9E5A61]" />}
                  <span>{allSelected ? '[ CLEAR ALL ]' : '[ SELECT ALL ]'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#2B2827] dark:text-[#F0EDEA]">
                <thead className="bg-[#F6F4F0] dark:bg-[#222026] text-[#6E6966] dark:text-[#9E9793] font-mono uppercase font-bold text-[10px] tracking-wider border-b border-[#E5E0D8] dark:border-[#29262C]">
                  <tr>
                    <th className="py-3 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={allSelected ? handleClearAll : handleSelectAll}
                        className="w-4 h-4 rounded bg-white dark:bg-[#121114] border-[#E5E0D8] dark:border-[#29262C] text-[#7E454B] focus:ring-0 cursor-pointer"
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
                <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#29262C] font-sans">
                  {recommendations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-[#6E6966] dark:text-[#9E9793] italic font-mono">
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
                            isChecked ? 'bg-[#7E454B]/5 dark:bg-[#7E454B]/20' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelection(idx)}
                              className="w-4 h-4 rounded border-[#E5E0D8] dark:border-[#29262C] text-[#7E454B] focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#6E6966] dark:text-[#9E9793] font-bold">{displayNum}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#2B2827] dark:text-[#F0EDEA]">{item.column}</td>
                          <td className="py-3 px-4 font-mono">
                            <span className="px-2 py-0.5 bg-[#7E454B] text-white border border-[#7E454B] text-[11px] font-bold uppercase rounded-md">
                              {item.operation}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-sm text-[#2B2827] dark:text-[#F0EDEA] leading-normal">{item.reason}</td>
                          <td className="py-3 px-4 font-mono text-[#7E454B] dark:text-[#9E5A61] font-bold">
                            {(item.confidence * 100).toFixed(0)}%
                          </td>
                          <td className="py-3 px-4">{renderRiskBadge(item.risk)}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#6E6966] dark:text-[#9E9793]">
                            {Object.keys(item.parameters || {}).length > 0 ? (
                              JSON.stringify(item.parameters)
                            ) : (
                              <span className="text-[#9E9793]">None</span>
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
              <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-mono font-bold text-[#2B2827] dark:text-[#F0EDEA] uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#7E454B] dark:text-[#9E5A61]" />
                  DETERMINISTIC INFORMATION LOSS PREVIEW ({selectedIndices.size} SELECTED TRANSFORMATIONS)
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono">
                  <div className="p-3 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg text-center">
                    <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-bold">Rows Affected</span>
                    <span className="text-lg font-bold text-[#2B2827] dark:text-[#F0EDEA]">{preview.loss_summary.rows_affected}</span>
                  </div>
                  <div className="p-3 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg text-center">
                    <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-bold">Cells Changed</span>
                    <span className="text-lg font-bold text-[#7E454B] dark:text-[#9E5A61]">{preview.loss_summary.cells_changed}</span>
                  </div>
                  <div className="p-3 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg text-center">
                    <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-bold">Rows Removed</span>
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{preview.loss_summary.rows_removed}</span>
                  </div>
                  <div className="p-3 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg text-center">
                    <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-bold">Values Nullified</span>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{preview.loss_summary.values_nullified}</span>
                  </div>
                  <div className="p-3 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg text-center">
                    <span className="text-[10px] text-[#6E6966] dark:text-[#9E9793] block uppercase font-bold">Affected Cols</span>
                    <span className="text-lg font-bold text-[#2B2827] dark:text-[#F0EDEA]">{preview.loss_summary.columns_affected.length}</span>
                  </div>
                  <div className="p-3 bg-[#7E454B] border border-[#7E454B] rounded-lg text-center text-white">
                    <span className="text-[10px] text-white/80 block uppercase font-bold">Loss Index</span>
                    <span className="text-xl font-bold">{preview.loss_summary.estimated_loss_score}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval & Execution Gate Section */}
          <div className="p-6 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#7E454B] dark:text-[#9E5A61] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm uppercase tracking-wide">
                  APPROVAL & EXECUTION AUTHORIZATION GATE
                </h4>
                <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] mt-1 leading-relaxed">
                  {plan?.status === 'approved'
                    ? 'Cleaning plan has been APPROVED by human operator. Execution will apply deterministic transformations, run automated test suite, and commit a new Parquet version.'
                    : plan?.status === 'executed'
                    ? 'Cleaning plan has been EXECUTED and committed to version storage.'
                    : `Approval authorizes the ${selectedIndices.size} selected transformation(s) for execution after dry-run preview simulation.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D8] dark:border-[#29262C] font-mono">
              {plan?.status === 'executed' ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-4 h-4" /> PLAN EXECUTED & VERSION COMMITTED
                  </span>
                </div>
              ) : plan?.status === 'approved' ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-4 h-4" /> PLAN APPROVED & AUTHORIZED FOR EXECUTION
                  </span>
                  <button
                    onClick={handleExecutePlan}
                    disabled={executing}
                    className="px-6 py-2.5 bg-[#7E454B] hover:bg-[#6A393E] text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all border border-[#7E454B] disabled:opacity-50"
                  >
                    {executing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Executing & Validating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-white" />
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
                    className="px-4 py-2 bg-rose-500/10 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    [ REJECT PLAN ]
                  </button>

                  <div className="flex items-center gap-3">
                    {!preview && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium italic">
                        Run dry run preview above before approving plan.
                      </span>
                    )}
                    <button
                      onClick={handleApprovePlan}
                      disabled={!preview || approving || plan?.status === 'approved' || plan?.status === 'executed'}
                      className="px-6 py-2.5 bg-[#7E454B] hover:bg-[#6A393E] text-white font-bold rounded-lg text-xs flex items-center gap-2 transition-all border border-[#7E454B] disabled:opacity-50"
                    >
                      {approving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
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
