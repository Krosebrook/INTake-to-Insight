/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Project, ComplexityLevel, VisualStyle, DataSource, GeneratedImage, Annotation, Comment, BrandKit } from '../types';
import { analyzeDashboardRequirements, generateDashboardImage, editDashboardImage } from '../lib/gemini';
import { db } from '../lib/db';
import DashboardCanvas from './DashboardCanvas'; 
import DataConnectors from './DataConnectors';
import BrandKitEditor from './BrandKitEditor';
import Loading from './Loading';
import { AlertCircle, ArrowLeft, Database, FileSpreadsheet, CheckCircle2, Save, Plus, Settings, Layers, X, Play, Palette } from 'lucide-react';

interface EditorProps {
  projectId: string | null;
  onBack: () => void;
}

const Editor: React.FC<EditorProps> = ({ projectId, onBack }) => {
  // --- State ---
  const [project, setProject] = useState<Project | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [objective, setObjective] = useState('');
  const [level, setLevel] = useState<ComplexityLevel>('Operational');
  const [style, setStyle] = useState<VisualStyle>('Modern SaaS');
  const [brandKit, setBrandKit] = useState<BrandKit | undefined>();
  
  // Canvas State (Lifted Up)
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  // Generation State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisFacts, setAnalysisFacts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // History
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // UI State
  const [showDataModal, setShowDataModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // --- Initialization ---
  useEffect(() => {
    loadBrandKit();
    if (projectId) {
      loadProject(projectId);
    } else {
        // New Project Defaults
        setShowDataModal(true);
    }
  }, [projectId]);

  const loadBrandKit = async () => {
    try {
      const kit = await db.getBrandKit();
      setBrandKit(kit);
    } catch (e) {
      console.error("Failed to load brand kit", e);
    }
  };

  const loadProject = async (id: string) => {
    try {
      const p = await db.getProject(id);
      if (p) {
        setProject(p);
        setObjective(p.prompt);
        setLevel(p.level);
        setStyle(p.style);
        setDataSources(p.dataSources || []);
        
        // Restore Canvas State
        if (p.canvasState) {
            setAnnotations(p.canvasState.annotations || []);
            setComments(p.canvasState.comments || []);
        }

        // Restore History
        if (p.history && p.history.length > 0) {
            setHistory(p.history);
            setCurrentIndex(0); // Show latest
        } else if (p.thumbnail) {
             const img: GeneratedImage = {
                 id: p.id,
                 data: p.thumbnail,
                 prompt: p.prompt,
                 timestamp: p.updatedAt,
                 level: p.level,
                 style: p.style
             };
             setHistory([img]);
        }
      }
    } catch (e) {
      console.error("Failed to load project", e);
    }
  };

  const handleManualSave = async () => {
      setIsSaving(true);
      await saveProjectState();
      setTimeout(() => setIsSaving(false), 800);
  };

  const saveProjectState = async (newImage?: string) => {
      const currentImg = newImage || (history[currentIndex]?.data);
      
      const p: Project = {
          id: project?.id || projectId || Date.now().toString(),
          title: objective || "Untitled Dashboard",
          createdAt: project?.createdAt || Date.now(),
          updatedAt: Date.now(),
          dataSources,
          prompt: objective,
          level,
          style,
          canvasState: { annotations, comments },
          thumbnail: currentImg,
          history: history // Persist entire history stack
      };
      
      if (!project) await db.createProject(p);
      else await db.updateProject(p);
      
      setProject(p);
      setLastSaved(Date.now());
  };

  // --- Handlers ---

  const handleConnectSource = (source: DataSource) => {
    const updated = [...dataSources, source];
    setDataSources(updated);
    db.addDataSource(source);
    setShowDataModal(false);
    saveProjectState();
  };

  const handleGenerate = async () => {
    if (isLoading || !objective.trim()) return;

    setIsLoading(true);
    setLoadingStep(1);
    setLoadingMessage("Analyzing data schema and objective...");
    setAnalysisFacts([]);
    setError(null);

    try {
        const dataContext = dataSources.map(d => `${d.name} (${d.type})`).join(', ');
        
        const analysis = await analyzeDashboardRequirements(objective, dataContext, level, style, brandKit);
        setAnalysisFacts([
            `Strategy: ${analysis.dashboardStrategy}`,
            `KPIs: ${analysis.kpis.join(', ')}`,
            `Visuals: ${analysis.suggestedCharts.join(', ')}`
        ]);

        setLoadingStep(2);
        setLoadingMessage("Architecting layout and navigation...");
        
        await new Promise(r => setTimeout(r, 1500)); // Visual pacing

        setLoadingStep(3);
        setLoadingMessage("Drafting vector components (SVG)...");

        const promptContext = `
            Strategy: ${analysis.dashboardStrategy}
            KPIs to show: ${analysis.kpis.join(', ')}
            Charts to render: ${analysis.suggestedCharts.join(', ')}
        `;
        const base64 = await generateDashboardImage(promptContext, style, brandKit);

        setLoadingStep(4);
        setLoadingMessage("Finalizing interactive assets...");

        const newImage: GeneratedImage = {
            id: Date.now().toString(),
            data: base64,
            prompt: objective,
            timestamp: Date.now(),
            level,
            style
        };
        
        // Push new image to history stack
        const newHistory = [newImage, ...history];
        setHistory(newHistory);
        setCurrentIndex(0);
        
        // Save project with new history
        await saveProjectState(base64);

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Generation failed");
    } finally {
        setIsLoading(false);
        setLoadingStep(0);
    }
  };

  const handleEdit = async (editPrompt: string) => {
      if (history.length === 0) return;
      setIsLoading(true);
      setLoadingStep(2);
      setLoadingMessage("Analyzing revision request...");

      try {
          const base64 = await editDashboardImage(history[currentIndex].data, editPrompt, brandKit);
          const newImage = { 
              ...history[currentIndex], 
              id: Date.now().toString(), 
              data: base64, 
              prompt: editPrompt, 
              timestamp: Date.now() 
          };
          
          setLoadingStep(4);
          setLoadingMessage("Saving version snapshot...");

          const newHistory = [newImage, ...history];
          setHistory(newHistory);
          setCurrentIndex(0);
          await saveProjectState(base64);

      } catch (err: any) {
          setError(err.message || "Edit failed");
      } finally {
          setIsLoading(false);
          setLoadingStep(0);
      }
  };

  const handleJumpToHistory = (index: number) => {
      setCurrentIndex(index);
      // Optional: Restore context from that history point if we stored it
      const entry = history[index];
      if (entry) {
          setStyle(entry.style);
          setLevel(entry.level);
      }
  };

  const handleDeleteSource = (id: string) => {
      setDataSources(dataSources.filter(ds => ds.id !== id));
      saveProjectState();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Top Bar */}
      <div className="h-16 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between z-20">
         <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                 <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
             </button>
             <div className="flex flex-col">
                 <h2 className="font-bold text-sm md:text-base text-slate-900 dark:text-white truncate max-w-[200px]">
                    {project?.title || 'New Dashboard'}
                 </h2>
                 {lastSaved && <span className="text-[10px] text-slate-400">Version Saved {new Date(lastSaved).toLocaleTimeString()}</span>}
             </div>
         </div>
         
         <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowBrandModal(true)}
                className={`p-2 rounded-lg transition-all ${brandKit ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:bg-slate-100'}`}
                title="Configure Brand Kit"
             >
                <Palette className="w-5 h-5" />
             </button>
             <button 
                onClick={handleManualSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
             >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Version'}
             </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar: Settings & Data */}
          <div className="w-80 shrink-0 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar flex flex-col">
              
              <div className="p-4 space-y-6">
                  {/* Data Sources Section */}
                  <div>
                      <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                              <Database className="w-4 h-4" /> Data Sources
                          </h3>
                          <button onClick={() => setShowDataModal(true)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-600 dark:text-blue-400">
                              <Plus className="w-4 h-4" />
                          </button>
                      </div>
                      
                      {dataSources.length === 0 ? (
                          <div 
                            onClick={() => setShowDataModal(true)}
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
                          >
                              <p className="text-xs text-slate-400">No data connected</p>
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 block">Connect Data</span>
                          </div>
                      ) : (
                          <div className="space-y-2">
                              {dataSources.map(ds => (
                                  <div key={ds.id} className="group flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg text-sm">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                          {ds.type === 'FILE_UPLOAD' ? <FileSpreadsheet className="w-3 h-3 text-green-500" /> : <Database className="w-3 h-3 text-blue-500" />}
                                          <div className="flex flex-col truncate">
                                            <span className="truncate text-slate-700 dark:text-slate-300 font-medium leading-none" title={ds.name}>{ds.name}</span>
                                            <span className={`text-[10px] uppercase font-bold mt-1 ${ds.status === 'ERROR' ? 'text-red-500' : 'text-slate-400'}`}>{ds.status}</span>
                                          </div>
                                      </div>
                                      <button onClick={() => handleDeleteSource(ds.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">
                                          <X className="w-3 h-3" />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  {/* Configuration Section */}
                  <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-3">
                          <Settings className="w-4 h-4" /> Configuration
                      </h3>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Complexity Level</label>
                              <div className="grid grid-cols-2 gap-2">
                                  {['Executive Summary', 'Operational', 'Analytical', 'Strategic'].map((l) => (
                                      <button 
                                          key={l}
                                          onClick={() => setLevel(l as any)}
                                          className={`py-1.5 px-2 rounded text-[10px] font-bold border transition-all truncate ${level === l ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-900 text-blue-900 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                          title={l}
                                      >
                                          {l.split(' ')[0]}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Visual Style</label>
                              <select 
                                  value={style} 
                                  onChange={(e) => setStyle(e.target.value as any)}
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-900 outline-none"
                              >
                                  <optgroup label="Enterprise Standard">
                                    <option>Modern SaaS</option>
                                    <option>Corporate Clean</option>
                                    <option>Financial Traditional</option>
                                    <option>Dark Mode Analytics</option>
                                    <option>Minimalist</option>
                                  </optgroup>
                                  <optgroup label="Creative & Modern">
                                    <option>Glassmorphism</option>
                                    <option>Neumorphism</option>
                                    <option>Cyberpunk Neon</option>
                                    <option>Isometric 3D</option>
                                    <option>Swiss Design</option>
                                  </optgroup>
                                  <optgroup label="Specialized">
                                    <option>Data Journalism</option>
                                    <option>Hand-Drawn Sketch</option>
                                    <option>Futuristic HUD</option>
                                    <option>Vintage Terminal</option>
                                    <option>High Contrast</option>
                                    <option>Paper Wireframe</option>
                                  </optgroup>
                              </select>
                              <p className="text-[10px] text-slate-400 mt-1 italic">
                                  {style === 'Cyberpunk Neon' && "High-tech, neon gradients, glitch effects."}
                                  {style === 'Hand-Drawn Sketch' && "Rough pencil lines, marker colors, informal."}
                                  {style === 'Data Journalism' && "Editorial typography, sophisticated chart types."}
                                  {style === 'Glassmorphism' && "Frosted glass panels, vivid blurred backgrounds."}
                                  {style === 'Corporate Clean' && "Structured, dense, professional blue/grey."}
                              </p>
                          </div>
                      </div>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  {/* Generation Section */}
                  <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-3">
                          <Layers className="w-4 h-4" /> Prompt
                      </h3>
                      <textarea 
                          className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-900 outline-none resize-none"
                          placeholder="Describe the dashboard you need..."
                          value={objective}
                          onChange={e => setObjective(e.target.value)}
                      />
                      <button 
                          onClick={handleGenerate}
                          disabled={isLoading || !objective}
                          className="w-full mt-3 bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                          {isLoading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Play className="w-4 h-4 fill-current" />}
                          {isLoading ? 'Generating...' : history.length > 0 ? 'Re-Generate' : 'Generate'}
                      </button>
                  </div>
              </div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-950/50 flex flex-col">
               
               {isLoading && (
                   <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm p-8 overflow-y-auto">
                        <Loading status={loadingMessage} step={loadingStep} facts={analysisFacts} />
                   </div>
               )}

               {error && !isLoading && (
                   <div className="absolute top-4 left-4 right-4 z-50 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 p-4 rounded-xl flex items-center gap-3">
                       <AlertCircle className="w-5 h-5" />
                       <p>{error}</p>
                       <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                   </div>
               )}

               <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
                   {history.length > 0 ? (
                        <DashboardCanvas 
                            image={history[currentIndex]}
                            onEdit={handleEdit}
                            isEditing={isLoading}
                            canUndo={currentIndex < history.length - 1}
                            canRedo={currentIndex > 0}
                            onUndo={() => handleJumpToHistory(currentIndex + 1)}
                            onRedo={() => handleJumpToHistory(currentIndex - 1)}
                            history={history}
                            currentIndex={currentIndex}
                            onJumpToHistory={handleJumpToHistory}
                            
                            // Passing lifted state down
                            annotations={annotations}
                            onUpdateAnnotations={setAnnotations}
                            comments={comments}
                            onUpdateComments={setComments}
                        />
                   ) : (
                       <div className="text-center max-w-md mx-auto opacity-50">
                           <Layers className="w-24 h-24 mx-auto text-slate-300 dark:text-slate-700 mb-6" />
                           <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Ready to Design</h3>
                           <p className="text-slate-500 mt-2">Configure your data and settings on the left, then click Generate to create your dashboard mockup.</p>
                       </div>
                   )}
               </div>
          </div>
      </div>

      {/* Data Source Modal */}
      {showDataModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                  <button 
                    onClick={() => setShowDataModal(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
                  >
                      <X className="w-6 h-6 text-slate-500" />
                  </button>
                  <div className="p-8">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connect Data Source</h2>
                      <p className="text-slate-500 mb-8">Select a source to feed your dashboard. The AI will analyze the schema.</p>
                      <DataConnectors onConnect={handleConnectSource} />
                  </div>
              </div>
          </div>
      )}

      {/* Brand Kit Modal */}
      {showBrandModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
                  <div className="p-8">
                      <BrandKitEditor 
                        initialKit={brandKit}
                        onClose={() => setShowBrandModal(false)} 
                        onUpdate={(kit) => setBrandKit(kit)} 
                      />
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Editor;