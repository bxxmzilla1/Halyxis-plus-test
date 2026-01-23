import React, { useState, useEffect, useCallback } from 'react';
import { XIcon } from './IconComponents';
import type { HistoryItem } from '../types';
import { getHistoryFromDb } from '../utils/storageUtils';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  onSelect
}) => {
  const [geminiHistory, setGeminiHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Gemini history from IndexedDB
  const loadGeminiHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await getHistoryFromDb('gemini');
      setGeminiHistory(history);
    } catch (err) {
      console.error('Failed to load Gemini history:', err);
      setError('Failed to load history');
      setGeminiHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load history when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadGeminiHistory();
    }
  }, [isOpen, loadGeminiHistory]);

  // Listen for new history items
  useEffect(() => {
    const handleHistoryUpdate = () => {
      if (isOpen) {
        loadGeminiHistory();
      }
    };

    window.addEventListener('geminiHistoryUpdated', handleHistoryUpdate);

    return () => {
      window.removeEventListener('geminiHistoryUpdated', handleHistoryUpdate);
    };
  }, [isOpen, loadGeminiHistory]);

  const isEmpty = geminiHistory.length === 0;

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
                onClick={loadGeminiHistory}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && isEmpty && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                No Gemini history yet.
              </p>
            </div>
          )}

          {!loading && !error && !isEmpty && (
            <div className="space-y-3">
              {geminiHistory.map((item) => (
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
