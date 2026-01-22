
import React, { useState, useEffect } from 'react';
import { ImageIcon, AlertTriangleIcon, DownloadIcon, ExpandIcon, ClipboardIcon } from './IconComponents';

interface ImageDisplayProps {
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
  prompt?: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ generatedImage, isLoading, error, prompt }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const getDownloadFilename = (prompt?: string): string => {
    if (prompt && prompt.trim()) {
      const sanitizedPrompt = prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove special characters
        .replace(/\s+/g, '-')       // replace spaces with hyphens
        .slice(0, 50);              // limit length
      return `halyxis-${sanitizedPrompt || 'asset'}.png`;
    }
    return 'halyxis-asset.png';
  };

  const openFullscreen = () => {
    if (generatedImage) {
      setIsFullscreen(true);
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };
  
  const handleCopyImage = async () => {
    if (!generatedImage || !navigator.clipboard?.write) {
      console.error('Clipboard API not available.');
      return;
    }

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFullscreen();
      }
    };

    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <>
      <div className="bg-[#0f1115] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col shadow-2xl h-full min-h-[500px] relative">
        <div className="w-full flex-grow flex flex-col items-center justify-center mb-6 relative">
            
            <div className="absolute top-0 left-0 text-xs font-bold text-gray-600 tracking-widest uppercase pointer-events-none">
                Output
            </div>

            <div className="w-full h-full min-h-[400px] bg-[#050608] rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 relative">
                {/* Placeholder is shown when there's no image and not loading. */}
                {!generatedImage && !isLoading && (
                    <div className="text-center text-gray-700">
                        <div className="bg-[#0a0c10] p-6 rounded-full inline-block mb-4 border border-white/5 shadow-inner">
                           <ImageIcon className="w-10 h-10 mx-auto opacity-50" />
                        </div>
                        <p className="text-sm font-medium tracking-wide">Ready to synthesize</p>
                    </div>
                )}
                
                {/* The image, when present, is positioned to fill the container. */}
                {generatedImage && (
                    <img
                        src={generatedImage}
                        alt="Generated"
                        className="absolute inset-0 w-full h-full object-contain"
                    />
                )}

                {/* Loading overlay covers the container. */}
                {isLoading && (
                    <div className="absolute inset-0 bg-[#050608]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                         <div className="relative">
                            <div className="absolute inset-0 bg-teal-500 rounded-full blur-2xl opacity-10 animate-pulse"></div>
                            <svg className="animate-spin h-12 w-12 text-teal-500 relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <p className="text-xs text-teal-400 font-bold tracking-widest uppercase animate-pulse">Synthesizing</p>
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex-shrink-0 min-h-[48px] flex items-center justify-center">
            {error ? (
                <div className="bg-red-900/10 border border-red-500/20 text-red-300 px-6 py-4 rounded-xl flex items-center gap-4 w-full">
                    <AlertTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            ) : generatedImage && !isLoading ? (
                <div className="flex items-center justify-center gap-2 w-full">
                    <a
                        href={generatedImage}
                        download={getDownloadFilename(prompt)}
                        title="Download Asset"
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-black bg-teal-500 hover:bg-teal-400 px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-teal-900/20"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Download
                    </a>
                    <button
                        onClick={handleCopyImage}
                        disabled={copyStatus === 'copied'}
                        title="Copy Image"
                        className="flex-none flex items-center justify-center gap-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-3.5 rounded-xl transition-colors disabled:bg-teal-900/20 disabled:text-teal-400 disabled:border-teal-500/20"
                    >
                        <ClipboardIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={openFullscreen}
                        title="View Fullscreen"
                        className="flex-none flex items-center justify-center gap-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-3.5 rounded-xl transition-colors"
                    >
                        <ExpandIcon className="w-5 h-5" />
                    </button>
                </div>
            ) : null }
        </div>
      </div>

      {isFullscreen && generatedImage && (
        <div
          className="fixed inset-0 bg-[#020408]/95 backdrop-blur-xl z-50 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={closeFullscreen}
        >
          <img
            src={generatedImage}
            alt="Generated Fullscreen"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
           <button
                onClick={closeFullscreen}
                className="absolute top-6 right-6 text-white/50 bg-white/5 border border-white/10 rounded-full p-3 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
                aria-label="Close fullscreen view"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      )}
    </>
  );
};
