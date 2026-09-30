import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { WorkflowStepper } from '../components/WorkflowStepper';
import {
  BrainCircuit,
  AlertCircle,
  Loader2,
  Database,
  Search,
  Sparkles,
  ShieldAlert,
  Info,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { apiService } from '../services/api';
import { SemanticAnalysisResponse } from '../types';

export const AIAnalysis: React.FC = () => {
  const { datasetId } = useParams<{ datasetId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetIdFromUrl = datasetId || searchParams.get('id') || '';

  const [inputDatasetId, setInputDatasetId] = useState<string>(datasetIdFromUrl);
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasetIdFromUrl);
  const [analysis, setAnalysis] = useState<SemanticAnalysisResponse | null>(null);
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
      .getAnalysis(activeDatasetId)
      .then((data) => {
        setAnalysis(data);
        setLoading(false);
      })
      .catch(() => {
        setAnalysis(null);
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

  const handleRunAnalysis = async () => {
    if (!activeDatasetId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.analyzeDataset(activeDatasetId);
      setAnalysis(result);
      setLoading(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to complete AI semantic analysis.';
      setError(msg);
      setLoading(false);
    }
  };

  const renderRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">LOW RISK</span>;
      case 'medium':
        return <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded-md bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">MEDIUM RISK</span>;
      case 'high':
        return <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded-md bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">HIGH RISK</span>;
    }
  };

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="understand" />

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-150">
        <div>
          <div className="font-mono text-[10px] font-bold text-[#7E454B] dark:text-[#9E5A61] uppercase tracking-widest mb-1">
            GROQ AI SEMANTIC INFERENCE
          </div>
          <h2 className="font-grotesk font-bold text-2xl text-[#2B2827] dark:text-[#F0EDEA] flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[#7E454B] dark:text-[#9E5A61]" />
            AI Semantic Analysis & Constraint Inference
          </h2>
          <p className="text-xs text-[#6E6966] dark:text-[#9E9793] mt-1 font-sans">
            AI infers semantic constraints from compact statistical profile metadata. Recommendations are declarative suggestions validated before execution.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 font-mono">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter Dataset ID (e.g. ds_...)"
              value={inputDatasetId}
              onChange={(e) => setInputDatasetId(e.target.value)}
              className="bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg text-xs text-[#2B2827] dark:text-[#F0EDEA] px-3 py-1.5 pl-8 w-60 focus:outline-none focus:border-[#7E454B] dark:focus:border-[#9E5A61]"
            />
            <Search className="w-3.5 h-3.5 text-[#6E6966] dark:text-[#9E9793] absolute left-2.5 top-2" />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#F6F4F0] dark:bg-[#222026] hover:bg-[#EFECE6] dark:hover:bg-[#2A2730] text-[#2B2827] dark:text-[#F0EDEA] text-xs font-bold uppercase rounded-lg border border-[#E5E0D8] dark:border-[#29262C] transition-colors"
          >
            Load Dataset
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 font-mono text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <div>
            <span className="font-bold block uppercase">AI ANALYSIS ERROR</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-12 text-center font-mono text-xs text-[#6E6966] dark:text-[#9E9793]">
          <Loader2 className="w-6 h-6 text-[#7E454B] dark:text-[#9E5A61] animate-spin mx-auto mb-2" />
          <span className="font-bold block text-[#2B2827] dark:text-[#F0EDEA] text-sm">GROQ AI ANALYZING PROFILE METADATA...</span>
          <span className="text-[11px]">Inferring column semantics, enterprise constraints, and generating recommendations.</span>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-10 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#6E6966] dark:text-[#9E9793] mx-auto" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-base">No Dataset Selected</h3>
          <p className="text-xs text-[#6E6966] dark:text-[#9E9793] max-w-md mx-auto font-sans">
            Select an ingested dataset to trigger Groq AI semantic constraint inference.
          </p>
          <Link
            to="/datasets"
            className="px-4 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold uppercase rounded-lg inline-flex items-center gap-2 border border-[#7E454B] transition-colors"
          >
            <Database className="w-4 h-4" />
            Go to Dataset Ingestion
          </Link>
        </div>
      )}

      {!loading && activeDatasetId && !analysis && !error && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-10 text-center space-y-4">
          <div className="w-10 h-10 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg mx-auto flex items-center justify-center text-[#7E454B] dark:text-[#9E5A61]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-lg">Ready for AI Semantic Analysis</h3>
            <p className="font-mono text-xs text-[#7E454B] dark:text-[#9E5A61] font-bold mt-1">DATASET ID: {activeDatasetId}</p>
            <p className="text-xs text-[#6E6966] dark:text-[#9E9793] max-w-md mx-auto mt-2 font-sans">
              The AI engine analyzes statistical profile metadata without modifying raw uploaded files or running arbitrary code.
            </p>
          </div>
          <button
            onClick={handleRunAnalysis}
            className="px-6 py-2.5 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold uppercase rounded-lg inline-flex items-center gap-2 border border-[#7E454B] transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Run Groq AI Analysis
          </button>
        </div>
      )}

      {!loading && analysis && (
        <div className="space-y-6">
          {/* Explicit Boundary Separation Callout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-4 bg-white dark:bg-[#19181C] border border-[#7E454B]/40 dark:border-[#9E5A61]/40 rounded-xl space-y-1">
              <span className="font-bold text-[#7E454B] dark:text-[#9E5A61] uppercase text-[10px] block">SUBSYSTEM 1: AI SEMANTIC INSIGHT</span>
              <p className="font-sans text-[11px] text-[#6E6966] dark:text-[#9E9793] leading-normal">
                Generates declarative recommendations from profile metadata using Llama 3.3 70B via Groq API.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl space-y-1">
              <span className="font-bold text-[#2B2827] dark:text-[#F0EDEA] uppercase text-[10px] block">SUBSYSTEM 2: DETERMINISTIC EXECUTION</span>
              <p className="font-sans text-[11px] text-[#6E6966] dark:text-[#9E9793] leading-normal">
                Validates recommendations against allow-listed Python functions. Code executes only after human approval.
              </p>
            </div>
          </div>

          {/* Analysis Overview Header */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-[#F6F4F0] dark:bg-[#222026] text-[#7E454B] dark:text-[#9E5A61] border border-[#E5E0D8] dark:border-[#29262C] rounded-md text-[10px] font-bold uppercase">
                  MODEL: {analysis.model_used}
                </span>
                <span className="text-xs text-[#6E6966] dark:text-[#9E9793]">DATASET ID: {analysis.dataset_id}</span>
              </div>
              <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-base">Structured AI Semantic Analysis Report</h3>
            </div>
            <button
              onClick={handleRunAnalysis}
              className="px-4 py-2 bg-[#F6F4F0] dark:bg-[#222026] hover:bg-[#EFECE6] dark:hover:bg-[#2A2730] text-[#2B2827] dark:text-[#F0EDEA] text-xs font-bold uppercase rounded-lg border border-[#E5E0D8] dark:border-[#29262C] flex items-center gap-2 transition-colors self-start md:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#7E454B] dark:text-[#9E5A61]" />
              Re-run Analysis
            </button>
          </div>

          {/* Dataset Summary */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-5 space-y-2">
            <h4 className="font-mono text-xs font-bold text-[#7E454B] dark:text-[#9E5A61] uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" />
              AI Dataset Overview & Semantic Summary
            </h4>
            <div className="p-4 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg font-mono text-xs text-[#2B2827] dark:text-[#F0EDEA] leading-relaxed">
              {analysis.dataset_summary}
            </div>
          </div>

          {/* Recommendations & Constraints Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inferred Constraints */}
            <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-5 space-y-4">
              <h4 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#7E454B] dark:text-[#9E5A61]" />
                Inferred Constraints ({analysis.inferred_constraints.length})
              </h4>
              {analysis.inferred_constraints.length === 0 ? (
                <p className="text-xs text-[#6E6966] dark:text-[#9E9793] italic font-mono p-4 bg-[#F6F4F0] dark:bg-[#222026] rounded-lg">No specific constraints inferred.</p>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {analysis.inferred_constraints.map((c, idx) => (
                    <div key={idx} className="p-3.5 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2B2827] dark:text-[#F0EDEA] bg-white dark:bg-[#19181C] px-2 py-0.5 border border-[#E5E0D8] dark:border-[#29262C] rounded-md">
                          COLUMN: {c.column}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          CONFIDENCE: {(c.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#7E454B] dark:text-[#9E5A61] uppercase block">
                        TYPE: {c.constraint_type}
                      </span>
                      <p className="font-sans text-xs text-[#6E6966] dark:text-[#9E9793] leading-normal">{c.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-5 space-y-4">
              <h4 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7E454B] dark:text-[#9E5A61]" />
                Cleaning Recommendations ({analysis.recommendations.length})
              </h4>
              {analysis.recommendations.length === 0 ? (
                <p className="text-xs text-[#6E6966] dark:text-[#9E9793] italic font-mono p-4 bg-[#F6F4F0] dark:bg-[#222026] rounded-lg">No cleaning recommendations required.</p>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {analysis.recommendations.map((r, idx) => (
                    <div key={idx} className="p-3.5 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2B2827] dark:text-[#F0EDEA] bg-white dark:bg-[#19181C] px-2 py-0.5 border border-[#E5E0D8] dark:border-[#29262C] rounded-md">
                            {r.column}
                          </span>
                          <span className="px-2 py-0.5 bg-[#7E454B] text-white font-bold text-[10px] uppercase rounded-md">
                            {r.operation}
                          </span>
                        </div>
                        {renderRiskBadge(r.risk)}
                      </div>
                      <p className="font-sans text-xs text-[#2B2827] dark:text-[#F0EDEA] leading-normal">{r.reason}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D8] dark:border-[#29262C] text-[10px] text-[#6E6966] dark:text-[#9E9793]">
                        <span>CONFIDENCE: {(r.confidence * 100).toFixed(0)}%</span>
                        <span className="text-[#7E454B] dark:text-[#9E5A61] font-bold">ALLOW-LISTED FUNCTION</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
            <span className="text-xs text-[#6E6966] dark:text-[#9E9793]">
              Proceed to Cleaning Plan generation to select transformations and run dry-run previews.
            </span>
            <Link
              to={`/plan?id=${analysis.dataset_id}`}
              className="px-5 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-bold uppercase rounded-lg flex items-center gap-2 border border-[#7E454B] transition-colors"
            >
              Generate Cleaning Plan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
