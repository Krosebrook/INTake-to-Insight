
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage, DataSource } from '../types';
import { 
    Download, Sparkles, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, RotateCw, 
    Type, Image as ImageIcon, FileText, Trash2, Check, Printer, 
    MessageSquare, Move, Database, Plus, AlertCircle, Loader2, Link as LinkIcon 
} from 'lucide-react';
import DataConnectors from './DataConnectors';

interface InfographicProps {
  image: GeneratedImage;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  history?: GeneratedImage[];
  currentIndex?: number;
  onJumpToHistory?: (index: number) => void;
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  resolved: boolean;
}

const Infographic: React.FC<InfographicProps> = ({ 
    image, 
    onEdit, 
    isEditing,
    canUndo = false,
    canRedo = false,
    onUndo,
    onRedo,
    history,
    currentIndex,
    onJumpToHistory
}) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Tools: 'none' | 'text' | 'comment'
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'comment'>('none');
  
  // Data State
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showDataModal, setShowDataModal] = useState(false);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialAnnPos, setInitialAnnPos] = useState({ x: 0, y: 0 });
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Clear annotations when image changes
  useEffect(() => {
    setAnnotations([]);
    setComments([]);
  }, [image.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    
    // Inject data context into the prompt if sources exist
    let contextualPrompt = editPrompt;
    if (dataSources.length > 0) {
      const sourceContext = dataSources.map(ds => ds.name).join(', ');
      contextualPrompt = `[Using data from: ${sourceContext}] ${editPrompt}`;
    }
    
    onEdit(contextualPrompt);
    setEditPrompt('');
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
  }

  // --- Data Logic ---
  const handleConnectSource = (source: DataSource) => {
    setDataSources(prev => [...prev, source]);
    setShowDataModal(false);
  };

  const removeDataSource = (id: string) => {
    setDataSources(prev => prev.filter(ds => ds.id !== id));
  };

  // --- Interaction Logic ---

  const handleImageClick = (e: React.MouseEvent) => {
    if (activeTool === 'none' || !imageContainerRef.current) {
        if (!isDragging) {
             setSelectedAnnotationId(null);
             setActiveCommentId(null);
        }
        return;
    }

    if (isDragging) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'text') {
        const newAnnotation: Annotation = {
            id: Date.now().toString(),
            x,
            y,
            text: 'Text Layer',
            color: '#000000',
            fontSize: 16
        };
        setAnnotations([...annotations, newAnnotation]);
        setSelectedAnnotationId(newAnnotation.id);
        setActiveTool('none'); 
    } else if (activeTool === 'comment') {
        const newComment: Comment = {
            id: Date.now().toString(),
            x,
            y,
            text: '',
            author: 'You',
            resolved: false
        };
        setComments([...comments, newComment]);
        setActiveCommentId(newComment.id);
        setActiveTool('none');
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (activeTool !== 'none') return;
    e.stopPropagation();
    
    const ann = annotations.find(a => a.id === id);
    if (!ann) return;

    setIsDragging(true);
    setSelectedAnnotationId(id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialAnnPos({ x: ann.x, y: ann.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedAnnotationId || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    updateAnnotation(selectedAnnotationId, {
        x: initialAnnPos.x + deltaX,
        y: initialAnnPos.y + deltaY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(annotations.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    setSelectedAnnotationId(null);
  };

  const updateComment = (id: string, text: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, text } : c));
  };

  const deleteComment = (id: string) => {
      setComments(comments.filter(c => c.id !== id));
      setActiveCommentId(null);
  };

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    if (!imageRef.current) return;
    const canvas = await generateCanvas();
    const dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
    
    if (format === 'pdf') {
       const printWindow = window.open('', '_blank');
       if (printWindow) {
           printWindow.document.write(`
               <html><head><title>Infographic Export</title></head>
                <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;">
                    <img src="${dataUrl}" style="max-width:100%;max-height:100%;" onload="window.print();" />
                </body></html>`);
           printWindow.document.close();
       }
    } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `infographic-${image.id}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    setShowExportMenu(false);
  };

  const generateCanvas = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
        if (!imageRef.current) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                annotations.forEach(ann => {
                    const x = (ann.x / 100) * canvas.width;
                    const y = (ann.y / 100) * canvas.height;
                    const scaleFactor = canvas.width / 800;
                    ctx.font = `bold ${Math.max(12, ann.fontSize * scaleFactor)}px sans-serif`;
                    ctx.fillStyle = ann.color;
                    ctx.textBaseline = 'middle';
                    ctx.fillText(ann.text, x, y);
                });
            }
            resolve(canvas);
        };
        img.src = image.data;
    });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto animate-in fade-in zoom-in duration-700 mt-8">
      
      {/* Top Banner: Data Context Status */}
      {dataSources.length > 0 && (
          <div className="w-full mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
              {dataSources.map(ds => (
                  <div key={ds.id} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-white/10 shadow-sm animate-in slide-in-from-top-1 duration-300">
                      <div className={`w-1.5 h-1.5 rounded-full ${ds.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate max-w-[120px]">{ds.name}</span>
                      <button onClick={() => removeDataSource(ds.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                      </button>
                  </div>
              ))}
          </div>
      )}

      {/* Image Container */}
      <div 
        ref={imageContainerRef}
        className={`relative group w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700/50 ${activeTool !== 'none' ? 'cursor-crosshair' : 'cursor-default'}`}
        onClick={handleImageClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          ref={imageRef}
          src={image.data} 
          alt={image.prompt} 
          className="w-full h-auto object-contain max-h-[80vh] bg-checkered relative z-10 select-none pointer-events-none"
        />

        {/* Text Annotations Layer */}
        {annotations.map(ann => (
            <div
                key={ann.id}
                className={`absolute z-20 transition-all cursor-move select-none flex items-center gap-2 ${selectedAnnotationId === ann.id ? 'ring-2 ring-cyan-500 rounded p-1 bg-white/20 backdrop-blur-sm' : ''}`}
                style={{
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    transform: 'translate(0, -50%)',
                }}
                onMouseDown={(e) => handleMouseDown(e, ann.id)}
                onClick={(e) => { e.stopPropagation(); setSelectedAnnotationId(ann.id); }}
            >
                {selectedAnnotationId === ann.id ? (
                   <input
                        autoFocus 
                        value={ann.text}
                        onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                        className="bg-transparent border-none outline-none font-bold min-w-[50px] max-w-[200px]"
                        style={{ color: ann.color, fontSize: `${ann.fontSize}px` }}
                        onKeyDown={(e) => e.stopPropagation()} 
                   />
                ) : (
                    <span 
                        className="font-bold drop-shadow-md whitespace-nowrap"
                        style={{ color: ann.color, fontSize: `${ann.fontSize}px` }}
                    >
                        {ann.text}
                    </span>
                )}
                
                {selectedAnnotationId === ann.id && !isDragging && (
                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-2 flex gap-2 items-center z-50 border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <Move className="w-3 h-3 text-slate-400" />
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <input 
                            type="color" 
                            value={ann.color} 
                            onChange={(e) => updateAnnotation(ann.id, { color: e.target.value })}
                            className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent"
                        />
                        <input 
                            type="number" 
                            value={ann.fontSize}
                            onChange={(e) => updateAnnotation(ann.id, { fontSize: Number(e.target.value) })}
                            className="w-10 text-xs p-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-900 dark:text-white"
                            min="8" max="72"
                        />
                        <button onClick={() => deleteAnnotation(ann.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        ))}

        {/* Comment Pins Layer */}
        {comments.map(comment => (
             <div
                key={comment.id}
                className="absolute z-30 group"
                style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
                onClick={(e) => { e.stopPropagation(); setActiveCommentId(comment.id); }}
            >
                <div className={`w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${activeCommentId === comment.id ? 'bg-amber-500 scale-110' : 'bg-cyan-600'}`}>
                    <span className="text-xs font-bold text-white">
                        {comment.author.charAt(0)}
                    </span>
                </div>
                
                {activeCommentId === comment.id && (
                    <div 
                        className="absolute left-full top-0 ml-3 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 p-3 z-50 animate-in fade-in slide-in-from-left-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                                    {comment.author.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{comment.author}</span>
                             </div>
                             <button onClick={() => deleteComment(comment.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                             </button>
                        </div>
                        <textarea 
                            value={comment.text}
                            onChange={(e) => updateComment(comment.id, e.target.value)}
                            placeholder="Add a comment..."
                            autoFocus
                            className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 min-h-[60px] resize-none focus:ring-2 focus:ring-cyan-500/20 outline-none text-slate-800 dark:text-slate-200"
                        />
                        <div className="mt-2 flex justify-end">
                            <button 
                                onClick={() => setActiveCommentId(null)}
                                className="text-xs font-bold text-cyan-600 hover:text-cyan-500 px-2 py-1"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ))}

        {isFullscreen && (
            <div className="fixed inset-0 z-[100] bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
                    <div className="flex gap-2 pointer-events-auto bg-white/10 backdrop-blur-md p-1 rounded-lg border border-black/5 dark:border-white/10">
                        <button onClick={handleZoomOut} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-slate-800 dark:text-slate-200 transition-colors">
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <button onClick={handleResetZoom} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-slate-800 dark:text-slate-200 transition-colors">
                            <span className="text-xs font-bold">{Math.round(zoomLevel * 100)}%</span>
                        </button>
                        <button onClick={handleZoomIn} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-slate-800 dark:text-slate-200 transition-colors">
                            <ZoomIn className="w-5 h-5" />
                        </button>
                    </div>
                    <button onClick={handleCloseFullscreen} className="pointer-events-auto p-3 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                    <img 
                        src={image.data} 
                        alt={image.prompt}
                        style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg origin-center"
                    />
                </div>
            </div>
        )}
      </div>

      {/* Main Toolbar */}
      <div className="w-full max-w-4xl -mt-6 sm:-mt-8 relative z-40 px-4">
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col gap-3 ring-1 ring-black/5 dark:ring-white/5">
            
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-white/10">
                    <button 
                        onClick={onUndo} 
                        disabled={!canUndo || isEditing}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg text-slate-500 dark:text-slate-400 disabled:opacity-30"
                        title="Undo"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onRedo} 
                        disabled={!canRedo || isEditing}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg text-slate-500 dark:text-slate-400 disabled:opacity-30"
                        title="Redo"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 flex gap-1 items-center overflow-x-auto no-scrollbar px-2 mask-linear-fade">
                    {history && history.map((h, i) => (
                        <button
                            key={h.id}
                            onClick={() => onJumpToHistory?.(i)}
                            className={`relative w-8 h-6 md:w-10 md:h-8 shrink-0 rounded overflow-hidden border transition-all ${i === currentIndex ? 'border-cyan-500 ring-1 ring-cyan-500' : 'border-slate-300 dark:border-slate-600 opacity-50'}`}
                        >
                            <img src={h.data} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-white/10">
                    {/* Data Connector Toggle */}
                    <button 
                        onClick={() => setShowDataModal(true)}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${dataSources.length > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-blue-500' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'}`}
                        title="Connect Data Sources"
                    >
                        <Database className="w-4 h-4" />
                        <span className="hidden sm:inline">Data</span>
                    </button>

                    <button 
                        onClick={() => setActiveTool(activeTool === 'text' ? 'none' : 'text')}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${activeTool === 'text' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 ring-1 ring-cyan-500' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'}`}
                        title="Add Text Layer"
                    >
                        <Type className="w-4 h-4" />
                        <span className="hidden sm:inline">Text</span>
                    </button>
                    
                    <button 
                        onClick={() => setActiveTool(activeTool === 'comment' ? 'none' : 'comment')}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${activeTool === 'comment' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-amber-500' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'}`}
                        title="Add Comment"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Comment</span>
                    </button>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <div className="relative">
                        <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        {showExportMenu && (
                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-bottom-2">
                                <button onClick={() => handleExport('png')} className="px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-emerald-500" /> Save as PNG
                                </button>
                                <button onClick={() => handleExport('jpg')} className="px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-blue-500" /> Save as JPG
                                </button>
                                <button onClick={() => handleExport('pdf')} className="px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 border-t border-slate-100 dark:border-white/5">
                                    <Printer className="w-4 h-4 text-red-500" /> Print / Save PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex gap-2 items-center">
                 <div className="pl-1 text-cyan-600 dark:text-cyan-400 hidden sm:block">
                    <Sparkles className="w-5 h-5" />
                </div>
                <form onSubmit={handleSubmit} className="flex-1 w-full flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder={dataSources.length > 0 ? "Refine using connected data..." : "AI Modification (e.g. 'Make it blue', 'Add a chart')..."}
                        className="flex-1 bg-slate-50 dark:bg-slate-950/50 sm:bg-transparent border border-slate-200 dark:border-white/5 sm:border-none rounded-xl sm:rounded-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 px-4 py-2 sm:px-2 font-medium text-base"
                        disabled={isEditing}
                    />
                    <div className="w-full sm:w-auto">
                        <button
                            type="submit"
                            disabled={isEditing || !editPrompt.trim()}
                            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                                isEditing || !editPrompt.trim() 
                                ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed' 
                                : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/20'
                            }`}
                        >
                            {isEditing ? (
                                <span className="animate-spin w-5 h-5 block border-2 border-white/30 border-t-white rounded-full"></span>
                            ) : (
                                <span>Refine</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
      
      {/* Data Connectors Modal */}
      {showDataModal && (
          <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600">
                             <Database className="w-5 h-5" />
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Intake Connector</h2>
                              <p className="text-xs text-slate-500 font-medium">Connect external data to ground your visual insights.</p>
                          </div>
                      </div>
                      <button onClick={() => setShowDataModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                          <X className="w-6 h-6 text-slate-400" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      <DataConnectors onConnect={handleConnectSource} />
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> All links encrypted
                      </div>
                      <button onClick={() => setShowDataModal(false)} className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Legend / Info Footer */}
      <div className="mt-8 flex justify-between items-center w-full px-4 max-w-6xl">
        <p className="text-xs text-slate-500 dark:text-slate-500 font-mono max-w-xl truncate opacity-60">
            {dataSources.length > 0 ? `GROUNDED: ${dataSources.length} SOURCES` : `PROMPT: ${image.prompt}`}
        </p>
        
        <div className="hidden md:flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-white">JD</div>
                <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-white">AS</div>
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-slate-600">+2</div>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stakeholders</span>
        </div>
      </div>
    </div>
  );
};

export default Infographic;
