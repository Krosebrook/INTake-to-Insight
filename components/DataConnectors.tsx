
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { DataSource, DataSourceType } from '../types';
import { UploadCloud, Database, FileSpreadsheet, HardDrive, Loader2, Link, Check, AlertCircle } from 'lucide-react';

interface DataConnectorsProps {
  onConnect: (source: DataSource) => void;
}

type ConnectionState = 'IDLE' | 'CONNECTING' | 'SUCCESS' | 'ERROR';

const DataConnectors: React.FC<DataConnectorsProps> = ({ onConnect }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'cloud' | 'api'>('upload');
  const [connState, setConnState] = useState<ConnectionState>('IDLE');
  const [statusMsg, setStatusMsg] = useState('');

  const simulateConnection = async (type: DataSourceType, name: string) => {
    setConnState('CONNECTING');
    setStatusMsg(`Connecting to ${name}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Randomly fail sometimes for realism (10% chance) - skipped for smooth user flow
    // const fail = Math.random() > 0.9;
    
    if (false) {
        setConnState('ERROR');
        setStatusMsg("Connection timed out. Please check your credentials.");
    } else {
        setConnState('SUCCESS');
        setStatusMsg("Successfully authenticated.");
        
        await new Promise(resolve => setTimeout(resolve, 800)); // Show success briefly
        
        const newSource: DataSource = {
          id: Date.now().toString(),
          type,
          name,
          status: 'CONNECTED',
          meta: {
            rowCount: Math.floor(Math.random() * 5000) + 100,
            lastSync: Date.now()
          }
        };
        
        onConnect(newSource);
        setConnState('IDLE');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10">
        <button 
          onClick={() => { setActiveTab('upload'); setConnState('IDLE'); }}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload' ? 'bg-slate-50 dark:bg-slate-800 text-blue-900 dark:text-blue-400 border-b-2 border-orange-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Local File
        </button>
        <button 
          onClick={() => { setActiveTab('cloud'); setConnState('IDLE'); }}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'cloud' ? 'bg-slate-50 dark:bg-slate-800 text-blue-900 dark:text-blue-400 border-b-2 border-orange-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <HardDrive className="w-4 h-4" /> Cloud Storage
        </button>
        <button 
          onClick={() => { setActiveTab('api'); setConnState('IDLE'); }}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'api' ? 'bg-slate-50 dark:bg-slate-800 text-blue-900 dark:text-blue-400 border-b-2 border-orange-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <Database className="w-4 h-4" /> API / SQL
        </button>
      </div>

      <div className="p-6 min-h-[300px] flex flex-col justify-center">
        
        {connState === 'CONNECTING' && (
          <div className="flex flex-col items-center justify-center text-slate-500 animate-in fade-in">
             <Loader2 className="w-10 h-10 animate-spin text-blue-900 mb-4" />
             <p className="font-medium text-slate-900 dark:text-white">{statusMsg}</p>
             <p className="text-xs mt-2">Verifying schema & permissions...</p>
          </div>
        )}

        {connState === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center text-green-600 animate-in zoom-in duration-300">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8" />
             </div>
             <p className="font-bold text-lg">{statusMsg}</p>
          </div>
        )}

        {connState === 'ERROR' && (
           <div className="flex flex-col items-center justify-center text-red-600 animate-in shake">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="font-bold text-lg">Connection Failed</p>
              <p className="text-sm text-slate-500 mt-2 mb-6">{statusMsg}</p>
              <button 
                 onClick={() => setConnState('IDLE')}
                 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-900 font-bold text-sm"
              >
                 Try Again
              </button>
           </div>
        )}

        {connState === 'IDLE' && (
          <>
            {activeTab === 'upload' && (
              <div 
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:border-blue-500 transition-all group"
                onClick={() => simulateConnection('FILE_UPLOAD', 'sales_data_q3.csv')}
              >
                 <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-900 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                   <UploadCloud className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Click to Upload CSV, JSON, or XML</h3>
                 <p className="text-sm text-slate-500 mt-2 max-w-xs">Supports automated schema detection. Max file size 50MB for free tier.</p>
              </div>
            )}

            {activeTab === 'cloud' && (
              <div className="grid grid-cols-1 gap-4">
                 {[
                   { id: 'google', name: 'Google Drive', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                   { id: 'dropbox', name: 'Dropbox', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                   { id: 'onedrive', name: 'OneDrive', color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' }
                 ].map((provider) => (
                   <button 
                      key={provider.id}
                      onClick={() => simulateConnection(provider.id === 'google' ? 'GOOGLE_DRIVE' : provider.id === 'dropbox' ? 'DROPBOX' : 'ONEDRIVE', `${provider.name} / Marketing Assets`)}
                      className={`flex items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-white/5 hover:border-orange-500 hover:shadow-md transition-all ${provider.bg}`}
                   >
                      <HardDrive className={`w-6 h-6 ${provider.color}`} />
                      <div className="text-left">
                        <span className="block font-bold text-slate-700 dark:text-slate-200">{provider.name}</span>
                        <span className="text-xs text-slate-500">Connect to your organization's folder</span>
                      </div>
                      <div className="ml-auto px-2 py-1 bg-white dark:bg-black/20 rounded text-[10px] font-mono text-slate-500">OAUTH 2.0</div>
                   </button>
                 ))}
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-5 animate-in slide-in-from-bottom-2">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Endpoint URL</label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
                       <Link className="w-5 h-5 text-slate-400" />
                       <input className="bg-transparent border-none w-full text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="https://api.example.com/v1/metrics" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Auth Type</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                           <option>Bearer Token</option>
                           <option>Basic Auth</option>
                           <option>API Key</option>
                        </select>
                     </div>
                     <button 
                        onClick={() => simulateConnection('API_REST', 'REST API: /v1/metrics')}
                        className="mt-auto bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
                     >
                        Test & Connect
                     </button>
                 </div>
                 <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-center text-slate-400">All connections are encrypted end-to-end.</p>
                 </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DataConnectors;
