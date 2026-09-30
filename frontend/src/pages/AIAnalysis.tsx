import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { WorkflowStepper } from '../components/WorkflowStepper';
import {
  BrainCircuit,
  AlertCircle,
  Loader2,
  Database,
  Search,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Info,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { apiService } from '../services/api';
import { SemanticAnalysisResponse } from '../types';

export const AIAnalysis: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetIdFromUrl = searchParams.get('id') || '';

  const [inputDatasetId, setInputDatasetId] = useState<string>(datasetIdFromUrl);
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasetIdFromUrl);
  const [analysis, setAnalysis] = useState<SemanticAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Attempt to load existing analysis on mount or URL change
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
        // If 404, analysis hasn't been triggered yet
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
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">LOW RISK</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">MEDIUM RISK</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">HIGH RISK</span>;
    }
  };

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="understand" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-sky-400" />
            Groq AI Semantic Intelligence
          </h2>
          <p className="text-xs text-slate-400">LLM analyzes statistical metadata to infer constraints and propose allow-listed operations.</p>
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
            Load Dataset
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-1">AI Semantic Analysis Failed</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold text-white text-sm">Groq AI Analyzing Dataset Profile...</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Inferring semantic data types, enterprise constraints, and generating declarative allow-listed recommendations.
          </p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-200 mb-1">No Active Dataset Selected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Select an ingested dataset to run Groq AI semantic constraint inference.
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

      {!loading && activeDatasetId && !analysis && !error && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-10 text-center space-y-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Ready for AI Semantic Analysis</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-mono">
              Dataset ID: {activeDatasetId}
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              The AI engine will analyze statistical profile metadata without modifying raw dataset files or executing arbitrary code.
            </p>
          </div>
          <button
            onClick={handleRunAnalysis}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Analyze with Groq AI
          </button>
        </div>
      )}

      {!loading && analysis && (
        <div className="space-y-6">
          {/* Header Action Banner */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-full text-[11px] font-mono font-semibold flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Model: {analysis.model_used}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {analysis.dataset_id}</span>
              </div>
              <h3 className="font-bold text-white text-base">AI Semantic Analysis Results</h3>
            </div>
            <button
              onClick={handleRunAnalysis}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors self-start md:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Re-run Analysis
            </button>
          </div>

          {/* Dataset Summary */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              AI Dataset Overview & Context
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-lg border border-slate-700/40 font-mono">
              {analysis.dataset_summary}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inferred Constraints */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                AI-Inferred Constraints ({analysis.inferred_constraints.length})
              </h4>
              {analysis.inferred_constraints.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-900/40 rounded-lg">No specific constraints inferred.</p>
              ) : (
                <div className="space-y-3">
                  {analysis.inferred_constraints.map((c, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-900/60 rounded-lg border border-slate-700/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {c.column}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400">
                          Confidence: {(c.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wide">
                        Constraint: {c.constraint_type}
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{c.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                AI Cleaning Recommendations ({analysis.recommendations.length})
              </h4>
              {analysis.recommendations.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-900/40 rounded-lg">No cleaning recommendations required.</p>
              ) : (
                <div className="space-y-3">
                  {analysis.recommendations.map((r, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-900/60 rounded-lg border border-slate-700/40 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {r.column}
                          </span>
                          <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded font-mono font-bold text-[11px]">
                            {r.operation}
                          </span>
                        </div>
                        {renderRiskBadge(r.risk)}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{r.reason}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                        <span>Model Confidence: {(r.confidence * 100).toFixed(0)}%</span>
                        <span>Allow-Listed Function</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Warnings Section */}
          {analysis.warnings.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Data Quality Warnings ({analysis.warnings.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.warnings.map((w, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 rounded-lg border border-amber-500/20 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300 block mb-0.5">{w.type}</span>
                      <p className="text-[11px] text-slate-400">{w.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Call to Action */}
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Proceed to Cleaning Plan generation to configure approval settings and execute dry-run simulation.
            </span>
            <Link
              to={`/plan?id=${analysis.dataset_id}`}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-sky-600/20"
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
