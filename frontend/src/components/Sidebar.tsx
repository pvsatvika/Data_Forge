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
    <aside className="w-60 bg-white border-r border-[#3A3A38]/20 p-4 flex flex-col justify-between select-none">
      <nav className="space-y-1">
        <div className="px-2 py-1.5 font-mono text-[10px] font-bold text-[#5A5A55] uppercase tracking-widest border-b border-[#3A3A38]/10 mb-2">
          OPERATIONAL PIPELINE
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 text-xs font-medium transition-all rounded-none border ${
                  isActive
                    ? 'bg-[#1A3C2B] text-white border-[#1A3C2B] font-semibold'
                    : 'text-[#5A5A55] border-transparent hover:bg-[#F7F7F5] hover:text-[#181816]'
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
      <div className="p-3 bg-[#F7F7F5] border border-[#3A3A38]/20 space-y-1.5 font-mono text-[10px]">
        <div className="flex items-center gap-1.5 text-[#1A3C2B] font-bold uppercase tracking-wider">
          <SlidersHorizontal className="w-3 h-3" />
          SAFETY GATEWAY
        </div>
        <p className="text-[#5A5A55] leading-normal font-sans text-[11px]">
          AI models generate declarative recommendations. Execution is strictly restricted to allow-listed Python functions following human approval.
        </p>
      </div>
    </aside>
  );
};
