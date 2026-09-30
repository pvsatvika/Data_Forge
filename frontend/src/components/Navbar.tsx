import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Terminal, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';
import { HealthStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  health: HealthStatus | null;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ health, loading }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-14 bg-white dark:bg-[#121114] border-b border-[#E5E0D8] dark:border-white/10 flex items-center justify-between px-6 select-none transition-colors duration-150">
      {/* Brand & Technical Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#7E454B] text-white flex items-center justify-center rounded-lg font-mono font-bold text-sm shadow-sm">
            DF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-grotesk font-bold text-sm text-[#2B2827] dark:text-[#F0EDEA] tracking-wider uppercase">
                DATA FORGE
              </h1>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#EFECE6] dark:bg-[#19181C] text-[#6E6966] dark:text-[#9E9793] border border-[#E5E0D8] dark:border-white/10 rounded uppercase tracking-widest">
                v0.1.0-ENGINEERING
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#6E6966] dark:text-[#9E9793] tracking-tight">
              DETERMINISTIC DATA CLEANING & REVERSIBILITY SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel Status, Principles & Theme Toggle */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-[#6E6966] dark:text-[#9E9793] border-r border-[#E5E0D8] dark:border-white/10 pr-4">
          <Terminal className="w-3.5 h-3.5 text-[#7E454B]" />
          <span className="tracking-wide">LLM DECIDES · CODE EXECUTES · HUMAN APPROVES</span>
        </div>

        <div className="flex items-center gap-2 bg-[#F6F4F0] dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 px-3 py-1 rounded-full font-mono text-[11px]">
          <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[#6E6966] dark:text-[#9E9793] uppercase text-[10px]">API:</span>
          {loading ? (
            <span className="text-amber-600 dark:text-amber-400 font-bold">CONNECTING...</span>
          ) : health?.status === 'ok' ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
              ONLINE
            </span>
          ) : (
            <span className="text-rose-600 dark:text-rose-400 font-bold">OFFLINE</span>
          )}
        </div>

        {/* Theme Toggle Button (Top-Right Header) */}
        <button
          onClick={toggleTheme}
          className="p-1.5 bg-[#F6F4F0] dark:bg-[#19181C] hover:bg-[#EFECE6] dark:hover:bg-[#252229] text-[#2B2827] dark:text-[#F0EDEA] border border-[#E5E0D8] dark:border-white/10 rounded-full flex items-center justify-center transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle Light and Dark Theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-[#6E6966]" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-[#E5E0D8] dark:border-white/10 font-mono text-xs">
            <div className="flex items-center gap-1.5 bg-[#F6F4F0] dark:bg-[#19181C] border border-[#E5E0D8] dark:border-white/10 px-3 py-1 rounded-full text-[#2B2827] dark:text-[#F0EDEA] max-w-[200px] truncate" title={user.email}>
              <UserIcon className="w-3.5 h-3.5 text-[#7E454B] flex-shrink-0" />
              <span className="truncate text-[11px] font-medium">{user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-[#F6F4F0] dark:bg-[#19181C] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#6E6966] dark:text-[#9E9793] hover:text-rose-700 dark:hover:text-rose-400 border border-[#E5E0D8] dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-800 rounded-md flex items-center gap-1.5 text-[11px] font-medium transition-colors"
              title="Sign out of Data Forge"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
