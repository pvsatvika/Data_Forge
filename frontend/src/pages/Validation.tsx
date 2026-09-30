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
        return <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> PASS</span>;
      case 'WARN':
        return <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> WARN</span>;
      case 'FAIL':
        return <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> FAIL</span>;
    }
  };

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="validate" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            Automated Post-Transformation Test Suite
          </h2>
          <p className="text-xs text-slate-400">Schema preservation, null checks, uniqueness, format patterns, and data loss integrity.</p>
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
            Load Report
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <h3 className="font-semibold text-white text-sm">Running Automated Validation Checks...</h3>
          <p className="text-xs text-slate-400 mt-1">Verifying schema preservation, format rules, and loss boundaries.</p>
        </div>
      )}

      {!loading && !activeDatasetId && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-200 mb-1">No Active Dataset Loaded</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Select an executed dataset to review post-transformation validation results.
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

      {!loading && validation && (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400 font-mono">Validation ID: {validation.validation_id}</span>
                <span className="text-xs text-slate-400 font-mono">Plan ID: {validation.plan_id}</span>
              </div>
              <h3 className="font-bold text-white text-base">Automated Validation Report</h3>
            </div>
            {renderStatusBadge(validation.overall_status)}
          </div>

          {/* Validation Checks Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                Executed Validation Checks ({validation.checks.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">Check Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Expected Condition</th>
                    <th className="py-3 px-4">Actual Result</th>
                    <th className="py-3 px-4">Explanation / Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {validation.checks.map((chk: ValidationCheckItem, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-700/20">
                      <td className="py-3 px-4 font-mono font-bold text-white">{chk.check_name}</td>
                      <td className="py-3 px-4">{renderStatusBadge(chk.status)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded font-mono text-[10px] uppercase">
                          {chk.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{chk.expected}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{chk.actual}</td>
                      <td className="py-3 px-4 text-slate-400">{chk.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-400">
              View versioned Parquet states, download clean CSV, or manage reversibility in Dataset History.
            </span>
            <Link
              to={`/history?id=${validation.dataset_id}`}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-sky-600/20"
            >
              View Version History & Rollback
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
