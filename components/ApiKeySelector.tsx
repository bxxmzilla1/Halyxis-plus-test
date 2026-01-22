
import React from 'react';
import { KeyIcon } from './IconComponents';
import { requestApiKeySelection } from '../services/apiKeyService';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const handleSelectKey = async () => {
    try {
      await requestApiKeySelection();
      // After the user interacts with the dialog, we assume a key was selected and proceed.
      onKeySelected();
    } catch (e) {
      console.error("Failed to open API key selection dialog", e);
      // Optionally, display a user-facing error here.
    }
  };

  return (
    <div className="flex flex-col flex-grow items-center justify-center text-center p-10 bg-[#0f1115] rounded-3xl border border-white/5 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-teal-500/5 blur-[80px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="inline-flex items-center justify-center p-5 bg-teal-900/10 rounded-2xl mb-8 border border-teal-500/20">
            <KeyIcon className="w-10 h-10 text-teal-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Initialize Creator Engine</h2>
        <p className="mb-10 text-gray-400 max-w-lg mx-auto leading-relaxed">
            Activate the <strong>Creator Plan</strong> rendering pipeline. Connect your dedicated Gemini API key to unlock unlimited high-fidelity image generation.
        </p>
        <button 
            onClick={handleSelectKey}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-10 py-4 text-sm font-bold text-white shadow-lg shadow-teal-900/20 hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-all transform hover:-translate-y-0.5"
        >
            Connect Creator Key
        </button>
        <p className="text-xs text-gray-400 mt-8 font-medium leading-relaxed">
            Your key must be from a Google Cloud project with billing enabled. <br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline transition-colors">
                Learn more about billing requirements.
            </a>
        </p>
      </div>
    </div>
  );
};
