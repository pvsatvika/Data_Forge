import React from 'react';
import { Database, ShieldCheck, Activity } from 'lucide-react';
import { HealthStatus } from '../types';

interface NavbarProps {
  health: HealthStatus | null;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ health, loading }) => {
  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-600 rounded-lg text-white">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-wide">DATA FORGE</h1>
          <p className="text-xs text-slate-400">Agentic Enterprise Data Profiling & Rollback</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700 px-3 py-1.5 rounded-full text-xs">
          <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="text-slate-400">API Status:</span>
          {loading ? (
            <span className="text-amber-400">Connecting...</span>
          ) : health?.status === 'ok' ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"></span> Online (v{health.version})
            </span>
          ) : (
            <span className="text-rose-400 font-medium">Offline</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-700 pl-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>LLM Decides — Code Executes</span>
        </div>
      </div>
    </header>
  );
};
