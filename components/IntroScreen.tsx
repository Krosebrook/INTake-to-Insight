
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    // Phase 1: Logo Reveal
    const timer1 = setTimeout(() => setPhase(1), 500);
    // Phase 2: Tagline Reveal
    const timer2 = setTimeout(() => setPhase(2), 1500);
    // Phase 3: Shine/Highlight
    const timer3 = setTimeout(() => setPhase(3), 2500);
    // Phase 4: Interactive Button
    const timer4 = setTimeout(() => setPhase(4), 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden font-sans">
        {/* Shine Animation Keyframes */}
        <style>{`
            @keyframes shine-sweep {
                0% { transform: translateX(-150%) skewX(-20deg); opacity: 0; }
                10% { opacity: 0.5; }
                100% { transform: translateX(150%) skewX(-20deg); opacity: 0; }
            }
            .animate-shine {
                animation: shine-sweep 1.5s ease-in-out forwards;
            }
        `}</style>

        <div className="relative flex flex-col items-start select-none p-8 md:p-0">
            
            {/* Logo Container */}
            <div className={`relative flex items-end gap-2 md:gap-3 transition-all duration-1000 ease-out transform ${phase >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
                
                {/* The "I" constructed to match the logo (Orange Dot, Blue Stem) */}
                <div className="flex flex-col items-center justify-end h-[60px] md:h-[110px] w-[14px] md:w-[26px] pb-[6px] md:pb-[10px]">
                     {/* Dot */}
                     <div className="w-[14px] h-[14px] md:w-[26px] md:h-[26px] bg-[#e65c00] rounded-full mb-2 md:mb-4 shadow-sm"></div>
                     {/* Stem */}
                     <div className="w-full flex-1 bg-[#1e3a8a] rounded-sm"></div>
                </div>

                {/* The "NT" Text */}
                <div className="flex items-baseline leading-none">
                    <span className="text-[60px] md:text-[120px] font-bold text-[#1e3a8a] leading-none tracking-tighter">
                        NT
                    </span>
                    <span className="text-xs md:text-2xl font-bold text-[#1e3a8a] mb-auto ml-1 -mt-1 md:-mt-4 transform -translate-y-full">
                        TM
                    </span>
                </div>

                {/* Shine Overlay Element */}
                {phase >= 3 && (
                    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shine"></div>
                    </div>
                )}
            </div>

            {/* Tagline */}
            <div className={`mt-2 md:mt-4 flex flex-col md:flex-row items-start md:items-baseline gap-1 md:gap-3 text-lg md:text-3xl font-sans transition-all duration-1000 ease-out delay-200 ${phase >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <span className="font-semibold text-[#1e3a8a]">Our Purpose is</span>
                <span className="font-bold text-[#e65c00]">YOUR Business</span>
            </div>

            {/* CTA Button */}
            <div className={`mt-12 md:mt-16 w-full flex justify-center md:justify-start transition-all duration-1000 ease-out delay-500 ${phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <button 
                   onClick={onComplete}
                   className="group relative px-6 py-3 bg-[#1e3a8a] text-white rounded-lg shadow-xl hover:shadow-2xl hover:bg-[#152865] transition-all overflow-hidden"
                >
                   <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                   <div className="flex items-center gap-3 relative z-10">
                       <span className="text-sm font-bold tracking-widest uppercase">Initialize Dashboard</span>
                       <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </div>
                </button>
            </div>

        </div>

        {/* Skip Button */}
        <button 
            onClick={onComplete}
            className="absolute top-6 right-6 text-xs text-slate-400 hover:text-[#1e3a8a] transition-colors uppercase tracking-widest font-bold"
        >
            Skip Intro
        </button>

        {/* Branding Footer */}
        <div className="absolute bottom-8 text-[10px] md:text-xs text-slate-400 font-sans tracking-wide">
            © {new Date().getFullYear()} INT Corporation. All rights reserved.
        </div>

    </div>
  );
};

export default IntroScreen;
