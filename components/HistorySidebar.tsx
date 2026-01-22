
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { HistoryItem } from '../types';
import { getHistoryFromDb } from '../utils/storageUtils';
import { getWaveSpeedApiKey } from '../services/apiKeyService';

interface WaveSpeedPrediction {
  id: string;
  model: string;
  status: 'created' | 'processing' | 'completed' | 'failed';
  outputs?: string[];
  created_at: string;
  input?: {
    prompt?: string;
    images?: string[];
    seed?: number;
    enable_prompt_expansion?: boolean;
  };
}

interface WaveSpeedPredictionsResponse {
  code: number;
  data: {
    items: WaveSpeedPrediction[];
    total?: number;
  };
}

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
  const [wavespeedLoading, setWavespeedLoading] = useState(false);
  const [wavespeedError, setWavespeedError] = useState<string | null>(null);
  
  // Refs to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const currentWavespeedHistoryRef = useRef<HistoryItem[]>(wavespeedHistory);
  const DEBOUNCE_DELAY = 500; // 500ms debounce

  // Keep ref in sync with state
  useEffect(() => {
    currentWavespeedHistoryRef.current = localWavespeedHistory;
  }, [localWavespeedHistory]);

  // Sync with props when they change (only for Gemini, WaveSpeed comes from API)
  useEffect(() => {
    setLocalGeminiHistory(geminiHistory);
  }, [geminiHistory]);

  // Function to fetch WaveSpeed predictions from API
  const fetchWaveSpeedPredictions = useCallback(async (force: boolean = false): Promise<HistoryItem[]> => {
    // Prevent duplicate fetches
    const now = Date.now();
    if (!force && isFetchingRef.current) {
      console.log('[HistorySidebar] Already fetching, skipping duplicate fetch');
      // Return current history from ref to preserve it
      return currentWavespeedHistoryRef.current;
    }
    
    if (!force && (now - lastFetchTimeRef.current < DEBOUNCE_DELAY)) {
      console.log('[HistorySidebar] Too soon since last fetch, skipping');
      // Return current history from ref to preserve it
      return currentWavespeedHistoryRef.current;
    }

    const apiKey = getWaveSpeedApiKey();
    if (!apiKey) {
      setWavespeedError('WaveSpeed API key not set');
      return [];
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    setWavespeedLoading(true);
    setWavespeedError(null);

    try {
      // Fetch predictions from WaveSpeed API
      const response = await fetch('https://api.wavespeed.ai/api/v3/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          page: 1, 
          page_size: 100 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to fetch predictions: ${response.status}`);
      }

      const result: WaveSpeedPredictionsResponse = await response.json();
      
      if (result.code !== 200 || !result.data?.items) {
        throw new Error('Invalid response from WaveSpeed API');
      }

      // Filter for image-edit model
      const imageEditPredictions = result.data.items
        .filter((pred: WaveSpeedPrediction) => 
          pred.model && pred.model.includes('wan-2.6/image-edit')
        )
        .filter((pred: WaveSpeedPrediction) => 
          pred.status === 'completed' && pred.outputs && pred.outputs.length > 0
        );

      // Fetch individual prediction details to get full prompt information
      // Process in batches to avoid overwhelming the API
      const BATCH_SIZE = 10;
      const predictionsWithPrompts: (HistoryItem & { created_at?: string })[] = [];

      for (let i = 0; i < imageEditPredictions.length; i += BATCH_SIZE) {
        const batch = imageEditPredictions.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(async (pred: WaveSpeedPrediction) => {
            // If prompt is already in the list response, use it
            if (pred.input?.prompt) {
              return {
                id: pred.id,
                imageUrl: pred.outputs![0],
                prompt: pred.input.prompt,
                aspectRatio: '16:9' as const,
                source: 'wavespeed' as const,
                created_at: pred.created_at,
              };
            }

            // Otherwise, fetch individual prediction details
            try {
              const detailResponse = await fetch(
                `https://api.wavespeed.ai/api/v3/predictions/${pred.id}`,
                {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (detailResponse.ok) {
                const detailResult = await detailResponse.json();
                const detailData = detailResult.data || detailResult;
                const prompt = detailData.input?.prompt || detailData.prompt || 'No prompt';
                
                return {
                  id: pred.id,
                  imageUrl: pred.outputs![0],
                  prompt: prompt,
                  aspectRatio: '16:9' as const,
                  source: 'wavespeed' as const,
                  created_at: pred.created_at,
                };
              }
            } catch (err) {
              console.warn(`[HistorySidebar] Failed to fetch details for prediction ${pred.id}:`, err);
            }

            // Fallback if detail fetch fails
            return {
              id: pred.id,
              imageUrl: pred.outputs![0],
              prompt: 'No prompt',
              aspectRatio: '16:9' as const,
              source: 'wavespeed' as const,
              created_at: pred.created_at,
            };
          })
        );

        predictionsWithPrompts.push(...batchResults);
      }

      // Sort by created_at descending (newest first)
      predictionsWithPrompts.sort((a, b) => {
        const dateA = a.created_at || '';
        const dateB = b.created_at || '';
        return dateB.localeCompare(dateA);
      });

      console.log(`[HistorySidebar] Fetched ${predictionsWithPrompts.length} WaveSpeed predictions from API with prompts`);
      return predictionsWithPrompts;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch WaveSpeed predictions';
      console.error('[HistorySidebar] Error fetching WaveSpeed predictions:', error);
      setWavespeedError(errorMessage);
      return [];
    } finally {
      setWavespeedLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Function to reload Gemini history from local storage
  const reloadGeminiHistory = useCallback(async () => {
    const geminiHistory = await getHistoryFromDb('gemini');
    setLocalGeminiHistory(geminiHistory);
    if (onHistoryUpdate) {
      setLocalWavespeedHistory(prev => {
        onHistoryUpdate(geminiHistory, prev);
        return prev;
      });
    }
  }, [onHistoryUpdate]);

  // Function to reload WaveSpeed history from API
  const reloadWavespeedHistory = useCallback(async (force: boolean = false) => {
    const wavespeedHistory = await fetchWaveSpeedPredictions(force);
    setLocalWavespeedHistory(wavespeedHistory);
    if (onHistoryUpdate) {
      setLocalGeminiHistory(prev => {
        onHistoryUpdate(prev, wavespeedHistory);
        return prev;
      });
    }
  }, [fetchWaveSpeedPredictions, onHistoryUpdate]);

  // Load Gemini history when sidebar opens
  useEffect(() => {
    if (isOpen) {
      reloadGeminiHistory();
    }
  }, [isOpen, reloadGeminiHistory]);

  // Fetch WaveSpeed predictions when switching to WaveSpeed tab (debounced)
  useEffect(() => {
    if (!isOpen || activeTab !== 'wavespeed') {
      return;
    }

    // Debounce the fetch
    const timeoutId = setTimeout(() => {
      reloadWavespeedHistory();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isOpen, activeTab, reloadWavespeedHistory]);

  // Listen for WaveSpeed API key saves - refresh only once immediately
  const apiKeyRefreshRef = useRef(false);
  useEffect(() => {
    const handleApiKeySaved = () => {
      // Refresh immediately, only once
      if (isOpen && !apiKeyRefreshRef.current) {
        apiKeyRefreshRef.current = true;
        reloadWavespeedHistory(true); // Force refresh immediately
        // Reset flag after a short delay to allow future refreshes
        setTimeout(() => {
          apiKeyRefreshRef.current = false;
        }, 1000);
      }
    };
    
    window.addEventListener('wavespeedApiKeySaved', handleApiKeySaved);
    return () => {
      window.removeEventListener('wavespeedApiKeySaved', handleApiKeySaved);
    };
  }, [isOpen, reloadWavespeedHistory]);

  // Listen for WaveSpeed history updates from new generations (debounced)
  useEffect(() => {
    const handleWavespeedHistoryUpdate = () => {
      // Only reload if WaveSpeed tab is active
      if (activeTab === 'wavespeed' && isOpen) {
        setTimeout(() => {
          reloadWavespeedHistory(true); // Force refresh
        }, 300);
      }
    };
    
    window.addEventListener('wavespeedHistoryUpdated', handleWavespeedHistoryUpdate);
    return () => {
      window.removeEventListener('wavespeedHistoryUpdated', handleWavespeedHistoryUpdate);
    };
  }, [activeTab, isOpen, reloadWavespeedHistory]);

  // Listen for Gemini history updates
  useEffect(() => {
    const handleGeminiHistoryUpdate = () => {
      if (activeTab === 'gemini' && isOpen) {
        reloadGeminiHistory();
      }
    };
    
    window.addEventListener('geminiHistoryUpdated', handleGeminiHistoryUpdate);
    return () => {
      window.removeEventListener('geminiHistoryUpdated', handleGeminiHistoryUpdate);
    };
  }, [activeTab, isOpen, reloadGeminiHistory]);

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
          <div className="flex items-center gap-2">
            {activeTab === 'wavespeed' && (
              <button 
                onClick={() => {
                  reloadWavespeedHistory(true); // Force refresh
                }}
                disabled={wavespeedLoading}
                className="p-2 text-gray-500 hover:text-teal-400 transition-colors rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh WaveSpeed History"
                aria-label="Refresh"
              >
                <svg 
                  className={`w-5 h-5 ${wavespeedLoading ? 'animate-spin' : ''}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
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
          {activeTab === 'wavespeed' && wavespeedLoading && (
            <div className="flex flex-col items-center justify-center h-64">
              <svg className="animate-spin h-8 w-8 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-400 text-sm mt-4">Loading WaveSpeed predictions...</p>
            </div>
          )}
          {activeTab === 'wavespeed' && wavespeedError && (
            <div className="bg-red-900/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl">
              <p className="text-sm">{wavespeedError}</p>
            </div>
          )}
          {!wavespeedLoading && currentHistory.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-600 text-sm">
                <p>No {activeTab === 'gemini' ? 'Gemini' : 'WaveSpeed'} history yet.</p>
                {activeTab === 'wavespeed' && (
                  <p className="text-xs text-gray-500 mt-2">Predictions are stored for 7 days on WaveSpeed servers.</p>
                )}
             </div>
          ) : !wavespeedLoading && (
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
                        {(() => {
                          // Try to get date from created_at if available (WaveSpeed API)
                          const created_at = (item as any).created_at;
                          if (created_at) {
                            try {
                              return new Date(created_at).toLocaleDateString();
                            } catch {
                              // Fall through to other methods
                            }
                          }
                          // Try to parse from ID (ISO timestamp format)
                          if (item.id.includes('T') || item.id.match(/^\d{4}-\d{2}-\d{2}/)) {
                            return new Date(item.id.split('T')[0]).toLocaleDateString();
                          }
                          return 'Recent';
                        })()}
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
