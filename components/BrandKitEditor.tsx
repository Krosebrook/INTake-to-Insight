
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { BrandKit } from '../types';
import { db } from '../lib/db';
import { X, Upload, Palette, Type, Check, RefreshCcw, Loader2, LayoutTemplate } from 'lucide-react';

interface BrandKitEditorProps {
  onClose: () => void;
  onUpdate: (kit: BrandKit) => void;
  initialKit?: BrandKit;
}

const DEFAULT_KIT: BrandKit = {
  primaryColor: '#1e3a8a',
  secondaryColor: '#334155',
  accentColor: '#e65c00',
  backgroundColor: '#f8fafc',
  fontFamily: 'Inter',
  headingFont: 'Space Grotesk'
};

const BrandKitEditor: React.FC<BrandKitEditorProps> = ({ onClose, onUpdate, initialKit }) => {
  const [kit, setKit] = useState<BrandKit>(initialKit || DEFAULT_KIT);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [logoPreview, setLogoPreview] = useState<string | null>(initialKit?.logo || null);
  
  // Track if we've initialized to avoid saving the initial prop immediately
  const isInitialMount = useRef(true);

  // Auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const performSave = async () => {
      setSaveStatus('saving');
      try {
        await db.updateBrandKit(kit);
        onUpdate(kit);
        setSaveStatus('saved');
        // Reset status back to idle after a delay
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error("Auto-save failed", e);
        setSaveStatus('idle');
      }
    };

    // Debounce saves slightly for color pickers and rapid changes
    const timeout = setTimeout(performSave, 500);
    return () => clearTimeout(timeout);
  }, [kit, onUpdate]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setKit(prev => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToDefault = () => {
    if (confirm("Reset brand kit to corporate defaults?")) {
        setKit(DEFAULT_KIT);
        setLogoPreview(null);
    }
  };

  const handleFinished = async () => {
      setSaveStatus('saving');
      try {
          // Explicitly save immediately, bypassing debounce to ensure latest state is captured
          await db.updateBrandKit(kit);
          onUpdate(kit);
          setSaveStatus('saved');
          
          // Small delay to show "Saved" state before closing
          setTimeout(() => {
              onClose();
          }, 500);
      } catch (e) {
          console.error("Manual save failed", e);
          setSaveStatus('idle');
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
          <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Brand Kit</h2>
                {saveStatus === 'saving' && (
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded text-[10px] font-bold uppercase tracking-widest animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                    </div>
                )}
                {saveStatus === 'saved' && (
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded text-[10px] font-bold uppercase tracking-widest">
                        <Check className="w-3 h-3" /> Saved
                    </div>
                )}
              </div>
              <p className="text-sm text-slate-500">Configure global enterprise styles used for AI dashboard generation. Changes are saved automatically.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
              <X className="w-6 h-6" />
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Visual Identity */}
          <div className="space-y-6">
              <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Visual Identity
                  </h3>
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/30 min-h-[200px]">
                      {logoPreview ? (
                          <div className="relative group w-full max-w-[200px]">
                              <div className="relative h-32 w-full flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                                <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain p-4" />
                              </div>
                              <button 
                                onClick={(e) => { 
                                    e.preventDefault();
                                    setLogoPreview(null); 
                                    setKit(prev => ({...prev, logo: undefined})); 
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 z-10"
                                title="Remove Logo"
                              >
                                  <X className="w-3 h-3" />
                              </button>
                          </div>
                      ) : (
                          <div className="text-center pointer-events-none">
                              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <Upload className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="text-xs text-slate-500 mb-1">Upload company logo</p>
                              <p className="text-[10px] text-slate-400">PNG, SVG, or JPG</p>
                          </div>
                      )}
                      <label className="mt-4 cursor-pointer bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm hover:shadow-md transition-all hover:bg-slate-50 dark:hover:bg-slate-700">
                          {logoPreview ? 'Change Logo' : 'Choose File'}
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                  </div>
              </div>

              <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Palette className="w-4 h-4" /> Color Palette
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                      {[
                          { key: 'primaryColor', label: 'Primary' },
                          { key: 'secondaryColor', label: 'Secondary' },
                          { key: 'accentColor', label: 'Accent' },
                          { key: 'backgroundColor', label: 'UI Background' },
                      ].map((color) => (
                          <div key={color.key} className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">{color.label}</label>
                              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                  <input 
                                      type="color" 
                                      value={(kit as any)[color.key]} 
                                      onChange={(e) => setKit(prev => ({ ...prev, [color.key]: e.target.value }))}
                                      className="w-8 h-8 rounded border-none p-0 cursor-pointer bg-transparent"
                                  />
                                  <input 
                                      type="text" 
                                      value={(kit as any)[color.key]} 
                                      onChange={(e) => setKit(prev => ({ ...prev, [color.key]: e.target.value }))}
                                      className="flex-1 bg-transparent border-none text-xs font-mono outline-none text-slate-800 dark:text-slate-200"
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Typography */}
          <div className="space-y-6">
              <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Type className="w-4 h-4" /> Typography
                  </h3>
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Heading Font</label>
                          <select 
                            value={kit.headingFont}
                            onChange={(e) => setKit(prev => ({ ...prev, headingFont: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                          >
                              <option>Space Grotesk</option>
                              <option>Inter</option>
                              <option>Cinzel</option>
                              <option>System Default</option>
                              <option>Montserrat</option>
                              <option>Roboto Mono</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Body Font</label>
                          <select 
                            value={kit.fontFamily}
                            onChange={(e) => setKit(prev => ({ ...prev, fontFamily: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                          >
                              <option>Inter</option>
                              <option>Open Sans</option>
                              <option>Lato</option>
                              <option>Merriweather</option>
                              <option>Source Sans Pro</option>
                          </select>
                      </div>
                  </div>
              </div>

              {/* Enhanced Live Preview Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-inner flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                          <LayoutTemplate className="w-4 h-4" /> Live Context
                      </h3>
                      <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/10" style={{ background: kit.primaryColor }} title="Primary"></div>
                          <div className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/10" style={{ background: kit.secondaryColor }} title="Secondary"></div>
                          <div className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/10" style={{ background: kit.accentColor }} title="Accent"></div>
                      </div>
                  </div>
                  
                  <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300 flex flex-col" style={{ backgroundColor: kit.backgroundColor, fontFamily: kit.fontFamily }}>
                      
                      {/* Mock Header */}
                      <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-black/20 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                              {logoPreview ? (
                                  <img src={logoPreview} className="h-5 w-auto object-contain" alt="Logo" />
                              ) : (
                                  <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: kit.primaryColor }}></div>
                              )}
                              <span className="font-bold text-sm tracking-tight" style={{ fontFamily: kit.headingFont, color: kit.primaryColor }}>Enterprise</span>
                          </div>
                          <div className="hidden sm:flex gap-3 text-[9px] font-bold tracking-wide uppercase" style={{ color: kit.secondaryColor }}>
                              <span>Dashboard</span>
                              <span className="opacity-50">Reports</span>
                          </div>
                      </div>

                      <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                          {/* Hero / KPI Area */}
                          <div className="space-y-2">
                              <h4 className="text-lg font-bold leading-tight" style={{ fontFamily: kit.headingFont, color: kit.primaryColor }}>
                                  Quarterly Performance
                              </h4>
                              <p className="text-xs leading-relaxed opacity-90" style={{ color: kit.secondaryColor }}>
                                  Revenue metrics have exceeded targets by <span className="font-bold" style={{ color: kit.accentColor }}>24%</span> due to optimized operations.
                              </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                              {/* Card 1 */}
                              <div className="bg-white/60 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
                                  <p className="text-[8px] uppercase font-bold opacity-60 mb-1" style={{ color: kit.secondaryColor }}>Total Revenue</p>
                                  <p className="text-base font-bold" style={{ color: kit.primaryColor }}>$1.2M</p>
                                  <div className="w-full h-1 mt-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: kit.primaryColor }}></div>
                                  </div>
                              </div>
                              {/* Card 2 */}
                              <div className="bg-white/60 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
                                  <p className="text-[8px] uppercase font-bold opacity-60 mb-1" style={{ color: kit.secondaryColor }}>Active Users</p>
                                  <p className="text-base font-bold" style={{ color: kit.secondaryColor }}>8,430</p>
                                   <div className="w-full h-1 mt-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: '40%', backgroundColor: kit.accentColor }}></div>
                                  </div>
                              </div>
                          </div>

                          {/* Interactive Buttons */}
                          <div className="flex gap-2 pt-1">
                              <button className="px-3 py-1.5 rounded-md text-[9px] font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: kit.primaryColor }}>
                                  Generate Report
                              </button>
                              <button className="px-3 py-1.5 rounded-md text-[9px] font-bold border bg-white/40 dark:bg-black/20 hover:bg-white/60 transition-colors" style={{ borderColor: kit.primaryColor, color: kit.primaryColor }}>
                                  Export Data
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
          <button 
            onClick={resetToDefault}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
              <RefreshCcw className="w-4 h-4" /> Reset Defaults
          </button>
          <button 
            onClick={handleFinished}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
              <Check className="w-4 h-4" /> Finished
          </button>
      </div>
    </div>
  );
};

export default BrandKitEditor;
    