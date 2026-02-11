/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, Suspense, ReactNode, ErrorInfo } from 'react';
import Layout from './components/Layout';
import { CreditCard, AlertTriangle, Loader2 } from 'lucide-react';

// Lazy Load Core Components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Editor = React.lazy(() => import('./components/Editor'));
const Settings = React.lazy(() => import('./components/Settings'));
const IntroScreen = React.lazy(() => import('./components/IntroScreen'));

// Error Boundary for Suspense
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Fix: Explicitly extending React.Component to ensure types are correct
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
          <AlertTriangle className="w-12 h-12 text-orange-600 mb-4" />
          <h3 className="text-xl font-bold">Component Failed to Load</h3>
          <p>Please refresh the application.</p>
        </div>
      );
    }
    return children;
  }
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
  </div>
);

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'editor' | 'settings'>('dashboard');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  // Initialize theme state checking LocalStorage first, then System Preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      // Fallback to system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return true;
      }
    }
    return true; // Default to dark mode
  });

  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const checkKey = async () => {
      try {
        const win = window as any;
        if (win.aistudio && win.aistudio.hasSelectedApiKey) {
          setHasApiKey(await win.aistudio.hasSelectedApiKey());
        } else {
          setHasApiKey(true); 
        }
      } catch (e) { console.error(e); } 
      finally { setCheckingKey(false); }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio?.openSelectKey) {
      await win.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const navigateToEditor = (projectId: string | null = null) => {
      setCurrentProjectId(projectId);
      setActiveView('editor');
  };

  const navigateToDashboard = () => {
      setActiveView('dashboard');
      setCurrentProjectId(null);
  };

  if (!checkingKey && !hasApiKey) {
      return (
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 max-w-md w-full p-8 rounded-2xl shadow-2xl border-2 border-orange-500/50 text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Paid API Key Required</h2>
                <p className="text-slate-500 mb-6 text-sm">
                  Gemini 3 Pro requires a billed Google Cloud Project. 
                  Refer to the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">billing documentation</a>.
                </p>
                <button onClick={handleSelectKey} className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold">Select API Key</button>
            </div>
        </div>
      );
  }

  if (showIntro) {
      return (
        <Suspense fallback={null}>
            <IntroScreen onComplete={() => setShowIntro(false)} />
        </Suspense>
      );
  }

  return (
    <Layout 
        activeView={activeView} 
        onNavigate={(view) => setActiveView(view)}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
    >
        <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
                {activeView === 'dashboard' && (
                    <Dashboard 
                        onCreateNew={() => navigateToEditor(null)}
                        onOpenProject={(id) => navigateToEditor(id)}
                    />
                )}
                {activeView === 'editor' && (
                    <Editor 
                        projectId={currentProjectId}
                        onBack={navigateToDashboard}
                    />
                )}
                {activeView === 'settings' && (
                    <Settings />
                )}
            </Suspense>
        </ErrorBoundary>
    </Layout>
  );
};

export default App;