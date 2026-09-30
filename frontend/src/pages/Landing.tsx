import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Sparkles } from 'lucide-react';

interface LineCoord {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pathD: string;
}

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 10-Second introductory loading progress state (0% -> 100%)
  const [progress, setProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Active hovered satellite card state (1: Top-Left, 2: Top-Right, 3: Bottom-Left, 4: Bottom-Right)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Parallax tilt state for subtle cursor tracking
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // DOM Refs for dynamic SVG line connection calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const card4Ref = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Computed lines state
  const [lines, setLines] = useState<LineCoord[]>([]);

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

  // Recalculate dynamic SVG connection paths based on actual rendered card bounding boxes
  const updateLines = () => {
    if (!containerRef.current || !heroRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const heroRect = heroRef.current.getBoundingClientRect();

    if (containerRect.width === 0 || heroRect.width === 0) return;

    // Target connection points on central hero card relative to hero container
    const heroTL = {
      x: heroRect.left - containerRect.left + heroRect.width * 0.1,
      y: heroRect.top - containerRect.top + heroRect.height * 0.25,
    };
    const heroTR = {
      x: heroRect.left - containerRect.left + heroRect.width * 0.9,
      y: heroRect.top - containerRect.top + heroRect.height * 0.25,
    };
    const heroBL = {
      x: heroRect.left - containerRect.left + heroRect.width * 0.1,
      y: heroRect.top - containerRect.top + heroRect.height * 0.75,
    };
    const heroBR = {
      x: heroRect.left - containerRect.left + heroRect.width * 0.9,
      y: heroRect.top - containerRect.top + heroRect.height * 0.75,
    };

    const getCardPoint = (
      ref: React.RefObject<HTMLDivElement>,
      edge: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    ) => {
      if (!ref.current) return { x: 0, y: 0 };
      const r = ref.current.getBoundingClientRect();
      if (edge === 'bottom-right') {
        return {
          x: r.right - containerRect.left - r.width * 0.1,
          y: r.bottom - containerRect.top - r.height * 0.2,
        };
      }
      if (edge === 'bottom-left') {
        return {
          x: r.left - containerRect.left + r.width * 0.1,
          y: r.bottom - containerRect.top - r.height * 0.2,
        };
      }
      if (edge === 'top-right') {
        return {
          x: r.right - containerRect.left - r.width * 0.1,
          y: r.top - containerRect.top + r.height * 0.2,
        };
      }
      // top-left
      return {
        x: r.left - containerRect.left + r.width * 0.1,
        y: r.top - containerRect.top + r.height * 0.2,
      };
    };

    const p1 = getCardPoint(card1Ref, 'bottom-right');
    const p2 = getCardPoint(card2Ref, 'bottom-left');
    const p3 = getCardPoint(card3Ref, 'top-right');
    const p4 = getCardPoint(card4Ref, 'top-left');

    // Cubic Bezier Curve paths with exact pixel coordinates
    const path1 = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C ${(p1.x + (heroTL.x - p1.x) * 0.5).toFixed(1)} ${p1.y.toFixed(1)}, ${(p1.x + (heroTL.x - p1.x) * 0.5).toFixed(1)} ${heroTL.y.toFixed(1)}, ${heroTL.x.toFixed(1)} ${heroTL.y.toFixed(1)}`;
    const path2 = `M ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} C ${(p2.x + (heroTR.x - p2.x) * 0.5).toFixed(1)} ${p2.y.toFixed(1)}, ${(p2.x + (heroTR.x - p2.x) * 0.5).toFixed(1)} ${heroTR.y.toFixed(1)}, ${heroTR.x.toFixed(1)} ${heroTR.y.toFixed(1)}`;
    const path3 = `M ${p3.x.toFixed(1)} ${p3.y.toFixed(1)} C ${(p3.x + (heroBL.x - p3.x) * 0.5).toFixed(1)} ${p3.y.toFixed(1)}, ${(p3.x + (heroBL.x - p3.x) * 0.5).toFixed(1)} ${heroBL.y.toFixed(1)}, ${heroBL.x.toFixed(1)} ${heroBL.y.toFixed(1)}`;
    const path4 = `M ${p4.x.toFixed(1)} ${p4.y.toFixed(1)} C ${(p4.x + (heroBR.x - p4.x) * 0.5).toFixed(1)} ${p4.y.toFixed(1)}, ${(p4.x + (heroBR.x - p4.x) * 0.5).toFixed(1)} ${heroBR.y.toFixed(1)}, ${heroBR.x.toFixed(1)} ${heroBR.y.toFixed(1)}`;

    setLines([
      { x1: p1.x, y1: p1.y, x2: heroTL.x, y2: heroTL.y, pathD: path1 },
      { x1: p2.x, y1: p2.y, x2: heroTR.x, y2: heroTR.y, pathD: path2 },
      { x1: p3.x, y1: p3.y, x2: heroBL.x, y2: heroBL.y, pathD: path3 },
      { x1: p4.x, y1: p4.y, x2: heroBR.x, y2: heroBR.y, pathD: path4 },
    ]);
  };

  useLayoutEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);

    const observer = new ResizeObserver(() => updateLines());
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', updateLines);
      observer.disconnect();
    };
  }, []);

  // Update line endpoints while mouse position or hover state shifts cards
  useEffect(() => {
    let animId: number;
    const loop = () => {
      updateLines();
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [mousePos, hoveredCard, progress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 20; // max 10px shift
    const y = (clientY / innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  const handleEnter = () => {
    if (user) {
      navigate('/dashboard');
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
      {/* Custom Keyframe Animations for Dotted Neural Flow */}
      <style>{`
        @keyframes connectionFlow {
          to {
            stroke-dashoffset: -24;
          }
        }
        @keyframes connectionPulse {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 0.9; }
        }
        .animate-connection-dotted {
          stroke-dasharray: 4 10;
          stroke-linecap: round;
          animation: connectionFlow 3s linear infinite, connectionPulse 4s ease-in-out infinite;
        }
      `}</style>

      {/* Central Gold Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-1000 z-0"
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
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 flex flex-col justify-center items-center py-6">
        
        {/* EXACT PLAYFAIR DISPLAY ITALIC TITLE (TOP OF HERO COMPOSITION) */}
        <div className="text-center pb-4 sm:pb-6 z-20">
          <h1 className="font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl text-white tracking-tight leading-none drop-shadow-2xl">
            DataForge
          </h1>
        </div>

        {/* HERO CARD COMPOSITION CONTAINER */}
        <div
          ref={containerRef}
          className="relative w-full max-w-5xl flex items-center justify-center min-h-[440px] md:min-h-[520px]"
        >
          {/* DEDICATED SVG CONNECTION LINES LAYER (z-10: Above background, below cards/hero) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          >
            <defs>
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c9b8a0" floodOpacity="0.45" />
              </filter>
              <filter id="goldGlowHover" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#e8d5b7" floodOpacity="0.85" />
              </filter>
            </defs>

            {/* Render dynamically calculated cubic Bezier dotted connection lines */}
            {lines.map((line, idx) => {
              const cardNum = idx + 1;
              const isHovered = hoveredCard === cardNum;
              if (!line.pathD) return null;
              return (
                <g key={cardNum}>
                  {/* Outer Glow Path */}
                  <path
                    d={line.pathD}
                    fill="none"
                    stroke={isHovered ? "#E8D5B7" : "#c9b8a0"}
                    strokeWidth={isHovered ? "4" : "3"}
                    strokeLinecap="round"
                    filter={isHovered ? "url(#goldGlowHover)" : "url(#goldGlow)"}
                    style={{ opacity: isHovered ? 0.6 : 0.3 }}
                  />

                  {/* Primary Visible Dotted Gold Line */}
                  <path
                    d={line.pathD}
                    fill="none"
                    stroke={isHovered ? "#E8D5B7" : "#c9b8a0"}
                    strokeWidth={isHovered ? "3" : "2"}
                    strokeLinecap="round"
                    className="animate-connection-dotted"
                    style={{ opacity: isHovered ? 1.0 : 0.75 }}
                  />

                  {/* Dynamic Gold Connection Nodes at Ends */}
                  <circle cx={line.x1} cy={line.y1} r={isHovered ? "4.5" : "3.5"} fill="#E8D5B7" opacity={isHovered ? 1 : 0.85} />
                  <circle cx={line.x2} cy={line.y2} r={isHovered ? "4.5" : "3.5"} fill="#a78b71" opacity={isHovered ? 1 : 0.85} />
                </g>
              );
            })}
          </svg>

          {/* SATELLITE 1: TOP LEFT (card1.png) - z-30 unhovered, z-50 hovered */}
          <div
            ref={card1Ref}
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`hidden md:block absolute top-4 left-0 w-64 lg:w-72 cursor-pointer ${
              hoveredCard === 1 ? 'z-50' : 'z-20'
            }`}
            style={{
              transform: hoveredCard === 1
                ? `translate3d(${mousePos.x * -0.6 + 36}px, ${mousePos.y * -0.6 + 32}px, 0) scale(1.05)`
                : `translate3d(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px, 0) scale(${progress >= 20 ? 1 : 0.9})`,
              opacity: Math.min(1, progress / 25),
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), filter 0.6s ease, box-shadow 0.6s ease',
            }}
          >
            <div className={`rounded-2xl p-2 backdrop-blur-md transition-all duration-500 border ${
              hoveredCard === 1
                ? 'bg-white/[0.08] border-[#E8D5B7] shadow-[0_0_35px_rgba(232,213,183,0.4),0_20px_40px_rgba(0,0,0,0.8)]'
                : 'bg-white/[0.03] border-white/10 hover:border-[#A78B71]/50 shadow-2xl'
            }`}>
              <img
                src="/landing/card1.png"
                alt="Microbiome Sample Data Table"
                className={`w-full h-auto rounded-xl border border-white/5 transition-all duration-500 ${
                  hoveredCard === 1 ? 'opacity-100 filter-none scale-[1.01]' : 'opacity-90'
                }`}
              />
            </div>
          </div>

          {/* SATELLITE 2: TOP RIGHT (card2.png) - z-30 unhovered, z-50 hovered */}
          <div
            ref={card2Ref}
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`hidden md:block absolute top-4 right-0 w-64 lg:w-72 cursor-pointer ${
              hoveredCard === 2 ? 'z-50' : 'z-20'
            }`}
            style={{
              transform: hoveredCard === 2
                ? `translate3d(${mousePos.x * 0.6 - 36}px, ${mousePos.y * -0.6 + 32}px, 0) scale(1.05)`
                : `translate3d(${mousePos.x * 0.6}px, ${mousePos.y * -0.6}px, 0) scale(${progress >= 40 ? 1 : 0.9})`,
              opacity: Math.min(1, progress / 45),
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), filter 0.6s ease, box-shadow 0.6s ease',
            }}
          >
            <div className={`rounded-2xl p-2 backdrop-blur-md transition-all duration-500 border ${
              hoveredCard === 2
                ? 'bg-white/[0.08] border-[#E8D5B7] shadow-[0_0_35px_rgba(232,213,183,0.4),0_20px_40px_rgba(0,0,0,0.8)]'
                : 'bg-white/[0.03] border-white/10 hover:border-[#A78B71]/50 shadow-2xl'
            }`}>
              <img
                src="/landing/card2.png"
                alt="Vehicle Telemetry Data Table"
                className={`w-full h-auto rounded-xl border border-white/5 transition-all duration-500 ${
                  hoveredCard === 2 ? 'opacity-100 filter-none scale-[1.01]' : 'opacity-90'
                }`}
              />
            </div>
          </div>

          {/* CENTRAL VISUAL ANCHOR (Platform Dark UI Mockup - hero-center.png) - z-20 */}
          <div
            ref={heroRef}
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

          {/* SATELLITE 3: BOTTOM LEFT (card3.png) - z-30 unhovered, z-50 hovered */}
          <div
            ref={card3Ref}
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`hidden md:block absolute bottom-4 left-0 w-64 lg:w-72 cursor-pointer ${
              hoveredCard === 3 ? 'z-50' : 'z-20'
            }`}
            style={{
              transform: hoveredCard === 3
                ? `translate3d(${mousePos.x * -0.6 + 36}px, ${mousePos.y * 0.6 - 32}px, 0) scale(1.05)`
                : `translate3d(${mousePos.x * -0.6}px, ${mousePos.y * 0.6}px, 0) scale(${progress >= 60 ? 1 : 0.9})`,
              opacity: Math.min(1, progress / 65),
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), filter 0.6s ease, box-shadow 0.6s ease',
            }}
          >
            <div className={`rounded-2xl p-2 backdrop-blur-md transition-all duration-500 border ${
              hoveredCard === 3
                ? 'bg-white/[0.08] border-[#E8D5B7] shadow-[0_0_35px_rgba(232,213,183,0.4),0_20px_40px_rgba(0,0,0,0.8)]'
                : 'bg-white/[0.03] border-white/10 hover:border-[#A78B71]/50 shadow-2xl'
            }`}>
              <img
                src="/landing/card3.png"
                alt="Cosmetics Financial Model Data"
                className={`w-full h-auto rounded-xl border border-white/5 transition-all duration-500 ${
                  hoveredCard === 3 ? 'opacity-100 filter-none scale-[1.01]' : 'opacity-90'
                }`}
              />
            </div>
          </div>

          {/* SATELLITE 4: BOTTOM RIGHT (card4.png) - z-30 unhovered, z-50 hovered */}
          <div
            ref={card4Ref}
            onMouseEnter={() => setHoveredCard(4)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`hidden md:block absolute bottom-4 right-0 w-64 lg:w-72 cursor-pointer ${
              hoveredCard === 4 ? 'z-50' : 'z-20'
            }`}
            style={{
              transform: hoveredCard === 4
                ? `translate3d(${mousePos.x * 0.6 - 36}px, ${mousePos.y * 0.6 - 32}px, 0) scale(1.05)`
                : `translate3d(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px, 0) scale(${progress >= 80 ? 1 : 0.9})`,
              opacity: Math.min(1, progress / 85),
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), filter 0.6s ease, box-shadow 0.6s ease',
            }}
          >
            <div className={`rounded-2xl p-2 backdrop-blur-md transition-all duration-500 border ${
              hoveredCard === 4
                ? 'bg-white/[0.08] border-[#E8D5B7] shadow-[0_0_35px_rgba(232,213,183,0.4),0_20px_40px_rgba(0,0,0,0.8)]'
                : 'bg-white/[0.03] border-white/10 hover:border-[#A78B71]/50 shadow-2xl'
            }`}>
              <img
                src="/landing/card4.png"
                alt="Sales Commission Formula Table"
                className={`w-full h-auto rounded-xl border border-white/5 transition-all duration-500 ${
                  hoveredCard === 4 ? 'opacity-100 filter-none scale-[1.01]' : 'opacity-90'
                }`}
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
          <div className="w-full h-1.5 bg-[#FFFFFF]/10 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#A78B71] via-[#C9B8A0] to-[#E8D5B7] transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
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
