import React, { useState } from 'react';
import { Search, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { researchTopic } from '../lib/gemini';

interface ResearchBarProps {
  onGenerateVisuals: (topic: string, summary: string) => void;
}

const ResearchBar: React.FC<ResearchBarProps> = ({ onGenerateVisuals }) => {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('General Business');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<{ summary: string, sources: any[] } | null>(null);

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
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-brand-blue" />
        Research Topic
      </h2>
      
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
                onClick={() => onGenerateVisuals(topic, researchResult.summary)}
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
