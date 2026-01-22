
import React, { useState, useEffect } from 'react';
import { CreditCardIcon, KeyIcon, SparklesIcon, SaveIcon } from './IconComponents';
import { getStoredApiKey, storeApiKey } from '../services/apiKeyService';
import { validateApiKey } from '../services/geminiService';

interface CreatorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export const CreatorSettingsModal: React.FC<CreatorSettingsModalProps> = ({ isOpen, onClose, userEmail }) => {
  const [apiKey, setApiKey] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey() || '');
      setShowSuccess(false);
      setValidationError(null);
    }
  }, [isOpen]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setShowSuccess(false);
    setValidationError(null);
  };

  const handleSaveKey = async () => {
    setValidationError(null);
    setShowSuccess(false);

    // If key is cleared, just remove it without validation
    if (!apiKey.trim()) {
        storeApiKey('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        return;
    }

    setIsValidating(true);
    try {
        const isValid = await validateApiKey(apiKey);
        if (isValid) {
            storeApiKey(apiKey);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } else {
            setValidationError('Invalid API Key. Please check permissions and try again.');
        }
    } catch (e) {
        setValidationError('Validation failed. Please check your connection.');
    } finally {
        setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#020408]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#0a0c10] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-[#0f1115] flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-900/20 rounded-xl border border-teal-500/20 text-teal-400">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Creator Settings</h2>
                    <p className="text-gray-400 text-xs mt-0.5">Manage your studio configuration</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Plan Status */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Current Plan</h3>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/20 text-teal-400 border border-teal-500/20 text-xs font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                        Active
                    </span>
                </div>
                <div className="bg-[#050608] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-bold text-white mb-1">Creator Plan</h4>
                        <p className="text-gray-400 text-sm">$89.00 / month</p>
                    </div>
                    <div className="text-right">
                         <button className="text-sm text-gray-400 hover:text-white border-b border-gray-600 hover:border-white transition-colors pb-0.5">
                            Manage Subscription
                         </button>
                    </div>
                </div>
            </div>

             {/* Rendering Engine Configuration */}
             <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Rendering Infrastructure</h3>
                <div className="bg-[#050608] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="p-3 bg-gray-900 rounded-xl border border-white/10 text-gray-300">
                            <KeyIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-white mb-1">Bring Your Own Key (BYOK)</h4>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                                Your studio is connected directly to your personal Google Gemini API infrastructure. Usage is billed directly by Google Cloud at cost.
                            </p>
                        </div>
                    </div>
                    
                    {/* API Key Input Section */}
                    <div className="mb-8">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block pl-1">
                             Google Gemini API Key
                         </label>
                         <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-grow group">
                                <input 
                                    type="password" 
                                    value={apiKey}
                                    onChange={handleApiKeyChange}
                                    placeholder="Paste your Gemini API Key here"
                                    className={`w-full bg-[#0a0c10] border rounded-xl py-3.5 px-4 text-white font-mono text-sm focus:outline-none transition-colors placeholder-gray-700 ${validationError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-teal-500/50'}`}
                                />
                                {/* Optional: Indicator if falling back to env */}
                                {!apiKey && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <span className="text-gray-600 text-[10px] uppercase tracking-wider font-bold bg-[#0a0c10] pl-2">
                                            Using Default
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleSaveKey}
                                disabled={isValidating}
                                className={`bg-teal-600 hover:bg-teal-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2 flex-shrink-0 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                {isValidating ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <SaveIcon className="w-4 h-4" />
                                )}
                                {isValidating ? 'Verifying...' : 'Apply Key'}
                            </button>
                         </div>
                         <div className="flex justify-between items-start mt-2 pl-1 min-h-[20px]">
                            {validationError ? (
                                <p className="text-xs text-red-400 font-bold animate-fade-in flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {validationError}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-600 leading-relaxed max-w-[80%]">
                                    Paste your personal API key here to unlock unlimited generation volume. 
                                </p>
                            )}
                            
                            {showSuccess && !validationError && (
                                <span className="text-xs text-teal-400 font-bold flex items-center gap-1.5 animate-fade-in whitespace-nowrap">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>
                                    {apiKey ? 'Active & Saved' : 'Restored Default'}
                                </span>
                            )}
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="bg-[#0a0c10] border border-white/5 rounded-xl p-4">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase">Connection Status</p>
                            <p className="text-sm text-teal-400 font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                                Pipeline Active
                            </p>
                         </div>
                         <div className="bg-[#0a0c10] border border-white/5 rounded-xl p-4">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase">Model Version</p>
                            <p className="text-sm text-white font-bold">Gemini 3 Pro Vision</p>
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-4 border border-white/5 flex items-start gap-3">
                 <div className="mt-1">
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <p className="text-xs text-gray-400 leading-relaxed">
                    You are currently on the <span className="text-white font-bold">Creator Plan</span>. This workspace is configured for unlimited, unmetered generation throughput using your BYO Key credentials.
                 </p>
            </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
            0% { opacity: 0; transform: scale(0.98); }
            100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        /* Custom Scrollbar Styling */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #0a0c10;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};
