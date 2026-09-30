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
          <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-max">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> PASS
          </span>
        );
      case 'WARN':
        return (
          <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold uppercase bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 w-max">
            <AlertTriangle className="w-3.5 h-3.5" /> WARN
          </span>
        );
      case 'FAIL':
        return (
          <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold uppercase bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5 w-max">
            <XCircle className="w-3.5 h-3.5" /> FAIL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="validate" />

      {/* Header section with technical typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8] dark:border-[#29262C] transition-colors duration-150">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest text-[#6E6966] dark:text-[#9E9793] uppercase">
              // STEP 05: INTEGRITY VALIDATION
            </span>
          </div>
          <h2 className="text-2xl font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#7E454B] dark:text-[#9E5A61]" />
            Automated Post-Transformation Test Suite
          </h2>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] mt-0.5">
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
              className="bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-[#29262C] text-xs font-mono text-[#2B2827] dark:text-[#F0EDEA] px-3 py-2 pl-8 rounded-lg w-64 focus:outline-none focus:border-[#7E454B] dark:focus:border-[#9E5A61]"
            />
            <Search className="w-3.5 h-3.5 text-[#6E6966] dark:text-[#9E9793] absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white font-mono text-xs font-semibold rounded-lg transition-colors border border-[#7E454B]"
          >
            [ LOAD REPORT ]
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-sans">{error}</span>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#7E454B] dark:text-[#9E5A61] animate-spin mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm">Running Automated Validation Checks...</h3>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] mt-1">Verifying schema preservation, format rules, and loss boundaries.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-[#6E6966] dark:text-[#9E9793] mx-auto mb-3" />
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] mb-1">No Active Dataset Loaded</h3>
          <p className="text-xs font-sans text-[#6E6966] dark:text-[#9E9793] max-w-md mx-auto mb-4">
            Select an executed dataset to review post-transformation validation results.
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

      {!loading && validation && (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1 font-mono">
                <span className="text-xs text-[#6E6966] dark:text-[#9E9793]">VALIDATION ID: {validation.validation_id}</span>
                <span className="text-xs text-[#6E6966] dark:text-[#9E9793]">PLAN ID: {validation.plan_id}</span>
              </div>
              <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-base">Automated Validation Report</h3>
            </div>
            {renderStatusBadge(validation.overall_status)}
          </div>

          {/* Validation Checks Table */}
          <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl overflow-hidden">
            <div className="p-4 bg-[#F6F4F0] dark:bg-[#222026] border-b border-[#E5E0D8] dark:border-[#29262C] flex justify-between items-center">
              <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm flex items-center gap-2 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-[#7E454B] dark:text-[#9E5A61]" />
                Executed Validation Checks ({validation.checks.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#2B2827] dark:text-[#F0EDEA] font-sans">
                <thead className="bg-[#F6F4F0] dark:bg-[#222026] text-[#6E6966] dark:text-[#9E9793] font-mono uppercase font-bold text-[10px] tracking-wider border-b border-[#E5E0D8] dark:border-[#29262C]">
                  <tr>
                    <th className="py-3 px-4">Check Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Expected Condition</th>
                    <th className="py-3 px-4">Actual Result</th>
                    <th className="py-3 px-4">Explanation / Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8] dark:divide-[#29262C]">
                  {validation.checks.map((chk: ValidationCheckItem, idx: number) => (
                    <tr key={idx} className="hover:bg-[#F6F4F0] dark:hover:bg-[#222026] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#2B2827] dark:text-[#F0EDEA]">{chk.check_name}</td>
                      <td className="py-3 px-4">{renderStatusBadge(chk.status)}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 bg-[#F6F4F0] dark:bg-[#222026] border border-[#E5E0D8] dark:border-[#29262C] text-[#6E6966] dark:text-[#9E9793] rounded-md text-[10px] uppercase font-bold">
                          {chk.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6E6966] dark:text-[#9E9793]">{chk.expected}</td>
                      <td className="py-3 px-4 font-mono text-[#2B2827] dark:text-[#F0EDEA]">{chk.actual}</td>
                      <td className="py-3 px-4 text-[#6E6966] dark:text-[#9E9793]">{chk.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl flex items-center justify-between font-mono">
            <span className="text-xs text-[#6E6966] dark:text-[#9E9793] font-sans">
              View versioned Parquet states, download clean CSV, or manage reversibility in Dataset History.
            </span>
            <Link
              to={`/history?id=${validation.dataset_id}`}
              className="px-4 py-2 bg-[#7E454B] hover:bg-[#6A393E] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors border border-[#7E454B]"
            >
              [ VIEW VERSION HISTORY & ROLLBACK ]
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
