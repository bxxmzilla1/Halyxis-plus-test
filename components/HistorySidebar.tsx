import React, { useState, useEffect, useCallback } from 'react';
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
  status: string;
  outputs?: string[];
  created_at: string;
  input?: {
    prompt?: string;
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

  // Load WaveSpeed history from API
  const loadWaveSpeedHistory = useCallback(async () => {
    const apiKey = getWaveSpeedApiKey();
    if (!apiKey) {
      setWavespeedHistory([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://api.wavespeed.ai/api/v3/predictions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data || result;
      const items = data.items || [];

      // Filter for completed image-edit predictions
      const imageEditPredictions = items
        .filter((pred: WaveSpeedPrediction) => 
          pred.model?.includes('wan-2.6/image-edit') &&
          pred.status === 'completed' &&
          pred.outputs?.length > 0
        );

      // Convert to HistoryItem format
      const historyItems: HistoryItem[] = imageEditPredictions.map((pred: WaveSpeedPrediction) => ({
        id: pred.id,
        imageUrl: pred.outputs![0],
        prompt: pred.input?.prompt || 'No prompt',
        aspectRatio: '16:9' as const,
        source: 'wavespeed' as const,
      }));

      // Sort by created_at descending
      historyItems.sort((a, b) => {
        const dateA = (a as any).created_at || '';
        const dateB = (b as any).created_at || '';
        return dateB.localeCompare(dateA);
      });

      setWavespeedHistory(historyItems);
    } catch (err) {
      console.error('Failed to load WaveSpeed history:', err);
      setError('Failed to load WaveSpeed history');
      setWavespeedHistory([]);
    } finally {
      setLoading(false);
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
                <p className="text-gray-500 text-xs mt-2">
                  Predictions are stored for 7 days on WaveSpeed servers.
                </p>
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
