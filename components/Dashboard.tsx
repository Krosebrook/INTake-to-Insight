
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import { db } from '../lib/db';
import { Plus, Search, Trash2 } from 'lucide-react';

interface DashboardProps {
  onCreateNew: () => void;
  onOpenProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateNew, onOpenProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await db.getAllProjects();
      setProjects(data);
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      await db.deleteProject(id);
      loadProjects();
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 md:p-10 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Workspace</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your visual research projects.</p>
        </div>
        <button 
            onClick={onCreateNew}
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
        >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
         <div className="flex items-center justify-center h-64 text-slate-400">Loading workspace...</div>
      ) : projects.length === 0 ? (
         <div className="flex flex-col items-center justify-center h-[50vh] text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <Search className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No projects yet</h3>
             <p className="text-slate-500 max-w-sm mt-2 mb-6">Start researching a topic to generate your first infographic.</p>
             <button onClick={onCreateNew} className="text-orange-600 font-bold hover:underline">Create Project</button>
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Create New Card (visual cue) */}
            <div 
                onClick={onCreateNew}
                className="group cursor-pointer border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all min-h-[280px]"
            >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 text-slate-400 group-hover:text-orange-600 transition-colors flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-600 dark:text-slate-400 group-hover:text-orange-700 dark:group-hover:text-orange-400">Create New</span>
            </div>

            {projects.map(project => (
                <div 
                    key={project.id}
                    onClick={() => onOpenProject(project.id)}
                    className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden hover:shadow-xl transition-all cursor-pointer hover:border-blue-900/30 dark:hover:border-blue-500/30 flex flex-col"
                >
                    <div className="aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                        {project.thumbnail ? (
                            <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                                <Search className="w-10 h-10" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate mb-1">{project.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-900 dark:text-blue-300 font-medium">{project.level}</span>
                            <span>•</span>
                            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="mt-auto flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={(e) => handleDelete(e, project.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
