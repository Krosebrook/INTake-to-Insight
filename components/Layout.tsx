
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { LayoutGrid, FileImage, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { BrandKit } from '../types';
import { db } from '../lib/db';

interface LayoutProps {
  children: React.ReactNode;
  activeView: 'dashboard' | 'editor' | 'settings';
  onNavigate: (view: 'dashboard' | 'editor' | 'settings') => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isDarkMode, toggleTheme }) => {
  const [brand, setBrand] = useState<BrandKit | undefined>();

  useEffect(() => {
    loadBrand();
  }, []);

  const loadBrand = async () => {
    try {
      const kit = await db.getBrandKit();
      setBrand(kit);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className="w-16 md:w-64 border-r border-slate-200 dark:border-white/10 flex flex-col bg-white dark:bg-slate-950/50 backdrop-blur-xl z-20">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 gap-3 border-b border-slate-200 dark:border-white/10">
           {brand?.logo ? (
              <img src={brand.logo} alt="Brand Logo" className="h-8 w-auto object-contain" />
           ) : (
              <div className="h-8 w-8 flex items-end justify-center pb-1 gap-[2px]">
                <div className="flex flex-col items-center justify-end h-full w-[6px]">
                    <div className="w-[6px] h-[6px] rounded-full bg-orange-600 mb-1"></div>
                    <div className="w-full h-4 bg-blue-900 dark:bg-blue-700 rounded-sm"></div>
                </div>
                <span className="text-xl font-bold text-blue-900 dark:text-blue-500 leading-none -mb-[1px]">NT</span>
              </div>
           )}
           <span className="hidden md:block font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">
             Workspace
           </span>
        </div>

        <nav className="flex-1 p-2 md:p-4 space-y-2">
            <button 
                onClick={() => onNavigate('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300 font-bold ring-1 ring-blue-900/10 dark:ring-blue-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <LayoutGrid className="w-5 h-5" />
                <span className="hidden md:block text-sm">Dashboard</span>
            </button>
            <button 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800`}
            >
                <FileImage className="w-5 h-5" />
                <span className="hidden md:block text-sm">Assets</span>
            </button>
             <button 
                onClick={() => onNavigate('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'settings' ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300 font-bold ring-1 ring-blue-900/10 dark:ring-blue-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <SettingsIcon className="w-5 h-5" />
                <span className="hidden md:block text-sm">Settings</span>
            </button>
        </nav>

        <div className="p-2 md:p-4 border-t border-slate-200 dark:border-white/10 space-y-2">
            <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="hidden md:block text-sm">Theme</span>
            </button>
            <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-slate-800">
                    JD
                </div>
                <div className="hidden md:block overflow-hidden">
                    <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-200">John Doe</p>
                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase">Enterprise Admin</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
         {children}
      </main>

    </div>
  );
};

export default Layout;
