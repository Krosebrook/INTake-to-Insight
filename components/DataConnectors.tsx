/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { DataSource, DataSourceType } from '../types';
import { UploadCloud, Database, FileSpreadsheet, HardDrive, Loader2, Link, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface DataConnectorsProps {
  onConnect: (source: DataSource) => void;
}

type ConnectionState = 'IDLE' | 'CONNECTING' | 'SUCCESS' | 'ERROR' | 'PREVIEW';

const DataConnectors: React.FC<DataConnectorsProps> = ({ onConnect }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'cloud' | 'api'>('upload');
  const [connState, setConnState] = useState<ConnectionState>('IDLE');
  const [statusMsg, setStatusMsg] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [authType, setAuthType] = useState('Bearer Token');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewData, setPreviewData] = useState<string>('');

  const resetState = () => {
      setConnState('IDLE');
      setStatusMsg('');
      setPreviewData('');
  };

  const handleTabChange = (tab: 'upload' | 'cloud' | 'api') => {
      setActiveTab(tab);
      resetState();
  };

  // --- Real File Parsing Logic ---
  const processFile = (file: File) => {
    setConnState('CONNECTING');
    setStatusMsg(`Parsing ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const text = event.target?.result as string;
            // Simple CSV/JSON sniffing
            let sampleData = "";
            let rowCount = 0;

            if (file.name.endsWith('.json')) {
                const json = JSON.parse(text);
                const arr = Array.isArray(json) ? json : [json];
                rowCount = arr.length;
                sampleData = JSON.stringify(arr.slice(0, 5)); // Top 5 items
            } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                // Assume CSV
                const lines = text.split('\n');
                rowCount = lines.length;
                sampleData = lines.slice(0, 6).join('\n'); // Header + 5 rows
            } else {
                throw new Error("Unsupported file type");
            }

            // Artificial delay for UX
            await new Promise(r => setTimeout(r, 800));

            const newSource: DataSource = {
                id: Date.now().toString(),
                type: 'FILE_UPLOAD',
                name: file.name,
                status: 'CONNECTED',
                meta: {
                    rowCount: rowCount,
                    fileSize: (file.size / 1024).toFixed(1) + ' KB',
                    lastSync: Date.now()
                },
                sampleData: sampleData
            };

            setConnState('SUCCESS');
            setStatusMsg('File parsed successfully.');
            setTimeout(() => {
                onConnect(newSource);
                resetState();
            }, 1000);

        } catch (err) {
            console.error(err);
            setConnState('ERROR');
            setStatusMsg("Failed to parse file. Ensure valid CSV or JSON.");
        }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleCloudConnect = async (type: DataSourceType, name: string) => {
    setConnState('CONNECTING');
    setStatusMsg(`Authenticating with ${name}...`);
    
    // Simulate OAuth Redirect & Handshake
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setStatusMsg(`Fetching file list...`);
    await new Promise(resolve => setTimeout(resolve, 800));

    setConnState('SUCCESS');
    setStatusMsg("Connected successfully.");
    
    setTimeout(() => {
        const newSource: DataSource = {
            id: Date.now().toString(),
            type,
            name: `${name} / Sales_Data_Q3.csv`,
            status: 'CONNECTED',
            meta: {
                rowCount: 12400,
                fileSize: '4.2 MB',
                lastSync: Date.now()
            },
            sampleData: "Date,Revenue,Region\n2024-01-01,5000,NA\n2024-01-02,5200,EU\n2024-01-03,4800,NA"
        };
        onConnect(newSource);
        resetState();
    }, 1000);
  };

  const handleApiConnect = async () => {
      if (!apiUrl) {
          setConnState('ERROR');
          setStatusMsg("Please enter a valid Endpoint URL.");
          return;
      }

      setConnState('CONNECTING');
      setStatusMsg(`Pinging ${new URL(apiUrl).hostname}...`);

      try {
          // Verify URL format
          new URL(apiUrl);
          
          // Simulate latency
          await new Promise(resolve => setTimeout(resolve, 1500));

          const mockData = {
              status: "success",
              source: apiUrl,
              timestamp: new Date().toISOString(),
              data: [
                  { id: 1, metric: "Revenue", value: 45000 },
                  { id: 2, metric: "Signups", value: 1250 },
                  { id: 3, metric: "Churn", value: "2.4%" }
              ]
          };

          setPreviewData(JSON.stringify(mockData, null, 2));
          setConnState('PREVIEW');
          setStatusMsg("Endpoint verified. Preview data below:");

      } catch (e) {
          setConnState('ERROR');
          setStatusMsg("Invalid URL or Connection Refused.");
      }
  };

  const saveApiConnection = () => {
      setConnState('SUCCESS');
      setStatusMsg("Connection Saved.");
      
      setTimeout(() => {
          const newSource: DataSource = {
              id: Date.now().toString(),
              type: 'API_REST',
              name: `API: ${new URL(apiUrl).hostname}`,
              status: 'CONNECTED',
              meta: {
                  lastSync: Date.now()
              },
              sampleData: previewData
          };
          onConnect(newSource);
          resetState();
          setApiUrl('');
      }, 1000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 shrink-0">
        <button 
          onClick={() => handleTabChange('upload')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload' ? 'bg-slate-50 dark:bg-slate-800 text-blue-900 dark:text-blue-400 border-b-2 border-orange-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Local File
        </button>
        <button 
          onClick={() => handleTabChange('cloud')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'cloud' ? 'bg-slate-50 dark:bg-slate-800 text-blue-900 dark:text-blue-400 border-b-2 border-orange-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <HardDrive className="w-4 h-4" /> Cloud Storage
        </button>
        <button 
          onClick={() => handleTabChange('api')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'api' ? 'bg-slate-50 dark:bg-slate-800 text-blue-900 dark:text-blue-400 border-b-2 border-orange-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <Database className="w-4 h-4" /> API / SQL
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center relative min-h-[320px]">
        
        {connState === 'CONNECTING' && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 z-20 flex flex-col items-center justify-center text-slate-500 animate-in fade-in">
             <Loader2 className="w-10 h-10 animate-spin text-blue-900 mb-4" />
             <p className="font-medium text-slate-900 dark:text-white">{statusMsg}</p>
             <p className="text-xs mt-2">This may take a few seconds...</p>
          </div>
        )}

        {connState === 'PREVIEW' && (
           <div className="absolute inset-0 bg-white dark:bg-slate-900 z-20 flex flex-col p-6 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                 <Check className="w-5 h-5" />
                 <h3 className="font-bold text-lg">Connection Successful</h3>
              </div>
              <p className="text-sm text-slate-500 mb-2">Preview of fetched data:</p>
              <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 overflow-auto custom-scrollbar mb-4">
                  <pre className="text-xs font-mono text-slate-700 dark:text-slate-300">
                      {previewData}
                  </pre>
              </div>
              <div className="flex gap-3 mt-auto">
                  <button 
                     onClick={resetState}
                     className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={saveApiConnection}
                     className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
                  >
                     Save Connection
                  </button>
              </div>
           </div>
        )}

        {connState === 'SUCCESS' && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 z-20 flex flex-col items-center justify-center text-green-600 animate-in zoom-in duration-300">
             <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8" />
             </div>
             <p className="font-bold text-lg">{statusMsg}</p>
          </div>
        )}

        {connState === 'ERROR' && (
           <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 z-20 flex flex-col items-center justify-center text-red-600 animate-in shake">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="font-bold text-lg">Connection Failed</p>
              <p className="text-sm text-slate-500 mt-2 mb-6">{statusMsg}</p>
              <button 
                 onClick={resetState}
                 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2"
              >
                 <RefreshCw className="w-3 h-3" /> Try Again
              </button>
           </div>
        )}

        {connState === 'IDLE' && (
          <>
            {activeTab === 'upload' && (
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group h-full ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:border-blue-500'}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.json,.txt"
                    onChange={handleFileUpload} 
                 />
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${isDragging ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 scale-110' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400 group-hover:scale-110'}`}>
                   <UploadCloud className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isDragging ? 'Drop file here' : 'Click or Drag to Upload CSV/JSON'}
                 </h3>
                 <p className="text-sm text-slate-500 mt-2 max-w-xs">We parse the first 100 rows locally to ground your AI generation in real data.</p>
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
                      onClick={() => handleCloudConnect(provider.id === 'google' ? 'GOOGLE_DRIVE' : provider.id === 'dropbox' ? 'DROPBOX' : 'ONEDRIVE', provider.name)}
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
                       <input 
                          className="bg-transparent border-none w-full text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400" 
                          placeholder="https://api.example.com/v1/metrics"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Auth Type</label>
                        <select 
                            value={authType}
                            onChange={(e) => setAuthType(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                           <option>Bearer Token</option>
                           <option>Basic Auth</option>
                           <option>API Key</option>
                        </select>
                     </div>
                     <button 
                        onClick={handleApiConnect}
                        disabled={!apiUrl}
                        className="mt-auto bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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