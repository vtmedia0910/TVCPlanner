import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Play, Cpu, Zap, Aperture } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStart = () => {
    setIsExiting(true);
    setTimeout(onStart, 800);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#020617] transition-all duration-1000 ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}>
      
      {/* --- Ambient Background --- */}
      <div className="absolute inset-0 z-0">
        {/* Animated Aurora Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/30 rounded-full blur-[100px] animate-blob mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-violet-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen" />
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[50vw] h-[50vw] bg-fuchsia-500/10 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen" />
        
        {/* Digital Grid Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-[linear-gradient(to_bottom,transparent_0%,#020617_100%),linear-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [transform:perspective(1000px)_rotateX(60deg)] origin-bottom animate-grid-flow" />
        
        {/* Noise Texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* --- Main Content --- */}
      <div className={`relative z-20 flex flex-col items-center text-center px-4 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Animated Logo Construction */}
        <div className="relative mb-12 group cursor-default">
            {/* Spinning Rings */}
            <div className="absolute inset-0 border border-indigo-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-[-10px] border border-violet-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
            
            {/* Core Logo Container */}
            <div className="w-32 h-32 relative flex items-center justify-center bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(79,70,229,0.3)] overflow-hidden">
                {/* Internal Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-50" />
                
                {/* Icon Composition */}
                <div className="relative z-10 grid place-items-center">
                    <Play className="w-12 h-12 text-white fill-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] ml-1" />
                    <Aperture className="absolute w-20 h-20 text-indigo-400 opacity-60 animate-pulse-slow" strokeWidth={1} />
                </div>
            </div>

            {/* Floating Orbiting Particles */}
            <div className="absolute -top-4 -right-4 bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-lg animate-bounce-slow">
                <Cpu size={16} className="text-cyan-400" />
            </div>
            <div className="absolute -bottom-2 -left-6 bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-lg animate-bounce-slow animation-delay-1000">
                <Sparkles size={16} className="text-amber-400" />
            </div>
        </div>

        {/* Hero Typography */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-2 drop-shadow-2xl">
          TVC PLANNER <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">AI</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-xl mb-12 font-light tracking-wide">
          Automate your commercial production pipeline. <br/>
          <span className="text-indigo-300 font-medium">Concept</span> to <span className="text-pink-300 font-medium">Manifest</span> in seconds.
        </p>

        {/* THE BUTTON */}
        <button 
          onClick={handleStart}
          className="group relative inline-flex items-center gap-4 px-10 py-5 bg-transparent overflow-hidden rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {/* Button Background Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-80 group-hover:opacity-100 blur-md transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-100 rounded-full border border-white/20" />
          
          {/* Shine Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />

          {/* Button Text & Icon */}
          <span className="relative z-20 font-bold text-white tracking-widest text-sm uppercase">Start Creative Engine</span>
          <div className="relative z-20 w-8 h-8 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-90 transition-transform duration-300">
             <ArrowRight size={16} strokeWidth={3} />
          </div>
        </button>

      </div>

      {/* Footer Status */}
      <div className="absolute bottom-8 flex items-center gap-6 opacity-40 text-[10px] md:text-xs font-mono tracking-widest text-slate-500 uppercase">
         <span className="flex items-center gap-2"><Zap size={12} /> System Operational</span>
         <span className="hidden md:inline">|</span>
         <span className="hidden md:flex items-center gap-2"><Cpu size={12} /> Gemini 2.5 Flash Connected</span>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes grid-flow {
            0% { background-position: 0 0; }
            100% { background-position: 0 4rem; }
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animate-grid-flow { animation: grid-flow 2s linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
