
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory, Creation } from './components/CreationHistory';
import { bringToLife } from './services/gemini';
import { ArrowUpTrayIcon, CpuChipIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';

const SESSION_TOKEN_LIMIT = 2000000; // 2 Million tokens session budget

const TokenMeter = ({ used }: { used: number }) => {
  const remaining = Math.max(0, SESSION_TOKEN_LIMIT - used);
  const percentage = Math.min(100, (used / SESSION_TOKEN_LIMIT) * 100);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (used > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [used]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1.5 pointer-events-none">
      <div className={`flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-lg px-3 py-1.5 transition-all duration-500 ${pulse ? 'ring-1 ring-blue-500/50 scale-105' : ''}`}>
        <CpuChipIcon className={`w-4 h-4 ${pulse ? 'text-blue-400' : 'text-zinc-500'}`} />
        <div className="flex flex-col">
          <div className="flex justify-between w-32 items-baseline">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Usage</span>
            <span className="text-[10px] font-mono text-zinc-300">
              {used.toLocaleString()} <span className="text-zinc-600">/ {SESSION_TOKEN_LIMIT.toLocaleString()}</span>
            </span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${percentage > 95 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter pr-1">
        {remaining.toLocaleString()} tokens remaining
      </div>
    </div>
  );
};

const TokenWarningBanner = ({ percentage }: { percentage: number }) => {
  if (percentage < 80) return null;

  const isCritical = percentage >= 95;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] py-2 px-4 flex items-center justify-center gap-3 transition-all duration-500 animate-in slide-in-from-top-full ${
      isCritical 
        ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-900/20' 
        : 'bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 backdrop-blur-md'
    }`}>
      {isCritical ? (
        <ShieldExclamationIcon className="w-5 h-5 animate-pulse" />
      ) : (
        <ExclamationTriangleIcon className="w-4 h-4" />
      )}
      <span className="text-xs uppercase tracking-wider font-mono">
        {isCritical 
          ? "Critical Token Limit: Generation disabled to prevent session overflow." 
          : "Heads up: You've used over 80% of your session token limit."}
      </span>
    </div>
  );
};

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [sessionTokens, setSessionTokens] = useState(0);
  const importInputRef = useRef<HTMLInputElement>(null);

  const usagePercentage = (sessionTokens / SESSION_TOKEN_LIMIT) * 100;
  const isLimitReached = usagePercentage >= 95;

  // Load history and total session tokens from local storage
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('gemini_app_history');
      const savedTokens = localStorage.getItem('gemini_session_tokens');
      
      if (savedTokens) {
        setSessionTokens(parseInt(savedTokens, 10) || 0);
      }

      let loadedHistory: Creation[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedHistory = parsed.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
          }));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }

      if (loadedHistory.length > 0) {
        setHistory(loadedHistory);
      } else {
        try {
           const exampleUrls = [
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/vibecode-blog.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/cassette.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/chess.json'
           ];

           const examples = await Promise.all(exampleUrls.map(async (url) => {
               const res = await fetch(url);
               if (!res.ok) return null;
               const data = await res.json();
               return {
                   ...data,
                   timestamp: new Date(data.timestamp || Date.now()),
                   id: data.id || crypto.randomUUID()
               };
           }));
           
           const validExamples = examples.filter((e): e is Creation => e !== null);
           setHistory(validExamples);
        } catch (e) {
            console.error("Failed to load examples", e);
        }
      }
    };

    initHistory();
  }, []);

  // Save history and tokens when they change
  useEffect(() => {
    if (history.length > 0) {
        try {
            localStorage.setItem('gemini_app_history', JSON.stringify(history));
        } catch (e) {
            console.warn("Local storage full or error saving history", e);
        }
    }
  }, [history]);

  useEffect(() => {
    localStorage.setItem('gemini_session_tokens', sessionTokens.toString());
  }, [sessionTokens]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async (promptText: string, file?: File) => {
    if (isLimitReached) return;
    setIsGenerating(true);
    setActiveCreation(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;

      if (file) {
        imageBase64 = await fileToBase64(file);
        mimeType = file.type.toLowerCase();
      }

      const result = await bringToLife(promptText, imageBase64, mimeType);
      
      if (result.html) {
        if (result.usage) {
          setSessionTokens(prev => prev + result.usage!.totalTokenCount);
        }

        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: file ? file.name : 'New Creation',
          html: result.html,
          originalImage: imageBase64 && mimeType ? `data:${mimeType};base64,${imageBase64}` : undefined,
          timestamp: new Date(),
        };
        setActiveCreation(newCreation);
        setHistory(prev => [newCreation, ...prev]);
      }

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Something went wrong while bringing your file to life. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateCreation = (updated: Creation) => {
    setHistory(prev => prev.map(c => c.id === updated.id ? updated : c));
    setActiveCreation(updated);
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = event.target?.result as string;
            const parsed = JSON.parse(json);
            if (parsed.html && parsed.name) {
                const importedCreation: Creation = {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp || Date.now()),
                    id: parsed.id || crypto.randomUUID()
                };
                setHistory(prev => {
                    const exists = prev.some(c => c.id === importedCreation.id);
                    return exists ? prev : [importedCreation, ...prev];
                });
                setActiveCreation(importedCreation);
            } else {
                alert("Invalid creation file format.");
            }
        } catch (err) {
            console.error("Import error", err);
            alert("Failed to import creation.");
        }
        if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const isFocused = !!activeCreation || isGenerating;

  return (
    <div className="h-[100dvh] bg-zinc-950 bg-dot-grid text-zinc-50 selection:bg-blue-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col">
      
      {/* Global Notifications */}
      <TokenWarningBanner percentage={usagePercentage} />

      {/* Token Usage Meter */}
      <TokenMeter used={sessionTokens} />

      {/* Centered Content Container */}
      <div 
        className={`
          min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isFocused 
            ? 'opacity-0 scale-95 blur-sm pointer-events-none h-[100dvh] overflow-hidden' 
            : 'opacity-100 scale-100 blur-0'
          }
        `}
      >
        <div className="flex-1 flex flex-col justify-center items-center w-full py-12 md:py-20">
          <div className="w-full mb-8 md:mb-16">
              <Hero />
          </div>
          <div className="w-full flex justify-center mb-8">
              <InputArea onGenerate={handleGenerate} isGenerating={isGenerating} disabled={isFocused || isLimitReached} />
          </div>
        </div>
        
        <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-6">
            <div className="w-full px-2 md:px-0">
                <CreationHistory history={history} onSelect={handleSelectCreation} />
            </div>
            <a 
              href="https://x.com/adamsanz_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors pb-2"
            >
              Created by @adamsanz_
            </a>
        </div>
      </div>

      <LivePreview
        creation={activeCreation}
        isLoading={isGenerating}
        isFocused={isFocused}
        onReset={handleReset}
        onUpdate={handleUpdateCreation}
      />

      <div className="fixed bottom-4 right-4 z-50">
        <button 
            onClick={handleImportClick}
            className="flex items-center space-x-2 p-2 text-zinc-500 hover:text-zinc-300 transition-colors opacity-60 hover:opacity-100"
            title="Import Artifact"
        >
            <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">Upload previous artifact</span>
            <ArrowUpTrayIcon className="w-5 h-5" />
        </button>
        <input 
            type="file" 
            ref={importInputRef} 
            onChange={handleImportFile} 
            accept=".json" 
            className="hidden" 
        />
      </div>
    </div>
  );
};

export default App;
