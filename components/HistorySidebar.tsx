import React, { useState, useEffect, useCallback, useRef } from 'react';
import { XIcon } from './IconComponents';
import type { HistoryItem } from '../types';
import { getHistoryFromDb } from '../utils/storageUtils';
import { getWaveSpeedApiKey } from '../services/apiKeyService';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
}

type TabType = 'gemini' | 'wavespeed';

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
  timings?: {
    inference?: number;
  };
}

interface WaveSpeedPredictionsResponse {
  code?: number;
  data?: WaveSpeedPrediction[] | {
    items?: WaveSpeedPrediction[];
  };
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  onSelect
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('gemini');
  const [geminiHistory, setGeminiHistory] = useState<HistoryItem[]>([]);
  const [wavespeedHistory, setWavespeedHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  // Load Gemini history from IndexedDB
  const loadGeminiHistory = useCallback(async () => {
    try {
      setError(null);
      const history = await getHistoryFromDb('gemini');
      setGeminiHistory(history);
    } catch (err) {
      console.error('Failed to load Gemini history:', err);
      setError('Failed to load history');
      setGeminiHistory([]);
    }
  }, []);

  // Load WaveSpeed history from API only
  const loadWaveSpeedHistory = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) {
      console.log('[HistorySidebar] Already loading WaveSpeed history, skipping duplicate request');
      return;
    }

    const apiKey = getWaveSpeedApiKey();
    if (!apiKey) {
      setWavespeedHistory([]);
      setError('WaveSpeed API key not set. Please add your API key in Creator Settings.');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const apiUrl = 'https://api.wavespeed.ai/api/v3/predictions';
      console.log('[HistorySidebar] Fetching WaveSpeed predictions from API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[HistorySidebar] API Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = '';
        try {
          const errorText = await response.text();
          console.error('[HistorySidebar] Error response body:', errorText);
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorText;
          } catch {
            errorMessage = errorText || `HTTP ${response.status}`;
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your WaveSpeed API key in Creator Settings.');
        }
        if (response.status === 403) {
          throw new Error('API key does not have permission to access predictions.');
        }
        if (response.status === 404) {
          // 404 means endpoint doesn't exist or no predictions
          setWavespeedHistory([]);
          setError('No predictions found. The API endpoint may not be available or you have no predictions yet.');
          return;
        }
        throw new Error(`Failed to load predictions: ${errorMessage}`);
      }

      const result: WaveSpeedPredictionsResponse = await response.json();
      
      console.log('[HistorySidebar] WaveSpeed API response:', result);
      
      // Handle response structure: could be { code: 200, data: [...] } or { data: { items: [...] } } or direct array
      let predictions: WaveSpeedPrediction[] = [];
      
      // Check if result is directly an array
      if (Array.isArray(result)) {
        predictions = result;
      } else if (result.data) {
        if (Array.isArray(result.data)) {
          predictions = result.data;
        } else if (result.data.items && Array.isArray(result.data.items)) {
          predictions = result.data.items;
        }
      }

      console.log('[HistorySidebar] Parsed predictions from API:', predictions.length);

      // Filter for completed predictions with outputs from alibaba/wan-2.6/image-edit model
      const completedPredictions = predictions
        .filter((pred: WaveSpeedPrediction) => {
          const isCompleted = pred.status === 'completed';
          const hasOutputs = pred.outputs && pred.outputs.length > 0;
          const isImageEditModel = pred.model && (
            pred.model.includes('wan-2.6/image-edit') || 
            pred.model === 'alibaba/wan-2.6/image-edit'
          );
          
          return isCompleted && hasOutputs && isImageEditModel;
        });

      console.log('[HistorySidebar] Completed image-edit predictions from API:', completedPredictions.length);

      // Convert API predictions to HistoryItem format
      const historyItems: HistoryItem[] = await Promise.all(
        completedPredictions.map(async (pred: WaveSpeedPrediction) => {
          let prompt = pred.input?.prompt;
          
          // If prompt is missing, try to fetch individual prediction details
          if (!prompt) {
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
                prompt = detailData.input?.prompt || 'No prompt';
              }
            } catch (err) {
              console.warn(`Failed to fetch prompt for prediction ${pred.id}:`, err);
            }
          }

          return {
            id: pred.id,
            imageUrl: pred.outputs![0],
            prompt: prompt || 'No prompt',
            aspectRatio: '16:9' as const,
            source: 'wavespeed' as const,
            created_at: pred.created_at,
          } as HistoryItem & { created_at?: string };
        })
      );

      // Sort by created_at descending (newest first)
      historyItems.sort((a, b) => {
        const dateA = (a as any).created_at || '';
        const dateB = (b as any).created_at || '';
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.localeCompare(dateA);
      });

      setWavespeedHistory(historyItems);
      console.log('[HistorySidebar] Successfully loaded', historyItems.length, 'WaveSpeed predictions from API');
      
      if (historyItems.length === 0) {
        setError('No predictions found. Generate images in Halyxis+ to see them here.');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('[HistorySidebar] Failed to load WaveSpeed history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load WaveSpeed history';
      setError(errorMessage);
      setWavespeedHistory([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Load history when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadGeminiHistory();
      if (activeTab === 'wavespeed') {
        loadWaveSpeedHistory();
      }
    }
  }, [isOpen, activeTab, loadGeminiHistory, loadWaveSpeedHistory]);

  // Listen for new history items
  useEffect(() => {
    const handleHistoryUpdate = () => {
      if (isOpen && activeTab === 'gemini') {
        loadGeminiHistory();
      }
    };

    const handleApiKeySaved = () => {
      // Refresh WaveSpeed history when API key is saved
      // Always refresh if sidebar is open, or prepare for when user opens it
      if (isOpen || activeTab === 'wavespeed') {
        loadWaveSpeedHistory();
      }
    };

    window.addEventListener('geminiHistoryUpdated', handleHistoryUpdate);
    window.addEventListener('wavespeedHistoryUpdated', loadWaveSpeedHistory);
    window.addEventListener('wavespeedApiKeySaved', handleApiKeySaved);

    return () => {
      window.removeEventListener('geminiHistoryUpdated', handleHistoryUpdate);
      window.removeEventListener('wavespeedHistoryUpdated', loadWaveSpeedHistory);
      window.removeEventListener('wavespeedApiKeySaved', handleApiKeySaved);
    };
  }, [isOpen, activeTab, loadGeminiHistory, loadWaveSpeedHistory]);

  const currentHistory = activeTab === 'gemini' ? geminiHistory : wavespeedHistory;
  const isEmpty = currentHistory.length === 0;

  const formatDate = (id: string) => {
    try {
      // Try to extract date from ISO string in ID
      const dateStr = id.substring(0, 19);
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      // Ignore
    }
    return 'Recent';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full w-96 bg-[#0a0c10] border-l border-white/5 shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Generation History</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'gemini'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-teal-400/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Gemini ({geminiHistory.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('wavespeed');
              // Always reload when switching to WaveSpeed tab to get latest data
              loadWaveSpeedHistory();
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'wavespeed'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-teal-400/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            WaveSpeed ({wavespeedHistory.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-12">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => activeTab === 'gemini' ? loadGeminiHistory() : loadWaveSpeedHistory()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && isEmpty && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                No {activeTab === 'gemini' ? 'Gemini' : 'WaveSpeed'} history yet.
              </p>
              {activeTab === 'wavespeed' && (
                <div className="mt-3 space-y-1">
                  <p className="text-gray-500 text-xs">
                    Predictions are stored for 7 days on WaveSpeed servers.
                  </p>
                  <p className="text-gray-500 text-xs">
                    Generate images in Halyxis+ to see them here.
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && !error && !isEmpty && (
            <div className="space-y-3">
              {currentHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="group cursor-pointer bg-[#0f1115] border border-white/5 rounded-lg p-3 hover:border-teal-500/50 hover:bg-[#14161a] transition-all"
                >
                  <div className="aspect-video bg-[#020408] rounded overflow-hidden mb-2">
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%231a1c20" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-family="sans-serif" font-size="12"%3EFailed to load%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-1 group-hover:text-gray-300 transition-colors">
                    {item.prompt || 'No prompt'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(item.id)}</span>
                    <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] uppercase">
                      {item.aspectRatio}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
