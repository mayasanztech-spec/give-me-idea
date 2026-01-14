
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ArrowUpTrayIcon, SparklesIcon, CpuChipIcon, MicrophoneIcon, PaperAirplaneIcon, XMarkIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneIconSolid } from '@heroicons/react/24/solid';

interface InputAreaProps {
  onGenerate: (prompt: string, file?: File) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const CyclingText = () => {
    const words = [
        "a napkin sketch",
        "a chaotic whiteboard",
        "a game level design",
        "a sci-fi interface",
        "a diagram of a machine",
        "an ancient scroll"
    ];
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false); // fade out
            setTimeout(() => {
                setIndex(prev => (prev + 1) % words.length);
                setFade(true); // fade in
            }, 500); // Wait for fade out
        }, 3000); // Slower cycle to read longer text
        return () => clearInterval(interval);
    }, [words.length]);

    return (
        <span className={`inline-block whitespace-nowrap transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-sm'} text-white font-medium pb-1 border-b-2 border-blue-500/50`}>
            {words[index]}
        </span>
    );
};

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(prev => prev + (prev ? " " : "") + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert("Please upload an image or PDF.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled, isGenerating]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isGenerating) {
        setIsDragging(true);
    }
  }, [disabled, isGenerating]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled || isGenerating) return;
    if (!prompt.trim() && !selectedFile) {
        return;
    }
    onGenerate(prompt, selectedFile || undefined);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative group transition-all duration-300 rounded-2xl border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_40px_rgba(59,130,246,0.1)]' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700'} ${disabled && !isGenerating ? 'opacity-40 cursor-not-allowed grayscale-[0.5]' : ''}`}
      >
        {/* Artifact Preview Area */}
        <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[16rem]">
            {selectedFile ? (
                <div className="relative group/file flex flex-col items-center">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shadow-2xl relative">
                        {selectedFile.type.startsWith('image/') ? (
                             <img 
                                src={URL.createObjectURL(selectedFile)} 
                                alt="Selected" 
                                className="w-full h-full object-cover"
                             />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                <ArrowUpTrayIcon className="w-12 h-12 text-zinc-500 mb-2" />
                                <span className="text-[10px] font-mono text-zinc-400 uppercase truncate max-w-full">{selectedFile.name}</span>
                            </div>
                        )}
                        <button 
                            onClick={removeFile}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors opacity-0 group-hover/file:opacity-100"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="mt-4 text-sm text-zinc-400 font-medium">{selectedFile.name}</p>
                </div>
            ) : (
                <div 
                    onClick={() => !disabled && !isGenerating && fileInputRef.current?.click()}
                    className={`flex flex-col items-center space-y-6 text-center ${!disabled && !isGenerating ? 'cursor-pointer' : ''}`}
                >
                    <div className="relative">
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center transition-all duration-500 ${isDragging ? 'scale-110 border-blue-500' : (!disabled && !isGenerating ? 'group-hover:-translate-y-1' : '')}`}>
                            <ArrowUpTrayIcon className={`w-8 h-8 md:w-10 md:h-10 text-zinc-500 transition-colors ${isDragging ? 'text-blue-400' : (!disabled && !isGenerating ? 'group-hover:text-zinc-300' : '')}`} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                         <h3 className="flex flex-col sm:flex-row items-center justify-center text-xl sm:text-2xl font-bold tracking-tight text-zinc-200 gap-2">
                            <span>Bring</span>
                            <div className="h-8 flex items-center justify-center min-w-[12rem]">
                               <CyclingText />
                            </div>
                            <span>to life</span>
                        </h3>
                        <p className="text-zinc-500 text-sm md:text-base font-light">
                            {disabled && !isGenerating ? "Session Token Limit Reached" : "Drop an artifact here or click to upload"}
                        </p>
                    </div>
                </div>
            )}
        </div>

        <input
            type="file"
            ref={fileInputRef}
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isGenerating || disabled}
        />
      </div>

      {/* Control / Prompt Bar */}
      <div className="relative">
        <form 
            onSubmit={handleSubmit}
            className={`relative flex items-end gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl transition-all duration-300 ${isGenerating || (disabled && !isGenerating) ? 'opacity-50' : 'focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-700'}`}
        >
            <div className="flex-1 relative flex items-center">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={disabled && !isGenerating ? "Session limit reached..." : "Describe what you want to build or leave blank for a surprise..."}
                    disabled={isGenerating || disabled}
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 text-zinc-100 placeholder:text-zinc-600 resize-none py-3 px-4 min-h-[44px] max-h-[200px] overflow-y-auto font-medium"
                />
                
                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isGenerating || disabled}
                    className={`p-2 rounded-xl transition-all ${isListening ? 'text-red-500 bg-red-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                    title="Voice Input"
                >
                    {isListening ? (
                        <MicrophoneIconSolid className="w-5 h-5 animate-pulse" />
                    ) : (
                        <MicrophoneIcon className="w-5 h-5" />
                    )}
                </button>
            </div>

            <button
                type="submit"
                disabled={isGenerating || disabled || (!prompt.trim() && !selectedFile)}
                className={`
                    group flex items-center justify-center
                    h-11 px-6 rounded-xl
                    font-bold text-sm tracking-wide uppercase
                    transition-all duration-300
                    ${isGenerating || (disabled && !isGenerating)
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50' 
                        : (!prompt.trim() && !selectedFile)
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-blue-500 hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95'
                    }
                `}
            >
                {isGenerating ? (
                    <CpuChipIcon className="w-5 h-5 animate-spin" />
                ) : disabled ? (
                    <div className="flex items-center gap-2">
                        <ShieldExclamationIcon className="w-4 h-4 text-red-500" />
                        <span className="text-zinc-500">Locked</span>
                    </div>
                ) : (
                    <>
                        <span className="mr-2">Bring to life</span>
                        <SparklesIcon className="w-4 h-4 group-hover:animate-bounce" />
                    </>
                )}
            </button>
        </form>
      </div>
    </div>
  );
};
