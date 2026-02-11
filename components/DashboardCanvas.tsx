/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage, Annotation, Comment } from '../types';
import { 
    RotateCcw, RotateCw, Type, MessageSquare, Trash2, Maximize2, X, 
    Download, Bold, Italic, FileImage, FileText, ChevronUp, ChevronDown, 
    Check, Sidebar, Plus, GripVertical, Palette, ChevronsUp, ChevronsDown 
} from 'lucide-react';

interface DashboardCanvasProps {
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
  
  // Persisted state from parent
  annotations: Annotation[];
  onUpdateAnnotations: (anns: Annotation[]) => void;
  comments: Comment[];
  onUpdateComments: (comms: Comment[]) => void;
}

const DashboardCanvas: React.FC<DashboardCanvasProps> = ({ 
    image, 
    onEdit, 
    isEditing,
    canUndo = false,
    canRedo = false,
    onUndo,
    onRedo,
    history = [],
    currentIndex = 0,
    onJumpToHistory,
    annotations,
    onUpdateAnnotations,
    comments,
    onUpdateComments
}) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'comment'>('none');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialAnnPos, setInitialAnnPos] = useState({ x: 0, y: 0 });
  
  // Local state for smooth dragging performance (prevents heavy parent re-renders)
  const [localDragState, setLocalDragState] = useState<{ id: string; x: number; y: number } | null>(null);
  
  // Cache container dimensions during drag to prevent layout thrashing
  const dragRectRef = useRef<{ width: number; height: number; left: number; top: number } | null>(null);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const GRID_SIZE = 10; // Snap grid size in pixels

  const isSvg = image.data.startsWith('data:image/svg+xml');

  // Helper to safely render interactive SVG
  // NOTE: In a production environment, you should sanitize this string with DOMPurify
  const svgContent = isSvg ? decodeURIComponent(escape(atob(image.data.split(',')[1]))) : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onEdit(editPrompt);
    setEditPrompt('');
  };

  /**
   * Moves the specified annotation to the very top of the visual stack.
   * @param id Unique identifier of the annotation
   */
  const bringToFront = (id: string) => {
    const index = annotations.findIndex(a => a.id === id);
    if (index === -1 || index === annotations.length - 1) return;
    const newAnns = [...annotations];
    const [item] = newAnns.splice(index, 1);
    newAnns.push(item);
    onUpdateAnnotations(newAnns);
  };

  /**
   * Swaps the specified annotation with the one directly above it.
   * @param id Unique identifier of the annotation
   */
  const moveForward = (id: string) => {
    const index = annotations.findIndex(a => a.id === id);
    if (index === -1 || index === annotations.length - 1) return;
    const newAnns = [...annotations];
    [newAnns[index], newAnns[index + 1]] = [newAnns[index + 1], newAnns[index]];
    onUpdateAnnotations(newAnns);
  };

  /**
   * Swaps the specified annotation with the one directly below it.
   * @param id Unique identifier of the annotation
   */
  const moveBackward = (id: string) => {
    const index = annotations.findIndex(a => a.id === id);
    if (index <= 0) return;
    const newAnns = [...annotations];
    [newAnns[index], newAnns[index - 1]] = [newAnns[index - 1], newAnns[index]];
    onUpdateAnnotations(newAnns);
  };

  /**
   * Moves the specified annotation to the very bottom of the visual stack.
   * @param id Unique identifier of the annotation
   */
  const sendToBack = (id: string) => {
    const index = annotations.findIndex(a => a.id === id);
    if (index === -1 || index === 0) return;
    const newAnns = [...annotations];
    const [item] = newAnns.splice(index, 1);
    newAnns.unshift(item);
    onUpdateAnnotations(newAnns);
  };

  // --- Export Logic ---
  const generateCanvas = async (fillBackground: boolean = false): Promise<HTMLCanvasElement> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = image.data;
      await new Promise(resolve => img.onload = resolve);

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (fillBackground) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw Base Image
      ctx.drawImage(img, 0, 0);

      // Draw Annotations
      annotations.forEach(ann => {
          const x = (ann.x / 100) * canvas.width;
          const y = (ann.y / 100) * canvas.height;
          
          const scaleFactor = canvas.width / 800; 
          const fontSize = Math.max(12, ann.fontSize * scaleFactor);
          
          ctx.font = `${ann.fontStyle || 'normal'} ${ann.fontWeight || 'normal'} ${fontSize}px sans-serif`;
          ctx.fillStyle = ann.color;
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          ctx.fillText(ann.text, x, y);
      });

      return canvas;
  };

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
      setShowExportMenu(false);
      try {
          const withBackground = format === 'jpg' || format === 'pdf';
          const canvas = await generateCanvas(withBackground);
          const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
          const dataUrl = canvas.toDataURL(mimeType, 0.9);

          if (format === 'pdf') {
             const win = window.open('', '_blank');
             if (win) {
                 win.document.write(`
                    <html>
                        <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#555;">
                            <img src="${dataUrl}" style="max-width:100%; max-height:100%; box-shadow: 0 0 20px rgba(0,0,0,0.5);" />
                            <script>setTimeout(() => window.print(), 500);</script>
                        </body>
                    </html>
                 `);
                 win.document.close();
             }
          } else {
              const link = document.createElement('a');
              link.href = dataUrl;
              link.download = `dashboard_export.${format}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      } catch (e) {
          console.error("Export failed", e);
          alert("Could not export image.");
      }
  };

  // --- Canvas Interaction (Dragging with Pointer Events) ---

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (activeTool !== 'none' || !imageContainerRef.current) return;
    e.stopPropagation();
    
    const ann = annotations.find(a => a.id === id);
    if (!ann) return;

    // Cache rect for performance
    const rect = imageContainerRef.current.getBoundingClientRect();
    dragRectRef.current = {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top
    };

    setIsDragging(true);
    setSelectedAnnotationId(id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialAnnPos({ x: ann.x, y: ann.y });
    setLocalDragState({ id, x: ann.x, y: ann.y });

    // Capture pointer to ensure we don't lose the element if mouse moves fast
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !selectedAnnotationId || !dragRectRef.current) return;
    
    const rect = dragRectRef.current;
    
    // Calculate raw current position in pixels based on the percentage we started with
    const initialPixelX = (initialAnnPos.x / 100) * rect.width;
    const initialPixelY = (initialAnnPos.y / 100) * rect.height;
    
    // Total delta in pixels from the drag start point
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const rawX = initialPixelX + deltaX;
    const rawY = initialPixelY + deltaY;
    
    // Snap to grid (10px) - Precise snapping calculation
    const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
    
    // Convert back to percentage for persistence, clamped to canvas bounds
    const newX = Math.max(0, Math.min(100, (snappedX / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, (snappedY / rect.height) * 100));

    // Update LOCAL state for high-frequency render loops (smooth feedback)
    setLocalDragState({ id: selectedAnnotationId, x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging && localDragState && selectedAnnotationId) {
        // Commit local position to persistent parent state
        onUpdateAnnotations(annotations.map(a => 
            a.id === selectedAnnotationId ? { ...a, x: localDragState.x, y: localDragState.y } : a
        ));
        
        try {
            (e.currentTarget as Element).releasePointerCapture(e.pointerId);
        } catch (err) {
            // Ignore capture errors
        }
    }
    setIsDragging(false);
    setLocalDragState(null);
    dragRectRef.current = null;
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    // Deselect if clicking empty space
    if (activeTool === 'none') {
        if (selectedAnnotationId) setSelectedAnnotationId(null);
        return;
    }

    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'text') {
        const newAnnotation: Annotation = {
            id: Date.now().toString(),
            x,
            y,
            text: 'New Text',
            color: '#1e3a8a',
            fontSize: 20,
            fontWeight: 'bold'
        };
        onUpdateAnnotations([...annotations, newAnnotation]);
        setSelectedAnnotationId(newAnnotation.id);
        setActiveTool('none'); 
    } else if (activeTool === 'comment') {
        const newComment: Comment = {
            id: Date.now().toString(),
            x,
            y,
            text: '',
            author: 'You',
            resolved: false,
            timestamp: Date.now()
        };
        onUpdateComments([...comments, newComment]);
        setActiveCommentId(newComment.id);
        setShowCommentSidebar(true);
        setActiveTool('none');
    }
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    onUpdateAnnotations(annotations.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAnnotation = (id: string) => {
    onUpdateAnnotations(annotations.filter(a => a.id !== id));
    setSelectedAnnotationId(null);
  };

  const updateComment = (id: string, text: string) => {
      onUpdateComments(comments.map(c => c.id === id ? { ...c, text } : c));
  };

  const toggleResolveComment = (id: string) => {
      onUpdateComments(comments.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  };

  const deleteComment = (id: string) => {
      onUpdateComments(comments.filter(c => c.id !== id));
      if (activeCommentId === id) setActiveCommentId(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-full animate-in fade-in zoom-in duration-500">
      
      {/* Canvas Viewport */}
      <div 
        ref={imageContainerRef}
        className={`relative group w-full bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700/50 ${activeTool !== 'none' ? 'cursor-crosshair' : 'cursor-default'}`}
        onClick={handleImageClick}
        style={{ minHeight: '300px' }}
      >
        {/* Dynamic Grid Overlay (visible only during drag) */}
        {isDragging && (
          <div 
            className="absolute inset-0 z-[15] pointer-events-none opacity-30 animate-in fade-in duration-300" 
            style={{
              backgroundImage: 'radial-gradient(circle, #64748b 1.5px, transparent 1.5px)',
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              backgroundPosition: '-5px -5px'
            }}
          />
        )}

        {isSvg ? (
             /* Inline SVG Rendering for Interactivity */
            <div 
                className={`w-full h-auto max-h-[70vh] relative z-10 select-none transition-opacity duration-300 ${isDragging ? 'opacity-70' : 'opacity-100'}`}
                dangerouslySetInnerHTML={{ __html: svgContent }}
            />
        ) : (
             /* Raster Image Fallback */
            <img 
                src={image.data} 
                alt="Generated Dashboard" 
                className={`w-full h-auto object-contain max-h-[70vh] bg-checkered relative z-10 select-none pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-70' : 'opacity-100'}`}
            />
        )}


        {/* Annotations */}
        {annotations.map(ann => {
            const isSelected = selectedAnnotationId === ann.id;
            const isBeingDragged = isDragging && localDragState?.id === ann.id;
            
            // Priority: Local Drag State > Parent State
            const displayX = isBeingDragged ? localDragState!.x : ann.x;
            const displayY = isBeingDragged ? localDragState!.y : ann.y;
            
            return (
                <div
                    key={ann.id}
                    className={`absolute z-20 flex items-center gap-2 group/ann
                        ${isSelected ? 'z-50' : 'z-20'} 
                        ${isBeingDragged ? 'z-[60] scale-[1.05] shadow-2xl cursor-grabbing ring-4 ring-blue-500/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-lg p-2 duration-0' : 'cursor-grab duration-75 ease-out'}
                        ${isSelected && !isBeingDragged ? 'ring-2 ring-blue-500 rounded p-1 bg-white/40 dark:bg-black/40 backdrop-blur-sm' : ''}
                        transition-all
                    `}
                    style={{
                        left: `${displayX}%`,
                        top: `${displayY}%`,
                        transform: 'translate(-50%, -50%)',
                        userSelect: 'none',
                        touchAction: 'none'
                    }}
                    onPointerDown={(e) => handlePointerDown(e, ann.id)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onClick={(e) => { e.stopPropagation(); setSelectedAnnotationId(ann.id); }}
                >
                    {/* Visual Coordinate Tooltip during drag */}
                    {isBeingDragged && (
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm pointer-events-none whitespace-nowrap z-[100] animate-in fade-in zoom-in duration-200 border border-blue-400">
                             X: {Math.round(localDragState?.x || 0)}%  Y: {Math.round(localDragState?.y || 0)}%
                         </div>
                    )}

                    {/* Visual Drag Handle for accessibility/clarity */}
                    {isSelected && !isBeingDragged && (
                        <div className="p-1 opacity-0 group-hover/ann:opacity-100 transition-opacity bg-blue-500 rounded-full">
                            <GripVertical className="w-3 h-3 text-white" />
                        </div>
                    )}

                    {isSelected ? (
                    <input
                            autoFocus 
                            value={ann.text}
                            onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                            className="bg-transparent border-none outline-none min-w-[50px] max-w-[400px] text-center"
                            style={{ 
                                color: ann.color, 
                                fontSize: `${ann.fontSize}px`, 
                                fontWeight: ann.fontWeight, 
                                fontStyle: ann.fontStyle 
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                    />
                    ) : (
                        <span 
                            className="drop-shadow-lg whitespace-nowrap font-medium"
                            style={{ 
                                color: ann.color, 
                                fontSize: `${ann.fontSize}px`, 
                                fontWeight: ann.fontWeight, 
                                fontStyle: ann.fontStyle 
                            }}
                        >
                            {ann.text}
                        </span>
                    )}
                    
                    {/* Selected Controls (Layering & Styling) - IMPROVED */}
                    {isSelected && !isDragging && (
                        <div 
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 flex flex-col gap-4 z-[60] border border-slate-200 dark:border-white/10 w-80 animate-in slide-in-from-top-2 duration-200 cursor-default" 
                          onClick={(e) => e.stopPropagation()}
                        >
                            {/* Row 1: Layering Controls */}
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stacking</span>
                                <div className="flex gap-1 items-center">
                                    <button 
                                        onClick={() => bringToFront(ann.id)} 
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 hover:text-blue-600 transition-colors"
                                        title="Bring to Front"
                                    >
                                        <ChevronsUp className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => moveForward(ann.id)} 
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 hover:text-blue-600 transition-colors"
                                        title="Move Forward"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => moveBackward(ann.id)} 
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 hover:text-blue-600 transition-colors"
                                        title="Move Backward"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => sendToBack(ann.id)} 
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 hover:text-blue-600 transition-colors"
                                        title="Send to Back"
                                    >
                                        <ChevronsDown className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                    <button 
                                        onClick={() => deleteAnnotation(ann.id)} 
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Row 2: Typography */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Size (px)</label>
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                                        <input 
                                            type="number" 
                                            value={ann.fontSize}
                                            onChange={(e) => updateAnnotation(ann.id, { fontSize: Number(e.target.value) })}
                                            className="w-full bg-transparent text-center text-xs font-bold outline-none text-slate-900 dark:text-white"
                                            min="8" max="200"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Weight</label>
                                    <select 
                                        value={ann.fontWeight || 'normal'}
                                        onChange={(e) => updateAnnotation(ann.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1 text-xs font-bold outline-none text-slate-900 dark:text-white h-[26px]"
                                    >
                                        <option value="normal">Regular</option>
                                        <option value="bold">Bold</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 3: Color & Style */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Color</label>
                                <div className="flex gap-2">
                                    <div className="relative w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0 shadow-sm">
                                        <input 
                                            type="color" 
                                            value={ann.color} 
                                            onChange={(e) => updateAnnotation(ann.id, { color: e.target.value })}
                                            className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-none"
                                        />
                                    </div>
                                    <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-2">
                                        <span className="text-slate-400 text-xs mr-1">#</span>
                                        <input 
                                            type="text" 
                                            value={ann.color.replace('#', '')}
                                            onChange={(e) => updateAnnotation(ann.id, { color: `#${e.target.value}` })}
                                            className="w-full bg-transparent text-xs font-mono outline-none text-slate-900 dark:text-white uppercase"
                                            maxLength={6}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => updateAnnotation(ann.id, { fontStyle: ann.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${ann.fontStyle === 'italic' ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        title="Italic"
                                    >
                                        <Italic className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}

        {/* Comment Pins - Enhanced Visuals */}
        {comments.map(c => (
            <div 
                key={c.id} 
                className={`absolute z-30 group cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 hover:-translate-y-2 active:scale-95 ${c.resolved ? 'opacity-40 hover:opacity-100' : ''}`} 
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                onClick={(e) => { e.stopPropagation(); setActiveCommentId(c.id); setShowCommentSidebar(true); }}
            >
                {/* Visual Pin Stem */}
                {!c.resolved && (
                   <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-2 bg-white/50 blur-[1px]"></div>
                )}
                
                <div className={`w-9 h-9 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-xs font-bold text-white transition-colors
                    ${activeCommentId === c.id ? 'bg-blue-600 ring-4 ring-blue-500/30' : 'bg-orange-500 ring-2 ring-orange-500/20'}
                    ${c.resolved ? 'bg-slate-500 border-slate-300' : ''}
                `}>
                    {c.resolved ? <Check className="w-4 h-4" /> : (c.author ? c.author.charAt(0) : 'U')}
                </div>
            </div>
        ))}
        
        {/* Comment Collapsible Sidebar */}
        {showCommentSidebar && (
             <div className="absolute top-0 right-0 bottom-0 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-slate-200 dark:border-white/10 p-5 z-[70] overflow-y-auto animate-in slide-in-from-right duration-500 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                        <MessageSquare className="w-5 h-5 text-blue-600" /> Discussion
                        <span className="text-xs font-normal text-slate-400 ml-1">({comments.filter(c => !c.resolved).length} active)</span>
                    </h3>
                    <button onClick={() => setShowCommentSidebar(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <button 
                    onClick={() => { setActiveTool('comment'); setShowCommentSidebar(false); }}
                    className="w-full mb-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" /> New Comment
                </button>

                <div className="flex-1 space-y-4 overflow-y-auto px-1 custom-scrollbar">
                   {comments.length === 0 ? (
                       <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                           <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                           <p className="text-sm text-slate-500 font-medium">No conversation started.</p>
                           <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Tap anywhere to comment</p>
                       </div>
                   ) : (
                       [...comments].sort((a, b) => b.timestamp - a.timestamp).map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => setActiveCommentId(c.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeCommentId === c.id ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-blue-300'} ${c.resolved ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${c.resolved ? 'bg-slate-400' : 'bg-orange-500'}`}>
                                        {c.author.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.author}</span>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-tighter">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); toggleResolveComment(c.id); }} 
                                      className={`p-1.5 rounded-lg transition-colors ${c.resolved ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`} 
                                      title={c.resolved ? "Unresolve" : "Mark Resolved"}
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteComment(c.id); }} 
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            
                            {activeCommentId === c.id && !c.resolved ? (
                                <textarea 
                                    value={c.text}
                                    onChange={(e) => updateComment(c.id, e.target.value)}
                                    placeholder="Write your feedback..."
                                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 min-h-[80px] resize-none focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-800 dark:text-slate-200 shadow-inner"
                                    autoFocus
                                />
                            ) : (
                                <p className={`text-xs leading-relaxed ${c.resolved ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {c.text || <span className="italic opacity-50">Empty comment...</span>}
                                </p>
                            )}
                        </div>
                       ))
                   )}
                </div>
             </div>
        )}
        
        {/* Fullscreen Trigger */}
        <button 
            onClick={() => setIsFullscreen(true)}
            className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-blue-600 shadow-xl"
            title="Expand View"
        >
            <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Control Bar */}
      <div className="w-full mt-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 flex flex-col gap-5">
          
          {/* Top Row: AI Command Center */}
          <div className="flex gap-3">
            <form onSubmit={handleSubmit} className="flex-1 flex gap-3">
                <div className="relative flex-1">
                   <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <RotateCcw className="w-4 h-4 text-blue-500 animate-pulse" />
                   </div>
                   <input 
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="Refine dashboard (e.g. 'Use dark charts', 'Add a user growth sidebar')..."
                        className="w-full bg-slate-50 dark:bg-slate-900 pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-900/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-shadow"
                        disabled={isEditing}
                    />
                </div>
                <button type="submit" disabled={isEditing || !editPrompt.trim()} className="bg-blue-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-2">
                    {isEditing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                    <span>{isEditing ? 'Syncing...' : 'AI Refine'}</span>
                </button>
            </form>
            
            {/* Export Quick Access */}
            <div className="relative">
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="h-full px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>
                {showExportMenu && (
                    <div className="absolute bottom-full right-0 mb-3 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col z-[100] animate-in slide-in-from-bottom-2 duration-300">
                        <button onClick={() => handleExport('png')} className="px-5 py-4 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 group transition-colors">
                            <FileImage className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" /> 
                            <div className="flex flex-col">
                                <span className="font-bold">Transparent PNG</span>
                                <span className="text-[10px] opacity-50">Best for overlays</span>
                            </div>
                        </button>
                        <button onClick={() => handleExport('jpg')} className="px-5 py-4 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 group transition-colors">
                            <FileImage className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" /> 
                            <div className="flex flex-col">
                                <span className="font-bold">JPG Image</span>
                                <span className="text-[10px] opacity-50">Solid background</span>
                            </div>
                        </button>
                        <button onClick={() => handleExport('pdf')} className="px-5 py-4 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 group transition-colors border-t border-slate-100 dark:border-white/5">
                            <FileText className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" /> 
                            <div className="flex flex-col">
                                <span className="font-bold">PDF / Print</span>
                                <span className="text-[10px] opacity-50">Multi-page layout</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-700 w-full"></div>

          {/* Bottom Row: Toolbar & Versioning */}
          <div className="flex items-center gap-5 overflow-hidden">
            
            {/* Contextual Tools */}
            <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setActiveTool(activeTool === 'text' ? 'none' : 'text')} 
                  className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTool === 'text' ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-300 ring-2 ring-blue-500/50 shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`} 
                  title="Add Text Element"
                >
                    <Type size={16}/> <span className="hidden sm:inline">Text</span>
                </button>
                <button 
                  onClick={() => setActiveTool(activeTool === 'comment' ? 'none' : 'comment')} 
                  className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTool === 'comment' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 ring-2 ring-orange-500/50 shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`} 
                  title="Pin Comment"
                >
                    <MessageSquare size={16}/> <span className="hidden sm:inline">Comment</span>
                </button>
                
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>
                
                <button 
                  onClick={() => setShowCommentSidebar(prev => !prev)} 
                  className={`p-2.5 rounded-xl transition-all ${showCommentSidebar ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 scale-110' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`} 
                  title="Toggle Discussion Sidebar"
                >
                    <Sidebar size={18}/>
                </button>
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0"></div>

            {/* Version Strip */}
            <div className="flex-1 flex items-center gap-3 overflow-hidden">
                <div className="flex gap-1 shrink-0">
                    <button onClick={onUndo} disabled={!canUndo} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Previous Version"><RotateCcw size={18}/></button>
                    <button onClick={onRedo} disabled={!canRedo} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Next Version"><RotateCw size={18}/></button>
                </div>
                
                {/* Visual History Scroll */}
                {history.length > 0 && (
                    <div className="flex-1 flex gap-2 overflow-x-auto pb-1 items-center custom-scrollbar mask-linear-fade pr-10">
                        {history.map((h, i) => (
                            <button 
                                key={h.id} 
                                onClick={() => onJumpToHistory?.(i)}
                                className={`relative shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === currentIndex ? 'border-blue-600 ring-2 ring-blue-500/20 scale-110 z-10 shadow-lg' : 'border-slate-200 dark:border-slate-800 opacity-40 hover:opacity-100'}`}
                                title={`Revision ${history.length - i}`}
                            >
                                <img src={h.data} alt="" className="w-full h-full object-cover" />
                                {i === currentIndex && (
                                    <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

          </div>
      </div>

       {/* Fullscreen Immersion Mode */}
       {isFullscreen && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-12 animate-in fade-in duration-300">
            <div className="absolute top-8 right-8 flex gap-4">
                <button 
                  onClick={() => setIsFullscreen(false)} 
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md shadow-2xl border border-white/10 group"
                >
                    <X className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                </button>
            </div>
            
            <div className="relative w-full h-full flex items-center justify-center">
                <img 
                    src={image.data} 
                    alt="Expanded UI View" 
                    className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_100px_rgba(30,58,138,0.4)] border border-white/5" 
                />
                
                {/* Legend in fullscreen */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-white/40 text-xs font-mono tracking-tighter uppercase">
                   Enterprise Intelligence Visualization — {image.style} — Revision {history.length - currentIndex}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default DashboardCanvas;