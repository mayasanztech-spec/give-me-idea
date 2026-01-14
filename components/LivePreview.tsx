
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  ArrowDownTrayIcon, 
  PlusIcon, 
  ViewColumnsIcon, 
  DocumentIcon, 
  CodeBracketIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  PuzzlePieceIcon,
  CpuChipIcon,
  CommandLineIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  isFocused: boolean;
  onReset: () => void;
  onUpdate?: (updated: Creation) => void;
}

// Add type definition for the global pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const TerminalLog = ({ step }: { step: number }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const logPool = [
        ["Initializing neural link...", "Scanning pixel buffers...", "Extracting geometric primitives...", "Metadata integrity verified."],
        ["Mapping interface topology...", "Identifying interactive nodes...", "Generating layout constraints...", "Responsive breakpoints calculated."],
        ["Synthesizing functional logic...", "Hydrating event handlers...", "Optimizing state transitions...", "Reactive patterns established."],
        ["Bundling assets...", "Injecting system styles...", "Compiling runtime environment...", "Manifest ready."]
    ];

    useEffect(() => {
        if (step >= 0 && step < logPool.length) {
            let i = 0;
            const interval = setInterval(() => {
                if (i < logPool[step].length) {
                    setLogs(prev => [...prev.slice(-5), `> ${logPool[step][i]}`]);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 600);
            return () => clearInterval(interval);
        }
    }, [step]);

    return (
        <div className="w-full font-mono text-[9px] text-zinc-600 bg-black/40 p-3 rounded-lg border border-zinc-900 overflow-hidden h-24 flex flex-col justify-end">
            <div className="space-y-1">
                {logs.map((log, idx) => (
                    <div key={idx} className={`${idx === logs.length - 1 ? 'text-zinc-400' : ''}`}>
                        {log}
                        {idx === logs.length - 1 && <span className="inline-block w-1 h-3 bg-blue-500 ml-1 animate-pulse"></span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const LoadingStep = ({ 
    text, 
    active, 
    completed, 
    Icon 
}: { 
    text: string, 
    active: boolean, 
    completed: boolean,
    Icon: React.ElementType 
}) => (
    <div className={`flex items-center space-x-4 transition-all duration-700 ${active || completed ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-2'}`}>
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-500 ${
            completed ? 'bg-green-500/10 border-green-500/50 text-green-400' : 
            active ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 
            'bg-zinc-900 border-zinc-800 text-zinc-700'
        }`}>
            <Icon className={`w-5 h-5 ${active ? 'animate-pulse' : ''}`} />
            {completed && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-black rounded-full p-0.5 border-2 border-[#09090b]">
                    <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
            {active && (
                <div className="absolute inset-0 rounded-xl border border-blue-500/50 animate-ping opacity-20"></div>
            )}
        </div>
        <div className="flex flex-col">
            <span className={`font-mono text-[9px] tracking-widest uppercase transition-colors duration-500 ${active ? 'text-blue-400' : completed ? 'text-green-500/70' : 'text-zinc-700'}`}>
                {completed ? 'Success' : active ? 'Active' : 'Standby'}
            </span>
            <span className={`text-[13px] font-medium transition-colors duration-500 ${active ? 'text-zinc-100' : completed ? 'text-zinc-500' : 'text-zinc-600'}`}>
                {text}
            </span>
        </div>
    </div>
);

const CodeEditor = ({ 
    code, 
    onChange, 
    onUndo, 
    onRedo 
}: { 
    code: string, 
    onChange: (val: string) => void,
    onUndo: () => void,
    onRedo: () => void
}) => {
    const preRef = useRef<HTMLPreElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const highlight = (text: string) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="text-green-400">$1</span>')
            .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|await|async|class|extends|new|this|true|false|null|undefined)\b/g, '<span class="text-blue-400">$1</span>')
            .replace(/\b(html|body|div|span|script|style|link|meta|h1|h2|h3|p|button|input|form|section|header|footer|nav|main|article|aside|ul|li|ol|canvas|iframe|a)\b/g, '<span class="text-orange-400">$1</span>')
            .replace(/(\/\*[\s\S]*?\*\/|\/\/.+)$/gm, '<span class="text-zinc-600">$1</span>');
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                onRedo();
            } else {
                onUndo();
            }
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            onRedo();
        }
    };

    const lineNumbers = code.split('\n').length;

    return (
        <div className="relative flex-1 bg-[#09090b] flex overflow-hidden font-mono text-[13px] leading-relaxed">
            <div className="w-10 bg-zinc-950/50 border-r border-zinc-900 text-zinc-700 text-right pr-2 pt-4 select-none overflow-hidden shrink-0">
                {Array.from({ length: lineNumbers }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                ))}
            </div>
            
            <div className="relative flex-1">
                <textarea
                    ref={textAreaRef}
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none outline-none z-10 whitespace-pre overflow-auto font-mono"
                />
                <pre
                    ref={preRef}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full p-4 pointer-events-none whitespace-pre overflow-hidden font-mono"
                    dangerouslySetInnerHTML={{ __html: highlight(code) + '\n' }}
                />
            </div>
        </div>
    );
};

const PdfRenderer = ({ dataUrl }: { dataUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      if (!window.pdfjsLib) {
        setError("PDF library not initialized");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const loadingTask = window.pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 2.0 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
        setError("Could not render PDF preview.");
        setLoading(false);
      }
    };
    renderPdf();
  }, [dataUrl]);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
            <DocumentIcon className="w-12 h-12 mb-3 opacity-50 text-red-400" />
            <p className="text-sm mb-2 text-red-400/80">{error}</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
    </div>
  );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, isFocused, onReset, onUpdate }) => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [showSplitView, setShowSplitView] = useState(false);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    
    const [editableCode, setEditableCode] = useState('');
    const [debouncedCode, setDebouncedCode] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isInternalChange = useRef(false);
    const prevCreationId = useRef<string | null>(null);

    useEffect(() => {
        if (isLoading) {
            setLoadingStep(0);
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
            }, 3000); 
            return () => clearInterval(interval);
        } else {
            setLoadingStep(0);
        }
    }, [isLoading]);

    useEffect(() => {
        if (creation?.id !== prevCreationId.current) {
            prevCreationId.current = creation?.id || null;
            if (creation?.html) {
                setEditableCode(creation.html);
                setDebouncedCode(creation.html);
                setHistory([creation.html]);
                setHistoryIndex(0);
                setLastSaved(null);
            }
        }
    }, [creation]);

    useEffect(() => {
        if (editableCode === debouncedCode) return;
        setIsSyncing(true);
        const timer = setTimeout(() => {
            setDebouncedCode(editableCode);
            setIsSyncing(false);
            
            // Trigger auto-save to parent history
            if (creation && onUpdate && editableCode !== creation.html) {
                onUpdate({
                    ...creation,
                    html: editableCode,
                    timestamp: new Date()
                });
                setLastSaved(new Date());
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [editableCode, debouncedCode, creation, onUpdate]);

    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }

        const timer = setTimeout(() => {
            if (editableCode && history.length > 0 && editableCode !== history[historyIndex]) {
                setHistory(prev => {
                    const newHistory = prev.slice(0, historyIndex + 1);
                    newHistory.push(editableCode);
                    if (newHistory.length > 100) newHistory.shift();
                    return newHistory;
                });
                setHistoryIndex(prev => Math.min(prev + 1, 99));
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [editableCode, history, historyIndex]);

    useEffect(() => {
        if (creation?.originalImage) {
            setShowSplitView(true);
        } else {
            setShowSplitView(false);
        }
    }, [creation]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const nextIdx = historyIndex - 1;
            isInternalChange.current = true;
            setHistoryIndex(nextIdx);
            setEditableCode(history[nextIdx]);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIdx = historyIndex + 1;
            isInternalChange.current = true;
            setHistoryIndex(nextIdx);
            setEditableCode(history[nextIdx]);
        }
    }, [history, historyIndex]);

    const handleSave = () => {
        if (creation && onUpdate) {
            onUpdate({
                ...creation,
                html: editableCode,
                timestamp: new Date()
            });
            setLastSaved(new Date());
            setDebouncedCode(editableCode);
        }
    };

    const handleExport = () => {
        if (!creation) return;
        const finalCreation = { ...creation, html: editableCode };
        const dataStr = JSON.stringify(finalCreation, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_artifact.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

  return (
    <div
      className={`
        fixed z-40 flex flex-col
        rounded-xl overflow-hidden border border-zinc-800 bg-[#0E0E10] shadow-2xl
        transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
        ${isFocused
          ? 'inset-2 md:inset-4 opacity-100 scale-100'
          : 'top-1/2 left-1/2 w-[90%] h-[60%] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Header Bar */}
      <div className="bg-[#121214] px-4 py-3 flex items-center justify-between border-b border-zinc-800 shrink-0">
        <div className="flex items-center space-x-3 w-32 md:w-56">
           <div className="flex space-x-2 group/controls">
                <button 
                  onClick={onReset}
                  className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-red-500 hover:!bg-red-600 transition-colors flex items-center justify-center focus:outline-none"
                >
                  <XMarkIcon className="w-2 h-2 text-black opacity-0 group-hover/controls:opacity-100" />
                </button>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-yellow-500 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-green-500 transition-colors"></div>
           </div>
           {showCodeEditor && !isLoading && (
               <div className="flex items-center space-x-4 ml-4">
                   {isSyncing ? (
                       <div className="flex items-center text-zinc-500 space-x-1">
                           <div className="w-2 h-2 rounded-full bg-yellow-500/50 animate-pulse"></div>
                           <span className="text-[10px] uppercase font-mono tracking-tighter">Syncing</span>
                       </div>
                   ) : (
                        <div className="flex items-center text-green-500 space-x-1">
                            <CheckCircleIcon className="w-3 h-3" />
                            <span className="text-[10px] uppercase font-mono tracking-tighter">Live</span>
                        </div>
                   )}
                   {lastSaved && !isSyncing && (
                       <div className="flex items-center text-zinc-600 space-x-1">
                            <CloudArrowUpIcon className="w-3 h-3" />
                            <span className="text-[9px] uppercase font-mono tracking-tighter">Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                       </div>
                   )}
               </div>
           )}
        </div>
        
        <div className="flex items-center space-x-2 text-zinc-500">
            <CodeBracketIcon className="w-3 h-3" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
                {isLoading ? 'System Synthesis' : creation ? creation.name : 'Preview Mode'}
            </span>
        </div>

        <div className="flex items-center justify-end space-x-1 w-32 md:w-56">
            {!isLoading && creation && (
                <>
                    <button 
                        onClick={() => setShowCodeEditor(!showCodeEditor)}
                        className={`p-1.5 rounded-md transition-all flex items-center space-x-1 ${showCodeEditor ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                        title="Edit Code"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase hidden md:inline">Edit</span>
                    </button>
                    {creation.originalImage && (
                         <button 
                            onClick={() => setShowSplitView(!showSplitView)}
                            className={`p-1.5 rounded-md transition-all ${showSplitView ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                        >
                            <ViewColumnsIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={handleSave}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-zinc-800"
                        title="Save to History"
                    >
                        <CloudArrowUpIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleExport}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-zinc-800"
                        title="Export as JSON"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onReset}
                        className="ml-2 flex items-center space-x-1 text-xs font-bold bg-white text-black hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <PlusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">New</span>
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="relative w-full flex-1 bg-[#09090b] flex overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full bg-zinc-950/40 backdrop-blur-sm z-50">
             
             {/* Dynamic Scanline Overlay */}
             <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

             <div className="w-full max-w-lg space-y-12 relative">
                
                {/* Visual Core Animation */}
                <div className="relative flex flex-col items-center">
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-[100px]"></div>
                    
                    <div className="relative w-24 h-24 mb-10">
                        {/* Rotating Rings */}
                        <div className="absolute inset-0 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-3 border-2 border-zinc-800 border-b-zinc-500 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                        <div className="absolute inset-6 border border-zinc-700/50 rounded-full flex items-center justify-center overflow-hidden">
                            <SparklesIcon className="w-8 h-8 text-white/90 animate-pulse" />
                        </div>
                        {/* Dynamic Core Glow */}
                        <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.2)]"></div>
                    </div>

                    <div className="text-center">
                        <h3 className="text-zinc-100 font-bold text-2xl tracking-tight mb-2">Synthesis in Progress</h3>
                        <p className="text-zinc-500 text-sm font-medium tracking-wide">GEMINI-3-PRO: EXECUTING CONSTRUCTION PROTOCOL</p>
                    </div>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 px-4">
                    <LoadingStep 
                        text="Visual Intelligence Scan" 
                        Icon={MagnifyingGlassIcon}
                        active={loadingStep === 0} 
                        completed={loadingStep > 0} 
                    />
                    <LoadingStep 
                        text="Structural Deconstruction" 
                        Icon={PuzzlePieceIcon}
                        active={loadingStep === 1} 
                        completed={loadingStep > 1} 
                    />
                    <LoadingStep 
                        text="Functional Logic Mapping" 
                        Icon={CpuChipIcon}
                        active={loadingStep === 2} 
                        completed={loadingStep > 2} 
                    />
                    <LoadingStep 
                        text="Runtime Compilation" 
                        Icon={CommandLineIcon}
                        active={loadingStep === 3} 
                        completed={loadingStep > 3} 
                    />
                </div>

                {/* Terminal Console */}
                <div className="px-4">
                    <TerminalLog step={loadingStep} />
                </div>

                {/* Bottom Progress Indicator */}
                <div className="px-4 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                        <span>Buffer Status: Stable</span>
                        <span>{Math.round(((loadingStep + 1) / 4) * 100)}% Complete</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden relative border border-zinc-800/50">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-[2000ms] ease-out shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                            style={{ width: `${(loadingStep + 1) * 25}%` }}
                        ></div>
                    </div>
                </div>

             </div>
          </div>
        ) : creation?.html ? (
          <>
            {showCodeEditor ? (
                 <div className="flex w-full h-full overflow-hidden">
                     <div className="w-1/2 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
                        <div className="px-3 py-2 border-b border-zinc-900 bg-zinc-900/30 flex items-center justify-between shrink-0">
                            <div className="flex items-center space-x-4">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Editor</span>
                                <div className="flex items-center bg-zinc-800/50 rounded-md p-0.5">
                                    <button 
                                        onClick={handleUndo}
                                        disabled={historyIndex <= 0}
                                        className={`p-1 rounded transition-colors ${historyIndex <= 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                                        title="Undo (Ctrl+Z)"
                                    >
                                        <ArrowUturnLeftIcon className="w-3 h-3" />
                                    </button>
                                    <button 
                                        onClick={handleRedo}
                                        disabled={historyIndex >= history.length - 1}
                                        className={`p-1 rounded transition-colors ${historyIndex >= history.length - 1 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                                        title="Redo (Ctrl+Y)"
                                    >
                                        <ArrowUturnRightIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></span>
                                <span className="text-[9px] font-mono text-blue-400">Live Sync Active</span>
                            </div>
                        </div>
                        <CodeEditor 
                            code={editableCode} 
                            onChange={setEditableCode}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                        />
                     </div>
                     <div className="flex-1 bg-white relative">
                        <iframe
                            key={debouncedCode.length}
                            title="Gemini Live Preview"
                            srcDoc={debouncedCode}
                            className="w-full h-full"
                            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                        />
                     </div>
                 </div>
            ) : (
                <>
                    {showSplitView && creation.originalImage && (
                        <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0c0c0e] relative flex flex-col shrink-0">
                            <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-zinc-400 text-[10px] font-mono uppercase px-2 py-1 rounded border border-zinc-800 tracking-tighter">
                                Reference Source
                            </div>
                            <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
                                {creation.originalImage.startsWith('data:application/pdf') ? (
                                    <PdfRenderer dataUrl={creation.originalImage} />
                                ) : (
                                    <img 
                                        src={creation.originalImage} 
                                        alt="Original Input" 
                                        className="max-w-full max-h-full object-contain shadow-2xl border border-zinc-800/50 rounded-lg"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                    <div className={`relative h-full bg-white transition-all duration-500 ${showSplitView && creation.originalImage ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full'}`}>
                        <iframe
                            title="Gemini Live Preview"
                            srcDoc={editableCode}
                            className="w-full h-full"
                            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                        />
                    </div>
                </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

// Internal utility icons
const SparklesIcon = ({ className }: { className?: string }) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);
