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
  History,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

const navigation = [
  { name: 'Control Center', path: '/', icon: LayoutDashboard },
  { name: 'Dataset Ingestion', path: '/datasets', icon: Database },
  { name: 'Data Profiler', path: '/profile', icon: BarChart3 },
  { name: 'AI Analysis', path: '/analysis', icon: BrainCircuit },
  { name: 'Cleaning Plan', path: '/plan', icon: FileCheck2 },
  { name: 'Dry Run Preview', path: '/preview', icon: Eye },
  { name: 'Validation Suite', path: '/validation', icon: ShieldCheck },
  { name: 'Version History', path: '/history', icon: History },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 bg-[#F6F4F0] dark:bg-[#121114] border-r border-[#E5E0D8] dark:border-white/10 p-4 flex flex-col justify-between select-none transition-colors duration-150">
      <nav className="space-y-1">
        <div className="px-2 py-1.5 font-mono text-[10px] font-bold text-[#6E6966] dark:text-[#9E9793] uppercase tracking-widest border-b border-[#E5E0D8] dark:border-white/10 mb-2">
          OPERATIONAL PIPELINE
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 text-xs font-medium transition-all rounded-lg ${
                  isActive
                    ? 'bg-[#7E454B] text-white shadow-sm font-semibold'
                    : 'text-[#6E6966] dark:text-[#9E9793] hover:bg-[#EFECE6] dark:hover:bg-[#19181C] hover:text-[#2B2827] dark:hover:text-[#F0EDEA]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-sans tracking-tight">{item.name}</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-40" />
            </NavLink>
          );
        })}
      </nav>

      {/* Principle Callout Card */}
      <div className="p-3.5 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 rounded-xl space-y-1.5 font-mono text-[10px] shadow-sm">
        <div className="flex items-center gap-1.5 text-[#7E454B] font-bold uppercase tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          SAFETY GATEWAY
        </div>
        <p className="text-[#6E6966] dark:text-[#9E9793] leading-normal font-sans text-[11px]">
          AI models generate declarative recommendations. Execution is strictly restricted to allow-listed Python functions following human approval.
        </p>
      </div>
    </aside>
  );
};
