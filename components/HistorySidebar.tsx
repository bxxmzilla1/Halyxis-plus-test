
import React, { useState, useEffect, useCallback } from 'react';
import type { HistoryItem } from '../types';
import { getHistoryFromDb } from '../utils/storageUtils';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  geminiHistory: HistoryItem[];
  wavespeedHistory: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onHistoryUpdate?: (gemini: HistoryItem[], wavespeed: HistoryItem[]) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  geminiHistory, 
  wavespeedHistory, 
  onSelect,
  onHistoryUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'wavespeed'>('gemini');
  const [localGeminiHistory, setLocalGeminiHistory] = useState<HistoryItem[]>(geminiHistory);
  const [localWavespeedHistory, setLocalWavespeedHistory] = useState<HistoryItem[]>(wavespeedHistory);

  // Sync with props when they change
  useEffect(() => {
    setLocalGeminiHistory(geminiHistory);
  }, [geminiHistory]);

  useEffect(() => {
    setLocalWavespeedHistory(wavespeedHistory);
  }, [wavespeedHistory]);

  // Function to reload history
  const reloadHistory = useCallback(async () => {
    const geminiHistory = await getHistoryFromDb('gemini');
    const wavespeedHistory = await getHistoryFromDb('wavespeed');
    setLocalGeminiHistory(geminiHistory);
    setLocalWavespeedHistory(wavespeedHistory);
    if (onHistoryUpdate) {
      onHistoryUpdate(geminiHistory, wavespeedHistory);
    }
  }, [onHistoryUpdate]);

  // Listen for WaveSpeed history updates
  useEffect(() => {
    const handleWavespeedHistoryUpdate = () => {
      reloadHistory();
    };
    
    window.addEventListener('wavespeedHistoryUpdated', handleWavespeedHistoryUpdate);
    return () => {
      window.removeEventListener('wavespeedHistoryUpdated', handleWavespeedHistoryUpdate);
    };
  }, [reloadHistory]);

  // Listen for Gemini history updates (if needed in the future)
  useEffect(() => {
    const handleGeminiHistoryUpdate = () => {
      reloadHistory();
    };
    
    window.addEventListener('geminiHistoryUpdated', handleGeminiHistoryUpdate);
    return () => {
      window.removeEventListener('geminiHistoryUpdated', handleGeminiHistoryUpdate);
    };
  }, [reloadHistory]);

  // Reload history when sidebar opens
  useEffect(() => {
    if (isOpen) {
      reloadHistory();
    }
  }, [isOpen, reloadHistory]);

  const currentHistory = activeTab === 'gemini' ? localGeminiHistory : localWavespeedHistory;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-40 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full w-80 sm:w-96 bg-[#0a0c10] border-l border-white/5 shadow-2xl transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 h-20">
          <h2 className="text-lg font-bold text-white tracking-wide">Generation History</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/5 px-6 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('gemini')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'gemini'
                  ? 'bg-[#0f1115] text-teal-400 border-t border-l border-r border-white/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Gemini ({localGeminiHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('wavespeed')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'wavespeed'
                  ? 'bg-[#0f1115] text-teal-400 border-t border-l border-r border-white/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              WaveSpeed ({localWavespeedHistory.length})
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-9rem)] p-6 space-y-6">
          {currentHistory.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-600 text-sm">
                <p>No {activeTab === 'gemini' ? 'Gemini' : 'WaveSpeed'} history yet.</p>
             </div>
          ) : (
             currentHistory.map((item) => (
                <button
                   key={item.id} 
                   onClick={() => { onSelect(item); onClose(); }} 
                   className="w-full text-left group bg-[#0f1115] rounded-xl overflow-hidden border border-white/5 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-900/10 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                   <div className="relative bg-[#050608] w-full aspect-video overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt="Generated result" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
                      />
                      {item.referenceImageUrl && (
                        <div className="absolute bottom-2 left-2 w-12 h-12 border border-white/10 rounded-lg overflow-hidden shadow-lg bg-black/50 backdrop-blur-md">
                           <img 
                             src={item.referenceImageUrl} 
                             alt="Reference" 
                             className="w-full h-full object-cover" 
                           />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <div className="bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                          {item.aspectRatio}
                        </div>
                        {item.source === 'wavespeed' && (
                          <div className="bg-teal-900/70 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                            WS
                          </div>
                        )}
                      </div>
                   </div>
                   <div className="p-4">
                      <p className="text-sm text-gray-400 line-clamp-2 mb-2 group-hover:text-gray-200 transition-colors font-medium">
                        {item.prompt || 'No text prompt provided'}
                      </p>
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                        {item.id.includes('T') ? new Date(item.id.split('T')[0]).toLocaleDateString() : 'Recent'}
                      </p>
                   </div>
                </button>
             ))
          )}
        </div>
      </div>
    </>
  );
}
