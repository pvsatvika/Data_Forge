import React from 'react';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { Database, ShieldAlert, Cpu, Server, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="profile" />

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Enterprise Data Forge Platform</h2>
            <p className="text-slate-400 max-w-3xl leading-relaxed text-sm">
              Autonomous data profiling, semantic constraint inference, risk-classified reversible transformations, and automated validation suite for enterprise datasets.
            </p>
          </div>
          <Link
            to="/datasets"
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-colors shadow-lg shadow-sky-600/20"
          >
            <Database className="w-4 h-4" />
            Upload Dataset
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">LLM Boundary Enforcement</h3>
              <span className="text-xs text-emerald-400 font-medium">Strict Security Model</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The AI inferencing engine produces JSON cleaning declarations. Code executes exclusively through registered, allow-listed Python functions.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Groq AI Semantic Inference</h3>
              <span className="text-xs text-sky-400 font-medium">Llama 3.3 70B</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Infers missing constraints, column semantics, phone/email formats, and category mappings from compact profile metadata.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Reversibility & Audit</h3>
              <span className="text-xs text-amber-400 font-medium">Immutable Storage</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Raw datasets remain untouched. Cleaned versions stored as versioned Parquet with itemized change logs for instant rollback.
          </p>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Architecture Initialization Checklist
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 flex justify-between items-center">
            <span>FastAPI Server & Modular Architecture</span>
            <span className="text-emerald-400 font-semibold">INITIALIZED</span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 flex justify-between items-center">
            <span>React + Vite + Tailwind Frontend</span>
            <span className="text-emerald-400 font-semibold">INITIALIZED</span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 flex justify-between items-center">
            <span>Health Check API Endpoint</span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 flex justify-between items-center">
            <span>Allow-listed Operations Registry</span>
            <span className="text-emerald-400 font-semibold">READY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
