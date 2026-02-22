/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { ArrowRight, User, Briefcase, PaintBucket, CheckCircle2, Sparkles } from 'lucide-react';
import { User as UserType, BrandKit, Workspace } from '../types';
import { db } from '../lib/db';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 'role', title: 'Your Role', icon: User },
  { id: 'brand', title: 'Brand Identity', icon: PaintBucket },
  { id: 'ready', title: 'Ready', icon: CheckCircle2 }
];

const ROLES = [
  { id: 'strategy', label: 'Strategic Advisor', desc: 'Focus on high-level KPIs and trends.', icon: '🎯' },
  { id: 'analyst', label: 'Data Analyst', desc: 'Focus on density, tables, and correlations.', icon: '📊' },
  { id: 'product', label: 'Product Manager', desc: 'Focus on user growth and engagement.', icon: '🚀' }
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e3a8a');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finalizeOnboarding();
    }
  };

  const finalizeOnboarding = async () => {
    setIsProcessing(true);
    
    // 1. Create User
    const newUser: UserType = {
      id: 'u-' + Date.now(),
      name: userName || 'Admin User',
      email: 'admin@infogenius.com',
      role: 'ADMIN',
      persona: ROLES.find(r => r.id === selectedRole)?.label || 'General User'
    };
    await db.updateCurrentUser(newUser);

    // 2. Create Workspace
    const newWorkspace: Workspace = {
      id: 'ws-' + Date.now(),
      name: companyName || 'My Workspace',
      plan: 'FREE',
      ownerId: newUser.id,
      brandKit: {
        primaryColor,
        secondaryColor: '#64748b',
        accentColor: '#e65c00',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter',
        headingFont: 'Space Grotesk'
      }
    };
    await db.updateWorkspace(newWorkspace);
    await db.updateBrandKit(newWorkspace.brandKit!);

    // 3. Log Audit
    await db.addAuditLog({
        id: Date.now().toString(),
        userId: newUser.id,
        userName: newUser.name,
        action: 'GENERATE',
        details: 'Completed Onboarding Wizard',
        timestamp: Date.now()
    });

    // Artificial delay for "AI Setup" feel
    setTimeout(() => {
        onComplete();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Progress Header */}
        <div className="h-2 bg-slate-100 dark:bg-slate-800 w-full">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} 
          />
        </div>

        <div className="p-10 flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-10 text-center">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 mb-4">
               {React.createElement(STEPS[currentStep].icon, { size: 24 })}
             </div>
             <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
               {currentStep === 0 && "Welcome to InfoGenius"}
               {currentStep === 1 && "Define your Brand"}
               {currentStep === 2 && "Setting up Workspace"}
             </h2>
             <p className="text-slate-500 max-w-md mx-auto">
               {currentStep === 0 && "Let's tailor the AI to your specific professional needs."}
               {currentStep === 1 && "The AI will enforce these style rules on every dashboard."}
               {currentStep === 2 && "We are configuring your local secure environment."}
             </p>
          </div>

          {/* Step 1: Role */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                 <input 
                    autoFocus
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full text-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {ROLES.map(role => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${selectedRole === role.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-blue-300'}`}
                    >
                      <div className="text-2xl mb-2">{role.icon}</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{role.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{role.desc}</div>
                    </button>
                  ))}
               </div>
            </div>
          )}

          {/* Step 2: Brand */}
          {currentStep === 1 && (
             <div className="space-y-8 animate-in slide-in-from-right duration-300">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Company / Workspace Name</label>
                   <input 
                      autoFocus
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp Analytics"
                      className="w-full text-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Brand Color</label>
                   <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-16 h-16 rounded-xl cursor-pointer border-0 p-0"
                      />
                      <div className="flex-1">
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3" style={{ backgroundColor: '#f8fafc' }}>
                           <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: primaryColor }}></div>
                           <div>
                              <div className="h-2 w-24 bg-slate-300 rounded mb-1"></div>
                              <div className="h-2 w-16 bg-slate-200 rounded"></div>
                           </div>
                           <div className="ml-auto px-3 py-1 text-xs font-bold text-white rounded" style={{ backgroundColor: primaryColor }}>Button</div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Preview of AI generated UI elements</p>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* Step 3: Ready */}
          {currentStep === 2 && (
             <div className="flex flex-col items-center justify-center flex-1 animate-in zoom-in duration-300">
                <div className="relative w-32 h-32 mb-8">
                   <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full animate-ping"></div>
                   <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
                   <div className="absolute inset-2 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-blue-600 animate-pulse" />
                   </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Optimizing LLM Context...</h3>
                <div className="space-y-2 mt-4 text-center">
                   <p className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Defining {ROLES.find(r => r.id === selectedRole)?.label} persona</p>
                   <p className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Generating {companyName} brand vectors</p>
                   <p className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Securing local database</p>
                </div>
             </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-auto pt-8 flex justify-between items-center border-t border-slate-100 dark:border-white/5">
              {currentStep > 0 && currentStep < 2 ? (
                <button 
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
                >
                  Back
                </button>
              ) : <div></div>}

              {currentStep < 2 && (
                <button 
                  onClick={handleNext}
                  disabled={(currentStep === 0 && !userName) || (currentStep === 1 && !companyName)}
                  className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;