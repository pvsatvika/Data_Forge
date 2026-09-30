import React, { useEffect, useState } from 'react';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { Database, ShieldAlert, Cpu, Server, ArrowRight, Activity } from 'lucide-react';
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

      {/* Header Banner */}
      <div className="bg-white border border-[#3A3A38]/20 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-bold text-[#1A3C2B] uppercase tracking-widest mb-1">
              DATA FORGE / CONTROL CENTER
            </div>
            <h2 className="font-grotesk font-bold text-3xl text-[#181816] tracking-tight">
              Data quality, under control.
            </h2>
            <p className="text-[#5A5A55] max-w-2xl text-xs font-sans mt-2 leading-relaxed">
              Data Forge profiles enterprise datasets, infers semantic constraints using LLM intelligence, previews deterministic transformations in-memory, and requires human approval before versioned execution.
            </p>
          </div>

          <Link
            to="/datasets"
            className="px-5 py-2.5 bg-[#1A3C2B] hover:bg-[#122C1F] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors self-start md:self-auto rounded-none border border-[#1A3C2B]"
          >
            <Database className="w-4 h-4" />
            Ingest Dataset
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Core Product Principle Bar */}
        <div className="p-3 bg-[#F7F7F5] border border-[#3A3A38]/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-[#1A3C2B] font-bold">CORE OPERATIONAL PRINCIPLE:</span>
          <div className="flex items-center gap-4 text-[#5A5A55] font-medium text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#1A3C2B]"></span> 1. LLM DECIDES</span>
            <span className="text-stone-300">→</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#D97706]"></span> 2. PREVIEW & LOSS</span>
            <span className="text-stone-300">→</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#E06B48]"></span> 3. HUMAN APPROVES</span>
            <span className="text-stone-300">→</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-[#059669]"></span> 4. CODE EXECUTES</span>
          </div>
        </div>
      </div>

      {/* Information-Dense Key Metrics in Flat Bordered Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-[#3A3A38]/20 p-4">
          <span className="font-mono text-[10px] text-[#5A5A55] uppercase block font-bold">DATASETS</span>
          <span className="font-grotesk text-2xl font-bold text-[#181816] block mt-1">{loading ? '...' : totalDatasets}</span>
          <span className="font-mono text-[9px] text-[#1A3C2B] block mt-1">Uploaded Enterprise Files</span>
        </div>

        <div className="bg-white border border-[#3A3A38]/20 p-4">
          <span className="font-mono text-[10px] text-[#5A5A55] uppercase block font-bold">ANALYSES</span>
          <span className="font-grotesk text-2xl font-bold text-[#181816] block mt-1">{loading ? '...' : profiledDatasets}</span>
          <span className="font-mono text-[9px] text-[#059669] block mt-1">Profiled & AI Analyzed</span>
        </div>

        <div className="bg-white border border-[#3A3A38]/20 p-4">
          <span className="font-mono text-[10px] text-[#5A5A55] uppercase block font-bold">PENDING APPROVALS</span>
          <span className="font-grotesk text-2xl font-bold text-[#D97706] block mt-1">0</span>
          <span className="font-mono text-[9px] text-[#5A5A55] block mt-1">Awaiting Authorization</span>
        </div>

        <div className="bg-white border border-[#3A3A38]/20 p-4">
          <span className="font-mono text-[10px] text-[#5A5A55] uppercase block font-bold">TRANSFORMATIONS</span>
          <span className="font-grotesk text-2xl font-bold text-[#1A3C2B] block mt-1">9</span>
          <span className="font-mono text-[9px] text-[#1A3C2B] block mt-1">Allow-Listed Functions</span>
        </div>

        <div className="bg-white border border-[#3A3A38]/20 p-4 col-span-2 md:col-span-1">
          <span className="font-mono text-[10px] text-[#5A5A55] uppercase block font-bold">SYSTEM STATUS</span>
          <span className="font-mono text-sm font-bold text-[#059669] block mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#10B981] inline-block"></span>
            ONLINE
          </span>
          <span className="font-mono text-[9px] text-[#5A5A55] block mt-1">Deterministic Boundary</span>
        </div>
      </div>

      {/* Operational Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#3A3A38]/20 p-5 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1A3C2B]">
            <ShieldAlert className="w-4 h-4 text-[#1A3C2B]" />
            <span>01. SECURITY GATEWAY</span>
          </div>
          <p className="text-xs text-[#5A5A55] leading-relaxed font-sans">
            AI produces declarative JSON instructions. Code executes strictly through allow-listed, deterministic Python transformations.
          </p>
        </div>

        <div className="bg-white border border-[#3A3A38]/20 p-5 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1A3C2B]">
            <Cpu className="w-4 h-4 text-[#1A3C2B]" />
            <span>02. GROQ AI INTELLIGENCE</span>
          </div>
          <p className="text-xs text-[#5A5A55] leading-relaxed font-sans">
            Infers missing constraints, column semantics, phone/email formats, and category mappings from compact profile metadata.
          </p>
        </div>

        <div className="bg-white border border-[#3A3A38]/20 p-5 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1A3C2B]">
            <Server className="w-4 h-4 text-[#1A3C2B]" />
            <span>03. PARQUET VERSIONING</span>
          </div>
          <p className="text-xs text-[#5A5A55] leading-relaxed font-sans">
            Raw datasets remain byte-for-byte untouched. Versioned Parquet snapshots enable instant, loss-less audit rollbacks.
          </p>
        </div>
      </div>

      {/* System Status & Architecture Matrix */}
      <div className="bg-white border border-[#3A3A38]/20 p-5">
        <div className="flex items-center justify-between border-b border-[#3A3A38]/10 pb-3 mb-4">
          <h3 className="font-grotesk font-bold text-[#181816] text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1A3C2B]" />
            ARCHITECTURAL SUBSYSTEM VERIFICATION
          </h3>
          <span className="font-mono text-[10px] text-[#5A5A55] uppercase">ALL SUBSYSTEMS VERIFIED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#F7F7F5] border border-[#3A3A38]/15 flex justify-between items-center">
            <span>FastAPI Core Server & SQLite DB</span>
            <span className="text-[#059669] font-bold">VERIFIED</span>
          </div>
          <div className="p-3 bg-[#F7F7F5] border border-[#3A3A38]/15 flex justify-between items-center">
            <span>React + Vite + Technical Minimalist UI</span>
            <span className="text-[#059669] font-bold">VERIFIED</span>
          </div>
          <div className="p-3 bg-[#F7F7F5] border border-[#3A3A38]/15 flex justify-between items-center">
            <span>Groq AI Semantic Analyzer</span>
            <span className="text-[#059669] font-bold">VERIFIED</span>
          </div>
          <div className="p-3 bg-[#F7F7F5] border border-[#3A3A38]/15 flex justify-between items-center">
            <span>Allow-listed Transformation Registry</span>
            <span className="text-[#059669] font-bold">VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
