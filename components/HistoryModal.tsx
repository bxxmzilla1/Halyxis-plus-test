
import React from 'react';
import type { HistoryItem } from '../types';

interface HistoryModalProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onSelect, onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-[#020408]/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-7xl bg-[#0a0c10] border border-white/5 rounded-3xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0 bg-[#0a0c10]">
            <h2 className="text-2xl font-bold text-white tracking-tight">Full Generation History</h2>
            <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
                aria-label="Close"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="p-8 overflow-y-auto bg-[#050608]">
            {history.length === 0 ? (
                <div className="text-center text-gray-500 py-32">
                    <p className="text-lg font-light">No history items to display.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {history.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => onSelect(item)}
                            className="group block bg-[#0f1115] rounded-xl overflow-hidden border border-white/5 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-900/10 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300 text-left hover:-translate-y-1"
                        >
                            <div className="aspect-video relative overflow-hidden">
                                <img
                                    src={item.imageUrl}
                                    alt="Generated"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {item.referenceImageUrl && (
                                    <div className="absolute bottom-3 left-3 w-14 h-14 object-cover rounded-lg border border-white/10 shadow-lg overflow-hidden bg-black/50 backdrop-blur-md">
                                        <img
                                            src={item.referenceImageUrl}
                                            alt="Reference"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                            </div>
                            <div className="p-5">
                                <p className="text-sm text-gray-400 line-clamp-2 group-hover:text-white transition-colors font-medium">
                                    {item.prompt || 'No additional prompt'}
                                </p>
                                <span className="mt-3 inline-block text-[10px] text-teal-400 bg-teal-900/20 border border-teal-500/20 px-2 py-1 rounded font-bold uppercase tracking-wider">
                                    {item.aspectRatio}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
      <style>{`
            @keyframes fade-in {
                0% { opacity: 0; transform: scale(0.98); }
                100% { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in {
                animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .line-clamp-2 {
                overflow: hidden;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
            }
            /* Custom scrollbar for webkit browsers */
            .overflow-y-auto::-webkit-scrollbar {
                width: 8px;
            }
            .overflow-y-auto::-webkit-scrollbar-track {
                background: #050608;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
        `}</style>
    </div>
  );
};
