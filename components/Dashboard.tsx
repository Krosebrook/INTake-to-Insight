
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { Project, DataSource, Folder } from '../types';
import { db } from '../lib/db';
import { generateThumbnail } from '../lib/image';
import { Plus, Trash2, Clock, BarChart3, Layout, Layers, Folder as FolderIcon, FolderPlus, Move } from 'lucide-react';
import ResearchBar from './ResearchBar';

interface DashboardProps {
  onCreateNew: () => void;
  onOpenProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateNew, onOpenProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allProjects, allFolders] = await Promise.all([
        db.getAllProjects(),
        db.getAllFolders()
      ]);
      setProjects(allProjects);
      setFolders(allFolders);
      
      // Background: Generate missing thumbnails for projects that have history
      const missingThumbs = allProjects.filter(p => !p.thumbnail && p.history && p.history.length > 0);
      if (missingThumbs.length > 0) {
          for (const p of missingThumbs) {
              try {
                  const thumb = await generateThumbnail(p.history[0].data);
                  const updatedProject = { ...p, thumbnail: thumb };
                  await db.updateProject(updatedProject);
                  setProjects(prev => prev.map(item => item.id === p.id ? updatedProject : item));
              } catch (e) {
                  console.error("Failed to generate thumbnail for project", p.id, e);
              }
          }
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    const data = await db.getAllProjects();
    setProjects(data);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      await db.deleteProject(id);
      loadProjects();
    }
  };

  const handleGenerateVisuals = async (topic: string, summary: string, style: any, colorPalette: string, aspectRatio: string) => {
    const newProjectId = Date.now().toString();
    const researchDataSource: DataSource = {
      id: Date.now().toString(),
      name: `Research: ${topic}`,
      type: 'API_REST',
      status: 'CONNECTED',
      sampleData: summary
    };

    const newProject: Project = {
      id: newProjectId,
      title: topic,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      prompt: `Create a dashboard visualizing the key insights from this research: ${topic}`,
      level: 'Executive Summary',
      style: style,
      colorPalette: colorPalette,
      aspectRatio: aspectRatio,
      dataSources: [researchDataSource],
      canvasState: { annotations: [], comments: [] },
      history: [],
      folderId: selectedFolderId || undefined
    };

    await db.createProject(newProject);
    onOpenProject(newProjectId);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setIsCreatingFolder(false);
      return;
    }
    const folder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.createFolder(folder);
    setFolders([...folders, folder]);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this folder? Projects inside will be moved to 'Uncategorized'.")) {
      await db.deleteFolder(id);
      // Update projects that were in this folder
      const affectedProjects = projects.filter(p => p.folderId === id);
      for (const p of affectedProjects) {
        await db.updateProject({ ...p, folderId: undefined });
      }
      setFolders(folders.filter(f => f.id !== id));
      if (selectedFolderId === id) setSelectedFolderId(null);
      loadProjects();
    }
  };

  const handleMoveToFolder = async (projectId: string, folderId: string | undefined) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updated = { ...project, folderId };
      await db.updateProject(updated);
      setProjects(projects.map(p => p.id === projectId ? updated : p));
      setMovingProjectId(null);
    }
  };

  const filteredProjects = selectedFolderId 
    ? projects.filter(p => p.folderId === selectedFolderId)
    : projects;

  const currentFolderName = selectedFolderId 
    ? folders.find(f => f.id === selectedFolderId)?.name 
    : "All Projects";

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 flex flex-col">
        <div className="p-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Workspace</h2>
          <nav className="space-y-1">
            <button 
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${!selectedFolderId ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Layout className="w-4 h-4" />
              All Projects
            </button>
          </nav>

          <div className="mt-10 flex items-center justify-between mb-4 px-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Folders</h2>
            <button 
              onClick={() => setIsCreatingFolder(true)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-brand-blue"
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
            {folders.map(folder => (
              <div key={folder.id} className="group flex items-center gap-1">
                <button 
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${selectedFolderId === folder.id ? 'bg-slate-100 dark:bg-slate-900 text-brand-blue' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                >
                  <FolderIcon className={`w-4 h-4 ${selectedFolderId === folder.id ? 'fill-brand-blue/20' : ''}`} />
                  <span className="truncate">{folder.name}</span>
                </button>
                <button 
                  onClick={(e) => handleDeleteFolder(e, folder.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {isCreatingFolder && (
              <div className="px-2 py-2">
                <input 
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                  onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                />
              </div>
            )}
            {folders.length === 0 && !isCreatingFolder && (
              <div className="px-4 py-8 text-center border border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No folders</p>
              </div>
            )}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-50 dark:border-white/5">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Storage</p>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-blue w-[12%] rounded-full"></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">1.2GB of 10GB used</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-10 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
                {selectedFolderId && <FolderIcon className="w-8 h-8 text-brand-blue fill-brand-blue/10" />}
                {currentFolderName}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                {selectedFolderId 
                  ? `Viewing projects in ${currentFolderName}` 
                  : "Manage your visual research projects across all folders."}
              </p>
          </div>
          <button 
              onClick={onCreateNew}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl shadow-brand-blue/20 transition-all hover:scale-[1.02] active:scale-95"
          >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
          </button>
        </div>

        <ResearchBar onGenerateVisuals={handleGenerateVisuals} />

        {/* Grid */}
        {isLoading ? (
           <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
               <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-blue rounded-full animate-spin"></div>
               <p className="text-sm font-medium animate-pulse">Synchronizing workspace...</p>
           </div>
        ) : filteredProjects.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-[50vh] text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 p-10">
               <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center mb-6 rotate-3">
                   {selectedFolderId ? <FolderIcon className="w-10 h-10 text-brand-blue" /> : <Layout className="w-10 h-10 text-brand-blue" />}
               </div>
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                 {selectedFolderId ? "This folder is empty" : "Your workspace is empty"}
               </h3>
               <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2 mb-8">
                 {selectedFolderId 
                   ? "Move projects here or create a new one to get started." 
                   : "Start researching a topic or create a manual project to generate your first AI-powered dashboard."}
               </p>
               <button 
                  onClick={onCreateNew} 
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
               >
                  Create First Project
               </button>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {/* Create New Card (visual cue) */}
              <div 
                  onClick={onCreateNew}
                  className="group cursor-pointer border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-brand-blue/50 hover:bg-brand-blue/5 dark:hover:bg-brand-blue/10 transition-all min-h-[320px] relative overflow-hidden"
              >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-blue/10 dark:group-hover:bg-brand-blue/20 text-slate-400 group-hover:text-brand-blue transition-all duration-300 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 shadow-sm">
                      <Plus className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                      <span className="font-bold text-lg text-slate-900 dark:text-white block">New Project</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start from scratch</span>
                  </div>
              </div>

              {filteredProjects.map(project => (
                  <div 
                      key={project.id}
                      onClick={() => onOpenProject(project.id)}
                      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 cursor-pointer hover:-translate-y-2 flex flex-col"
                  >
                      <div className="aspect-[16/10] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                          {project.thumbnail ? (
                              <img 
                                  src={project.thumbnail} 
                                  alt={project.title} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                  referrerPolicy="no-referrer"
                              />
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                                  <Layers className="w-12 h-12 mb-2 opacity-20" />
                                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">No Preview</span>
                              </div>
                          )}
                          
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                              <div className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                  Open Editor
                              </div>
                          </div>

                          {/* Complexity Badge */}
                          <div className="absolute top-3 left-3">
                              <span className="px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-tighter text-slate-900 dark:text-white shadow-sm border border-white/20">
                                  {project.level}
                              </span>
                          </div>

                          {/* Folder Badge */}
                          {project.folderId && !selectedFolderId && (
                            <div className="absolute top-3 right-3">
                              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-white/20 shadow-sm">
                                <FolderIcon className="w-3 h-3 text-brand-blue fill-brand-blue/10" />
                              </div>
                            </div>
                          )}
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-bold text-slate-900 dark:text-white truncate mb-2 text-lg group-hover:text-brand-blue transition-colors">{project.title}</h3>
                          
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-white/5">
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                      <BarChart3 className="w-3 h-3" />
                                      <span>{project.dataSources?.length || 0} Sources</span>
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <div className="relative">
                                  <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMovingProjectId(movingProjectId === project.id ? null : project.id);
                                      }}
                                      className="p-2 text-slate-300 hover:text-brand-blue hover:bg-brand-blue/5 rounded-xl transition-all"
                                      title="Move to Folder"
                                  >
                                      <Move className="w-4 h-4" />
                                  </button>
                                  
                                  {movingProjectId === project.id && (
                                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-bottom-2">
                                      <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5 mb-1">Move to Folder</p>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleMoveToFolder(project.id, undefined); }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                                      >
                                        <Layout className="w-3 h-3" />
                                        Uncategorized
                                      </button>
                                      {folders.map(f => (
                                        <button 
                                          key={f.id}
                                          onClick={(e) => { e.stopPropagation(); handleMoveToFolder(project.id, f.id); }}
                                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                                        >
                                          <FolderIcon className="w-3 h-3" />
                                          {f.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <button 
                                    onClick={(e) => handleDelete(e, project.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                    title="Delete Project"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
