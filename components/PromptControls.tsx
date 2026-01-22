
import React from 'react';
import { WandIcon } from './IconComponents';
import { AspectRatio, EditMode } from '../types';

interface PromptControlsProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isReadyToGenerate: boolean;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  mode: EditMode;
}

const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '4:3', label: '4:3 (Classic)' },
    { value: '3:4', label: '3:4 (Editorial)' },
];

export const PromptControls: React.FC<PromptControlsProps> = ({ 
  prompt, 
  setPrompt, 
  onSubmit, 
  isLoading, 
  isReadyToGenerate, 
  aspectRatio, 
  setAspectRatio,
  mode,
}) => {
  const getTitle = () => {
    switch(mode) {
        case 'prompt': return '2. Describe Your Vision';
        case 'reference': return '3. Describe Your Vision (Optional)';
        case 'multi': return 'Describe Your Vision';
        default: return 'Describe Your Vision';
    }
  };

  const getPlaceholder = () => {
    return 'Change the jacket color to blue, make the background a cityscape at night...';
  };

  return (
    <div className="flex flex-col gap-5 bg-[#0f1115] border border-white/5 rounded-2xl p-6 shadow-sm">
      <div>
        <label htmlFor="aspect-ratio" className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
            Output Aspect Ratio
        </label>
        <select
            id="aspect-ratio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="block w-full text-sm rounded-xl bg-[#050608] border border-white/10 placeholder-gray-600 text-gray-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 py-3 px-4 transition-all hover:border-white/20"
        >
            {aspectRatios.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                    {ratio.label}
                </option>
            ))}
        </select>
      </div>
      <div>
        <label htmlFor="prompt" className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
          {getTitle()}
        </label>
        <textarea
          id="prompt"
          rows={4}
          className="block w-full text-sm rounded-xl bg-[#050608] border border-white/10 placeholder-gray-600 text-gray-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 p-4 transition-all hover:border-white/20 resize-none leading-relaxed"
          placeholder={getPlaceholder()}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={isLoading || !isReadyToGenerate}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-teal-900/20 hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:bg-[#1a1d24] disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed transition-all transform active:scale-[0.99] mt-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <WandIcon className="w-5 h-5" />
            GENERATE
          </>
        )}
      </button>
    </div>
  );
};
