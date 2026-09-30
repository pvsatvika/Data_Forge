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
        return <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase bg-[#9EFFBF]/30 text-[#1A3C2B] border border-[#1A3C2B]/30">LOW RISK</span>;
      case 'medium':
        return <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase bg-[#F4D35E]/30 text-[#D97706] border border-[#D97706]/30">MEDIUM RISK</span>;
      case 'high':
        return <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase bg-[#FF8C69]/30 text-[#E06B48] border border-[#E06B48]/30">HIGH RISK</span>;
    }
  };

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="understand" />

      {/* Header Banner */}
      <div className="bg-white border border-[#3A3A38]/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] font-bold text-[#1A3C2B] uppercase tracking-widest mb-1">
            GROQ AI SEMANTIC INFERENCE
          </div>
          <h2 className="font-grotesk font-bold text-2xl text-[#181816] flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[#1A3C2B]" />
            AI Semantic Analysis & Constraint Inference
          </h2>
          <p className="text-xs text-[#5A5A55] mt-1 font-sans">
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
              className="bg-[#F7F7F5] border border-[#3A3A38]/20 text-xs text-[#181816] px-3 py-1.5 pl-8 w-60 focus:outline-none focus:border-[#1A3C2B]"
            />
            <Search className="w-3.5 h-3.5 text-[#5A5A55] absolute left-2.5 top-2" />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#F7F7F5] hover:bg-[#EFEFEA] text-[#181816] text-xs font-bold uppercase border border-[#3A3A38]/20 transition-colors"
          >
            Load Dataset
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-[#FF8C69]/10 border border-[#FF8C69]/40 text-[#E06B48] font-mono text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <div>
            <span className="font-bold block uppercase">AI ANALYSIS ERROR</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-[#3A3A38]/20 p-12 text-center font-mono text-xs text-[#5A5A55]">
          <Loader2 className="w-6 h-6 text-[#1A3C2B] animate-spin mx-auto mb-2" />
          <span className="font-bold block text-[#181816] text-sm">GROQ AI ANALYZING PROFILE METADATA...</span>
          <span className="text-[11px]">Inferring column semantics, enterprise constraints, and generating recommendations.</span>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white border border-[#3A3A38]/20 p-10 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#5A5A55] mx-auto" />
          <h3 className="font-grotesk font-bold text-[#181816] text-base">No Dataset Selected</h3>
          <p className="text-xs text-[#5A5A55] max-w-md mx-auto font-sans">
            Select an ingested dataset to trigger Groq AI semantic constraint inference.
          </p>
          <Link
            to="/datasets"
            className="px-4 py-2 bg-[#1A3C2B] text-white font-mono text-xs font-bold uppercase inline-flex items-center gap-2 border border-[#1A3C2B]"
          >
            <Database className="w-4 h-4" />
            Go to Dataset Ingestion
          </Link>
        </div>
      )}

      {!loading && activeDatasetId && !analysis && !error && (
        <div className="bg-white border border-[#3A3A38]/20 p-10 text-center space-y-4">
          <div className="w-10 h-10 bg-[#F7F7F5] border border-[#3A3A38]/20 mx-auto flex items-center justify-center text-[#1A3C2B]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-grotesk font-bold text-[#181816] text-lg">Ready for AI Semantic Analysis</h3>
            <p className="font-mono text-xs text-[#1A3C2B] font-bold mt-1">DATASET ID: {activeDatasetId}</p>
            <p className="text-xs text-[#5A5A55] max-w-md mx-auto mt-2 font-sans">
              The AI engine analyzes statistical profile metadata without modifying raw uploaded files or running arbitrary code.
            </p>
          </div>
          <button
            onClick={handleRunAnalysis}
            className="px-6 py-2.5 bg-[#1A3C2B] hover:bg-[#122C1F] text-white font-mono text-xs font-bold uppercase inline-flex items-center gap-2 border border-[#1A3C2B] transition-colors"
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
            <div className="p-4 bg-white border border-[#1A3C2B]/40 space-y-1">
              <span className="font-bold text-[#1A3C2B] uppercase text-[10px] block">SUBSYSTEM 1: AI SEMANTIC INSIGHT</span>
              <p className="font-sans text-[11px] text-[#5A5A55] leading-normal">
                Generates declarative recommendations from profile metadata using Llama 3.3 70B via Groq API.
              </p>
            </div>
            <div className="p-4 bg-white border border-[#3A3A38]/20 space-y-1">
              <span className="font-bold text-[#181816] uppercase text-[10px] block">SUBSYSTEM 2: DETERMINISTIC EXECUTION</span>
              <p className="font-sans text-[11px] text-[#5A5A55] leading-normal">
                Validates recommendations against allow-listed Python functions. Code executes only after human approval.
              </p>
            </div>
          </div>

          {/* Analysis Overview Header */}
          <div className="bg-white border border-[#3A3A38]/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-[#F7F7F5] text-[#1A3C2B] border border-[#3A3A38]/20 text-[10px] font-bold uppercase">
                  MODEL: {analysis.model_used}
                </span>
                <span className="text-xs text-[#5A5A55]">DATASET ID: {analysis.dataset_id}</span>
              </div>
              <h3 className="font-grotesk font-bold text-[#181816] text-base">Structured AI Semantic Analysis Report</h3>
            </div>
            <button
              onClick={handleRunAnalysis}
              className="px-4 py-2 bg-[#F7F7F5] hover:bg-[#EFEFEA] text-[#181816] text-xs font-bold uppercase border border-[#3A3A38]/20 flex items-center gap-2 transition-colors self-start md:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1A3C2B]" />
              Re-run Analysis
            </button>
          </div>

          {/* Dataset Summary */}
          <div className="bg-white border border-[#3A3A38]/20 p-5 space-y-2">
            <h4 className="font-mono text-xs font-bold text-[#1A3C2B] uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" />
              AI Dataset Overview & Semantic Summary
            </h4>
            <div className="p-4 bg-[#F7F7F5] border border-[#3A3A38]/15 font-mono text-xs text-[#181816] leading-relaxed">
              {analysis.dataset_summary}
            </div>
          </div>

          {/* Recommendations & Constraints Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inferred Constraints */}
            <div className="bg-white border border-[#3A3A38]/20 p-5 space-y-4">
              <h4 className="font-grotesk font-bold text-[#181816] text-sm uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#1A3C2B]" />
                Inferred Constraints ({analysis.inferred_constraints.length})
              </h4>
              {analysis.inferred_constraints.length === 0 ? (
                <p className="text-xs text-[#8C8C85] italic font-mono p-4 bg-[#F7F7F5]">No specific constraints inferred.</p>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {analysis.inferred_constraints.map((c, idx) => (
                    <div key={idx} className="p-3.5 bg-[#F7F7F5] border border-[#3A3A38]/15 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#181816] bg-white px-2 py-0.5 border border-[#3A3A38]/20">
                          COLUMN: {c.column}
                        </span>
                        <span className="text-[10px] text-[#059669] font-bold">
                          CONFIDENCE: {(c.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#1A3C2B] uppercase block">
                        TYPE: {c.constraint_type}
                      </span>
                      <p className="font-sans text-xs text-[#5A5A55] leading-normal">{c.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            <div className="bg-white border border-[#3A3A38]/20 p-5 space-y-4">
              <h4 className="font-grotesk font-bold text-[#181816] text-sm uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1A3C2B]" />
                Cleaning Recommendations ({analysis.recommendations.length})
              </h4>
              {analysis.recommendations.length === 0 ? (
                <p className="text-xs text-[#8C8C85] italic font-mono p-4 bg-[#F7F7F5]">No cleaning recommendations required.</p>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {analysis.recommendations.map((r, idx) => (
                    <div key={idx} className="p-3.5 bg-[#F7F7F5] border border-[#3A3A38]/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#181816] bg-white px-2 py-0.5 border border-[#3A3A38]/20">
                            {r.column}
                          </span>
                          <span className="px-2 py-0.5 bg-[#1A3C2B] text-white font-bold text-[10px] uppercase">
                            {r.operation}
                          </span>
                        </div>
                        {renderRiskBadge(r.risk)}
                      </div>
                      <p className="font-sans text-xs text-[#181816] leading-normal">{r.reason}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#3A3A38]/10 text-[10px] text-[#5A5A55]">
                        <span>CONFIDENCE: {(r.confidence * 100).toFixed(0)}%</span>
                        <span className="text-[#1A3C2B] font-bold">ALLOW-LISTED FUNCTION</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 bg-white border border-[#3A3A38]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
            <span className="text-xs text-[#5A5A55]">
              Proceed to Cleaning Plan generation to select transformations and run dry-run previews.
            </span>
            <Link
              to={`/plan?id=${analysis.dataset_id}`}
              className="px-5 py-2 bg-[#1A3C2B] hover:bg-[#122C1F] text-white font-mono text-xs font-bold uppercase flex items-center gap-2 border border-[#1A3C2B] transition-colors"
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
