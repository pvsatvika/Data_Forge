import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Terminal, LogOut, User as UserIcon } from 'lucide-react';
import { HealthStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  health: HealthStatus | null;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ health, loading }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-14 bg-white border-b border-[#3A3A38]/20 flex items-center justify-between px-6 select-none">
      {/* Brand & Technical Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1A3C2B] text-white flex items-center justify-center rounded-none font-mono font-bold text-sm">
            DF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-grotesk font-bold text-sm text-[#181816] tracking-wider uppercase">
                DATA FORGE
              </h1>
              <span className="font-mono text-[9px] px-1.5 py-0.2 bg-stone-100 text-stone-600 border border-stone-300 uppercase tracking-widest">
                v0.1.0-ENGINEERING
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#5A5A55] tracking-tight">
              DETERMINISTIC DATA CLEANING & REVERSIBILITY SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel Status & Principles */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-[#5A5A55] border-r border-[#3A3A38]/20 pr-4">
          <Terminal className="w-3.5 h-3.5 text-[#1A3C2B]" />
          <span className="tracking-wide">LLM DECIDES · CODE EXECUTES · HUMAN APPROVES</span>
        </div>

        <div className="flex items-center gap-2 bg-[#F7F7F5] border border-[#3A3A38]/20 px-3 py-1 rounded-none font-mono text-[11px]">
          <Activity className="w-3.5 h-3.5 text-[#1A3C2B]" />
          <span className="text-[#5A5A55] uppercase text-[10px]">API:</span>
          {loading ? (
            <span className="text-[#D97706] font-bold">CONNECTING...</span>
          ) : health?.status === 'ok' ? (
            <span className="text-[#1A3C2B] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#10B981] rounded-none inline-block"></span>
              ONLINE
            </span>
          ) : (
            <span className="text-[#E06B48] font-bold">OFFLINE</span>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-[#3A3A38]/20 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-[#181816] max-w-[180px] truncate" title={user.email}>
              <UserIcon className="w-3.5 h-3.5 text-[#1A3C2B] flex-shrink-0" />
              <span className="truncate text-[11px] font-bold">{user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-2.5 py-1 bg-[#F7F7F5] hover:bg-rose-50 text-[#5A5A55] hover:text-rose-700 border border-[#3A3A38]/20 hover:border-rose-300 rounded-none flex items-center gap-1 text-[11px] font-bold transition-colors"
              title="Sign out of Data Forge"
            >
              <LogOut className="w-3 h-3" />
              [ LOGOUT ]
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
