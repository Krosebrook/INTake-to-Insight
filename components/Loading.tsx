/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { Loader2, BrainCircuit, Sparkles, Database, DraftingCompass, Layers, Palette } from 'lucide-react';

interface LoadingProps {
  status: string;
  step: number; 
  facts?: string[];
}

const Loading: React.FC<LoadingProps> = ({ status, step, facts = [] }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  
  useEffect(() => {
    if (facts.length > 0) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % facts.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [facts]);

  const steps = [
    { id: 1, label: 'Analyze Data', icon: Database },
    { id: 2, label: 'Architect UI', icon: DraftingCompass },
    { id: 3, label: 'Draft Vector', icon: Layers },
    { id: 4, label: 'Final Polish', icon: Palette },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto mt-8 min-h-[400px] overflow-hidden rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-md transition-colors">
      
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,58,138,0.5),transparent_70%)] animate-pulse"></div>

      {/* Central Animation */}
      <div className="relative z-10 mb-12 scale-110">
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Spinning Rings */}
            <div className={`absolute inset-0 rounded-full border-4 border-dashed border-blue-200 dark:border-blue-900/30 ${step > 0 ? 'animate-[spin_10s_linear_infinite]' : ''}`}></div>
            <div className={`absolute inset-2 rounded-full border-4 border-dashed border-orange-200 dark:border-orange-900/30 ${step > 0 ? 'animate-[spin_7s_linear_infinite_reverse]' : ''}`}></div>
            
            {/* Core Icon */}
            <div className="w-16 h-16 bg-white dark:bg-slate-950 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center z-20">
                {step === 1 && <Database className="w-8 h-8 text-blue-600 animate-bounce" />}
                {step === 2 && <BrainCircuit className="w-8 h-8 text-purple-600 animate-pulse" />}
                {step === 3 && <DraftingCompass className="w-8 h-8 text-orange-500 animate-spin-slow" />}
                {step >= 4 && <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />}
                {step === 0 && <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />}
            </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative z-20 w-full max-w-2xl px-8 mb-8">
        <div className="flex justify-between items-center relative">
            {/* Connecting Line Background */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
            
            {/* Connecting Line Progress */}
            <div 
                className="absolute top-1/2 left-0 h-0.5 bg-blue-600 dark:bg-blue-500 -z-10 transition-all duration-700 ease-out" 
                style={{ width: `${Math.min(100, ((Math.max(1, step) - 1) / (steps.length - 1)) * 100)}%` }}
            ></div>

            {steps.map((s) => {
                const isActive = step >= s.id;
                const isCurrent = step === s.id;
                return (
                    <div key={s.id} className="flex flex-col items-center gap-2 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${isActive ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'}`}>
                            {isActive ? <s.icon className="w-5 h-5" /> : <span className="text-sm font-bold">{s.id}</span>}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors absolute top-12 whitespace-nowrap ${isActive ? 'text-blue-900 dark:text-blue-400' : 'text-slate-400'}`}>
                            {s.label}
                        </span>
                    </div>
                )
            })}
        </div>
      </div>

      {/* Status Text & Facts */}
      <div className="relative z-20 text-center max-w-xl px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
            <Loader2 className="w-3 h-3 animate-spin" />
            {status || 'Initializing...'}
        </div>
        
        <div className="h-20 flex items-center justify-center">
            {facts.length > 0 ? (
                <p key={currentFactIndex} className="text-lg text-slate-700 dark:text-slate-300 font-medium italic animate-in fade-in slide-in-from-bottom-2">
                    "{facts[currentFactIndex]}"
                </p>
            ) : (
                <p className="text-slate-400 text-sm">Analyzing request parameters...</p>
            )}
        </div>
      </div>

    </div>
  );
};

export default Loading;