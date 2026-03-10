import React, { useState } from 'react';
import { Search, Loader2, ArrowRight, ExternalLink, Settings2 } from 'lucide-react';
import { researchTopic } from '../lib/gemini';
import { VisualStyle } from '../types';

interface ResearchBarProps {
  onGenerateVisuals: (topic: string, summary: string, style: VisualStyle, colorPalette: string, aspectRatio: string) => void;
}

const ResearchBar: React.FC<ResearchBarProps> = ({ onGenerateVisuals }) => {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('General Business');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<{ summary: string, sources: any[] } | null>(null);
  
  const [showOptions, setShowOptions] = useState(false);
  const [style, setStyle] = useState<VisualStyle>('Modern SaaS');
  const [colorPalette, setColorPalette] = useState('Brand Default');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsResearching(true);
    setResearchResult(null);

    try {
      const result = await researchTopic(topic, audience);
      setResearchResult(result);
    } catch (error) {
      console.error("Research failed:", error);
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-brand-blue" />
          Research Topic
        </h2>
        <button 
          onClick={() => setShowOptions(!showOptions)}
          className="text-slate-500 hover:text-brand-blue flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          {showOptions ? 'Hide Options' : 'Show Options'}
        </button>
      </div>
      
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="e.g., Global Renewable Energy Trends 2025"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none"
            disabled={isResearching}
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none"
            disabled={isResearching}
          >
            <option>General Business</option>
            <option>C-Suite Executives</option>
            <option>Data Analysts</option>
            <option>Investors</option>
            <option>Marketing Team</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isResearching || !topic.trim()}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
        >
          {isResearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Research <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {showOptions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Visual Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as VisualStyle)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none"
            >
              <option value="Modern SaaS">Modern SaaS</option>
              <option value="Dark Mode Analytics">Dark Mode Analytics</option>
              <option value="Minimalist">Minimalist</option>
              <option value="Corporate Clean">Corporate Clean</option>
              <option value="Data Journalism">Data Journalism</option>
              <option value="Glassmorphism">Glassmorphism</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Color Palette</label>
            <select
              value={colorPalette}
              onChange={(e) => setColorPalette(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none"
            >
              <option value="Brand Default">Brand Default</option>
              <option value="Monochrome">Monochrome</option>
              <option value="High Contrast">High Contrast</option>
              <option value="Pastel">Pastel</option>
              <option value="Vibrant">Vibrant</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none"
            >
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="4:3">4:3 (Standard)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16 (Vertical)</option>
            </select>
          </div>
        </div>
      )}

      {researchResult && (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Research Summary</h3>
            <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 mb-6 whitespace-pre-wrap">
              {researchResult.summary}
            </div>
            
            {researchResult.sources && researchResult.sources.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-xs text-slate-500 uppercase mb-3">Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {researchResult.sources.map((source: any, idx: number) => {
                    if (source.web?.uri) {
                      return (
                        <a 
                          key={idx} 
                          href={source.web.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:border-brand-blue hover:text-brand-blue transition-colors"
                        >
                          <span className="truncate max-w-[200px]">{source.web.title || source.web.uri}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onGenerateVisuals(topic, researchResult.summary, style, colorPalette, aspectRatio)}
                className="bg-brand-orange hover:bg-brand-orange-dark text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-brand-orange/20 flex items-center gap-2"
              >
                Generate Visuals
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchBar;
