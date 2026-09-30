import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Sparkles } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 10-Second introductory loading progress state (0% -> 100%)
  const [progress, setProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Parallax tilt state for subtle cursor tracking
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const startTime = Date.now();
    const duration = 10000; // 10 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        setIsLoaded(true);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 20; // max 10px shift
    const y = (clientY / innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  const handleEnter = () => {
    if (user) {
      navigate('/datasets');
    } else {
      navigate('/login');
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }}
    >
      {/* Central Gold Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-1000"
        style={{
          boxShadow: '0 0 120px 60px rgba(167, 139, 113, 0.18)',
          background: 'radial-gradient(circle, rgba(167,139,113,0.12) 0%, rgba(10,10,10,0) 70%)',
        }}
      />

      {/* MINIMAL TOP HEADER */}
      <header className="relative z-30 max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#7E454B] border border-[#A78B71]/40 rounded-lg flex items-center justify-center font-mono font-bold text-sm text-white shadow-md">
            DF
          </div>
          <span className="font-playfair italic text-xl tracking-wide text-white">DataForge</span>
        </div>

        <button
          onClick={handleEnter}
          className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[#C9B8A0] hover:text-[#E8D5B7] border border-[#A78B71]/30 hover:border-[#A78B71]/60 font-mono text-xs tracking-wider uppercase transition-all backdrop-blur-md flex items-center gap-2"
        >
          <span>{user ? 'Enter Platform' : 'Sign In'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* MAIN CINEMATIC HERO COMPOSITION */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 flex flex-col justify-center items-center py-8">
        
        {/* SVG Neural Connection Lines Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78B71" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#E8D5B7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#A78B71" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Connection Lines from Satellites to Center */}
          <path
            d="M 18% 25% Q 35% 30% 50% 45%"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeDasharray="6 6"
            className="animate-pulse"
            style={{ opacity: Math.min(1, progress / 30) }}
          />
          <path
            d="M 82% 25% Q 65% 30% 50% 45%"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeDasharray="6 6"
            className="animate-pulse"
            style={{ opacity: Math.min(1, progress / 50) }}
          />
          <path
            d="M 18% 70% Q 35% 65% 50% 55%"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeDasharray="6 6"
            className="animate-pulse"
            style={{ opacity: Math.min(1, progress / 70) }}
          />
          <path
            d="M 82% 70% Q 65% 65% 50% 55%"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeDasharray="6 6"
            className="animate-pulse"
            style={{ opacity: Math.min(1, progress / 90) }}
          />
        </svg>

        {/* HERO CARD COMPOSITION GRID */}
        <div className="relative w-full max-w-5xl flex items-center justify-center min-h-[440px] md:min-h-[520px]">

          {/* SATELLITE 1: TOP LEFT (Sample table data ERR1883195) */}
          <div
            className="hidden md:block absolute top-4 left-0 w-64 lg:w-72 z-20 transition-all duration-700 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px, 0) scale(${progress >= 20 ? 1 : 0.9})`,
              opacity: Math.min(1, progress / 25),
            }}
          >
            <div className="bg-white/[0.03] border border-white/10 hover:border-[#A78B71]/50 rounded-2xl p-2 shadow-2xl backdrop-blur-md transition-all group">
              <img
                src="/landing/card1.png"
                alt="Microbiome Sample Data Table"
                className="w-full h-auto rounded-xl border border-white/5 opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* SATELLITE 2: TOP RIGHT (Vehicle count traffic dataset) */}
          <div
            className="hidden md:block absolute top-4 right-0 w-64 lg:w-72 z-20 transition-all duration-700 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * 0.6}px, ${mousePos.y * -0.6}px, 0) scale(${progress >= 40 ? 1 : 0.9})`,
              opacity: Math.min(1, progress / 45),
            }}
          >
            <div className="bg-white/[0.03] border border-white/10 hover:border-[#A78B71]/50 rounded-2xl p-2 shadow-2xl backdrop-blur-md transition-all group">
              <img
                src="/landing/card2.png"
                alt="Vehicle Telemetry Data Table"
                className="w-full h-auto rounded-xl border border-white/5 opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* CENTRAL VISUAL ANCHOR (Platform Dark UI Mockup - hero-center.png) */}
          <div
            className="relative z-30 max-w-2xl w-full mx-auto transition-all duration-1000 ease-out transform hover:scale-[1.01]"
            style={{
              transform: `translate3d(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px, 0)`,
              boxShadow: '0 20px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(167, 139, 113, 0.15)',
            }}
          >
            <div className="bg-white/[0.03] border border-white/15 rounded-3xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              {/* Subtle gold line highlight */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#A78B71]/50 to-transparent" />
              
              <img
                src="/landing/hero-center.png"
                alt="DataForge Platform Engine Visual"
                className="w-full h-auto rounded-2xl border border-white/10 shadow-inner"
              />
            </div>
          </div>

          {/* SATELLITE 3: BOTTOM LEFT (Cosmetics financial model) */}
          <div
            className="hidden md:block absolute bottom-4 left-0 w-64 lg:w-72 z-20 transition-all duration-700 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * -0.6}px, ${mousePos.y * 0.6}px, 0) scale(${progress >= 60 ? 1 : 0.9})`,
              opacity: Math.min(1, progress / 65),
            }}
          >
            <div className="bg-white/[0.03] border border-white/10 hover:border-[#A78B71]/50 rounded-2xl p-2 shadow-2xl backdrop-blur-md transition-all group">
              <img
                src="/landing/card3.png"
                alt="Cosmetics Financial Model Data"
                className="w-full h-auto rounded-xl border border-white/5 opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* SATELLITE 4: BOTTOM RIGHT (Excel sales commission formula table) */}
          <div
            className="hidden md:block absolute bottom-4 right-0 w-64 lg:w-72 z-20 transition-all duration-700 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px, 0) scale(${progress >= 80 ? 1 : 0.9})`,
              opacity: Math.min(1, progress / 85),
            }}
          >
            <div className="bg-white/[0.03] border border-white/10 hover:border-[#A78B71]/50 rounded-2xl p-2 shadow-2xl backdrop-blur-md transition-all group">
              <img
                src="/landing/card4.png"
                alt="Sales Commission Formula Table"
                className="w-full h-auto rounded-xl border border-white/5 opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

        </div>

        {/* MOBILE STACKED GALLERY VIEW FOR SMALL SCREENS */}
        <div className="md:hidden grid grid-cols-2 gap-3 mt-6 w-full max-w-lg z-20">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-1.5 backdrop-blur-md">
            <img src="/landing/card1.png" alt="Sample Data" className="w-full h-auto rounded-lg" />
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-1.5 backdrop-blur-md">
            <img src="/landing/card2.png" alt="Traffic Data" className="w-full h-auto rounded-lg" />
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-1.5 backdrop-blur-md">
            <img src="/landing/card3.png" alt="Financial Data" className="w-full h-auto rounded-lg" />
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-1.5 backdrop-blur-md">
            <img src="/landing/card4.png" alt="Commission Data" className="w-full h-auto rounded-lg" />
          </div>
        </div>

      </main>

      {/* FOOTER AREA WITH TITLE & 10-SECOND PROGRESS INDICATOR */}
      <footer className="relative z-30 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col items-center gap-6">

        {/* 10-SECOND INTRO PROGRESS BAR */}
        <div className="w-full max-w-md space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-[#A78B71]">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#E8D5B7]" />
              {isLoaded ? 'Engine Initialized' : 'Loading DataForge Engine...'}
            </span>
            <span className="font-bold text-[#E8D5B7]">{progress}%</span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#A78B71] via-[#C9B8A0] to-[#E8D5B7] transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* EXACT PLAYFAIR DISPLAY ITALIC TITLE */}
        <div className="text-center pt-2">
          <h1 className="font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl text-white tracking-tight leading-none drop-shadow-2xl">
            DataForge
          </h1>
        </div>

        {/* ACTION BUTTON ONCE LOADED */}
        {isLoaded && (
          <button
            onClick={handleEnter}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-[#7E454B] to-[#94535A] hover:from-[#6A393E] hover:to-[#7E454B] text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl border border-[#A78B71]/40 flex items-center gap-2 animate-bounce"
          >
            <span>{user ? 'Enter DataForge Platform' : 'Launch Application'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </footer>
    </div>
  );
};

export default LandingPage;
