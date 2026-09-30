import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { WorkflowStepper } from '../components/WorkflowStepper';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { apiService } from '../services/api';
import { ValidationReportResponse, ValidationCheckItem } from '../types';

export const ValidationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetIdFromUrl = searchParams.get('id') || '';

  const [inputDatasetId, setInputDatasetId] = useState<string>(datasetIdFromUrl);
  const [activeDatasetId, setActiveDatasetId] = useState<string>(datasetIdFromUrl);

  const [validation, setValidation] = useState<ValidationReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDatasetId) return;

    setLoading(true);
    setError(null);

    apiService
      .getValidation(activeDatasetId)
      .then((data) => {
        setValidation(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'No validation report found for dataset.';
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

  const renderStatusBadge = (status: 'PASS' | 'WARN' | 'FAIL') => {
    switch (status) {
      case 'PASS':
        return (
          <span className="px-2.5 py-1 rounded-none font-mono text-xs font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 w-max">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1A3C2B] dark:text-[#9EFFBF]" /> PASS
          </span>
        );
      case 'WARN':
        return (
          <span className="px-2.5 py-1 rounded-none font-mono text-xs font-bold uppercase bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1.5 w-max">
            <AlertTriangle className="w-3.5 h-3.5" /> WARN
          </span>
        );
      case 'FAIL':
        return (
          <span className="px-2.5 py-1 rounded-none font-mono text-xs font-bold uppercase bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1.5 w-max">
            <XCircle className="w-3.5 h-3.5" /> FAIL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="validate" />

      {/* Header section with technical typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#3A3A38]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest text-[#3A3A38]/60 dark:text-slate-400 uppercase">
              // STEP 05: INTEGRITY VALIDATION
            </span>
          </div>
          <h2 className="text-2xl font-grotesk font-bold text-[#1A1A18] dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1A3C2B] dark:text-[#9EFFBF]" />
            Automated Post-Transformation Test Suite
          </h2>
          <p className="text-xs font-sans text-[#3A3A38]/70 dark:text-slate-400 mt-0.5">
            Schema preservation, null checks, uniqueness, format patterns, and data loss integrity assertions.
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
            [ LOAD REPORT ]
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-none flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-sans">{error}</span>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#1A3C2B] dark:text-[#9EFFBF] animate-spin mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm">Running Automated Validation Checks...</h3>
          <p className="text-xs font-sans text-[#3A3A38]/60 dark:text-slate-400 mt-1">Verifying schema preservation, format rules, and loss boundaries.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-10 text-center">
          <AlertCircle className="w-10 h-10 text-[#3A3A38]/40 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white mb-1">No Active Dataset Loaded</h3>
          <p className="text-xs font-sans text-[#3A3A38]/60 dark:text-slate-400 max-w-md mx-auto mb-4">
            Select an executed dataset to review post-transformation validation results.
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

      {!loading && validation && (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1 font-mono">
                <span className="text-xs text-[#3A3A38]/60 dark:text-slate-400">VALIDATION ID: {validation.validation_id}</span>
                <span className="text-xs text-[#3A3A38]/60 dark:text-slate-400">PLAN ID: {validation.plan_id}</span>
              </div>
              <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-base">Automated Validation Report</h3>
            </div>
            {renderStatusBadge(validation.overall_status)}
          </div>

          {/* Validation Checks Table */}
          <div className="bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none overflow-hidden">
            <div className="p-4 bg-[#F7F7F5] dark:bg-[#1A1A18] border-b border-[#3A3A38]/20 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-grotesk font-bold text-[#1A1A18] dark:text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-[#1A3C2B] dark:text-[#9EFFBF]" />
                Executed Validation Checks ({validation.checks.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1A1A18] dark:text-slate-300 font-sans">
                <thead className="bg-[#F7F7F5] dark:bg-[#121212] text-[#3A3A38]/70 dark:text-slate-400 font-mono uppercase font-bold text-[10px] tracking-wider border-b border-[#3A3A38]/20 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Check Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Expected Condition</th>
                    <th className="py-3 px-4">Actual Result</th>
                    <th className="py-3 px-4">Explanation / Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3A38]/10 dark:divide-slate-800/60">
                  {validation.checks.map((chk: ValidationCheckItem, idx: number) => (
                    <tr key={idx} className="hover:bg-[#F7F7F5] dark:hover:bg-[#1A1A18] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1A1A18] dark:text-white">{chk.check_name}</td>
                      <td className="py-3 px-4">{renderStatusBadge(chk.status)}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 bg-[#F7F7F5] dark:bg-[#1A1A18] border border-[#3A3A38]/20 dark:border-slate-800 text-[#3A3A38] dark:text-slate-300 rounded-none text-[10px] uppercase font-bold">
                          {chk.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#3A3A38] dark:text-slate-300">{chk.expected}</td>
                      <td className="py-3 px-4 font-mono text-[#1A1A18] dark:text-slate-200">{chk.actual}</td>
                      <td className="py-3 px-4 text-[#3A3A38]/70 dark:text-slate-400">{chk.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#121212] border border-[#3A3A38]/20 dark:border-slate-800 rounded-none flex items-center justify-between font-mono">
            <span className="text-xs text-[#3A3A38]/70 dark:text-slate-400 font-sans">
              View versioned Parquet states, download clean CSV, or manage reversibility in Dataset History.
            </span>
            <Link
              to={`/history?id=${validation.dataset_id}`}
              className="px-4 py-2 bg-[#1A3C2B] hover:bg-[#25523b] text-white text-xs font-bold rounded-none flex items-center gap-2 transition-colors"
            >
              [ VIEW VERSION HISTORY & ROLLBACK ]
              <ArrowRight className="w-4 h-4 text-[#9EFFBF]" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
