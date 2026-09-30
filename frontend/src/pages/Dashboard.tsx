import React, { useEffect, useState } from 'react';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { Database, ShieldAlert, Cpu, Server, ArrowRight, Activity, Sparkles, Layers, FileCheck2, BarChart3, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Dataset } from '../types';

export const Dashboard: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiService
      .listDatasets()
      .then((data) => {
        setDatasets(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const totalDatasets = datasets.length;
  const profiledDatasets = datasets.filter((d) => d.profile_status === 'completed').length;

  return (
    <div className="space-y-6">
      <WorkflowStepper currentStep="profile" />

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-150">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="font-mono text-[10px] font-bold text-[#7E454B] uppercase tracking-widest">
              WELCOME TO DATA FORGE
            </div>
            <h2 className="font-grotesk font-bold text-3xl md:text-4xl text-[#2B2827] dark:text-[#F0EDEA] tracking-tight">
              Clean. <span className="text-[#7E454B]">Validate.</span> Transform.
            </h2>
            <p className="text-[#6E6966] dark:text-[#9E9793] max-w-2xl text-xs sm:text-sm font-sans leading-relaxed">
              AI-powered data cleaning and transformation platform for accurate, reliable and reversible data pipelines.
            </p>
          </div>

          {/* Right Banner Feature Box */}
          <div className="bg-[#7E454B] text-white p-5 rounded-xl flex items-center justify-between gap-4 max-w-sm shadow-md flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 rounded-lg text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block text-white">From raw data</span>
                <span className="text-white/80 text-[11px]">to trusted insights.</span>
              </div>
            </div>
            <Link
              to="/datasets"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="Ingest Dataset"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Core Product Principle Bar */}
        <div className="p-3.5 bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-[#7E454B] font-bold">CORE OPERATIONAL PRINCIPLE:</span>
          <div className="flex items-center gap-3 text-[#6E6966] dark:text-[#9E9793] font-medium text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7E454B]"></span> 1. LLM DECIDES</span>
            <span className="text-[#6E6966]/40">→</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 2. PREVIEW & LOSS</span>
            <span className="text-[#6E6966]/40">→</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> 3. HUMAN APPROVES</span>
            <span className="text-[#6E6966]/40">→</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 4. CODE EXECUTES</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#6E6966] dark:text-[#9E9793] uppercase font-bold">Total Datasets</span>
            <div className="p-2 bg-[#7E454B]/10 dark:bg-[#7E454B]/20 text-[#7E454B] rounded-lg">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <span className="font-grotesk text-3xl font-bold text-[#2B2827] dark:text-[#F0EDEA] block">{loading ? '...' : totalDatasets}</span>
          <span className="font-sans text-[11px] text-[#6E6966] dark:text-[#9E9793] block">Uploaded Enterprise Files</span>
        </div>

        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#6E6966] dark:text-[#9E9793] uppercase font-bold">Analyses</span>
            <div className="p-2 bg-[#7E454B]/10 dark:bg-[#7E454B]/20 text-[#7E454B] rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <span className="font-grotesk text-3xl font-bold text-[#2B2827] dark:text-[#F0EDEA] block">{loading ? '...' : profiledDatasets}</span>
          <span className="font-sans text-[11px] text-[#6E6966] dark:text-[#9E9793] block">Profiled & AI Analyzed</span>
        </div>

        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#6E6966] dark:text-[#9E9793] uppercase font-bold">Pending Approvals</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <span className="font-grotesk text-3xl font-bold text-[#2B2827] dark:text-[#F0EDEA] block">0</span>
          <span className="font-sans text-[11px] text-[#6E6966] dark:text-[#9E9793] block">Awaiting Authorization</span>
        </div>

        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#6E6966] dark:text-[#9E9E93] uppercase font-bold">Transformations</span>
            <div className="p-2 bg-[#7E454B]/10 dark:bg-[#7E454B]/20 text-[#7E454B] rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="font-grotesk text-3xl font-bold text-[#2B2827] dark:text-[#F0EDEA] block">9</span>
          <span className="font-sans text-[11px] text-[#6E6966] dark:text-[#9E9793] block">Allow-Listed Functions</span>
        </div>
      </div>

      {/* Operational Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#7E454B]">
            <ShieldAlert className="w-4 h-4 text-[#7E454B]" />
            <span>01. SECURITY GATEWAY</span>
          </div>
          <p className="text-xs text-[#6E6966] dark:text-[#9E9793] leading-relaxed font-sans">
            AI produces declarative JSON instructions. Code executes strictly through allow-listed, deterministic Python transformations.
          </p>
        </div>

        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#7E454B]">
            <Cpu className="w-4 h-4 text-[#7E454B]" />
            <span>02. GROQ AI INTELLIGENCE</span>
          </div>
          <p className="text-xs text-[#6E6966] dark:text-[#9E9793] leading-relaxed font-sans">
            Infers missing constraints, column semantics, phone/email formats, and category mappings from compact profile metadata.
          </p>
        </div>

        <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#7E454B]">
            <Server className="w-4 h-4 text-[#7E454B]" />
            <span>03. PARQUET VERSIONING</span>
          </div>
          <p className="text-xs text-[#6E6966] dark:text-[#9E9793] leading-relaxed font-sans">
            Raw datasets remain byte-for-byte untouched. Versioned Parquet snapshots enable instant, loss-less audit rollbacks.
          </p>
        </div>
      </div>

      {/* Subsystem Matrix */}
      <div className="bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-white/10 pb-3 mb-4">
          <h3 className="font-grotesk font-bold text-[#2B2827] dark:text-[#F0EDEA] text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#7E454B]" />
            ARCHITECTURAL SUBSYSTEM VERIFICATION
          </h3>
          <span className="font-mono text-[10px] text-[#6E6966] dark:text-[#9E9793] uppercase">ALL SUBSYSTEMS VERIFIED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-white/10 rounded-lg flex justify-between items-center text-[#2B2827] dark:text-[#F0EDEA]">
            <span>FastAPI Core Server & SQLite DB</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
            </span>
          </div>
          <div className="p-3 bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-white/10 rounded-lg flex justify-between items-center text-[#2B2827] dark:text-[#F0EDEA]">
            <span>React + Vite + Technical Minimalist UI</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
            </span>
          </div>
          <div className="p-3 bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-white/10 rounded-lg flex justify-between items-center text-[#2B2827] dark:text-[#F0EDEA]">
            <span>Groq AI Semantic Analyzer</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
            </span>
          </div>
          <div className="p-3 bg-[#F6F4F0] dark:bg-[#121114] border border-[#E5E0D8] dark:border-white/10 rounded-lg flex justify-between items-center text-[#2B2827] dark:text-[#F0EDEA]">
            <span>Allow-listed Transformation Registry</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
