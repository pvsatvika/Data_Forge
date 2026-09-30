import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  BrainCircuit,
  FileCheck2,
  Eye,
  ShieldCheck,
  History
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Datasets', path: '/datasets', icon: Database },
  { name: 'Profile', path: '/profile', icon: BarChart3 },
  { name: 'AI Analysis', path: '/analysis', icon: BrainCircuit },
  { name: 'Cleaning Plan', path: '/plan', icon: FileCheck2 },
  { name: 'Preview & Loss', path: '/preview', icon: Eye },
  { name: 'Validation', path: '/validation', icon: ShieldCheck },
  { name: 'History & Rollback', path: '/history', icon: History },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-800/50 border-r border-slate-700/60 p-4 flex flex-col justify-between">
      <nav className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Platform Workspace
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/50 text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300">Hackathon Core Principle</div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Strict deterministic execution boundary. AI generates plans; allow-listed Python functions execute.
        </p>
      </div>
    </aside>
  );
};
