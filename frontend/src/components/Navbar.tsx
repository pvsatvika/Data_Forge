import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Activity,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  Database,
  BarChart3,
  BrainCircuit,
  FileCheck2,
  Eye,
  ShieldCheck,
  History as HistoryIcon,
  Menu,
  X
} from 'lucide-react';
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
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Extract current dataset ID if present in query params or path params
  const currentDatasetId = searchParams.get('id') || '';

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const getNavPath = (basePath: string) => {
    if (currentDatasetId && basePath !== '/datasets') {
      return `${basePath}?id=${currentDatasetId}`;
    }
    return basePath;
  };

  const navItems = [
    { name: 'Datasets', path: '/datasets', basePath: '/datasets', icon: Database },
    { name: 'Data Profiler', path: getNavPath('/profile'), basePath: '/profile', icon: BarChart3 },
    { name: 'AI Analysis', path: getNavPath('/analysis'), basePath: '/analysis', icon: BrainCircuit },
    { name: 'Cleaning Plan', path: getNavPath('/plan'), basePath: '/plan', icon: FileCheck2 },
    { name: 'Preview', path: getNavPath('/preview'), basePath: '/preview', icon: Eye },
    { name: 'Validation', path: getNavPath('/validation'), basePath: '/validation', icon: ShieldCheck },
    { name: 'History', path: getNavPath('/history'), basePath: '/history', icon: HistoryIcon },
  ];

  const isNavActive = (basePath: string) => {
    if (basePath === '/datasets') {
      return location.pathname === '/datasets';
    }
    if (basePath === '/analysis') {
      return location.pathname.startsWith('/analysis') || location.pathname.startsWith('/ai-analysis');
    }
    return location.pathname.startsWith(basePath);
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#121114] border-b border-[#E5E0D8] dark:border-[#29262C] select-none transition-colors duration-150 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 md:gap-4">
        {/* LEFT: DataForge Logo & Name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#7E454B] text-white flex items-center justify-center rounded-lg font-mono font-bold text-sm shadow-sm group-hover:bg-[#6A393E] transition-colors">
              DF
            </div>
            <div>
              <h1 className="font-grotesk font-bold text-sm text-[#2B2827] dark:text-[#F0EDEA] tracking-wider uppercase">
                DATA FORGE
              </h1>
              <p className="font-mono text-[9px] text-[#6E6966] dark:text-[#9E9793] tracking-tight hidden sm:block">
                DETERMINISTIC DATA CLEANING
              </p>
            </div>
          </NavLink>
        </div>

        {/* CENTER: Horizontal Top Navigation (Desktop & Tablet Scroll) */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.basePath);
            return (
              <NavLink
                key={item.basePath}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#7E454B] text-white font-semibold shadow-sm'
                    : 'text-[#6E6966] dark:text-[#9E9793] hover:bg-[#F6F4F0] dark:hover:bg-[#19181C] hover:text-[#2B2827] dark:hover:text-[#F0EDEA]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* RIGHT: Three-Line User/System Menu Trigger & Mobile Hamburger */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Three-Line Menu Trigger (Desktop & Mobile) */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="p-2 bg-[#F6F4F0] dark:bg-[#19181C] hover:bg-[#EFECE6] dark:hover:bg-[#2A2730] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg text-[#2B2827] dark:text-[#F0EDEA] transition-colors flex items-center justify-center"
                aria-expanded={isProfileOpen}
                aria-label="Account and system menu"
                title="Account & System Menu"
              >
                <Menu className="w-5 h-5 text-[#2B2827] dark:text-[#F0EDEA]" />
              </button>

              {/* Three-Line Dropdown Popover */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#19181C] border border-[#E5E0D8] dark:border-[#29262C] rounded-xl shadow-xl p-4 space-y-3.5 font-mono text-xs z-50">
                  {/* 1. ACCOUNT SECTION */}
                  <div className="space-y-2 pb-3 border-b border-[#E5E0D8] dark:border-[#29262C]">
                    <div className="text-[10px] font-bold tracking-wider text-[#6E6966] dark:text-[#9E9793] uppercase flex items-center gap-1.5">
                      <UserIcon className="w-3 h-3 text-[#7E454B] dark:text-[#9E5A61]" />
                      <span>ACCOUNT</span>
                    </div>

                    <div className="bg-[#F6F4F0] dark:bg-[#121114] p-3 rounded-lg border border-[#E5E0D8] dark:border-[#29262C] space-y-2 text-[11px]">
                      <div>
                        <span className="text-[#6E6966] dark:text-[#9E9793] text-[10px] block uppercase">Email</span>
                        <span className="font-semibold text-[#2B2827] dark:text-[#F0EDEA] text-xs truncate block" title={user.email}>
                          {user.email}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#6E6966] dark:text-[#9E9793] text-[10px] block uppercase">Username / Account</span>
                        <span className="text-[#2B2827] dark:text-[#F0EDEA] font-semibold text-xs truncate block" title={user.id}>
                          {user.user_metadata?.full_name || user.email?.split('@')[0] || user.id}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-[#E5E0D8] dark:border-[#29262C] text-[10px]">
                        <span className="text-[#6E6966] dark:text-[#9E9793]">AUTH PROVIDER:</span>
                        <span className="text-[#7E454B] dark:text-[#9E5A61] font-bold">SUPABASE JWT</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. SYSTEM STATUS SECTION */}
                  <div className="space-y-2 pb-3 border-b border-[#E5E0D8] dark:border-[#29262C]">
                    <div className="text-[10px] font-bold tracking-wider text-[#6E6966] dark:text-[#9E9793] uppercase flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>SYSTEM STATUS</span>
                    </div>

                    <div className="bg-[#F6F4F0] dark:bg-[#121114] p-3 rounded-lg border border-[#E5E0D8] dark:border-[#29262C] space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6E6966] dark:text-[#9E9793]">API Integration:</span>
                        {loading ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                            Connecting
                          </span>
                        ) : health?.status === 'ok' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Online
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            Offline
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#6E6966] dark:text-[#9E9793]">System Status:</span>
                        <span className="text-[#2B2827] dark:text-[#F0EDEA] font-semibold text-[10px]">
                          FastAPI + Parquet Engine
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#6E6966] dark:text-[#9E9793]">Verification:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                          JWT Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. THEME SECTION */}
                  <div className="space-y-2 pb-3 border-b border-[#E5E0D8] dark:border-[#29262C]">
                    <div className="text-[10px] font-bold tracking-wider text-[#6E6966] dark:text-[#9E9793] uppercase flex items-center gap-1.5">
                      {theme === 'light' ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-amber-400" />}
                      <span>THEME</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#F6F4F0] dark:bg-[#121114] p-1.5 rounded-lg border border-[#E5E0D8] dark:border-[#29262C]">
                      <button
                        type="button"
                        onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                        className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-mono font-semibold transition-all ${
                          theme === 'dark'
                            ? 'bg-[#7E454B] text-white shadow-sm border border-[#7E454B]'
                            : 'text-[#6E6966] dark:text-[#9E9793] hover:text-[#2B2827] dark:hover:text-[#F0EDEA]'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>🌙 Dark</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { if (theme !== 'light') toggleTheme(); }}
                        className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-mono font-semibold transition-all ${
                          theme === 'light'
                            ? 'bg-[#7E454B] text-white shadow-sm border border-[#7E454B]'
                            : 'text-[#6E6966] dark:text-[#9E9793] hover:text-[#2B2827] dark:hover:text-[#F0EDEA]'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>☀️ Light</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. LOGOUT */}
                  <div className="pt-0.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 bg-[#F6F4F0] dark:bg-[#19181C] hover:bg-[#EFECE6] text-[#2B2827] dark:text-[#F0EDEA] border border-[#E5E0D8] dark:border-[#29262C] rounded-lg transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION OVERLAY DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#121114] border-b border-[#E5E0D8] dark:border-[#29262C] p-4 space-y-4 shadow-lg">
          <div className="font-mono text-[10px] font-bold text-[#6E6966] dark:text-[#9E9793] uppercase tracking-widest px-2 pb-1 border-b border-[#E5E0D8] dark:border-[#29262C]">
            WORKFLOW NAVIGATION
          </div>
          <div className="grid grid-cols-1 gap-1 font-mono text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.basePath);
              return (
                <NavLink
                  key={item.basePath}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-mono text-xs transition-colors ${
                    active
                      ? 'bg-[#7E454B] text-white font-semibold'
                      : 'text-[#6E6966] dark:text-[#9E9793] hover:bg-[#F6F4F0] dark:hover:bg-[#19181C] text-[#2B2827] dark:text-[#F0EDEA]'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Theme & Logout Controls */}
          {user && (
            <div className="pt-3 border-t border-[#E5E0D8] dark:border-[#29262C] space-y-3">
              <div className="px-2 text-xs font-mono text-[#6E6966] dark:text-[#9E9793] space-y-1">
                <span className="text-[10px] uppercase font-bold block">Account</span>
                <span className="truncate text-[#2B2827] dark:text-[#F0EDEA] font-semibold block" title={user.email}>{user.email}</span>
              </div>

              {/* Theme Toggle Mobile */}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-semibold transition-all ${
                    theme === 'dark' ? 'bg-[#7E454B] text-white' : 'bg-[#F6F4F0] dark:bg-[#19181C] text-[#6E6966]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>🌙 Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => { if (theme !== 'light') toggleTheme(); }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-semibold transition-all ${
                    theme === 'light' ? 'bg-[#7E454B] text-white' : 'bg-[#F6F4F0] dark:bg-[#19181C] text-[#6E6966]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>☀️ Light</span>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
