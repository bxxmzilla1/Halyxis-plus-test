
import React from 'react';
import type { HistoryItem } from '../types';
import { HistoryIcon } from './IconComponents';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onViewMore: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onViewMore }) => {
  const visibleHistory = history.slice(0, 3);

  return (
    <div className="flex flex-col gap-4 bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-2">
        <HistoryIcon className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-white">Generation History</h3>
      </div>
      {history.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">Your past creations will appear here.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {visibleHistory.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSelect(item)}
                  className="w-full flex items-center gap-4 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-left"
                >
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                      <img
                          src={item.imageUrl}
                          alt="History thumbnail"
                          className="w-12 h-12 object-cover rounded-md bg-gray-700"
                      />
                      {item.referenceImageUrl && (
                          <>
                              <span className="text-gray-500 text-xl font-light">+</span>
                              <img
                              src={item.referenceImageUrl}
                              alt="Reference thumbnail"
                              className="w-12 h-12 object-cover rounded-md bg-gray-700"
                              />
                          </>
                      )}
                  </div>

                  <div className="flex-grow overflow-hidden">
                    <p className="text-sm text-gray-300 truncate">
                      {item.prompt || "No additional prompt"}
                    </p>
                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                      {item.aspectRatio}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {history.length > 3 && (
            <button
              onClick={onViewMore}
              className="w-full text-center py-2 mt-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              View More ({history.length - 3} more)
            </button>
          )}
        </>
      )}
    </div>
  );
};
